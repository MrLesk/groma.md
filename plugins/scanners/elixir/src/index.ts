import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { createScanObservation, type CodeFile, type ScanDiagnostic, type ScannerPlugin } from '@groma/scanner'
import { ashMounts, ashRoutingWrappers, readAsh } from './ash/index.ts'
import { compiledSources, mixProject, projectEntries, projectRoots, type MixProject } from './mix.ts'
import { moduleScopes } from './modules.ts'
import { grammarVersion, parseElixir } from './parser.ts'
import { phoenixEndpoints } from './phoenix/endpoints.ts'
import { provenRouters, providesRouter, routerCandidate } from './phoenix/router.ts'
import { elixirSource, moduleIndex } from './source.ts'

/*
 * The Elixir scanner, from selected files to one observation:
 *
 * 1. `mix.ts` reads every `mix.exs` and decides which `.ex` files Mix compiles.
 * 2. Each compiled file is parsed once. `modules.ts`, `source.ts` and `calls.ts` describe its modules
 *    and functions, `phoenix/router.ts` reads the routes of router modules, and `ash/` reads Ash
 *    resources, domains and JSON:API routers.
 * 3. Facts that need several files are resolved after all files are read: execution entries, and in
 *    `phoenix/endpoints.ts` the function that handles each route. Phoenix knows nothing about Ash:
 *    this file hands it the lookup of what an AshJsonApi router serves under a `forward`.
 */

const isMixFile = (file: string) => path.posix.basename(file) === 'mix.exs'

/**
 * The Mix projects among `files` and the sources they compile. A scan fails on a `mix.exs` it
 * cannot parse; a listing skips it, because a listing also sees files that exclusions later remove.
 */
async function selectSources(root: string, files: readonly string[], unparsable: 'fail' | 'skip') {
  const projects: MixProject[] = []
  for (const file of files.filter(isMixFile).sort()) {
    try {
      projects.push(await parseElixir(file, await readFile(path.join(root, file), 'utf8'), tree => mixProject(tree, file)))
    } catch (error) {
      if (unparsable === 'fail') throw error
    }
  }
  return { projects, sources: compiledSources(projects, files) }
}

/**
 * Everything one source file states, as plain data: the syntax tree is freed when this returns.
 * `entries` are the symbol names its Code links mark as entries.
 */
async function readSource(root: string, file: string, entries: readonly string[] = []) {
  return parseElixir(file, await readFile(path.join(root, file), 'utf8'), tree => {
    const scopes = moduleScopes(tree)
    const ash = readAsh(scopes, file)
    return {
      ...elixirSource(file, scopes, ash.generated, entries),
      ash: ash.facts,
      routerCandidates: scopes.flatMap(scope => routerCandidate(scope, file, ashRoutingWrappers) ?? []),
      routerProviders: scopes.filter(providesRouter).map(scope => scope.name),
    }
  })
}

function diagnostics(projects: readonly MixProject[], sources: ReadonlyMap<string, readonly MixProject[]>): ScanDiagnostic[] {
  const compiling = new Set([...sources.values()].flat())
  return [
    { severity: 'info', code: 'ELIXIR_SOURCE_SCOPE',
      message: 'Elixir syntax evidence only: call targets stay unresolved, and macros, `use` callbacks and protocols are not expanded. Mix, Phoenix and Ash declarations are read in their documented literal forms without running Mix or the application. Routes the scanner cannot read remain blockers.' },
    ...projects.filter(project => project.sourceRoots === undefined && compiling.has(project)).map(project => ({
      severity: 'warning', code: 'ELIXIR_SOURCE_ROOTS_UNREADABLE', file: project.file,
      message: 'The compiled source directories (elixirc_paths) are not written as literal lists, so every selected .ex file of this Mix project that no nested project claims is read as source.' })),
  ]
}

export default {
  id: 'elixir',
  listSourceFiles: async (root, _settings, candidates) => [...(await selectSources(root, candidates, 'skip')).sources.keys()],
  async checkReadiness(root, _settings, files) {
    // Reading the `mix.exs` files also loads the bundled parser, the scanner's only tool.
    const { sources } = await selectSources(root, files, 'fail')
    if (sources.size === 0) throw new Error('elixir: No Mix project (mix.exs) with selected Elixir source files was found.')
  },
  async scan(root, _settings, selected) {
    const { projects, sources } = await selectSources(root, selected, 'fail')
    if (sources.size === 0) return undefined
    const parsed: Awaited<ReturnType<typeof readSource>>[] = []
    for (const file of sources.keys()) parsed.push(await readSource(root, file))
    const moduleNamed = moduleIndex(parsed)
    const ash = parsed.map(source => source.ash)
    const mounts = ashMounts(ash.flatMap(facts => facts.resources), ash.flatMap(facts => facts.domains), ash.flatMap(facts => facts.routers))
    const routers = provenRouters(parsed.flatMap(source => source.routerCandidates),
      new Set(parsed.flatMap(source => source.routerProviders)), moduleNamed)
    const phoenix = phoenixEndpoints(routers, moduleNamed, mounts)
    return createScanObservation({
      scanner: { id: 'elixir', technology: 'elixir', engine: 'tree-sitter-elixir', engineVersion: grammarVersion },
      roots: projectRoots(projects, root),
      files: parsed.map(source => ({ file: source.file, roots: sources.get(source.file)!.map(project => project.file), symbols: source.symbols })),
      entryPoints: projectEntries(projects, sources, root, module => moduleNamed(module)?.file),
      operations: [...parsed.flatMap(source => source.operations), ...ash.flatMap(facts => facts.operations), ...phoenix.operations],
      invocations: parsed.flatMap(source => source.invocations),
      httpEndpoints: phoenix.endpoints,
      diagnostics: diagnostics(projects, sources),
    })
  },
  async readCodeStructure(root, references): Promise<CodeFile[]> {
    const files: CodeFile[] = []
    for (const reference of references) {
      if (!reference.file.endsWith('.ex')) continue
      const { declarations } = await readSource(root, reference.file, reference.symbols)
      if (declarations.length) files.push({ file: reference.file, declarations })
    }
    return files
  },
} satisfies ScannerPlugin
