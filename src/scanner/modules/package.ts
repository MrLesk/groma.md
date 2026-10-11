import { parseScannerDiscovery, type ScannerDiscoveryMetadata } from '@groma/scanner'
import { createHash } from 'node:crypto'
import { homedir } from 'node:os'
import { mkdir, mkdtemp, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { stringArray } from './config.ts'
import { isNpmPackageName, publishedPluginSource } from './published.ts'

export interface NpmPluginSource {
  kind: 'npm'
  name: string
  source: string
  version: string
}

export interface LocalPluginSource {
  kind: 'local'
  packageRoot: string
  source: string
}

export interface GitPluginSource {
  kind: 'git'
  repository: string
  revision: string
  source: string
}

export type PluginSource = NpmPluginSource | LocalPluginSource | GitPluginSource

/** What every resolved plugin package has, whatever its kind. */
interface ResolvedPackageFields {
  id: string
  name: string
  version: string
}

export interface ResolvedScannerPackage extends ResolvedPackageFields {
  kind: 'scanner'
  /** The module groma.md imports to run the scanner. */
  entry: string
  discovery?: ScannerDiscoveryMetadata
  /** Git ignore patterns naming the files the scanner reads, written into its configuration when it is added. */
  include: string[]
  /** Default Git ignore patterns, written into the scanner's configuration when it is added. */
  exclude?: string[]
}

export interface ResolvedWorkSourcePackage extends ResolvedPackageFields {
  kind: 'workSource'
  /** The module groma.md imports to run the adapter. */
  entry: string
  /** The groma.md versions the adapter's manifest says it works with. */
  compatibility?: { groma?: string }
}

/** An icon pack holds images and no code, so it has no entry to import. */
export interface ResolvedIconPackage extends ResolvedPackageFields {
  kind: 'icons'
  /** Each icon name the pack declares, with the absolute path of its SVG file. */
  icons: Record<string, string>
}

/** The resolved package of each plugin kind. A caller that asks for one kind gets that kind's package type. */
interface ResolvedPackages {
  scanner: ResolvedScannerPackage
  workSource: ResolvedWorkSourcePackage
  icons: ResolvedIconPackage
}

export type PluginKind = keyof ResolvedPackages

export type ResolvedPluginPackage = ResolvedPackages[PluginKind]

export interface PluginResolutionOptions {
  /** Where npm and Git packages are kept instead of the shared ~/.groma/cache/plugins folder. */
  cacheRoot?: string
}

export interface PluginInstallOptions extends PluginResolutionOptions {
  /** The npm registry to read releases from and install with instead of the configured one. */
  registry?: string
}

const exactVersion = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/
const pluginId = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function cacheRoot(options: PluginResolutionOptions): string {
  return options.cacheRoot ?? path.join(homedir(), '.groma', 'cache', 'plugins')
}

function npmSource(source: string): NpmPluginSource | undefined {
  const separator = source.lastIndexOf('@')
  if (separator <= 0) return undefined
  const name = source.slice(0, separator)
  const version = source.slice(separator + 1)
  if (!isNpmPackageName(name) || !exactVersion.test(version)) return undefined
  return { kind: 'npm', name, source: `${name}@${version}`, version }
}

function projectLocalSource(repositoryRoot: string, absolute: string): string {
  const relative = path.relative(repositoryRoot, absolute)
  if (relative === '') return '.'
  if (relative.startsWith('..') || path.isAbsolute(relative)) return absolute
  return `./${relative.split(path.sep).join('/')}`
}

export function parsePluginSource(repositoryRoot: string, input: string): PluginSource {
  const source = input.trim()
  if (source.startsWith('git+')) {
    const url = new URL(source.slice(4))
    const revision = url.hash.slice(1)
    if (url.protocol !== 'https:' || url.username || url.password || url.search || !revision) {
      throw new Error('Git plugin source must be git+https://repository#tag-or-commit')
    }
    url.hash = ''
    return { kind: 'git', repository: url.href, revision, source: `git+${url.href}#${revision}` }
  }
  const npm = npmSource(source)
  if (npm !== undefined) return npm
  if (!source.startsWith('.') && !path.isAbsolute(source)) {
    throw new Error('plugin source must be an exact package@version, git+https://repository#tag-or-commit, or a local ./path')
  }
  const packageRoot = path.resolve(repositoryRoot, source)
  return {
    kind: 'local',
    packageRoot,
    source: projectLocalSource(repositoryRoot, packageRoot),
  }
}

function installDirectory(cacheRoot: string, source: string): string {
  const key = createHash('sha256').update(source).digest('hex').slice(0, 16)
  return path.join(cacheRoot, key)
}

function npmPackageRoot(cacheRoot: string, source: NpmPluginSource): string {
  return path.join(installDirectory(cacheRoot, source.source), 'node_modules', ...source.name.split('/'))
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`)
  }
  return value as Record<string, unknown>
}

/**
 * The absolute path of a file a manifest names inside its package, or undefined while that file is not on this
 * computer. `label` says in an error which manifest value is wrong.
 */
async function packageFile(packageRoot: string, value: unknown, label: string): Promise<string | undefined> {
  if (typeof value !== 'string' || !value.startsWith('./')) {
    throw new Error(`${label} must be a relative ./path`)
  }
  const file = path.resolve(packageRoot, value)
  const relativeFile = path.relative(packageRoot, file)
  if (relativeFile.startsWith('..') || path.isAbsolute(relativeFile)) {
    throw new Error(`${label} must stay inside its package`)
  }
  try {
    if (!(await stat(file)).isFile()) {
      throw new Error(`${label} must be a file: ${value}`)
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
    throw error
  }
  return file
}

/**
 * Each icon a pack declares, with the absolute path of its SVG file. This is the one check of a pack's files:
 * a declared icon whose file is missing or is not an .svg file blocks the whole pack.
 */
async function iconFiles(packageRoot: string, declared: unknown): Promise<Record<string, string>> {
  const files = object(declared, 'plugin package.json groma.icons.icons')
  if (Object.keys(files).length === 0) throw new Error('plugin package.json groma.icons.icons must declare at least one icon')
  const icons: Record<string, string> = {}
  for (const [name, value] of Object.entries(files)) {
    if (!pluginId.test(name)) throw new Error(`icon name must be lowercase kebab-case: ${name}`)
    const file = await packageFile(packageRoot, value, `icon ${name}`)
    if (!file?.endsWith('.svg')) throw new Error(`icon ${name} must name an existing SVG file`)
    icons[name] = file
  }
  return icons
}

/** A scanner manifest's include globs, which it must declare, and its optional default exclusions. */
function scannerLists(scanner: Record<string, unknown>): { include: string[]; exclude?: string[] } {
  if (!stringArray(scanner.include) || scanner.include.length === 0) {
    throw new Error('scanner package.json groma.scanner.include must list the files the scanner reads')
  }
  if (scanner.exclude !== undefined && !stringArray(scanner.exclude)) {
    throw new Error('scanner package.json groma.scanner.exclude must be an array of strings')
  }
  return { include: scanner.include, ...(scanner.exclude === undefined ? {} : { exclude: scanner.exclude }) }
}

function workSourceCompatibility(value: unknown): { groma?: string } | undefined {
  if (value === undefined) return undefined
  const compatibility = object(value, 'work source compatibility')
  if (Object.keys(compatibility).some(key => key !== 'groma')
    || (compatibility.groma !== undefined && typeof compatibility.groma !== 'string')) {
    throw new Error('work source compatibility may contain a groma version range')
  }
  return compatibility as { groma?: string }
}

/** A package's manifest text, or undefined when the package is not on this computer. */
async function manifestText(packageRoot: string): Promise<string | undefined> {
  try {
    return await readFile(path.join(packageRoot, 'package.json'), 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
    throw error
  }
}

/** The fields a manifest may declare under `groma.<kind>`. */
const declaredFields: Record<PluginKind, readonly string[]> = {
  scanner: ['id', 'entry', 'discovery', 'include', 'exclude'],
  workSource: ['id', 'entry', 'compatibility'],
  icons: ['id', 'icons'],
}

/** The kind a manifest declares, for a caller that accepts any kind. */
function declaredKind(groma: Record<string, unknown>): PluginKind {
  if (groma.scanner !== undefined) return 'scanner'
  if (groma.workSource !== undefined) return 'workSource'
  if (groma.icons !== undefined) return 'icons'
  throw new Error('plugin package.json groma must contain a scanner, a workSource or an icons section')
}

/** The id, name and version every kind declares the same way. */
function packageIdentity(manifest: Record<string, unknown>, declared: Record<string, unknown>, kind: PluginKind): ResolvedPackageFields {
  if (typeof declared.id !== 'string' || !pluginId.test(declared.id)) {
    throw new Error(`plugin package.json groma.${kind}.id must be lowercase kebab-case`)
  }
  if (typeof manifest.name !== 'string' || manifest.name.trim() === '') {
    throw new Error('plugin package.json name must be non-empty')
  }
  if (typeof manifest.version !== 'string' || manifest.version.trim() === '') {
    throw new Error('plugin package.json version must be non-empty')
  }
  return { id: declared.id, name: manifest.name, version: manifest.version }
}

/**
 * Reads a package of the given kind, or of the kind its manifest declares when the caller accepts any.
 * A package that does not declare the requested kind is refused here, which is what makes the kind-specific
 * return types of `resolvePluginPackage` and `installPluginPackage` true.
 */
async function pluginPackage(packageRoot: string, kind?: PluginKind): Promise<ResolvedPluginPackage | undefined> {
  const source = await manifestText(packageRoot)
  if (source === undefined) return undefined
  const manifest = object(JSON.parse(source), 'plugin package.json')
  const groma = object(manifest.groma, 'plugin package.json groma')
  kind ??= declaredKind(groma)
  const declared = object(groma[kind], `plugin package.json groma.${kind}`)
  const allowed = declaredFields[kind]
  if (Object.keys(declared).some(field => !allowed.includes(field))) {
    throw new Error(`plugin package.json groma.${kind} may contain only ${allowed.join(', ')}`)
  }
  const identity = packageIdentity(manifest, declared, kind)
  if (kind === 'icons') return { ...identity, kind, icons: await iconFiles(packageRoot, declared.icons) }
  const details = kind === 'scanner'
    ? { kind, ...scannerLists(declared) }
    : { kind, compatibility: workSourceCompatibility(declared.compatibility) }
  const entry = await packageFile(packageRoot, declared.entry, 'plugin package.json entry')
  if (entry === undefined) return undefined
  const shared = { entry, ...identity }
  if (details.kind === 'workSource') return { ...shared, ...details }
  return { ...shared, ...details, ...(declared.discovery === undefined ? {} : { discovery: parseScannerDiscovery(declared.discovery) }) }
}

async function installedPackage(source: PluginSource, cache: string, kind?: PluginKind): Promise<ResolvedPluginPackage | undefined> {
  const packageRoot = source.kind === 'local'
    ? source.packageRoot
    : source.kind === 'git'
      ? installDirectory(cache, source.source)
      : npmPackageRoot(cache, source)
  const resolved = await pluginPackage(packageRoot, kind)
  if (resolved !== undefined && source.kind === 'npm') {
    if (resolved.name !== source.name || resolved.version !== source.version) {
      throw new Error(`installed plugin does not match ${source.source}`)
    }
  }
  return resolved
}

/**
 * The package a source resolves to on this computer, or undefined when it is not installed. Nothing is downloaded
 * and no plugin code runs. The compiler does not check the kind-specific return type against the body; see `pluginPackage`.
 */
export function resolvePluginPackage<K extends PluginKind>(
  source: PluginSource, options: PluginResolutionOptions, kind: K,
): Promise<ResolvedPackages[K] | undefined>
export function resolvePluginPackage(
  source: PluginSource, options: PluginResolutionOptions, kind: PluginKind,
): Promise<ResolvedPluginPackage | undefined> {
  return installedPackage(source, cacheRoot(options), kind)
}

async function installNpmPackage(
  source: NpmPluginSource,
  cache: string,
  registry?: string,
  kind?: PluginKind,
): Promise<ResolvedPluginPackage> {
  const directory = installDirectory(cache, source.source)
  await mkdir(directory, { recursive: true })
  await writeFile(path.join(directory, 'package.json'), `${JSON.stringify({
    private: true,
    dependencies: { [source.name]: source.version },
  }, null, 2)}\n`)
  await installDependencies(directory, source.source, registry)
  const resolved = await installedPackage(source, cache, kind)
  if (resolved === undefined) throw new Error(`installed plugin is missing: ${source.source}`)
  return resolved
}

async function installDependencies(directory: string, source: string, registry?: string): Promise<void> {
  const command = [process.execPath, 'install', '--ignore-scripts']
  if (registry !== undefined) command.push(`--registry=${registry}`)
  const child = Bun.spawn(command, {
    cwd: directory,
    env: { ...process.env, BUN_BE_BUN: '1' },
    stderr: 'pipe', stdout: 'ignore',
  })
  const [exitCode, stderr] = await Promise.all([child.exited, new Response(child.stderr).text()])
  if (exitCode !== 0) {
    throw new Error(`Could not download ${source}. Check your connection and registry access, then retry.\n${stderr.trim() || `exit ${exitCode}`}`)
  }
}

async function git(directory: string, ...args: string[]): Promise<string> {
  const child = Bun.spawn(['git', ...args], {
    cwd: directory, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    stdout: 'pipe', stderr: 'pipe', stdin: 'ignore',
  })
  const [code, stdout, stderr] = await Promise.all([
    child.exited, new Response(child.stdout).text(), new Response(child.stderr).text(),
  ])
  if (code !== 0) throw new Error(`could not install Git plugin: ${stderr.trim()}`)
  return stdout.trim()
}

async function installGitPackage(
  source: GitPluginSource,
  cache: string,
  registry?: string,
  kind?: PluginKind,
): Promise<{ source: string; package: ResolvedPluginPackage }> {
  await mkdir(cache, { recursive: true })
  const temporary = await mkdtemp(path.join(cache, 'checkout-'))
  try {
    await git(temporary, 'init', '--quiet')
    const revision = /^[0-9a-f]{40}$/i.test(source.revision)
      ? source.revision : `refs/tags/${source.revision}`
    await git(temporary, 'fetch', '--depth=1', source.repository, revision)
    const commit = await git(temporary, 'rev-parse', 'FETCH_HEAD^{commit}')
    await git(temporary, 'checkout', '--quiet', '--detach', commit)
    const pinned = { ...source, revision: commit, source: `git+${source.repository}#${commit}` }
    const existing = await installedPackage(pinned, cache, kind)
    if (existing !== undefined) return { source: pinned.source, package: existing }
    const resolved = await pluginPackage(temporary, kind)
    if (resolved === undefined) throw new Error('Git repository must contain a runnable plugin package at its root')
    await installDependencies(temporary, pinned.source, registry)
    const destination = installDirectory(cache, pinned.source)
    await rename(temporary, destination)
    const moved = (file: string) => path.join(destination, path.relative(temporary, file))
    return { source: pinned.source, package: resolved.kind === 'icons'
      ? { ...resolved, icons: Object.fromEntries(Object.entries(resolved.icons).map(([name, file]) => [name, moved(file)])) }
      : { ...resolved, entry: moved(resolved.entry) } }
  } finally {
    await rm(temporary, { recursive: true, force: true })
  }
}

