import type { CodeVisibility } from '@groma/scanner'
import type { Node } from 'web-tree-sitter'
import { aliasesAfter, aliasesBefore, fileAliases, insideModule, moduleName, type Aliases } from './aliases.ts'
import { body, callName, operator, options, positional } from './syntax.ts'

/*
 * The modules a file declares and the named functions each module declares. Everything in Elixir
 * source lives in a module, so these two lists are the scanner's whole view of the language; the
 * Phoenix and Ash readers receive the same module scopes and read their own declarations from them.
 */

export type ModuleKind = 'module' | 'protocol' | 'implementation'

/** One module declaration. The nodes are valid only while the file's syntax tree is alive. */
export interface ModuleScope {
  /** Full module name, such as `Shop.Orders.Line` for a `Line` module nested in `Shop.Orders`. */
  name: string
  kind: ModuleKind
  /** The whole `defmodule`, `defprotocol` or `defimpl` call. */
  node: Node
  /** The statements written directly in the module body. */
  statements: Node[]
  /** The lexical aliases in force where the module body starts. */
  aliases: Aliases
}

/** One named function or macro of a module: all its clauses share one name and arity. */
export interface FunctionDeclaration {
  name: string
  arity: number
  kind: 'function' | 'macro'
  visibility: CodeVisibility
  /** Executable at run time: `def` and `defp` with a body, and `defdelegate`. */
  executable: boolean
  /** The first clause, where the function is declared. */
  node: Node
  /** Every clause, in source order. */
  clauses: Node[]
}

/** The definition forms of the language and what each declares. `delegate` forms have no body of their own. */
const definitionForms = new Map<string, { kind: 'function' | 'macro'; visibility: CodeVisibility; delegate?: true }>([
  ['def', { kind: 'function', visibility: 'public' }],
  ['defp', { kind: 'function', visibility: 'private' }],
  ['defdelegate', { kind: 'function', visibility: 'public', delegate: true }],
  ['defmacro', { kind: 'macro', visibility: 'public' }],
  ['defmacrop', { kind: 'macro', visibility: 'private' }],
  ['defguard', { kind: 'macro', visibility: 'public' }],
  ['defguardp', { kind: 'macro', visibility: 'private' }],
])

const moduleForms = new Map<string, ModuleKind>([['defmodule', 'module'], ['defprotocol', 'protocol'], ['defimpl', 'implementation']])

/** Whether a statement declares a function, macro or module rather than calling something. */
export function isDefinition(statement: Node): boolean {
  const name = callName(statement) ?? ''
  return definitionForms.has(name) || moduleForms.has(name)
}

/** `defimpl Protocol, for: Type` declares the module `Protocol.Type`; without `for:` the type is the enclosing module. */
function implementationName(statement: Node, aliases: Aliases): string | undefined {
  const protocol = moduleName(positional(statement)[0], aliases)
  const target = options(statement)?.get('for')
  const type = target ? moduleName(target, aliases) : aliases.module
  return protocol && type ? `${protocol}.${type}` : undefined
}

/**
 * The full name a module declaration states. At file level the written name is complete, after
 * lexical aliases. Inside a module it is appended to the enclosing name, unless written `Elixir.Name`.
 */
function declaredName(statement: Node, kind: ModuleKind, aliases: Aliases): string | undefined {
  if (kind === 'implementation') return implementationName(statement, aliases)
  const written = positional(statement)[0]
  if (written?.type !== 'alias') return undefined
  const nested = aliases.module !== '' && !written.text.startsWith('Elixir.')
  return nested ? `${aliases.module}.${written.text}` : moduleName(written, aliases)
}

function collectScopes(statements: Node[], initial: Aliases, found: ModuleScope[]): void {
  let aliases = initial
  for (const statement of statements) {
    const kind = moduleForms.get(callName(statement) ?? '')
    const inner = kind && body(statement)
    // A module whose name is computed has no provable identity, so nothing inside it is reported.
    const name = inner && declaredName(statement, kind, aliases)
    if (inner && name) {
      const scope = { name, kind, node: statement, statements: inner, aliases: insideModule(aliases, name) }
      found.push(scope)
      collectScopes(inner, scope.aliases, found)
    }
    aliases = aliasesAfter(aliases, statement)
  }
}

/** Every module of a file in source order, nested modules after the module that contains them. */
export function moduleScopes(root: Node): ModuleScope[] {
  const found: ModuleScope[] = []
  collectScopes(root.namedChildren, fileAliases, found)
  return found
}

/** The lexical aliases in force where `node` is written inside the module body. */
export function aliasesAt(scope: ModuleScope, node: Node): Aliases {
  return aliasesBefore(scope.aliases, scope.statements, node)
}

/** The `use Module, ...` statements of a module body, each with the full name of the module it uses. */
export function moduleUses(scope: ModuleScope): { module: string; statement: Node }[] {
  return scope.statements.flatMap(statement => {
    const module = callName(statement) === 'use' ? moduleName(positional(statement)[0], aliasesAt(scope, statement)) : undefined
    return module === undefined ? [] : [{ module, statement }]
  })
}

/**
 * The name and arity a definition states: `name(a, b)`, `name(a) when guard`, or a bare `name`.
 * A computed name such as `unquote(name)(a)` and an operator definition state no name.
 */
function functionHead(definition: Node): { name: string; arity: number } | undefined {
  const first = positional(definition)[0]
  const head = first && operator(first) === 'when' ? first.childForFieldName('left') : first
  if (head?.type === 'identifier') return { name: head.text, arity: 0 }
  const name = head ? callName(head) : undefined
  return name === undefined || name === 'unquote' ? undefined : { name, arity: head!.namedChildren.find(child => child.type === 'arguments')
    ?.namedChildren.filter(child => child.type !== 'comment').length ?? 0 }
}

/** The named functions and macros a module declares directly in its body, in source order. */
export function moduleFunctions(scope: ModuleScope): FunctionDeclaration[] {
  const functions = new Map<string, FunctionDeclaration>()
  for (const statement of scope.statements) {
    const form = definitionForms.get(callName(statement) ?? '')
    const head = form && functionHead(statement)
    if (!form || !head) continue
    const key = `${head.name}/${head.arity}`
    const executable = form.kind === 'function' && (form.delegate === true || body(statement) !== undefined)
    const known = functions.get(key)
    if (known) {
      known.clauses.push(statement)
      known.executable ||= executable
    } else {
      functions.set(key, { ...head, kind: form.kind, visibility: form.visibility, executable, node: statement, clauses: [statement] })
    }
  }
  return [...functions.values()]
}
