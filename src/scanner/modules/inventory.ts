import { readPluginConfig } from './config.ts'
import type { ConfiguredScanner } from './config.ts'
import {
  parsePluginSource,
  resolvePluginPackage,
  type PluginInstallOptions,
  type PluginResolutionOptions,
  type ResolvedScannerPackage,
} from './package.ts'
import { addPlugin, installPlugins, removePlugin, updatePlugin } from '../../plugin-management.ts'

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

// The scanner commands' entry points: the operations of plugin-management.ts limited to the scanners section.

export function addScanner(
  repositoryRoot: string,
  input: string,
  options: PluginInstallOptions = {},
): Promise<ScannerInventoryItem> {
  return addPlugin(repositoryRoot, input, options, 'scanner')
}

export function installScanners(
  repositoryRoot: string,
  options: PluginInstallOptions = {},
): Promise<number> {
  return installPlugins(repositoryRoot, options, 'scanner')
}

export function removeScanner(
  repositoryRoot: string,
  id: string,
): Promise<string> {
  return removePlugin(repositoryRoot, id, 'scanner')
}

export function updateScanner(
  repositoryRoot: string,
  id: string,
  input?: string,
  options: PluginInstallOptions = {},
): Promise<ScannerInventoryItem> {
  return updatePlugin(repositoryRoot, id, input, options, 'scanner')
}
