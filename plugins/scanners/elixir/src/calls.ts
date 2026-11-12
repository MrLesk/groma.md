import type { ScanInvocation } from '@groma/scanner'
import type { Node } from 'web-tree-sitter'
import { body, callName, lineOf } from './syntax.ts'

/*
 * Call evidence: where a named function calls something. Every target stays unresolved, because
 * what an Elixir call reaches depends on imports, macros and run-time values this scanner does not
 * evaluate. Core derives no relationship from these facts alone.
 */

/**
 * Forms the language itself defines (Kernel.SpecialForms) that are written like calls. They are
 * syntax, not calls to a function.
 */
const specialForms = new Set([
  'alias', 'case', 'cond', 'for', 'import', 'quote', 'receive', 'require', 'super', 'try',
  'unquote', 'unquote_splicing', 'with',
])

/** `&fun/1` and `&fun(&1)` build a function value; the code inside does not run where it is written. */
const isCapture = (node: Node) => node.type === 'unary_operator' && node.childForFieldName('operator')?.text === '&'

/** Code inside `fn`, `&` and `quote` belongs to a value or to generated code, not to the enclosing function's own run. */
function isDeferred(node: Node): boolean {
  return node.type === 'anonymous_function' || isCapture(node) || callName(node) === 'quote'
}

/** The call a node states: a local `name(...)`, or a remote `Receiver.name(...)` with its member name. */
function callFact(node: Node): { member?: string } | undefined {
  if (node.type !== 'call') return undefined
  const target = node.childForFieldName('target')
  if (target?.type === 'identifier') return specialForms.has(target.text) ? undefined : {}
  const member = target?.type === 'dot' ? target.childForFieldName('right') : undefined
  if (member?.type !== 'identifier') return undefined
  // Without parentheses, `value.name` reads a field unless the receiver is a module.
  const written = node.namedChildren.some(child => child.type === 'arguments')
  return written || target!.childForFieldName('left')?.type === 'alias' ? { member: member.text } : undefined
}

function collect(node: Node, source: string, found: ScanInvocation[]): void {
  if (isDeferred(node)) return
  const fact = callFact(node)
  if (fact) {
    found.push({ source, targets: [], unresolved: true, line: lineOf(node), position: node.startIndex, ...fact })
  }
  for (const child of node.namedChildren) collect(child, source, found)
}

/**
 * The calls one clause of a function makes in its body. The head (name, parameters and guard) is a
 * declaration and lends no call to the function.
 */
export function clauseCalls(clause: Node, source: string): ScanInvocation[] {
  const found: ScanInvocation[] = []
  for (const statement of body(clause) ?? []) collect(statement, source, found)
  return found
}
