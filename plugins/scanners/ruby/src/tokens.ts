import type { Node } from 'web-tree-sitter'
import { literal, parameterNames } from './syntax.ts'

const definitions = new Set(['method', 'singleton_method', 'class', 'module', 'singleton_class'])
const closures = new Set(['block', 'do_block', 'lambda'])

function assignedNames(node: Node, names: Set<string>, shadowed: Set<string> = new Set()): void {
  if (definitions.has(node.type)) return
  const hidden = closures.has(node.type)
    ? new Set([...shadowed, ...parameterNames(node.childForFieldName('parameters'))]) : shadowed
  if (['assignment', 'operator_assignment', 'for'].includes(node.type)) {
    const left = node.childForFieldName('left') ?? node.childForFieldName('pattern')
    if (left) bindLeft(left, names, hidden)
  }
  for (const child of node.namedChildren) assignedNames(child, names, hidden)
}

function bindLeft(node: Node, names: Set<string>, hidden: Set<string>): void {
  if (node.type === 'identifier' && !hidden.has(node.text)) names.add(node.text)
  if (['left_assignment_list', 'destructured_left_assignment', 'rest_assignment'].includes(node.type)) {
    for (const child of node.namedChildren) bindLeft(child, names, hidden)
  }
}

/** Only local bindings change names; constants, instance state, method names and operators remain meaningful. */
export function comparedMethod(node: Node) {
  const body = node.childForFieldName('body')
  const bindings = new Map<string, string>()
  let next = 0
  const bind = (names: Iterable<string>, scope: Map<string, string>) => {
    for (const name of names) scope.set(name, `$${next++}`)
  }
  bind(parameterNames(node.childForFieldName('parameters')), bindings)
  const locals = new Set<string>()
  if (body) assignedNames(body, locals)
  bind([...locals].filter(name => !bindings.has(name)), bindings)
  const tokens: string[] = []
  function visit(current: Node, scope: Map<string, string>): void {
    if (current.type === 'comment' || current.text === ';') return
    const text = literal(current)
    if (current.type === 'string' && text !== undefined) {
      tokens.push(`string:${JSON.stringify(text)}`)
      return
    }
    let local = scope
    if (closures.has(current.type)) {
      local = new Map(scope)
      bind(parameterNames(current.childForFieldName('parameters')), local)
    }
    if (current.childCount === 0) {
      tokens.push(leafToken(current, local))
      return
    }
    for (const child of current.children) visit(child, local)
  }
  if (body) visit(body, bindings)
  return { startLine: node.startPosition.row + 1, endLine: node.endPosition.row + 1, tokens }
}

function leafToken(node: Node, scope: Map<string, string>): string {
  if (node.type !== 'identifier' || node.parent?.childForFieldName('method')?.id === node.id) return node.text
  return scope.get(node.text) ?? node.text
}

