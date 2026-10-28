import type { CodeDeclaration, CodeSymbol, CodeVisibility, ScanInvocation, ScanOperation, ScanSymbol } from '@groma/scanner'
import type { Node } from 'web-tree-sitter'
import { comparedMethod } from './tokens.ts'

export interface RubySource {
  file: string
  symbols: ScanSymbol[]
  declarations: CodeDeclaration[]
  operations: ScanOperation[]
  invocations: ScanInvocation[]
  publicInstanceMethods: string[]
}

interface Scope {
  owner: string
  members?: CodeSymbol[]
  singleton: boolean
  outlineTypes: boolean
  concern: boolean
}

const types = new Set(['class', 'module'])
const methods = new Set(['method', 'singleton_method'])
const visibilityNames = new Set(['public', 'protected', 'private'])

export function body(node: Node): Node[] {
  return node.childForFieldName('body')?.namedChildren ?? []
}

function qualified(owner: string, name: string): string {
  return owner ? `${owner}::${name}` : name
}

function codeSymbol(node: Node, name: string, visibility: CodeVisibility, entries: readonly string[]): CodeSymbol {
  return { name, line: node.childForFieldName('name')!.startPosition.row + 1, visibility, entry: entries.includes(name) }
}

/** Only explicit calls in a method body are evidence; dynamic Ruby binding stays unresolved. */
function calls(node: Node, source: string, output: ScanInvocation[]): void {
  if (types.has(node.type) || methods.has(node.type) || ['singleton_class', 'lambda', 'block', 'do_block'].includes(node.type)) return
  if (node.type === 'call') {
    output.push({ source, targets: [], unresolved: true, line: node.startPosition.row + 1,
      position: node.startIndex, member: node.childForFieldName('method')?.text })
  }
  for (const child of node.namedChildren) calls(child, source, output)
}

function methodName(node: Node, scope: Scope): string | undefined {
  const name = node.childForFieldName('name')?.text
  if (!name) return undefined
  if (node.type === 'singleton_method' && (scope.singleton || node.childForFieldName('object')?.type !== 'self')) return undefined
  if (!scope.owner) return node.type === 'method' ? name : undefined
  const separator = scope.singleton || node.type === 'singleton_method' ? '.' : '#'
  return `${scope.owner}${separator}${name}`
}

function methodVisibility(node: Node, scope: Scope, visibility: CodeVisibility): CodeVisibility {
  if (node.type === 'singleton_method') return 'public'
  if (!scope.singleton && node.childForFieldName('name')?.text === 'initialize') return 'private'
  return visibility
}

function addMethod(node: Node, scope: Scope, visibility: CodeVisibility, result: RubySource,
  entries: readonly string[]): void {
  const name = methodName(node, scope)
  if (!name) return
  const symbol = codeSymbol(node, name, methodVisibility(node, scope, visibility), entries)
  const id = `${result.file}:${node.startIndex}`
  result.symbols.push({ id, name, kind: 'method' })
  result.operations.push({ id, file: result.file, name, position: node.startIndex, ...comparedMethod(node) })
  if (symbol.visibility === 'public' && !scope.singleton && node.type === 'method') result.publicInstanceMethods.push(id)
  const methodBody = node.childForFieldName('body')
  if (methodBody) calls(methodBody, id, result.invocations)
  if (scope.members) scope.members.push({ ...symbol, name: node.childForFieldName('name')!.text })
  else if (!scope.owner) result.declarations.push({ ...symbol, kind: 'function' })
}

function isConcern(nodes: Node[]): boolean {
  return nodes.some(node => node.type === 'call' && !node.childForFieldName('receiver') &&
    node.childForFieldName('method')?.text === 'extend' &&
    node.childForFieldName('arguments')?.namedChildren.some(argument => argument.text === 'ActiveSupport::Concern'))
}

