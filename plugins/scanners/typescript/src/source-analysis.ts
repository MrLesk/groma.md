import { stat } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { API, ModuleKind, ModuleResolutionKind, type CompilerOptions } from 'typescript/async'
import { SyntaxKind, type SourceFile } from 'typescript/ast'
import type { ScanDiagnostic, ScanHttpEndpoint, ScanHttpRequest, ScanSymbol, ScanOperation, ScanInvocation } from '@groma/scanner'

import { usedImportSpecifiers } from './source-usage.ts'
import { buildOutputs, typescriptProjects, type TypeScriptProject } from './projects.ts'
import { resolvedImports } from './source-imports.ts'
import { sourceOperations } from './source-operations.ts'
import { exportSymbols } from './source-symbols.ts'
import { nativeChecker, syntax } from './native-checker.ts'
import { sourceBuildEntries } from '../../entry-points/source.ts'
import type { SourceEntry } from '../../entry-points/javascript.ts'
import { packagePaths, type BuildOutput } from '../../workspace-packages.ts'

export interface SourceAnalysis {
  file: string
  imports: string[]
  symbols: ScanSymbol[]
}

type ProjectEvidence = {
  entries: SourceEntry[]
  files: SourceAnalysis[]
  operations: ScanOperation[]
  invocations: ScanInvocation[]
  httpEndpoints: ScanHttpEndpoint[]
  httpRequests: ScanHttpRequest[]
}

/** Everything the programs state, with the build outputs that map built files back to their source. */
type SourceEvidence = ProjectEvidence & { diagnostics: ScanDiagnostic[]; buildOutputs: BuildOutput[] }

function unique<Fact>(facts: Fact[]): Fact[] {
  return [...new Map(facts.map(fact => [JSON.stringify(fact), fact])).values()]
}

/**
 * A program that compiles a NestJS controller without the file creating its application, such as a check outside
 * every config or the controller's own library config, places its routes in the controller's own file
 * (./http-controllers.ts). Where another program places the same route in its application, that reading stands.
 */
function placedEndpoints(endpoints: readonly ScanHttpEndpoint[], operationFiles: ReadonlyMap<string, string>): ScanHttpEndpoint[] {
  const route = ({ operation, method, path }: ScanHttpEndpoint) => JSON.stringify([operation, method, path])
  const unplaced = ({ order, operation }: ScanHttpEndpoint) => order !== undefined && order.application === operationFiles.get(operation)
  const placed = new Set(endpoints.filter(endpoint => !unplaced(endpoint)).map(route))
  return unique(endpoints.filter(endpoint => !unplaced(endpoint) || !placed.has(route(endpoint))))
}

/**
 * The facts of every program, where a file two programs compile states its facts twice: one operation per id, every
 * invocation claim so core can detect conflicting resolutions, each request once and each route as placed.
 */
function mergedEvidence(programs: readonly ProjectEvidence[]): ProjectEvidence {
  const operations = [...new Map(programs.flatMap(program => program.operations).map(operation => [operation.id, operation])).values()]
  return {
    entries: programs.flatMap(program => program.entries),
    files: programs.flatMap(program => program.files),
    operations,
    invocations: programs.flatMap(program => program.invocations),
    httpEndpoints: placedEndpoints(programs.flatMap(program => program.httpEndpoints),
      new Map(operations.map(operation => [operation.id, operation.file]))),
    httpRequests: unique(programs.flatMap(program => program.httpRequests)),
  }
}

/**
 * Each compiler project resolves its own aliases; only the selected `paths` become evidence. The configs and workspace
 * manifests read are those among the scanner's `files`.
 */
export async function analyzeSourceFiles(repositoryRoot: string, paths: string[], files: readonly string[]): Promise<SourceEvidence> {
  if (paths.length === 0) return { ...mergedEvidence([]), diagnostics: [], buildOutputs: [] }
  const api = new API({ cwd: repositoryRoot })
  try {
    const { projects, diagnostics } = await typescriptProjects(api, repositoryRoot, paths, files)
    const outputs = buildOutputs(repositoryRoot, projects)
    const workspacePaths = await packagePaths(repositoryRoot, outputs, files)
    // A file's imports come from its own config's program, whose aliases it is written for; a file no config owns
    // takes them from any program that reaches it.
    const configured = new Set(projects.flatMap(project => project.config === undefined ? [] : project.files.map(file => path.resolve(file))))
    const programs: ProjectEvidence[] = []
    for (const project of projects) {
      if (!project.config) {
        const analyzed = new Set(programs.flatMap(program => program.files).map(file => path.resolve(repositoryRoot, file.file)))
        project.files = project.files.filter(file => !analyzed.has(file))
        if (!project.files.length) continue
      }
      programs.push(await analyzeProject(api, repositoryRoot, paths, project, workspacePaths, configured))
    }
    return { ...mergedEvidence(programs), diagnostics, buildOutputs: outputs }
  } finally {
    await api.close()
  }
}

