import { iconPackInventory, restoreIconPacks, saveIconPack } from './icon-packs.ts'
import groma from '../package.json'
import { readScannerConfig, writeScannerConfig } from './scanner/modules/config.ts'
import { configureScanner, installScanners, removeScanner, scannerInventory, updateScanner, type ScannerInstallOptions } from './scanner/modules/inventory.ts'
import { defaultScannerCacheRoot, installScannerPackage, parseScannerSource, resolveScannerPackage, type ResolvedScannerPackage } from './scanner/modules/package.ts'
import { isNpmPackageName, publishedScannerSource } from './scanner/modules/published.ts'
import { configuredWorkSource } from './work-sources.ts'

function validateWorkSource(resolved: ResolvedScannerPackage): void {
  if (resolved.id !== 'backlog') throw new Error('Only the backlog work source is supported')
  const required = resolved.compatibility?.groma
  if (required && !Bun.semver.satisfies(groma.version, required)) {
    throw new Error(`Requires Groma ${required}; this computer has ${groma.version}. Update Groma.`)
  }
}

async function selectedSource(root: string, input: string, options: ScannerInstallOptions) {
  const value = input.trim()
  return parseScannerSource(root, isNpmPackageName(value)
    ? await publishedScannerSource(value, options.registry, 'any') : value)
}

export async function pluginInventory(root: string, options: ScannerInstallOptions = {}) {
  const scanners = (await scannerInventory(root, options)).map(scanner => ({ ...scanner, kind: 'scanner' as const, message: '' }))
  const work = await configuredWorkSource(root, options)
  const icons = await iconPackInventory(root, options)
  return [...scanners, ...icons, ...(work ? [{ id: work.id, kind: work.kind, source: work.source, status: work.status, message: work.message }] : [])]
}

/** Package metadata determines the kind; every selection still lives in one project file. */
export async function addPlugin(root: string, input: string, options: ScannerInstallOptions = {}) {
  const source = await selectedSource(root, input, options)
  const installed = await installScannerPackage(source, options.cacheRoot ?? defaultScannerCacheRoot(), options.registry)
  const resolved = installed.package
  if (resolved.kind === 'scanner') return configureScanner(root, installed)
  if (resolved.kind === 'icons') {
    await saveIconPack(root, resolved.id, installed.source)
    return { id: resolved.id, source: installed.source, status: 'found' as const }
  }
  validateWorkSource(resolved)
  const config = await readScannerConfig(root)
  if (config.workSources?.length) throw new Error('This project supports at most one work source; remove the current selection first')
  if ([...config.scanners, ...(config.icons ?? [])].some(plugin => plugin.id === resolved.id)) throw new Error(`Plugin id already configured: ${resolved.id}`)
  await writeScannerConfig(root, { ...config, workSources: [{ id: resolved.id, source: installed.source }] })
  return { id: resolved.id, source: installed.source, status: 'found' as const }
}

export async function removePlugin(root: string, id: string): Promise<string> {
  const config = await readScannerConfig(root)
  if (config.icons?.some(pack => pack.id === id)) {
    await writeScannerConfig(root, { ...config, icons: config.icons.filter(pack => pack.id !== id) })
    return id
  }
  if (!config.workSources?.some(work => work.id === id)) return removeScanner(root, id)
  await writeScannerConfig(root, { ...config, workSources: [] })
  return id
}

export async function restoreWorkSource(root: string, options: ScannerInstallOptions = {}): Promise<number> {
  const selected = (await readScannerConfig(root)).workSources?.[0]
  if (!selected) return 0
  const source = parseScannerSource(root, selected.source)
  const cache = options.cacheRoot ?? defaultScannerCacheRoot()
  const resolved = source.kind === 'local' ? await resolveScannerPackage(source, cache, 'workSource')
    : (await installScannerPackage(source, cache, options.registry, 'workSource')).package
  if (!resolved) throw new Error(`Restore the local work source directory: ${selected.source}`)
  validateWorkSource(resolved)
  if (resolved.id !== selected.id) throw new Error(`Configured work source ${selected.id} resolves to ${resolved.id}`)
  return source.kind === 'local' ? 0 : 1
}

export async function installPlugins(root: string, options: ScannerInstallOptions = {}): Promise<number> {
  return await installScanners(root, options) + await restoreWorkSource(root, options) + await restoreIconPacks(root, options)
}

export async function updatePlugin(root: string, id: string, input?: string, options: ScannerInstallOptions = {}) {
  const config = await readScannerConfig(root)
  const icon = config.icons?.find(pack => pack.id === id)
  const selected = icon ?? config.workSources?.find(work => work.id === id)
  if (!selected) return updateScanner(root, id, input, options)
  const current = parseScannerSource(root, selected.source)
  const requested = input?.trim() ?? (current.kind === 'npm' ? current.name : undefined)
  if (!requested) throw new Error('Git updates require a tag or commit; local plugins run from their configured path')
  const replacement = await selectedSource(root, requested, options)
  if (!(current.kind === 'npm' && replacement.kind === 'npm' && current.name === replacement.name)
    && !(current.kind === 'git' && replacement.kind === 'git' && current.repository === replacement.repository)) {
    throw new Error('Plugin update must keep the same npm package or Git repository')
  }
  const installed = await installScannerPackage(replacement, options.cacheRoot ?? defaultScannerCacheRoot(), options.registry, icon ? 'icons' : 'workSource')
  if (installed.package.id !== id) throw new Error(`Plugin id changed: ${installed.package.id}`)
  if (icon) {
    await saveIconPack(root, id, installed.source, true)
    return { id, source: installed.source, status: 'found' as const }
  }
  validateWorkSource(installed.package)
  await writeScannerConfig(root, { ...config, workSources: [{ id, source: installed.source }] })
  return { id, source: installed.source, status: 'found' as const }
}
