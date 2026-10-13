import path from 'node:path'
import type { ScanDiagnostic } from '@groma/scanner'
import ts from 'typescript'
import { frameworkProjectFiles, frameworkSourceFiles } from '../../typescript-project.ts'

/** A package that declares Angular; an Nx workspace declares it once at its root and keeps configs in each project. */
const SELECTION = { dependency: '@angular/core', projects: ['.ts'], nestedConfig: true } as const
const RESOURCES = ['.html', '.css', '.scss', '.sass', '.less', '.styl']

export function relative(root: string, file: string): string {
  return path.relative(root, file).split(path.sep).join('/')
}

function failDiagnostics(diagnostics: readonly ts.Diagnostic[]): void {
  const errors = diagnostics.filter(item => item.category === ts.DiagnosticCategory.Error)
  if (errors.length) throw new Error(errors.map(item => {
    const file = item.file?.fileName ?? 'Angular'
    return `${file}: ${ts.flattenDiagnosticMessageText(item.messageText, '\n')}`
  }).join('\n'))
}

/**
 * Each Angular project directory with the TypeScript sources among the scanner's files that its scan compiles; a file
 * belongs to its nearest project.
 */
export function angularProjects(root: string, files: readonly string[]): Promise<Map<string, string[]>> {
  return frameworkProjectFiles({ root, files, ...SELECTION, sources: ['.ts'] })
}

/** The candidates a scan can read: the sources, and every template and stylesheet a component can name. */
export function angularSourceFiles(root: string, candidates: readonly string[]): Promise<string[]> {
  return frameworkSourceFiles({ root, files: candidates, ...SELECTION, sources: ['.ts', ...RESOURCES] })
}

/**
 * Settings the bundled TypeScript cannot read: an extended config a fresh checkout lacks (an uninstalled
 * package or a generated file), or an option or value from a newer TypeScript. The rest of the config still applies.
 */
const unreadable = new Set([5083, 6053, 5023, 6046])

export interface ProjectConfig { file: string; config: ts.ParsedCommandLine }

/**
 * Every `tsconfig.json` among the scanner's files inside the Angular projects, and each config they reference, as a
 * solution config names its projects.
 */
export function projectConfigs(root: string, directories: readonly string[],
  files: readonly string[]): { configs: ProjectConfig[]; diagnostics: ScanDiagnostic[] } {
  const configs = new Map<string, ProjectConfig>()
  const diagnostics: ScanDiagnostic[] = []
  const read = (file: string): void => {
    if (configs.has(file)) return
    const json = ts.readConfigFile(file, ts.sys.readFile)
    if (json.error) failDiagnostics([json.error])
    const config = ts.parseJsonConfigFileContent(json.config, ts.sys, path.dirname(file), undefined, file)
    // An empty input set contributes no source; other errors block scanning.
    failDiagnostics(config.errors.filter(error => error.code !== 18003 && !unreadable.has(error.code)))
    diagnostics.push(...config.errors.flatMap(error => unreadable.has(error.code) ? [{ severity: 'warning' as const,
      code: 'angular-unreadable-config', file: relative(root, file),
      message: `The scanner's TypeScript cannot read a setting; the rest of the config applies. ${ts.flattenDiagnosticMessageText(error.messageText, ' ')}` }] : []))
    configs.set(file, { file, config })
    for (const reference of config.projectReferences ?? []) read(ts.resolveProjectReferencePath(reference))
  }
  const inProject = (file: string) => directories.some(directory => directory === '.' || file.startsWith(`${directory}/`))
  for (const file of files.filter(file => path.posix.basename(file) === 'tsconfig.json' && inProject(file))) read(path.join(root, file))
  return { configs: [...configs.values()], diagnostics }
}

/**
 * One compiler program: the project sources it owns and reports, each once, and every repository source it reads, such
 * as an imported library. A source is reported under the name its owning program gives it: the config's spelling when
 * a config includes it, otherwise the importing program's, otherwise the first listed one.
 */
export interface AngularProgram { program: ts.Program; owned: ReadonlySet<ts.SourceFile>; sources: readonly ts.SourceFile[] }

function inRepository(root: string, source: ts.SourceFile): boolean {
  return !source.isDeclarationFile && !relative(root, source.fileName).startsWith('../') && !source.fileName.includes('/node_modules/')
}

/**
 * As in the TypeScript scanner, a source belongs to the deepest config that includes it. Configs arrive in reading
 * order, each referenced config after the config that names it, so at equal depth the referenced config wins. A
 * source no config includes compiles in a program that imports it, else with default options.
 */
function configOwners(wanted: ReadonlySet<string>, configs: readonly ProjectConfig[]): Map<string, ProjectConfig> {
  const depth = (owner: ProjectConfig) => path.dirname(owner.file).split(path.sep).length
  const owners = new Map<string, ProjectConfig>()
  for (const owner of configs) {
    for (const file of owner.config.fileNames.map(name => path.resolve(name)).filter(name => wanted.has(name))) {
      const previous = owners.get(file)
      if (!previous || depth(owner) >= depth(previous)) owners.set(file, owner)
    }
  }
  return owners
}

/**
 * Pairs a program with the sources it owns, the ones its listed `paths` name. One source has one owner however many
 * listed paths name it, as two spellings of a path do on a case-insensitive disk, so the owned sources are a set of the
 * compiler's sources and never a list of paths.
 */
function programWithOwnedSources(program: ts.Program, paths: readonly string[]): { program: ts.Program; owned: Set<ts.SourceFile> } {
  return { program, owned: new Set(paths.map(file => program.getSourceFile(file)!)) }
}

export function angularPrograms(root: string, files: readonly string[], configs: readonly ProjectConfig[]): AngularProgram[] {
  const wanted = new Set(files.map(file => path.resolve(root, file)))
  const owners = configOwners(wanted, configs)
  const groups = new Map<ProjectConfig, string[]>()
  for (const [file, owner] of owners) groups.set(owner, [...groups.get(owner) ?? [], file])
  const programs = [...groups].map(([owner, rootNames]) =>
    programWithOwnedSources(ts.createProgram(rootNames, { ...owner.config.options, noEmit: true }), rootNames))
  const loose: string[] = []
  for (const file of wanted) {
    if (owners.has(file)) continue
    const readers = programs.filter(({ program }) => program.getSourceFile(file) !== undefined)
    // A source that has its owner keeps it: a second listed path naming it adds no owner, even when another program
    // reads the source first. The owned set alone only prevents a repeat inside one program, and each program has
    // its own `ts.SourceFile` objects, so a source another program owns is found by asking every program that reads it.
    if (readers.some(({ program, owned }) => owned.has(program.getSourceFile(file)!))) continue
    const [importer] = readers
    if (importer) importer.owned.add(importer.program.getSourceFile(file)!)
    else loose.push(file)
  }
  if (loose.length) programs.push(programWithOwnedSources(ts.createProgram(loose, { noEmit: true }), loose))
  return programs.map(({ program, owned }) => {
    // Each source's own program checks its syntax; an imported file from elsewhere is only context.
    failDiagnostics([...owned].flatMap(source => program.getSyntacticDiagnostics(source)))
    return { program, owned, sources: program.getSourceFiles().filter(source => inRepository(root, source)) }
  })
}
