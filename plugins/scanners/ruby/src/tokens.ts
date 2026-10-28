import type { Node } from 'web-tree-sitter'
import { literal, parameterNames } from './syntax.ts'

const closures = new Set(['block', 'do_block', 'lambda'])

function bindLeft(node: Node, names: Set<string>): void {
  if (node.type === 'identifier') names.add(node.text)
  if (['left_assignment_list', 'destructured_left_assignment', 'rest_assignment'].includes(node.type)) {
    for (const child of node.namedChildren) bindLeft(child, names)
  }
}

function assignmentNames(node: Node): string[] {
  if (!['assignment', 'operator_assignment', 'for'].includes(node.type)) return []
  const names = new Set<string>()
  const left = node.childForFieldName('left') ?? node.childForFieldName('pattern')
  if (left) bindLeft(left, names)
  return [...names]
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
    bind(assignmentNames(current).filter(name => !local.has(name)), local)
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