function concernMethods(node: Node, scope: Scope): Node | undefined {
  if (!scope.concern || node.childForFieldName('receiver')) return undefined
  if (node.childForFieldName('method')?.text !== 'class_methods') return undefined
  if (node.childForFieldName('arguments')?.namedChildCount) return undefined
  return node.childForFieldName('block') ?? undefined
}

/** Enter only language scopes and the explicitly declared Concern DSL, never arbitrary blocks. */
function nestedDeclarations(node: Node, scope: Scope, result: RubySource, entries: readonly string[]): void {
  if (types.has(node.type)) {
    addType(node, scope, result, entries)
  } else if (node.type === 'singleton_class' && node.childForFieldName('value')?.type === 'self') {
    declarations(body(node), { ...scope, singleton: true, outlineTypes: false, concern: false }, result, entries)
  } else if (node.type === 'call') {
    const block = concernMethods(node, scope)
    if (block) declarations(body(block), { ...scope, owner: qualified(scope.owner, 'ClassMethods'),
      singleton: false, outlineTypes: false, concern: false }, result, entries)
  } else if (node.type === 'assignment') {
    constructedMethods(node, scope, result, entries)
  }
}

/** A constructed type has a source binding, not a proven static class name or outline declaration. */
function constructedMethods(node: Node, scope: Scope, result: RubySource, entries: readonly string[]): void {
  const name = node.childForFieldName('left')
  const value = node.childForFieldName('right')
  if (!name || !['identifier', 'constant'].includes(name.type)) return
  if (value?.type === 'lambda' && !scope.owner) {
    result.symbols.push({ id: `${result.file}:${node.startIndex}`, name: name.text, kind: 'function' })
    result.declarations.push({ kind: 'function', name: name.text, line: name.startPosition.row + 1,
      visibility: 'private', entry: entries.includes(name.text) })
    return
  }
  if (value?.type !== 'call') return
  if (!['Module', 'Class'].includes(value.childForFieldName('receiver')?.text ?? '')) return
  if (value.childForFieldName('method')?.text !== 'new') return
  const block = value.childForFieldName('block')
  if (block) declarations(body(block), { owner: qualified(scope.owner, `(${name.text})`), singleton: false,
    outlineTypes: false, concern: false }, result, entries)
}

function declarations(nodes: Node[], scope: Scope, result: RubySource, entries: readonly string[]): void {
  let visibility: CodeVisibility = scope.owner ? 'public' : 'private'
  for (const node of nodes) {
    if (node.type === 'identifier' && visibilityNames.has(node.text)) {
      visibility = node.text as CodeVisibility
    } else if (methods.has(node.type)) {
      addMethod(node, scope, visibility, result, entries)
    } else {
      nestedDeclarations(node, scope, result, entries)
    }
  }
}

/** Nested types contribute operations, while outlines keep the shared top-level declaration boundary. */
function addType(node: Node, parent: Scope, result: RubySource, entries: readonly string[]): void {
  const name = node.childForFieldName('name')
  if (!name) return
  const owner = qualified(parent.owner, name.text)
  const members: CodeSymbol[] | undefined = parent.outlineTypes ? [] : undefined
  result.symbols.push({ id: `${result.file}:${node.startIndex}`, name: owner, kind: node.type })
  if (members) result.declarations.push({ ...codeSymbol(node, owner, 'public', entries), kind: 'type', members })
  const nodes = body(node)
  declarations(nodes, { owner, members, singleton: false, outlineTypes: parent.outlineTypes && node.type === 'module',
    concern: node.type === 'module' && isConcern(nodes) }, result, entries)
}

export function analyzeRuby(root: Node, file: string, entries: readonly string[] = []): RubySource {
  const result: RubySource = { file, symbols: [], declarations: [], operations: [], invocations: [], publicInstanceMethods: [] }
  declarations(root.namedChildren, { owner: '', singleton: false, outlineTypes: true, concern: false }, result, entries)
  return result
}
