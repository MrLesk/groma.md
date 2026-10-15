import type { CodeDeclaration, CodeSymbol, ScanInvocation, ScanOperation, ScanSymbol } from '@groma/scanner'
import type { Node } from 'web-tree-sitter'

export interface MojoSource {
  symbols: ScanSymbol[]
  declarations: CodeDeclaration[]
  operations: ScanOperation[]
  invocations: ScanInvocation[]
  main: boolean
}

const typeDeclarations = new Set(['class_definition', 'trait_definition'])
const deferred = new Set(['decorated_definition', 'function_definition', 'class_definition', 'trait_definition', 'lambda', 'generator_expression'])

function declaration(node: Node): Node {
  return node.type === 'decorated_definition' ? node.childForFieldName('definition')! : node
}

function nameNode(node: Node): Node | null {
  return node.childForFieldName('name')
}

function sourceName(node: Node): string {
  return node.type === 'string' && node.text.startsWith('`') ? node.text.slice(1, -1) : node.text
}

function symbol(node: Node, entries: readonly string[]): CodeSymbol | undefined {
  const name = nameNode(node)
  if (!name) return undefined
  const text = sourceName(name)
  // Mojo's underscore prefix is a convention, not Python protected/private access.
  return { name: text, line: name.startPosition.row + 1, visibility: 'public', entry: entries.includes(text) }
}

function outline(node: Node, entries: readonly string[]): CodeDeclaration | undefined {
  const item = symbol(node, entries)
  if (!item) return undefined
  if (node.type === 'function_definition') return { kind: 'function', ...item }
  if (!typeDeclarations.has(node.type)) return undefined
  const members = (node.childForFieldName('body')?.namedChildren ?? []).flatMap(child => {
    const member = declaration(child)
    if (member.type !== 'function_definition') return []
    const value = symbol(member, entries)
    return value ? [value] : []
  })
  return { kind: 'type', ...item, members }
}

function callableName(node: Node | null): string | undefined {
  if (!node) return undefined
  if (['identifier', 'string'].includes(node.type)) return sourceName(node)
  if (node.type === 'subscript') return callableName(node.childForFieldName('value'))
  if (node.type === 'attribute') return callableName(node.childForFieldName('attribute'))
  return undefined
}

/** Calls are syntax evidence only; overloads, specialization and receivers never become guessed providers. */
function calls(node: Node, operation: string, output: ScanInvocation[]): void {
  if (deferred.has(node.type) || node.type === 'comptime_statement') return
  // Multiple compile-time bracket arguments use parameter_list rather than subscript.
  if (node.type === 'parameter_list') return
  if (node.children.some(child => child.type === 'comptime')) return
  // Brackets can contain compile-time parameters or runtime indices; syntax cannot establish execution.
  if (node.type === 'subscript') {
    const base = node.childForFieldName('value')
    if (base) calls(base, operation, output)
    return
  }
  if (node.type === 'call') {
    output.push({ source: operation, targets: [], unresolved: true,
      line: node.startPosition.row + 1, position: node.startIndex,
      member: callableName(node.childForFieldName('function')) })
  }
  for (const child of node.namedChildren) calls(child, operation, output)
}

function implemented(body: Node): boolean {
  return body.namedChildren.some(child => !['ellipsis', 'comment', 'string'].includes(child.type))
}

/** Visit each named body separately, so a nested function owns its calls and never lends them to its parent. */
function operations(node: Node, file: string, result: MojoSource, owners: string[] = []): void {
  const name = nameNode(node)
  const ownScope = name && (node.type === 'function_definition' || typeDeclarations.has(node.type))
  const names = ownScope ? [...owners, sourceName(name)] : owners
  if (node.type === 'function_definition') {
    const body = node.childForFieldName('body')!
    if (implemented(body)) {
      const id = `${file}:${node.startIndex}`
      result.operations.push({ id, file, name: names.join('.'), position: node.startIndex })
      calls(body, id, result.invocations)
    }
  }
  for (const child of node.namedChildren) operations(child, file, result, names)
}

export function analyzeMojo(root: Node, file: string, entries: readonly string[] = []): MojoSource {
  const result: MojoSource = { symbols: [], declarations: [], operations: [], invocations: [], main: false }
  for (const child of root.namedChildren) {
    const node = declaration(child)
    const item = outline(node, entries)
    if (!item) continue
    result.declarations.push(item)
    result.symbols.push({ id: `${file}:${node.startIndex}`, name: item.name, kind: item.kind })
    if (node.type === 'function_definition' && item.name === 'main') {
      const args = node.childForFieldName('parameters')!
      result.main ||= args.namedChildCount === 0 && !node.childForFieldName('type_parameters')
    }
  }
  operations(root, file, result)
  return result
}
