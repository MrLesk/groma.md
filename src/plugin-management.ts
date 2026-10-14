import { readGromaConfig, writeGromaConfig } from './config.ts'
import {
  addScanner,
  configuredScannerModules,
  removeScanner,
  restoreScanner,
  updateScanner,
  type ScannerInstallOptions,
} from './scanner/modules/inventory.ts'
import { bundledWorkSources, checkWorkSourceReadiness, type BundledWorkSource } from './work-sources.ts'

/**
 * The one owner of the plugins config.json lists: whether this computer has each of them, and adding, updating,
 * removing and restoring them. Every entry point uses it: the plugin commands, groma init, the plugins screen and
 * the groma web restore view. What "present" and "restore" mean depends on the kind:
 * - scanner: the package at its exact listed source is on this computer; restoring downloads it.
 * - work source: it ships inside groma.md, and its tool is installed at the listed version or newer; restoring
 *   installs the current tool.
 */

export type PluginKind = 'scanner' | 'workSource'

/** One listed plugin as this computer has it. */
export interface PluginPresence {
  kind: PluginKind
  id: string
  /** What the entry pins: a scanner's exact source, or the lowest tool version of a work source. */
  pinned: string
  present: boolean
  /** Why the plugin is not present; empty when it is. */
  message: string
}

/** Every plugin config.json lists, scanners first, with whether this computer has it. */
export async function pluginPresence(root: string, options: ScannerInstallOptions = {}): Promise<PluginPresence[]> {
  const scanners = (await configuredScannerModules(root, options)).map(module => ({
    kind: 'scanner' as const, id: module.id, pinned: module.source, present: module.status === 'found',
    message: module.status === 'missing' ? `Package missing: ${module.source}` : '',
  }))
  const work = await checkWorkSourceReadiness(root)
  if (!work) return scanners
  return [...scanners, { kind: 'workSource', id: work.id, pinned: work.version, present: work.status === 'found', message: work.message }]
}

async function toolVersion(bundled: BundledWorkSource): Promise<string | undefined> {
  const readiness = await bundled.plugin.readiness()
  return readiness.status === 'found' ? readiness.version : undefined
}

/** Installs the work source's tool when it is missing, or brings it up to date when `update` is set; returns the version installed. */
async function installTool(bundled: BundledWorkSource, update: boolean): Promise<string> {
  const before = await toolVersion(bundled)
  if (before !== undefined && !update) return before
  await bundled.installTool(before !== undefined)
  const after = await toolVersion(bundled)
  if (after === undefined) throw new Error(`${bundled.name} CLI is still not installed.`)
  return after
}

function bundledWorkSource(id: string): BundledWorkSource {
  const bundled = bundledWorkSources[id]
  if (!bundled) throw new Error(`groma.md has no work source ${id}. Bundled: ${Object.keys(bundledWorkSources).join(', ')}.`)
  return bundled
}

/** A plugin as a command reports it after adding or updating it. */
export interface PluginSelection {
  kind: PluginKind
  id: string
  pinned: string
}

/**
 * Adds a plugin to config.json and makes it present. A bundled work source is named by its id (`backlog`): its tool
 * is installed when missing and the installed version is recorded. Anything else is a scanner source.
 */
export async function addPlugin(root: string, input: string, options: ScannerInstallOptions = {}): Promise<PluginSelection> {
  const id = input.trim()
  if (!Object.hasOwn(bundledWorkSources, id)) {
    const added = await addScanner(root, input, options)
    return { kind: 'scanner', id: added.id, pinned: added.source }
  }
  const config = await readGromaConfig(root)
  const listed = config.workSources[0]
  if (listed) throw new Error(`config.json already lists the work source ${listed.id}; remove it before adding another`)
  const version = await installTool(bundledWorkSource(id), false)
  await writeGromaConfig(root, { ...config, workSources: [{ id, version }] })
  return { kind: 'workSource', id, pinned: version }
}

/** Removes a plugin from config.json. Ids are unique across sections, so the id finds the one entry. */
export async function removePlugin(root: string, id: string): Promise<string> {
  const config = await readGromaConfig(root)
  if (config.scanners.some(scanner => scanner.id === id)) return removeScanner(root, id)
  if (!config.workSources.some(work => work.id === id)) throw new Error(`plugin is not configured: ${id}`)
  await writeGromaConfig(root, { ...config, workSources: config.workSources.filter(work => work.id !== id) })
  return id
}

/**
 * Moves a plugin to a newer release and records it, so a colleague who pulls finds it missing and restores it.
 * A scanner moves to its newest compatible release or the exact source given; a work source updates its tool to the
 * current release and records that version.
 */
export async function updatePlugin(root: string, id: string, input?: string, options: ScannerInstallOptions = {}): Promise<PluginSelection> {
  const config = await readGromaConfig(root)
  if (config.scanners.some(scanner => scanner.id === id)) {
    const updated = await updateScanner(root, id, input, options)
    return { kind: 'scanner', id, pinned: updated.source }
  }
  if (!config.workSources.some(work => work.id === id)) throw new Error(`plugin is not configured: ${id}`)
  if (input !== undefined) throw new Error(`${id} ships inside groma.md; update it without a source`)
  const version = await installTool(bundledWorkSource(id), true)
  await writeGromaConfig(root, { ...config, workSources: config.workSources.map(work => work.id === id ? { id, version } : work) })
  return { kind: 'workSource', id, pinned: version }
}

/** Makes one listed plugin present on this computer without changing config.json. */
export async function restorePlugin(root: string, id: string, options: ScannerInstallOptions = {}): Promise<void> {
  const config = await readGromaConfig(root)
  if (config.scanners.some(scanner => scanner.id === id)) return restoreScanner(root, id, options)
  const listed = config.workSources.find(work => work.id === id)
  if (!listed) throw new Error(`plugin is not configured: ${id}`)
  const version = await installTool(bundledWorkSource(id), true)
  if (Bun.semver.order(version, listed.version) < 0) {
    throw new Error(`${bundledWorkSource(id).name} CLI ${version} is still older than ${listed.version}.`)
  }
}

/** Restores every plugin this computer lacks, continuing past failures, and returns the ids it restored. */
export async function restoreMissingPlugins(root: string, options: ScannerInstallOptions = {}): Promise<string[]> {
  const restored: string[] = []
  const failures: string[] = []
  for (const plugin of await pluginPresence(root, options)) {
    if (plugin.present) continue
    try {
      await restorePlugin(root, plugin.id, options)
      restored.push(plugin.id)
    } catch (error) {
      failures.push(`${plugin.id}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  if (failures.length) throw new Error(failures.join('\n'))
  return restored
}
