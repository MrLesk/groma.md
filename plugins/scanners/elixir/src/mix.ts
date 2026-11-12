import path from 'node:path'
import type { ScanEntryPoint, ScanRoot } from '@groma/scanner'
import type { Node } from 'web-tree-sitter'
import { isUnder } from '../../projects.ts'
import { moduleName, type Aliases } from './aliases.ts'
import { moduleFunctions, moduleScopes, moduleUses, type FunctionDeclaration } from './modules.ts'
import { atomLiteral, body, callName, keywordPairs, listItems, operator, positional, stringList } from './syntax.ts'

/*
 * Mix projects. A `mix.exs` file declares one project: its application name, the directories Mix
 * compiles and what launches it. This module reads those declarations as written, without running
 * Mix, and answers three questions: which projects exist, which `.ex` files each one compiles, and
 * which file is each project's execution entry.
 */

export interface MixProject {
  /** Repository-relative path of the `mix.exs` file. */
  file: string
  /** Repository-relative directory of the project; empty at the repository root. */
  directory: string
  /** The `app:` name. */
  app?: string
  /**
   * Directories Mix compiles, relative to the project, over every Mix environment. Empty for an
   * umbrella root. Undefined when `elixirc_paths` is not written in a readable form.
   */
  sourceRoots?: string[]
  /**
   * The module that launches the project: its application callback (`mod:`), or its escript
   * `main_module:` when the project declares no callback. Undefined when neither is readable.
   */
  entryModule?: string
}

type Functions = FunctionDeclaration[]

/** What a function of the `mix.exs` module returns: the last expression of each clause. */
function results(functions: Functions, name: string, arity: number): Node[] {
  const declared = functions.find(candidate => candidate.name === name && candidate.arity === arity)
  return declared?.clauses.flatMap(clause => body(clause)?.at(-1) ?? []) ?? []
}

/** The `key: value` pairs of a literal keyword list such as `[app: :shop, deps: deps()]`. */
function keywordList(node: Node | undefined): Map<string, Node> | undefined {
  const items = listItems(node)
  if (items?.length === 0) return new Map()
  return items?.length === 1 && items[0]!.type === 'keywords' ? keywordPairs(items[0]) : undefined
}

/** A keyword list written in place, or returned by the single clause of a function of the same module. */
function declaredKeywords(node: Node | undefined, functions: Functions): Map<string, Node> | undefined {
  const name = node ? callName(node) : undefined
  if (name === undefined) return keywordList(node)
  const returned = results(functions, name, positional(node!).length)
  return returned.length === 1 ? keywordList(returned[0]) : undefined
}

/**
 * The directories an `elixirc_paths` value can name: string lists, lists joined with `++`, and calls
 * to functions of the same module, over all their clauses. The Mix environment that selects a clause
 * is unknown without running Mix, so every clause counts. Undefined when any part is computed.
 */
function sourcePaths(node: Node, functions: Functions, reading: ReadonlySet<string>): string[] | undefined {
  if (node.type === 'list') return stringList(node)
  if (operator(node) === '++') {
    const left = sourcePaths(node.childForFieldName('left')!, functions, reading)
    const right = sourcePaths(node.childForFieldName('right')!, functions, reading)
    return left && right ? [...left, ...right] : undefined
  }
  const name = callName(node)
  if (name === undefined) return undefined
  const key = `${name}/${positional(node).length}`
  // A clause that calls its own function, as in `paths(:dev) ++ ["test/support"]`, adds nothing new.
  if (reading.has(key)) return []
  const returned = results(functions, name, positional(node).length)
  const lists = returned.map(result => sourcePaths(result, functions, new Set([...reading, key])))
  return returned.length > 0 && lists.every(list => list !== undefined) ? lists.flat() as string[] : undefined
}

/** Project-relative directories without `./` or a trailing slash; a path leaving the project is unreadable. */
function sourceRoots(paths: string[] | undefined): string[] | undefined {
  const roots = paths?.map(directory => path.posix.normalize(`${directory}/`).replace(/\/$/, '').replace(/^\.$/, ''))
  if (roots?.some(root => root.startsWith('..') || path.posix.isAbsolute(root))) return undefined
  return roots && [...new Set(roots)].sort()
}

/** `mod: {Module, args}` in `application/0`: the application callback module. */
function applicationCallback(functions: Functions, aliases: Aliases): { declared: boolean; module?: string } {
  const returned = results(functions, 'application', 0)
  if (returned.length === 0) return { declared: false }
  const settings = returned.length === 1 ? keywordList(returned[0]) : undefined
  // An application list the scanner cannot read may declare a callback, so nothing else may stand in for it.
  if (!settings) return { declared: true }
  const callback = settings.get('mod')
  if (!callback) return { declared: false }
  return { declared: true, module: callback.type === 'tuple' ? moduleName(callback.namedChildren[0], aliases) : undefined }
}

