import type { CodeDeclaration, CodeSymbol, ScanInvocation, ScanOperation, ScanSymbol } from '@groma/scanner'
import type { Node } from 'web-tree-sitter'
import { clauseCalls } from './calls.ts'
import { moduleFunctions, type FunctionDeclaration, type ModuleScope } from './modules.ts'
import { declarationId, lineOf, positional } from './syntax.ts'

/*
 * The language evidence of one file: a symbol and an outline type per module, a symbol and an
 * outline member per named function, an operation per executable function, and the calls each
 * operation makes. Framework readers add the functions their DSL generates through `GeneratedFunction`.
 */

/** A public function that a framework declaration generates on a module, such as an Ash code interface. */
export interface GeneratedFunction {
  /** The module the function is defined on. */
  module: string
  name: string
  /** The declaration that names it. */
  node: Node
}

/** A function another file may name as a handler: its module, name, arity and operation. */
export interface ModuleFunction {
  name: string
  arity: number
  public: boolean
  /** Set for functions that run at run time; macros, guards and protocol signatures have none. */
  operation?: string
}

/** What other files may look up about a module, kept after the file's syntax tree is freed. */
export interface ElixirModule {
  name: string
  file: string
  functions: ModuleFunction[]
}

export interface ElixirSource {
  file: string
  modules: ElixirModule[]
  symbols: ScanSymbol[]
  declarations: CodeDeclaration[]
  operations: ScanOperation[]
  invocations: ScanInvocation[]
}

/** The line a declaration is listed at: the line of its name, which follows `def`, `defmodule` or the DSL word. */
const nameLine = (declaration: Node) => lineOf(positional(declaration)[0] ?? declaration)

function addFunction(scope: ModuleScope, declared: FunctionDeclaration, source: ElixirSource, members: CodeSymbol[],
  entries: readonly string[]): ModuleFunction {
  const local = `${declared.name}/${declared.arity}`
  const name = `${scope.name}.${local}`
  const id = declarationId(source.file, declared.node)
  source.symbols.push({ id, name, kind: declared.kind })
  members.push({ name: local, line: nameLine(declared.node), visibility: declared.visibility, entry: entries.includes(name) })
  if (declared.executable) {
    source.operations.push({ id, file: source.file, name, position: declared.node.startIndex })
    for (const clause of declared.clauses) source.invocations.push(...clauseCalls(clause, id))
  }
  return { name: declared.name, arity: declared.arity, public: declared.visibility === 'public',
    ...(declared.executable ? { operation: id } : {}) }
}

function addGeneratedFunction(generated: GeneratedFunction, source: ElixirSource, members: CodeSymbol[], entries: readonly string[]): void {
  const name = `${generated.module}.${generated.name}`
  source.symbols.push({ id: declarationId(source.file, generated.node), name, kind: 'function' })
  members.push({ name: generated.name, line: nameLine(generated.node), visibility: 'public', entry: entries.includes(name) })
}

/**
 * Describe the modules of one file. `generated` holds the functions framework DSLs generate on these
 * modules, and `entries` the symbol names the file's Code links state, which mark outline entries.
 */
export function elixirSource(file: string, scopes: readonly ModuleScope[], generated: readonly GeneratedFunction[] = [],
  entries: readonly string[] = []): ElixirSource {
  const source: ElixirSource = { file, modules: [], symbols: [], declarations: [], operations: [], invocations: [] }
  for (const scope of scopes) {
    const members: CodeSymbol[] = []
    const functions = moduleFunctions(scope).map(found => addFunction(scope, found, source, members, entries))
    for (const added of generated) {
      if (added.module === scope.name) addGeneratedFunction(added, source, members, entries)
    }
    source.symbols.push({ id: declarationId(file, scope.node), name: scope.name, kind: scope.kind })
    source.declarations.push({ kind: 'type', name: scope.name, line: nameLine(scope.node), visibility: 'public',
      entry: entries.includes(scope.name), members: members.sort((left, right) => left.line - right.line) })
    source.modules.push({ name: scope.name, file, functions })
  }
  return source
}

/**
 * Index declarations by name. A name that two declarations share identifies neither of them, so it
 * is left out: a reference to it stays unresolved instead of picking one.
 */
export function uniquelyNamed<T>(declared: readonly T[], nameOf: (item: T) => string): Map<string, T> {
  const count = new Map<string, number>()
  for (const item of declared) count.set(nameOf(item), (count.get(nameOf(item)) ?? 0) + 1)
  return new Map(declared.filter(item => count.get(nameOf(item)) === 1).map(item => [nameOf(item), item]))
}

/** Finds the one module with a full name across every scanned file. */
export type ModuleLookup = (name: string) => ElixirModule | undefined

export function moduleIndex(sources: readonly ElixirSource[]): ModuleLookup {
  const modules = uniquelyNamed(sources.flatMap(source => source.modules), module => module.name)
  return name => modules.get(name)
}
