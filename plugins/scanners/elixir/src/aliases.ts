import type { Node } from 'web-tree-sitter'
import { callName, listItems, options, positional, stringLiteral } from './syntax.ts'

/*
 * The lexical aliases of one place in a module: which short name stands for which full module name.
 * Phoenix handler resolution and Ash module references use it to turn a written reference such as
 * `PageController` into a full module name. Only directives written in the source count; aliases
 * that a `use` macro injects are invisible here.
 */

export interface Aliases {
  /** Full name of the enclosing module, the value of `__MODULE__`; empty outside every module. */
  module: string
  /** Short name to full module name. */
  names: ReadonlyMap<string, string>
}

/** No aliases yet, outside every module: where a file starts. */
export const fileAliases: Aliases = { module: '', names: new Map() }

/** The aliases a module body starts with: those written around it, and its own name for `__MODULE__`. */
export function insideModule(enclosing: Aliases, module: string): Aliases {
  return { module, names: enclosing.names }
}

const lastSegment = (name: string) => name.slice(name.lastIndexOf('.') + 1)

function expand(text: string, aliases: Aliases): string {
  const [first, ...rest] = text.split('.')
  if (first === 'Elixir') return rest.join('.')
  const full = aliases.names.get(first!)
  return full === undefined ? text : [full, ...rest].join('.')
}

/** `Module.concat(["A.B"])`, the literal form generators write to avoid a compile-time dependency. */
function concatenated(node: Node): string | undefined {
  const target = node.childForFieldName('target')
  if (target?.type !== 'dot' || target.childForFieldName('left')?.text !== 'Module') return undefined
  if (target.childForFieldName('right')?.text !== 'concat') return undefined
  const [list, ...others] = positional(node)
  const parts = listItems(list)?.map(stringLiteral)
  if (others.length > 0 || !parts?.length || parts.some(part => part === undefined)) return undefined
  return parts.join('.')
}

/**
 * The full module name a literal reference states: `A.B`, a short name the aliases expand,
 * `__MODULE__`, `__MODULE__.Inner`, or `Module.concat` of string literals. Anything computed is undefined.
 */
export function moduleName(node: Node | undefined | null, aliases: Aliases): string | undefined {
  if (!node) return undefined
  if (node.type === 'alias') return expand(node.text, aliases)
  if (node.type === 'identifier') return node.text === '__MODULE__' && aliases.module !== '' ? aliases.module : undefined
  if (node.type === 'call') return concatenated(node)
  if (node.type !== 'dot') return undefined
  const base = moduleName(node.childForFieldName('left'), aliases)
  const rest = node.childForFieldName('right')
  return base !== undefined && rest?.type === 'alias' ? `${base}.${rest.text}` : undefined
}

/** `alias A.{B, C.D}` names `A.B` and `A.C.D`. */
function groupedTargets(node: Node, aliases: Aliases): string[] | undefined {
  const group = node.childForFieldName('right')
  if (node.type !== 'dot' || group?.type !== 'tuple') return undefined
  const base = moduleName(node.childForFieldName('left'), aliases)
  if (base === undefined) return undefined
  return group.namedChildren.flatMap(member => member.type === 'alias' ? [`${base}.${member.text}`] : [])
}

function withNames(aliases: Aliases, entries: [string, string][]): Aliases {
  return entries.length === 0 ? aliases : { module: aliases.module, names: new Map([...aliases.names, ...entries]) }
}

function directiveEntries(statement: Node, name: string, aliases: Aliases): [string, string][] {
  const [target, ...others] = positional(statement)
  if (!target || others.length > 0) return []
  const renamed = options(statement)?.get('as')
  const grouped = name === 'alias' ? groupedTargets(target, aliases) : undefined
  if (grouped) return grouped.map(full => [lastSegment(full), full])
  const full = moduleName(target, aliases)
  if (full === undefined) return []
  if (renamed) return renamed.type === 'alias' ? [[renamed.text, full]] : []
  // `require A.B` without `as:` names nothing new.
  return name === 'alias' ? [[lastSegment(full), full]] : []
}

/**
 * The aliases in force after `statement`: an `alias` or `require ..., as:` directive adds its
 * names, and a nested `defmodule Inner` makes `Inner` stand for `Enclosing.Inner`. Any other
 * statement leaves them unchanged.
 */
export function aliasesAfter(aliases: Aliases, statement: Node): Aliases {
  const name = callName(statement)
  if (name === 'alias' || name === 'require') return withNames(aliases, directiveEntries(statement, name, aliases))
  // Only a module nested in another module gains a short name; a module at file level does not.
  if (name !== 'defmodule' || aliases.module === '') return aliases
  const nested = positional(statement)[0]
  if (nested?.type !== 'alias' || nested.text.startsWith('Elixir.')) return aliases
  const first = nested.text.split('.')[0]!
  return withNames(aliases, [[first, `${aliases.module}.${first}`]])
}

/** The aliases in force where `node` is written inside a module body that starts with `initial`. */
export function aliasesBefore(initial: Aliases, moduleStatements: readonly Node[], node: Node): Aliases {
  let aliases = initial
  for (const statement of moduleStatements) {
    if (statement.startIndex >= node.startIndex) break
    aliases = aliasesAfter(aliases, statement)
  }
  return aliases
}
