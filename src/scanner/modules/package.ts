import { parseScannerDiscovery, type ScannerDiscoveryMetadata } from '@groma/scanner'
import { createHash } from 'node:crypto'
import { homedir } from 'node:os'
import { mkdir, mkdtemp, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { stringArray } from './config.ts'
import { isNpmPackageName, publishedScannerSource } from './published.ts'

export interface NpmScannerSource {
  kind: 'npm'
  name: string
  source: string
  version: string
}

export interface LocalScannerSource {
  kind: 'local'
  packageRoot: string
  source: string
}

export interface GitScannerSource {
  kind: 'git'
  repository: string
  revision: string
  source: string
}

export type ScannerSource = NpmScannerSource | LocalScannerSource | GitScannerSource

/** What every resolved plugin package has, whatever its kind. */
interface ResolvedPackageFields {
  entry: string
  id: string
  name: string
  version: string
}

export interface ResolvedScannerPackage extends ResolvedPackageFields {
  kind: 'scanner'
  discovery?: ScannerDiscoveryMetadata
  /** Git ignore patterns naming the files the scanner reads, written into its configuration when it is added. */
  include: string[]
  /** Default Git ignore patterns, written into the scanner's configuration when it is added. */
  exclude?: string[]
}

export interface ResolvedWorkSourcePackage extends ResolvedPackageFields {
  kind: 'workSource'
  /** The groma.md versions the adapter's manifest says it works with. */
  compatibility?: { groma?: string }
}

/** The resolved package of each plugin kind. A caller that asks for one kind gets that kind's package type. */
interface ResolvedPackages {
  scanner: ResolvedScannerPackage
  workSource: ResolvedWorkSourcePackage
}

export type PluginKind = keyof ResolvedPackages

export type ResolvedPluginPackage = ResolvedPackages[PluginKind]

const exactVersion = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/
const scannerId = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function defaultScannerCacheRoot(): string {
  return path.join(homedir(), '.groma', 'cache', 'plugins')
}

function npmSource(source: string): NpmScannerSource | undefined {
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

export function parseScannerSource(repositoryRoot: string, input: string): ScannerSource {
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

function npmPackageRoot(cacheRoot: string, source: NpmScannerSource): string {
  return path.join(installDirectory(cacheRoot, source.source), 'node_modules', ...source.name.split('/'))
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`)
  }
  return value as Record<string, unknown>
}

async function scannerEntry(packageRoot: string, value: unknown): Promise<string | undefined> {
  if (typeof value !== 'string' || !value.startsWith('./')) {
    throw new Error('plugin package.json entry must be a relative ./path')
  }
  const entry = path.resolve(packageRoot, value)
  const relativeEntry = path.relative(packageRoot, entry)
  if (relativeEntry.startsWith('..') || path.isAbsolute(relativeEntry)) {
    throw new Error('plugin package.json entry must stay inside its package')
  }
  try {
    if (!(await stat(entry)).isFile()) {
      throw new Error(`plugin package entry must be a file: ${value}`)
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
    throw error
  }
  return entry
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

/** Reads a package of the given kind, or of the kind its manifest declares when the caller accepts any. */
async function scannerPackage(packageRoot: string, kind?: PluginKind): Promise<ResolvedPluginPackage | undefined> {
  const source = await manifestText(packageRoot)
  if (source === undefined) return undefined
  const manifest = object(JSON.parse(source), 'plugin package.json')
  const groma = object(manifest.groma, 'plugin package.json groma')
  kind ??= groma.scanner !== undefined ? 'scanner' : 'workSource'
  const declared = object(groma[kind], `plugin package.json groma.${kind}`)
  const allowed = kind === 'scanner' ? ['id', 'entry', 'discovery', 'include', 'exclude'] : ['id', 'entry', 'compatibility']
  if (Object.keys(declared).some(field => !allowed.includes(field))) {
    throw new Error(`plugin package.json groma.${kind} contains unsupported fields`)
  }
  const details = kind === 'scanner'
    ? { kind, ...scannerLists(declared) }
    : { kind, compatibility: workSourceCompatibility(declared.compatibility) }
  if (typeof declared.id !== 'string' || !scannerId.test(declared.id)) {
    throw new Error(`plugin package.json groma.${kind}.id must be lowercase kebab-case`)
  }
  if (typeof manifest.name !== 'string' || manifest.name.trim() === '') {
    throw new Error('plugin package.json name must be non-empty')
  }
  if (typeof manifest.version !== 'string' || manifest.version.trim() === '') {
    throw new Error('plugin package.json version must be non-empty')
  }
  const entry = await scannerEntry(packageRoot, declared.entry)
  if (entry === undefined) return undefined
  const shared = { entry, id: declared.id, name: manifest.name, version: manifest.version }
  if (details.kind === 'workSource') return { ...shared, ...details }
  return { ...shared, ...details, ...(declared.discovery === undefined ? {} : { discovery: parseScannerDiscovery(declared.discovery) }) }
}

export function resolveScannerPackage<K extends PluginKind>(
  source: ScannerSource, cacheRoot: string, kind: K,
): Promise<ResolvedPackages[K] | undefined>
export function resolveScannerPackage(
  source: ScannerSource, cacheRoot?: string, kind?: PluginKind,
): Promise<ResolvedPluginPackage | undefined>
export async function resolveScannerPackage(
  source: ScannerSource,
  cacheRoot = defaultScannerCacheRoot(),
  kind?: PluginKind,
): Promise<ResolvedPluginPackage | undefined> {
  const packageRoot = source.kind === 'local'
    ? source.packageRoot
    : source.kind === 'git'
      ? installDirectory(cacheRoot, source.source)
      : npmPackageRoot(cacheRoot, source)
  const resolved = await scannerPackage(packageRoot, kind)
  if (resolved !== undefined && source.kind === 'npm') {
    if (resolved.name !== source.name || resolved.version !== source.version) {
      throw new Error(`installed plugin does not match ${source.source}`)
    }
  }
  return resolved
}

async function installNpmScanner(
  source: NpmScannerSource,
  cacheRoot = defaultScannerCacheRoot(),
  registry?: string,
  kind?: PluginKind,
): Promise<ResolvedPluginPackage> {
  const directory = installDirectory(cacheRoot, source.source)
  await mkdir(directory, { recursive: true })
  await writeFile(path.join(directory, 'package.json'), `${JSON.stringify({
    private: true,
    dependencies: { [source.name]: source.version },
  }, null, 2)}\n`)
  await installDependencies(directory, source.source, registry)
  const resolved = await resolveScannerPackage(source, cacheRoot, kind)
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

async function installGitScanner(
  source: GitScannerSource,
  cacheRoot: string,
  registry?: string,
  kind?: PluginKind,
): Promise<{ source: string; package: ResolvedPluginPackage }> {
  await mkdir(cacheRoot, { recursive: true })
  const temporary = await mkdtemp(path.join(cacheRoot, 'checkout-'))
  try {
    await git(temporary, 'init', '--quiet')
    const revision = /^[0-9a-f]{40}$/i.test(source.revision)
      ? source.revision : `refs/tags/${source.revision}`
    await git(temporary, 'fetch', '--depth=1', source.repository, revision)
    const commit = await git(temporary, 'rev-parse', 'FETCH_HEAD^{commit}')
    await git(temporary, 'checkout', '--quiet', '--detach', commit)
    const pinned = { ...source, revision: commit, source: `git+${source.repository}#${commit}` }
    const existing = await resolveScannerPackage(pinned, cacheRoot, kind)
    if (existing !== undefined) return { source: pinned.source, package: existing }
    const resolved = await scannerPackage(temporary, kind)
    if (resolved === undefined) throw new Error('Git repository must contain a runnable plugin package at its root')
    await installDependencies(temporary, pinned.source, registry)
    const destination = installDirectory(cacheRoot, pinned.source)
    await rename(temporary, destination)
    return { source: pinned.source, package: { ...resolved, entry: path.join(destination, path.relative(temporary, resolved.entry)) } }
  } finally {
    await rm(temporary, { recursive: true, force: true })
  }
}

/** Installation is explicit; registry loading only resolves already installed packages. */
export function installScannerPackage<K extends PluginKind>(
  source: ScannerSource, cacheRoot: string, registry: string | undefined, kind: K,
): Promise<{ source: string; package: ResolvedPackages[K] }>
export function installScannerPackage(
  source: ScannerSource, cacheRoot?: string, registry?: string, kind?: PluginKind,
): Promise<{ source: string; package: ResolvedPluginPackage }>
export async function installScannerPackage(
  source: ScannerSource,
  cacheRoot = defaultScannerCacheRoot(),
  registry?: string,
  kind?: PluginKind,
): Promise<{ source: string; package: ResolvedPluginPackage }> {
  if (source.kind === 'git') return installGitScanner(source, cacheRoot, registry, kind)
  const resolved = source.kind === 'npm'
    ? await installNpmScanner(source, cacheRoot, registry, kind)
    : await resolveScannerPackage(source, cacheRoot, kind)
  if (resolved === undefined) throw new Error(`plugin package not found: ${source.source}`)
  return { source: source.source, package: resolved }
}

function samePackage(current: ScannerSource, replacement: ScannerSource): boolean {
  if (current.kind === 'npm' && replacement.kind === 'npm') return current.name === replacement.name
  if (current.kind === 'git' && replacement.kind === 'git') return current.repository === replacement.repository
  return false
}

/** Prepare an update without changing the project selection; callers own kind validation and configuration. */
export async function preparePluginUpdate<K extends PluginKind>(
  root: string,
  selected: { id: string; source: string },
  input: string | undefined,
  options: { cacheRoot?: string; registry?: string },
  kind: K,
): Promise<{ source: string; package: ResolvedPackages[K] }> {
  const current = parseScannerSource(root, selected.source)
  const requested = input?.trim() ?? (current.kind === 'npm' ? current.name : undefined)
  if (!requested) throw new Error('Git updates require a tag or commit; local plugins run from their configured path')
  const replacement = parseScannerSource(root, isNpmPackageName(requested)
    ? await publishedScannerSource(requested, options.registry, kind) : requested)
  if (!samePackage(current, replacement)) {
    throw new Error('Plugin update must keep the same npm package or Git repository; local plugins run from their configured path')
  }
  const installed = await installScannerPackage(replacement, options.cacheRoot ?? defaultScannerCacheRoot(), options.registry, kind)
  if (installed.package.id !== selected.id) throw new Error(`Plugin id changed: ${installed.package.id}`)
  return installed
}
