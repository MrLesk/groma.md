import { EMPTY_WORK_SOURCE, type WorkSource, type WorkSourcePlugin } from '@groma/work-source'
import { backlogPlugin } from '@groma/work-source-backlog'
import { installBacklogCli } from './backlog-cli.ts'
import { readGromaConfig, type ConfiguredWorkSource } from './config.ts'

/** A work source that ships inside groma.md, with the tool it reads through. */
export interface BundledWorkSource {
  name: string
  plugin: WorkSourcePlugin
  /** Installs the current tool, or updates an installed one when `upgrade` is set. */
  installTool(upgrade: boolean): Promise<void>
}

/** The work sources that ship inside groma.md, by the id config.json lists them with. */
export const bundledWorkSources: Readonly<Record<string, BundledWorkSource>> = {
  backlog: { name: 'Backlog.md', plugin: backlogPlugin, installTool: installBacklogCli },
}

interface WorkSourceSelectionFields extends ConfiguredWorkSource {
  kind: 'workSource'
  name: string
  /** The tool version on this computer, when it is installed. */
  installed?: string
  message: string
}

/**
 * The work source config.json lists, as it stands on this computer. `missing` means its tool is not installed or is
 * older than the listed version, which restoring fixes; the adapter is there exactly when the source is ready.
 */
export type WorkSourceSelection =
  | WorkSourceSelectionFields & { status: 'found'; plugin: WorkSourcePlugin }
  | WorkSourceSelectionFields & { status: 'missing' | 'blocked' }

/** Reports whether the work source config.json lists can run here. Without an entry no tool runs. */
export async function checkWorkSourceReadiness(root: string): Promise<WorkSourceSelection | undefined> {
  const selected = (await readGromaConfig(root)).workSources[0]
  if (!selected) return undefined
  const bundled = bundledWorkSources[selected.id]
  const base = { ...selected, kind: 'workSource' as const, name: bundled?.name ?? selected.id }
  if (!bundled) {
    return { ...base, status: 'blocked', message: `groma.md has no work source ${selected.id}. Bundled: ${Object.keys(bundledWorkSources).join(', ')}.` }
  }
  try {
    const readiness = await bundled.plugin.readiness()
    if (readiness.status === 'missing') return { ...base, status: 'missing', message: `${bundled.name} CLI is not installed.` }
    const installed = { ...base, installed: readiness.version }
    if (Bun.semver.order(readiness.version, selected.version) < 0) {
      return { ...installed, status: 'missing', message: `${bundled.name} CLI ${readiness.version} is older than ${selected.version}.` }
    }
    return { ...installed, status: 'found', plugin: bundled.plugin, message: '' }
  } catch (error) {
    return { ...base, status: 'blocked', message: error instanceof Error ? error.message : String(error) }
  }
}

/** Only a ready selection creates its source, so an unlisted or missing work source never runs its tool. */
function activeSource(root: string, selection: WorkSourceSelection | undefined): WorkSource {
  return selection?.status === 'found' ? selection.plugin.create(root) : EMPTY_WORK_SOURCE
}

function selectionSignature(selection: WorkSourceSelection | undefined): string {
  return selection ? JSON.stringify([selection.id, selection.version, selection.status, selection.installed]) : ''
}

/** A work source that follows config.json for as long as a viewer is open. */
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
