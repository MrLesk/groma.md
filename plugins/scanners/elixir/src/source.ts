import type { CodeDeclaration, CodeSymbol, ScanInvocation, ScanOperation, ScanSymbol } from '@groma/scanner'
import type { Node } from 'web-tree-sitter'
import { clauseCalls } from './calls.ts'
import { moduleFunctions, type FunctionDeclaration, type ModuleScope } from './modules.ts'
import { declarationId, lineOf, positional } from './syntax.ts'

/*
 * The language evidence of one file: a symbol and an outline type per module, a symbol and an
 * outline member per named function, an operation per executable function, and the calls each
 * operation makes. Framework readers add the functions their DSL declares through `DeclaredFunction`.
 */

/** A public function that a framework declaration generates on a module, such as an Ash code interface. */
export interface DeclaredFunction {
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

function addDeclaredFunction(declared: DeclaredFunction, source: ElixirSource, members: CodeSymbol[], entries: readonly string[]): void {
  const name = `${declared.module}.${declared.name}`
  source.symbols.push({ id: declarationId(source.file, declared.node), name, kind: 'function' })
  members.push({ name: declared.name, line: nameLine(declared.node), visibility: 'public', entry: entries.includes(name) })
}

/**
 * Describe the modules of one file. `declared` holds the functions framework DSLs generate on these
 * modules, and `entries` the symbol names the file's Code links state, which mark outline entries.
 */
export function elixirSource(file: string, scopes: readonly ModuleScope[], declared: readonly DeclaredFunction[] = [],
  entries: readonly string[] = []): ElixirSource {
  const source: ElixirSource = { file, modules: [], symbols: [], declarations: [], operations: [], invocations: [] }
  for (const scope of scopes) {
    const members: CodeSymbol[] = []
    const functions = moduleFunctions(scope).map(found => addFunction(scope, found, source, members, entries))
    for (const generated of declared) {
      if (generated.module === scope.name) addDeclaredFunction(generated, source, members, entries)
    }
    source.symbols.push({ id: declarationId(file, scope.node), name: scope.name, kind: scope.kind })
    source.declarations.push({ kind: 'type', name: scope.name, line: nameLine(scope.node), visibility: 'public',
      entry: entries.includes(scope.name), members: members.sort((left, right) => left.line - right.line) })
    source.modules.push({ name: scope.name, file, functions })
  }
  return source
}

/**
 * Look a module up by its full name across every scanned file. A name that more than one
 * declaration uses identifies no single module, so it finds nothing.
 */
export function moduleIndex(sources: readonly ElixirSource[]): (name: string) => ElixirModule | undefined {
  const byName = new Map<string, ElixirModule[]>()
  for (const module of sources.flatMap(source => source.modules)) {
    byName.set(module.name, [...byName.get(module.name) ?? [], module])
  }
  return name => {
    const declared = byName.get(name)
    return declared?.length === 1 ? declared[0] : undefined
  }
}
