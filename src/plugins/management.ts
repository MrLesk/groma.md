import { readGromaConfig, updateGromaConfig } from '../config.ts'
import {
  addScanner,
  configuredScannerModules,
  removeScanner,
  restoreScanner,
  updateScanner,
  type ScannerInstallOptions,
} from '../scanner/modules/inventory.ts'
import { bundledWorkSource, bundledWorkSources, checkWorkSourceReadiness, type BundledWorkSource } from '../work/sources.ts'

/**
 * The one owner of the plugins config.json lists: whether this computer has each of them, and adding, updating,
 * removing and restoring them. Every entry point uses it: the plugin commands, groma init, the plugins screen, the
 * welcome screen and the groma web restore view. What "present" and "restore" mean depends on the kind:
 * - scanner: its last selected source is on this computer; npm restoration selects the newest compatible release.
 * - work source: it ships inside groma.md, and its tool is installed at the listed version or newer; restoring
 *   installs the current tool.
 */

export type PluginKind = 'scanner' | 'workSource'

/** One listed plugin as this computer has it. */
export interface PluginPresence {
  kind: PluginKind
  id: string
  /** The scanner id, or the work source's name such as Backlog.md. */
  name: string
  /** The scanner source last selected, or the lowest tool version of a work source. */
  selection: string
  present: boolean
  /** Why the plugin is not present; empty when it is. */
  message: string
}

/** Every plugin config.json lists, scanners first, with whether this computer has it. */
export async function pluginPresence(root: string, options: ScannerInstallOptions = {}): Promise<PluginPresence[]> {
  const scanners = (await configuredScannerModules(root, options)).map(module => ({
    kind: 'scanner' as const, id: module.id, name: module.id, selection: module.source, present: module.status === 'found',
    message: module.status === 'missing' ? `Package missing: ${module.source}` : '',
  }))
  const work = await checkWorkSourceReadiness(root)
  if (!work) return scanners
  return [...scanners, {
    kind: 'workSource', id: work.id, name: work.name, selection: work.version, present: work.status === 'found', message: work.message,
  }]
}

/**
 * Installs the work source's tool when it is missing, or when `latest` is set brings it to the current release;
 * returns the version installed.
 */
async function ensureTool(bundled: BundledWorkSource, latest: boolean): Promise<string> {
  const readiness = await bundled.plugin.readiness()
  if (readiness.status === 'found' && !latest) return readiness.version
  await bundled.installTool(readiness.status === 'found')
  const after = await bundled.plugin.readiness()
  if (after.status === 'missing') throw new Error(`${bundled.name} CLI is still not installed.`)
  return after.version
}

/** A plugin as a command reports it after adding or updating it. */
export interface PluginSelection {
  kind: PluginKind
  id: string
  selection: string
}

/**
 * Adds a plugin to config.json and makes it present. A bundled work source is named by its id (`backlog`): its tool
 * is installed when missing and the installed version is recorded. Anything else is a scanner source.
 */
export async function addPlugin(root: string, input: string, options: ScannerInstallOptions = {}): Promise<PluginSelection> {
  const id = input.trim()
  if (!Object.hasOwn(bundledWorkSources, id)) {
    const added = await addScanner(root, input, options)
    return { kind: 'scanner', id: added.id, selection: added.source }
  }
  const config = await readGromaConfig(root)
  const listed = config.workSources[0]
  if (listed) throw new Error(`config.json already lists the work source ${listed.id}; remove it before adding another`)
  const version = await ensureTool(bundledWorkSource(id), false)
  await updateGromaConfig(root, current => {
    if (current.workSources.length) throw new Error(`config.json already lists the work source ${current.workSources[0]!.id}; remove it before adding another`)
    return { ...current, workSources: [{ id, version }] }
  })
  return { kind: 'workSource', id, selection: version }
}

/** Removes a plugin from config.json. Ids are unique across sections, so the id finds the one entry. */
export async function removePlugin(root: string, id: string): Promise<string> {
  const config = await readGromaConfig(root)
  if (config.scanners.some(scanner => scanner.id === id)) return removeScanner(root, id)
  if (!config.workSources.some(work => work.id === id)) throw new Error(`plugin is not configured: ${id}`)
  await updateGromaConfig(root, current => {
    if (!current.workSources.some(work => work.id === id)) throw new Error(`plugin is not configured: ${id}`)
    return { ...current, workSources: current.workSources.filter(work => work.id !== id) }
  })
  return id
}

/**
 * Moves a plugin to another release and records the selected source.
 * A scanner moves to its newest compatible release or the exact source given; a work source updates its tool to the
 * current release and records that version.
 */
export async function updatePlugin(root: string, id: string, input?: string, options: ScannerInstallOptions = {}): Promise<PluginSelection> {
  const config = await readGromaConfig(root)
  if (config.scanners.some(scanner => scanner.id === id)) {
    const updated = await updateScanner(root, id, input, options)
    return { kind: 'scanner', id, selection: updated.source }
  }
  if (!config.workSources.some(work => work.id === id)) throw new Error(`plugin is not configured: ${id}`)
  if (input !== undefined) throw new Error(`${id} ships inside groma.md; update it without a source`)
  const version = await ensureTool(bundledWorkSource(id), true)
  await updateGromaConfig(root, current => {
    if (!current.workSources.some(work => work.id === id)) throw new Error(`plugin selection changed while updating: ${id}`)
    return { ...current, workSources: current.workSources.map(work => work.id === id ? { id, version } : work) }
  })
  return { kind: 'workSource', id, selection: version }
}

/** Restores one listed plugin; an npm scanner records its newest compatible release. */
export async function restorePlugin(root: string, id: string, options: ScannerInstallOptions = {}): Promise<void> {
  const config = await readGromaConfig(root)
  if (config.scanners.some(scanner => scanner.id === id)) return restoreScanner(root, id, options)
  if (!config.workSources.some(work => work.id === id)) throw new Error(`plugin is not configured: ${id}`)
  if ((await checkWorkSourceReadiness(root))?.status === 'found') return
  await ensureTool(bundledWorkSource(id), true)
  const after = await checkWorkSourceReadiness(root)
  if (after?.status !== 'found') throw new Error(after?.message ?? `plugin is not configured: ${id}`)
}

export type RestoreState = 'restoring' | 'restored' | 'failed'

/**
 * Restores every plugin this computer lacks, one at a time and past failures. `onChange` hears each plugin start
 * and end, with the reason when it failed; the result lists the plugins that could not be restored.
 */
export async function restoreMissingPlugins(
  root: string,
  onChange: (id: string, state: RestoreState, message: string) => void = () => {},
  options: ScannerInstallOptions = {},
): Promise<{ restored: string[]; failed: { id: string; message: string }[] }> {
  const result: Awaited<ReturnType<typeof restoreMissingPlugins>> = { restored: [], failed: [] }
  for (const plugin of await pluginPresence(root, options)) {
    if (plugin.present) continue
    onChange(plugin.id, 'restoring', '')
    try {
      await restorePlugin(root, plugin.id, options)
      result.restored.push(plugin.id)
      onChange(plugin.id, 'restored', '')
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      result.failed.push({ id: plugin.id, message })
      onChange(plugin.id, 'failed', message)
    }
  }
  return result
}

/** The failures of a restore as one error, one line per plugin. */
export function restoreFailure(failed: readonly { id: string; message: string }[]): Error {
  return new Error(failed.map(({ id, message }) => `${id}: ${message}`).join('\n'))
}
