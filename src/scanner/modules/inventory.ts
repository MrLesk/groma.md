import { isNpmPackageName, publishedPluginSource } from './published.ts'
import {
  readPluginConfig,
  writePluginConfig,
} from './config.ts'
import type { ConfiguredScanner } from './config.ts'
import {
  installPluginPackage,
  parsePluginSource,
  resolvePluginPackage,
  preparePluginUpdate,
  type PluginInstallOptions,
  type PluginResolutionOptions,
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

async function moduleLocation(
  repositoryRoot: string,
  configured: ConfiguredScanner,
  options: PluginResolutionOptions,
): Promise<ScannerModuleLocation> {
  const source = parsePluginSource(repositoryRoot, configured.source)
  const resolved = await resolvePluginPackage(source, options, 'scanner')
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
  options: PluginResolutionOptions = {},
): Promise<ScannerModuleLocation[]> {
  const config = await readPluginConfig(repositoryRoot)
  const configured = config.scanners
  return Promise.all(configured.map(scanner => {
    return moduleLocation(repositoryRoot, scanner, options)
  }))
}

export async function scannerInventory(
  repositoryRoot: string,
  options: PluginResolutionOptions = {},
): Promise<ScannerInventoryItem[]> {
  const configured = await configuredScannerModules(repositoryRoot, options)
  return configured.map(({ id, source, status }) => ({ id, source, status }))
}

export async function addScanner(
  repositoryRoot: string,
  input: string,
  options: PluginInstallOptions = {},
): Promise<ScannerInventoryItem> {
  const selected = input.trim()
  const source = parsePluginSource(repositoryRoot, isNpmPackageName(selected)
    ? await publishedPluginSource(selected, options.registry, 'scanner') : selected)
  const config = await readPluginConfig(repositoryRoot)
  const configured = config.scanners
  if (configured.some(scanner => scanner.source === source.source)) {
    throw new Error(`scanner source is already configured: ${source.source}`)
  }
  const installed = await installPluginPackage(source, options, 'scanner')
  return configureScanner(repositoryRoot, installed)
}

/** Record a resolved scanner once; plugin add and scanner add share the same defaults and validation. */
export async function configureScanner(
  repositoryRoot: string,
  installed: { source: string; package: ResolvedScannerPackage },
): Promise<ScannerInventoryItem> {
  const config = await readPluginConfig(repositoryRoot)
  const configured = config.scanners
  const resolved = installed.package
  const scanner = { id: resolved.id, source: installed.source, include: resolved.include,
    ...(resolved.exclude?.length ? { exclude: resolved.exclude } : {}) }
  await writePluginConfig(repositoryRoot, { ...config, scanners: [...configured, scanner] })
  return { id: scanner.id, source: scanner.source, status: 'found' }
}

export async function installScanners(
  repositoryRoot: string,
  options: PluginInstallOptions = {},
): Promise<number> {
  const config = await readPluginConfig(repositoryRoot)
  const configured = config.scanners
  let installed = 0
  for (const scanner of configured) {
    const source = parsePluginSource(repositoryRoot, scanner.source)
    if (source.kind === 'local') {
      if (await resolvePluginPackage(source, options, 'scanner') === undefined) {
        throw new Error(`Scanner ${scanner.id} is missing. Restore the local scanner directory: ${scanner.source}`)
      }
      continue
    }
    const { package: resolved } = await installPluginPackage(source, options, 'scanner')
    if (resolved.id !== scanner.id) {
      throw new Error(`configured scanner ${scanner.id} resolves to manifest id ${resolved.id}`)
    }
    installed += 1
  }
  return installed
}

export async function removeScanner(
  repositoryRoot: string,
  id: string,
): Promise<string> {
  const config = await readPluginConfig(repositoryRoot)
  const configured = config.scanners
  if (!configured.some(scanner => scanner.id === id)) {
    throw new Error(`scanner is not configured: ${id}`)
  }
  await writePluginConfig(
    repositoryRoot,
    { ...config, scanners: configured.filter(scanner => scanner.id !== id) },
  )
  return id
}

export async function updateScanner(
  repositoryRoot: string,
  id: string,
  input?: string,
  options: PluginInstallOptions = {},
): Promise<ScannerInventoryItem> {
  const config = await readPluginConfig(repositoryRoot)
  const selected = config.scanners.find(scanner => scanner.id === id)
  if (selected === undefined) throw new Error(`scanner is not configured: ${id}`)
  const installed = await preparePluginUpdate(repositoryRoot, selected, input, options, 'scanner')
  const updated = { ...selected, source: installed.source }
  await writePluginConfig(repositoryRoot, {
    ...config, scanners: config.scanners.map(scanner => scanner.id === id ? updated : scanner),
  })
  return { id, source: updated.source, status: 'found' }
}

/** Restore one project selection without installing unrelated configured packages. */
export async function restoreScanner(repositoryRoot: string, id: string, options: PluginInstallOptions = {}): Promise<void> {
  const configured = (await readPluginConfig(repositoryRoot)).scanners.find(scanner => scanner.id === id)
  if (!configured) throw new Error(`scanner is not configured: ${id}`)
  const source = parsePluginSource(repositoryRoot, configured.source)
  if (source.kind === 'local') throw new Error(`Restore the local scanner directory: ${configured.source}`)
  const installed = await installPluginPackage(source, options, 'scanner')
  if (installed.package.id !== id) throw new Error(`restored scanner id ${installed.package.id} does not match ${id}`)
}