/**
 * Analysing one program takes about this many bytes of memory for every byte of its source, at the highest point and
 * in both processes together: the compiler holds the program's syntax trees and symbols, and the scanner its copy of
 * the trees and what it resolves from them. Programs of 18 to 36 MB of source in three repositories took 184 to 258.
 * To measure again, divide the highest memory of both processes by the source size of one such program.
 */
const MEMORY_PER_SOURCE_BYTE = 250

/** One program's analysis may take this share of the machine's memory; the rest stays with everything else running. */
const MACHINE_SHARE = 0.5

/** The most source, in bytes, that one program may hold on this machine. */
export function largestProgramSource(): number {
  return os.totalmem() * MACHINE_SHARE / MEMORY_PER_SOURCE_BYTE
}

const gigabytes = (bytes: number) => `${Number((bytes / 2 ** 30).toFixed(1))} GB`

/**
 * Fails the scan before a program takes more memory than the machine can give it. A program that runs the machine out
 * of memory freezes it or is killed without a word; this failure is a message, and core keeps the saved scanner data.
 */
function requireMemoryFor(project: string, files: number, sourceBytes: number): void {
  if (sourceBytes <= largestProgramSource()) return
  throw new Error(`stopped, ${project} (${files.toLocaleString('en-US')} files) would take about `
    + `${gigabytes(sourceBytes * MEMORY_PER_SOURCE_BYTE)} of memory, more than the `
    + `${gigabytes(os.totalmem() * MACHINE_SHARE)} a scan may take of this machine's ${gigabytes(os.totalmem())}`)
}

/** The size on disk of a project's files. A file removed since the files were listed counts as nothing. */
async function sizeOnDisk(files: readonly string[]): Promise<number> {
  const sizes = await Promise.all(files.map(file => stat(file).then(stats => stats.size, () => 0)))
  return sizes.reduce((sum, size) => sum + size, 0)
}

/**
 * A program lives for one project's analysis. Its evidence is plain data, so the program and the source trees fetched
 * for it are released before the next project is compiled: a repository of many projects then needs the memory of its
 * largest one, not of all of them together. That one has to fit the machine. Compiling takes most of the compiler's
 * memory within a second, so the project's own files are measured before it; the files they import are known only
 * once the program exists, so the program is measured again before its symbols are read.
 */
async function analyzeProject(
  api: API, repositoryRoot: string, paths: string[], project: TypeScriptProject, workspacePaths: Record<string, string[]>,
  configured: ReadonlySet<string>,
): Promise<ProjectEvidence> {
  const options: CompilerOptions = project.config?.options ?? {
    noLib: true, types: [], allowJs: true,
    moduleResolution: ModuleResolutionKind.Bundler, module: ModuleKind.Preserve,
  }
  const name = project.config === undefined ? 'the files outside every tsconfig.json'
    : path.relative(repositoryRoot, project.key).split(path.sep).join('/')
  requireMemoryFor(name, project.files.length, await sizeOnDisk(project.files))
  // Repository packages resolve to their source without node_modules; an identical key in the config's own paths wins.
  const program = await api.createProgram(project.files,
    { ...options, paths: { ...workspacePaths, ...options.paths }, noEmit: true })
  try {
    const sources = await Promise.all(paths.map(file => program.getSourceFile(path.join(repositoryRoot, file))))
    const selectedProgramSources = sources.filter((source): source is SourceFile => source !== undefined)
    requireMemoryFor(name, selectedProgramSources.length, selectedProgramSources.reduce((sum, source) => sum + source.text.length, 0))
    // The program's selected files by the compiler's path, so an import is matched to its file without loading it.
    const selectedFiles = new Map(selectedProgramSources.map(source =>
      [source.path, path.relative(repositoryRoot, source.fileName).split(path.sep).join('/')]))
    const checker = program.getProject().checker
    // One adapter per program, so operations and entries share its answers.
    const sharedChecker = nativeChecker(checker)
    const evidence = await sourceOperations(repositoryRoot, selectedProgramSources, checker, sharedChecker)
    const owned = new Set(project.files.map(file => path.resolve(file)))
    const readsImports = ({ fileName }: SourceFile) => owned.has(path.resolve(fileName)) || !configured.has(path.resolve(fileName))
    const files = await Promise.all(selectedProgramSources.filter(readsImports).map(async source => {
      const file = selectedFiles.get(source.path)!
      const specifiers = await usedImportSpecifiers(source, checker)
      const imports = await resolvedImports(source, specifiers, checker, selectedFiles)
      return { file, imports, symbols: exportSymbols(file, source) }
    }))
    const entries = await sourceBuildEntries(repositoryRoot, { ...syntax, SyntaxKind }, sharedChecker, selectedProgramSources)
    return { files, ...evidence, entries }
  } finally {
    await program.dispose()
  }
}
