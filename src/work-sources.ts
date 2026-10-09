import { pathToFileURL } from 'node:url'
import { EMPTY_WORK_SOURCE, type WorkSource, type WorkSourcePlugin } from '@groma/work-source'
import groma from '../package.json'
import { readScannerConfig } from './scanner/modules/config.ts'
import { defaultScannerCacheRoot, parseScannerSource, resolveScannerPackage } from './scanner/modules/package.ts'
import type { ScannerResolutionOptions } from './scanner/modules/inventory.ts'

export interface WorkSourceSelection {
  id: string
  source: string
  kind: 'workSource'
  status: 'found' | 'missing' | 'blocked'
  message: string
  install?: string
  name?: string
  version?: string
  plugin?: WorkSourcePlugin
}

/** Read only the selected package; an absent selection never imports or probes a work source. */
export async function configuredWorkSource(root: string, options: ScannerResolutionOptions = {}): Promise<WorkSourceSelection | undefined> {
  const selected = (await readScannerConfig(root)).workSources?.[0]
  if (!selected) return undefined
  const base = { ...selected, kind: 'workSource' as const }
  try {
    const source = parseScannerSource(root, selected.source)
    const resolved = await resolveScannerPackage(source, options.cacheRoot ?? defaultScannerCacheRoot(), 'workSource')
    if (!resolved) return { ...base, status: 'missing', message: `Restore ${selected.source} with groma plugin install, or restore its local path.` }
    if (resolved.id !== selected.id) throw new Error(`Configured work source ${selected.id} resolves to ${resolved.id}`)
    const details = { ...base, name: resolved.name, version: resolved.version }
    const required = resolved.compatibility?.groma
    if (required && !Bun.semver.satisfies(groma.version, required)) {
      return { ...details, status: 'blocked', message: `Requires Groma ${required}; this computer has ${groma.version}. Update Groma.` }
    }
    return await importedWorkSource(resolved.entry, details)
  } catch (error) {
    return { ...base, status: 'blocked', message: error instanceof Error ? error.message : String(error) }
  }
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
  return { ...details, plugin, status: readiness.status === 'found' ? 'found' : 'blocked',
    message: readiness.status === 'found' ? 'Work source is ready.' : `Backlog CLI missing. Install with ${readiness.install}.`,
    ...(readiness.install ? { install: readiness.install } : {}) }
}

/** Viewers share this boundary so an unselected or blocked adapter cannot run its CLI. */
export async function loadWorkSource(root: string): Promise<WorkSource> {
  const selection = await configuredWorkSource(root)
  return activeSource(root, selection)
}

function activeSource(root: string, selection: WorkSourceSelection | undefined): WorkSource {
  return selection?.status === 'found' ? selection.plugin!.create(root) : EMPTY_WORK_SOURCE
}

function selectionSignature(selection: WorkSourceSelection | undefined): string {
  return selection ? JSON.stringify([selection.id, selection.source, selection.status, selection.version]) : ''
}

/** Retains the selected adapter until configuration changes and closes its watch before replacing it. */
export async function workSourceSession(root: string, supplied?: WorkSource) {
  let selection = supplied ? undefined : await configuredWorkSource(root)
  let source = supplied ?? activeSource(root, selection)
  let signature = selectionSignature(selection)
  let subscription: ReturnType<WorkSource['watch']> | undefined
  let listener: (() => void) | undefined
  let pending = Promise.resolve()
  async function refresh() {
    if (supplied) return
    selection = await configuredWorkSource(root)
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
