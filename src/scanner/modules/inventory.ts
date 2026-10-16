import { isNpmPackageName, publishedScannerSource } from './published.ts'
import {
  readGromaConfig,
  writeGromaConfig,
} from '../../config.ts'
import type { ConfiguredScanner } from '../../config.ts'
import {
  defaultScannerCacheRoot,
  installScannerPackage,
  parseScannerSource,
  resolveScannerPackage,
  type ScannerSource,
  type ResolvedScannerPackage,
} from './package.ts'

export type ScannerReadiness = 'found' | 'missing'

export interface ScannerInventoryItem {
  id: string
  source: string
  status: ScannerReadiness
}

export interface FoundScannerModule extends ScannerInventoryItem, ConfiguredScanner {
  name: string
  version: string
  discovery?: ResolvedScannerPackage['discovery']
  entry: string
  status: 'found'
}

export interface MissingScannerModule extends ScannerInventoryItem {
  status: 'missing'
}

export type ScannerModuleLocation = FoundScannerModule | MissingScannerModule

export interface ScannerResolutionOptions {
  cacheRoot?: string
}

export interface ScannerInstallOptions extends ScannerResolutionOptions {
  /**
   * Replaces only the default registry, for release lookup and download alike. A scope's registry in the user's
   * `.npmrc` still wins for that scope, so this does not isolate a run from the user's npm settings. Only tests set it.
   */
  registry?: string
}

function cacheRoot(options: ScannerResolutionOptions): string {
  return options.cacheRoot ?? defaultScannerCacheRoot()
}

async function moduleLocation(
  repositoryRoot: string,
  configured: ConfiguredScanner,
  options: ScannerResolutionOptions,
): Promise<ScannerModuleLocation> {
  const source = parseScannerSource(repositoryRoot, configured.source)
  const resolved = await resolveScannerPackage(source, cacheRoot(options))
  if (resolved === undefined) {
    return { ...configured, status: 'missing' }
  }
  if (resolved.id !== configured.id) {
    throw new Error(
      `configured scanner ${configured.id} resolves to manifest id ${resolved.id}`,
    )
  }
  return {
    ...configured,
    entry: resolved.entry,
    name: resolved.name,
    version: resolved.version,
    discovery: resolved.discovery,
    status: 'found',
  }
}

export async function configuredScannerModules(
  repositoryRoot: string,
  options: ScannerResolutionOptions = {},
): Promise<ScannerModuleLocation[]> {
  const config = await readGromaConfig(repositoryRoot)
  const configured = config.scanners
  return Promise.all(configured.map(scanner => {
    return moduleLocation(repositoryRoot, scanner, options)
  }))
}

export async function scannerInventory(
  repositoryRoot: string,
  options: ScannerResolutionOptions = {},
): Promise<ScannerInventoryItem[]> {
  const configured = await configuredScannerModules(repositoryRoot, options)
  return configured.map(({ id, source, status }) => ({ id, source, status }))
}

export async function addScanner(
  repositoryRoot: string,
  input: string,
  options: ScannerInstallOptions = {},
): Promise<ScannerInventoryItem> {
  const selected = input.trim()
  const source = parseScannerSource(repositoryRoot, isNpmPackageName(selected)
    ? await publishedScannerSource(selected, options.registry) : selected)
  const config = await readGromaConfig(repositoryRoot)
  const configured = config.scanners
  if (configured.some(scanner => scanner.source === source.source)) {
    throw new Error(`scanner source is already configured: ${source.source}`)
  }
  const installed = await installScannerPackage(source, cacheRoot(options), options.registry)
  const resolved = installed.package
  if (configured.some(scanner => scanner.id === resolved.id)) {
    throw new Error(`scanner id is already configured: ${resolved.id}`)
  }
  // The package's include globs and default exclusions become this project's lists, which people then edit.
  const scanner = { id: resolved.id, source: installed.source, include: resolved.include,
    ...(resolved.exclude?.length ? { exclude: resolved.exclude } : {}) }
  await writeGromaConfig(repositoryRoot, { ...config, scanners: [...configured, scanner] })
  return { id: scanner.id, source: scanner.source, status: 'found' }
}

export async function removeScanner(
  repositoryRoot: string,
  id: string,
): Promise<string> {
  const config = await readGromaConfig(repositoryRoot)
  const configured = config.scanners
  if (!configured.some(scanner => scanner.id === id)) {
    throw new Error(`scanner is not configured: ${id}`)
  }
  await writeGromaConfig(
    repositoryRoot,
    { ...config, scanners: configured.filter(scanner => scanner.id !== id) },
  )
  return id
}

function samePackage(current: ScannerSource, replacement: ScannerSource): boolean {
  if (current.kind === 'npm' && replacement.kind === 'npm') return current.name === replacement.name
  if (current.kind === 'git' && replacement.kind === 'git') return current.repository === replacement.repository
  return false
}

export async function updateScanner(
  repositoryRoot: string,
  id: string,
  input?: string,
  options: ScannerInstallOptions = {},
): Promise<ScannerInventoryItem> {
  const config = await readGromaConfig(repositoryRoot)
  const selected = config.scanners.find(scanner => scanner.id === id)
  if (selected === undefined) throw new Error(`scanner is not configured: ${id}`)
  const current = parseScannerSource(repositoryRoot, selected.source)
  const requested = input?.trim() ?? (current.kind === 'npm' ? current.name : undefined)
  if (requested === undefined) throw new Error('Git updates require a tag or commit; local plugins run from their configured path')
  const replacement = parseScannerSource(repositoryRoot, isNpmPackageName(requested)
    ? await publishedScannerSource(requested, options.registry) : requested)
  if (!samePackage(current, replacement)) {
    throw new Error('scanner update must keep the same npm package or Git repository; local plugins run from their configured path')
  }
  const installed = await installScannerPackage(replacement, cacheRoot(options), options.registry)
  if (installed.package.id !== id) {
    throw new Error(`replacement scanner id ${installed.package.id} does not match ${id}`)
  }
  if (selected.source === installed.source) return { id, source: selected.source, status: 'found' }
  const updated = { ...selected, source: installed.source }
  await writeGromaConfig(repositoryRoot, {
    ...config, scanners: config.scanners.map(scanner => scanner.id === id ? updated : scanner),
  })
  return { id, source: updated.source, status: 'found' }
}

/** Refresh configured npm scanners before a scan session; Git and local selections stay as declared. */
export async function updateNpmScanners(root: string, options: ScannerInstallOptions = {}): Promise<void> {
  for (const scanner of (await readGromaConfig(root)).scanners) {
    if (parseScannerSource(root, scanner.source).kind === 'npm') await updateScanner(root, scanner.id, undefined, options)
  }
}

/** Restore one configured scanner; npm uses the newest compatible release. */
export async function restoreScanner(repositoryRoot: string, id: string, options: ScannerInstallOptions = {}): Promise<void> {
  const configured = (await readGromaConfig(repositoryRoot)).scanners.find(scanner => scanner.id === id)
  if (!configured) throw new Error(`scanner is not configured: ${id}`)
  const source = parseScannerSource(repositoryRoot, configured.source)
  if (source.kind === 'local') throw new Error(`Restore the local scanner directory: ${configured.source}`)
  if (source.kind === 'npm') {
    await updateScanner(repositoryRoot, id, undefined, options)
    return
  }
  const installed = await installScannerPackage(source, cacheRoot(options), options.registry)
  if (installed.package.id !== id) throw new Error(`restored scanner id ${installed.package.id} does not match ${id}`)
}
