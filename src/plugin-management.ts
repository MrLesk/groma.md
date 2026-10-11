import { readPluginConfig, writePluginConfig } from './scanner/modules/config.ts'
import { configureScanner, installScanners, removeScanner, scannerInventory, updateScanner } from './scanner/modules/inventory.ts'
import { installPluginPackage, parsePluginSource, preparePluginUpdate, resolvePluginPackage, type PluginInstallOptions, type ResolvedWorkSourcePackage } from './scanner/modules/package.ts'
import { isNpmPackageName, publishedPluginSource } from './scanner/modules/published.ts'
import { configuredWorkSource, hostIncompatibility } from './work-sources.ts'

/** Selecting, restoring or updating a work source this groma.md version cannot load is refused with the reason. */
function requireCompatibleHost(resolved: ResolvedWorkSourcePackage): void {
  const incompatible = hostIncompatibility(resolved)
  if (incompatible) throw new Error(incompatible)
}

async function selectedSource(root: string, input: string, options: PluginInstallOptions) {
  const value = input.trim()
  return parsePluginSource(root, isNpmPackageName(value)
    ? await publishedPluginSource(value, options.registry) : value)
}

export async function pluginInventory(root: string, options: PluginInstallOptions = {}) {
  const scanners = (await scannerInventory(root, options)).map(scanner => ({ ...scanner, kind: 'scanner' as const, message: '' }))
  const work = await configuredWorkSource(root, options)
  return [...scanners, ...(work ? [{ id: work.id, kind: work.kind, source: work.source, status: work.status, message: work.message }] : [])]
}

/** Package metadata determines the kind; every selection still lives in one project file. */
export async function addPlugin(root: string, input: string, options: PluginInstallOptions = {}) {
  const source = await selectedSource(root, input, options)
  const installed = await installPluginPackage(source, options)
  const resolved = installed.package
  if (resolved.kind === 'scanner') return configureScanner(root, { source: installed.source, package: resolved })
  requireCompatibleHost(resolved)
  const config = await readPluginConfig(root)
  if (config.workSources?.length) throw new Error('This project supports at most one work source; remove the current selection first')
  if (config.scanners.some(plugin => plugin.id === resolved.id)) throw new Error(`Plugin id already configured: ${resolved.id}`)
  await writePluginConfig(root, { ...config, workSources: [{ id: resolved.id, source: installed.source }] })
  return { id: resolved.id, source: installed.source, status: 'found' as const }
}

export async function removePlugin(root: string, id: string): Promise<string> {
  const config = await readPluginConfig(root)
  if (!config.workSources?.some(work => work.id === id)) return removeScanner(root, id)
  await writePluginConfig(root, { ...config, workSources: [] })
  return id
}

export async function restoreWorkSource(root: string, options: PluginInstallOptions = {}): Promise<number> {
  const selected = (await readPluginConfig(root)).workSources?.[0]
  if (!selected) return 0
  const source = parsePluginSource(root, selected.source)
  const resolved = source.kind === 'local' ? await resolvePluginPackage(source, options, 'workSource')
    : (await installPluginPackage(source, options, 'workSource')).package
  if (!resolved) throw new Error(`Restore the local work source directory: ${selected.source}`)
  requireCompatibleHost(resolved)
  if (resolved.id !== selected.id) throw new Error(`Configured work source ${selected.id} resolves to ${resolved.id}`)
  return source.kind === 'local' ? 0 : 1
}

export async function installPlugins(root: string, options: PluginInstallOptions = {}): Promise<number> {
  return await installScanners(root, options) + await restoreWorkSource(root, options)
}

export async function updatePlugin(root: string, id: string, input?: string, options: PluginInstallOptions = {}) {
  const config = await readPluginConfig(root)
  const selected = config.workSources?.find(work => work.id === id)
  if (!selected) return updateScanner(root, id, input, options)
  const installed = await preparePluginUpdate(root, selected, input, options, 'workSource')
  requireCompatibleHost(installed.package)
  await writePluginConfig(root, { ...config, workSources: [{ id, source: installed.source }] })
  return { id, source: installed.source, status: 'found' as const }
}