/**
 * Installation is explicit; registry loading only resolves already installed packages. A caller that names a kind
 * gets that kind's package; without one the manifest decides. The compiler does not check the kind-specific
 * return type against the body; see `pluginPackage`.
 */
export function installPluginPackage<K extends PluginKind>(
  source: PluginSource, options: PluginInstallOptions, kind: K,
): Promise<{ source: string; package: ResolvedPackages[K] }>
export function installPluginPackage(
  source: PluginSource, options: PluginInstallOptions, kind?: PluginKind,
): Promise<{ source: string; package: ResolvedPluginPackage }>
export async function installPluginPackage(
  source: PluginSource,
  options: PluginInstallOptions,
  kind?: PluginKind,
): Promise<{ source: string; package: ResolvedPluginPackage }> {
  const cache = cacheRoot(options)
  if (source.kind === 'git') return installGitPackage(source, cache, options.registry, kind)
  const resolved = source.kind === 'npm'
    ? await installNpmPackage(source, cache, options.registry, kind)
    : await installedPackage(source, cache, kind)
  if (resolved === undefined) throw new Error(`plugin package not found: ${source.source}`)
  return { source: source.source, package: resolved }
}

/** The exact source an input names: a bare npm package name becomes its newest published release this computer can run. */
export async function requestedPluginSource(
  root: string, input: string, options: PluginInstallOptions, kind?: PluginKind,
): Promise<PluginSource> {
  const requested = input.trim()
  return parsePluginSource(root, isNpmPackageName(requested)
    ? await publishedPluginSource(requested, options.registry, kind) : requested)
}

