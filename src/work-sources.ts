import { pathToFileURL } from 'node:url'
import { EMPTY_WORK_SOURCE, type WorkSource, type WorkSourcePlugin } from '@groma/work-source'
import groma from '../package.json' with { type: 'json' }
import { readPluginConfig } from './scanner/modules/config.ts'
import { parsePluginSource, resolvePluginPackage, type PluginResolutionOptions, type ResolvedWorkSourcePackage } from './scanner/modules/package.ts'

interface WorkSourceSelectionFields {
  id: string
  source: string
  kind: 'workSource'
  message: string
  /** The command the adapter's readiness names for what it lacks. */
  install?: string
  name?: string
  version?: string
}

/** The selected work source as it stands on this computer. The adapter is there exactly when it is ready to create a source. */
export type WorkSourceSelection =
  | WorkSourceSelectionFields & { status: 'found'; plugin: WorkSourcePlugin }
  | WorkSourceSelectionFields & { status: 'missing' | 'blocked' }

/**
 * Reports whether the work source that plugins.json selects can run here. Unlike `configuredScannerModules`, this
 * executes plugin code: once the package is found and accepts this groma.md version, it imports the adapter and
 * calls its `readiness()`. Without a selection nothing is imported or probed.
 */
export async function checkWorkSourceReadiness(root: string, options: PluginResolutionOptions = {}): Promise<WorkSourceSelection | undefined> {
  const selected = (await readPluginConfig(root)).workSources[0]
  if (!selected) return undefined
  const base = { ...selected, kind: 'workSource' as const }
  try {
    const source = parsePluginSource(root, selected.source)
    const resolved = await resolvePluginPackage(source, options, 'workSource')
    if (!resolved) return { ...base, status: 'missing', message: `Restore ${selected.source} with groma plugin install, or restore its local path.` }
    if (resolved.id !== selected.id) throw new Error(`Configured work source ${selected.id} resolves to ${resolved.id}`)
    const details = { ...base, name: resolved.name, version: resolved.version }
    const incompatible = hostIncompatibility(resolved)
    if (incompatible) return { ...details, status: 'blocked', message: incompatible }
    return await importedWorkSource(resolved.entry, details)
  } catch (error) {
    return { ...base, status: 'blocked', message: error instanceof Error ? error.message : String(error) }
  }
}

/** Why this groma.md version cannot load a work-source package, when the range its manifest declares excludes it. */
export function hostIncompatibility(resolved: ResolvedWorkSourcePackage): string | undefined {
  const required = resolved.compatibility?.groma
  return required && !Bun.semver.satisfies(groma.version, required)
    ? `Requires Groma ${required}; this computer has ${groma.version}. Update Groma.`
    : undefined
}

async function importedWorkSource(
  entry: string,
  details: Pick<WorkSourceSelection, 'id' | 'source' | 'kind' | 'name' | 'version'>,
): Promise<WorkSourceSelection> {
  const module = await import(pathToFileURL(entry).href)
  const plugin = module.default as WorkSourcePlugin | undefined
  if (plugin?.id !== details.id || typeof plugin.create !== 'function' || typeof plugin.readiness !== 'function') {
    throw new Error(`Work source ${details.id} must export a default WorkSourcePlugin with matching id, readiness and create`)
  }
  const readiness = plugin.readiness()
  const install = readiness.install ? { install: readiness.install } : {}
  if (readiness.status === 'found') return { ...details, ...install, plugin, status: 'found', message: 'Work source is ready.' }
  // The contract names what an adapter lacks only through its install command, so this wording fits every adapter.
  const message = readiness.install ? `Required tool missing. Install with ${readiness.install}.` : 'Required tool missing.'
  return { ...details, ...install, status: 'blocked', message }
}

/** Only a ready selection creates its source, so an unselected or blocked adapter never runs its tool. */
function activeSource(root: string, selection: WorkSourceSelection | undefined): WorkSource {
  return selection?.status === 'found' ? selection.plugin.create(root) : EMPTY_WORK_SOURCE
}

function selectionSignature(selection: WorkSourceSelection | undefined): string {
  return selection ? JSON.stringify([selection.id, selection.source, selection.status, selection.version]) : ''
}

/** A work source that follows plugins.json for as long as a viewer is open. */
export interface WorkSourceSession extends WorkSource {
  /** Reads the selection again and swaps the adapter when the selection or its readiness changed. */
  reconfigure(): Promise<void>
}

/**
 * Retains the selected adapter until configuration changes and closes its watch before replacing it.
 * A session serves one watcher: call `watch` once. A second call would replace the listener and leave the
 * first subscription open. A supplied source is used as it is and never reconfigured.
 */
export async function workSourceSession(root: string, supplied?: WorkSource): Promise<WorkSourceSession> {
  let selection = supplied ? undefined : await checkWorkSourceReadiness(root)
  let source = supplied ?? activeSource(root, selection)
  let signature = selectionSignature(selection)
  let subscription: ReturnType<WorkSource['watch']> | undefined
  let listener: (() => void) | undefined
  let pending = Promise.resolve()
  async function refresh() {
    if (supplied) return
    selection = await checkWorkSourceReadiness(root)
    const next = selectionSignature(selection)
    if (next === signature) return
    await subscription?.close()
    source = activeSource(root, selection)
    signature = next
    if (listener) { subscription = source.watch(listener); listener() }
  }
  return {
    read: () => source.read(),
    readItem: (id: string) => source.readItem(id),
    watch(onChange: () => void) {
      listener = onChange
      subscription = source.watch(onChange)
      return { close: async () => { listener = undefined; await subscription?.close() } }
    },
    reconfigure() {
      const next = pending.then(refresh)
      pending = next.catch(() => {})
      return next
    },
  }
}