function entryModule(project: Map<string, Node>, functions: Functions, aliases: Aliases): string | undefined {
  const callback = applicationCallback(functions, aliases)
  if (callback.declared) return callback.module
  return moduleName(declaredKeywords(project.get('escript'), functions)?.get('main_module'), aliases)
}

/** Read one parsed `mix.exs`. A file whose `project/0` is not a literal keyword list keeps only its location. */
export function mixProject(root: Node, file: string): MixProject {
  const directory = path.posix.dirname(file) === '.' ? '' : path.posix.dirname(file)
  const scope = moduleScopes(root).find(candidate => moduleUses(candidate).some(use => use.module === 'Mix.Project'))
  const functions = scope ? moduleFunctions(scope) : []
  const returned = results(functions, 'project', 0)
  const project = returned.length === 1 ? keywordList(returned[0]) : undefined
  if (!scope || !project) return { file, directory }
  const paths = project.get('elixirc_paths')
  return {
    file, directory,
    app: atomLiteral(project.get('app')),
    // An umbrella root (`apps_path`) only groups its child projects; Mix compiles no source for it.
    sourceRoots: project.has('apps_path') ? [] : sourceRoots(paths ? sourcePaths(paths, functions, new Set()) : ['lib']),
    entryModule: entryModule(project, functions, scope.aliases),
  }
}

/** The project whose directory is the nearest one containing `file`. */
function nearestProject(projects: readonly MixProject[], file: string, except?: MixProject): MixProject | undefined {
  return projects.filter(project => project !== except && isUnder(file, project.directory))
    .sort((left, right) => right.directory.length - left.directory.length)[0]
}

/** Whether Mix compiles `file` for `project`: the file lies in one of the project's source directories. */
function compiles(project: MixProject, file: string, nearest: MixProject | undefined): boolean {
  if (!isUnder(file, project.directory)) return false
  // Unreadable source directories: the project keeps every file that no nested project claims.
  if (project.sourceRoots === undefined) return project === nearest
  const local = project.directory === '' ? file : file.slice(project.directory.length + 1)
  return project.sourceRoots.some(root => isUnder(local, root))
}

/**
 * The `.ex` files Mix compiles, each with every project that compiles it. Usually that is one
 * project. A project whose source directories reach into another project, such as
 * `elixirc_paths: ["lib", "proto/lib"]` beside `proto/mix.exs`, compiles those files as well.
 */
export function compiledSources(projects: readonly MixProject[], candidates: readonly string[]): Map<string, MixProject[]> {
  const sources = new Map<string, MixProject[]>()
  for (const file of [...candidates].sort()) {
    if (!file.endsWith('.ex')) continue
    const nearest = nearestProject(projects, file)
    const compiling = projects.filter(project => compiles(project, file, nearest))
    if (compiling.length > 0) sources.set(file, compiling)
  }
  return sources
}

/** A project's display name: its `app:` name, else its directory, else the repository directory. */
function projectName(project: MixProject, repositoryRoot: string): string {
  return project.app ?? path.posix.basename(project.directory || repositoryRoot.split(path.sep).join('/'))
}

/** One source group per project, identified by its `mix.exs` path; a nested project names its enclosing one as parent. */
export function projectRoots(projects: readonly MixProject[], repositoryRoot: string): ScanRoot[] {
  return projects.map(project => {
    const parent = nearestProject(projects, project.file, project)
    return { id: project.file, kind: 'project', name: projectName(project, repositoryRoot), file: project.file,
      ...(parent ? { parent: parent.file } : {}) }
  })
}

/**
 * One execution entry per project that declares what launches it. The entry file is the one source
 * of that project declaring the launch module; its source unit is every file the project compiles.
 */
export function projectEntries(projects: readonly MixProject[], sources: ReadonlyMap<string, readonly MixProject[]>,
  repositoryRoot: string, declaringFile: (module: string) => string | undefined): ScanEntryPoint[] {
  return projects.flatMap(project => {
    const file = project.entryModule === undefined ? undefined : declaringFile(project.entryModule)
    if (file === undefined || !sources.get(file)?.includes(project)) return []
    const files = [...sources].flatMap(([source, compiling]) => compiling.includes(project) ? [source] : [])
    return [{ file, declaration: project.file, name: projectName(project, repositoryRoot), files }]
  })
}