function samePackage(current: PluginSource, replacement: PluginSource): boolean {
  if (current.kind === 'npm' && replacement.kind === 'npm') return current.name === replacement.name
  if (current.kind === 'git' && replacement.kind === 'git') return current.repository === replacement.repository
  return false
}

/** Prepare an update without changing the project selection; callers own kind validation and configuration. */
export async function preparePluginUpdate<K extends PluginKind>(
  root: string,
  selected: { id: string; source: string },
  input: string | undefined,
  options: PluginInstallOptions,
  kind: K,
): Promise<{ source: string; package: ResolvedPackages[K] }> {
  const current = parsePluginSource(root, selected.source)
  const requested = input?.trim() ?? (current.kind === 'npm' ? current.name : undefined)
  if (!requested) throw new Error('Git updates require a tag or commit; local plugins run from their configured path')
  const replacement = await requestedPluginSource(root, requested, options, kind)
  if (!samePackage(current, replacement)) {
    throw new Error('Plugin update must keep the same npm package or Git repository; local plugins run from their configured path')
  }
  const installed = await installPluginPackage(replacement, options, kind)
  if (installed.package.id !== selected.id) throw new Error(`Plugin id changed: ${installed.package.id}`)
  return installed
}

/**
 * Puts one selection's package back on this computer without changing the selection: an npm or Git source is
 * installed again, a local path only has to be there. Reports whether anything was installed.
 */
export async function restorePluginPackage<K extends PluginKind>(
  root: string,
  selected: { id: string; source: string },
  options: PluginInstallOptions,
  kind: K,
): Promise<{ installed: boolean; package: ResolvedPackages[K] }> {
  const source = parsePluginSource(root, selected.source)
  const resolved = source.kind === 'local'
    ? await resolvePluginPackage(source, options, kind)
    : (await installPluginPackage(source, options, kind)).package
  if (resolved === undefined) throw new Error(`Plugin ${selected.id} is missing. Restore its local directory: ${selected.source}`)
  if (resolved.id !== selected.id) throw new Error(`Configured plugin ${selected.id} resolves to manifest id ${resolved.id}`)
  return { installed: source.kind !== 'local', package: resolved }
}
