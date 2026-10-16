import { reconcileScanObservations } from '../core.ts'
import { loadScannerRegistry, type ScanBatch, type ScanEvent } from './registry.ts'
import { watchObservations } from './source-watch.ts'
import { readGromaConfig } from '../config.ts'
import type { ScanSummary } from '../types.ts'
import type { ProjectReadiness } from './modules/readiness.ts'
import { changePluginSettings, readPluginSettings, type PluginSettings, type PluginSettingsAction } from '../plugins/settings.ts'
import { updateNpmScanners, type ScannerInstallOptions } from './modules/inventory.ts'

export type ScannerProgress =
  | { phase: 'preparing-scanners' | 'updating-architecture' }
  | { phase: 'scanning'; scanners: readonly string[] }

/** The part of config.json scanning depends on; a change elsewhere, such as a work source, needs no rescan. */
async function scannerSignature(root: string): Promise<string> {
  const { scanners, exclude, useGitignore } = await readGromaConfig(root)
  return JSON.stringify({ scanners, exclude, useGitignore })
}

/** Owns scanner execution, settings state and the one source-adapter subscription for an open viewer. */
export async function createScannerSession(root: string, options: {
  scan?: boolean
  onProgress?: (progress: ScannerProgress) => void
  onSettings?: (settings: PluginSettings) => void
  /** Reports asynchronous errors; startup and change failures reject their promises. */
  onError?: (error: unknown) => void
  onPluginsChanged?: () => void | Promise<void>
  onFold?: (summary: ScanSummary) => void | Promise<void>
  watchesFile?: (file: string) => boolean
} & ScannerInstallOptions = {}) {
  options.onProgress?.({ phase: 'preparing-scanners' })
  let state = await readPluginSettings(root, [], options)
  let checks: ProjectReadiness[] = []
  let watcher: Awaited<ReturnType<typeof watchObservations>> | undefined
  let scannerConfig = ''
  let closed = false
  const updates = new AbortController()
  let serial = Promise.resolve()
  const listeners = new Set<(state: PluginSettings) => void>()
  const activeScanners = new Set<string>()

  function scanProgress(event: ScanEvent) {
    if (event.type === 'start') activeScanners.add(event.scanner)
    else activeScanners.delete(event.scanner)
    options.onProgress?.(activeScanners.size
      ? { phase: 'scanning', scanners: [...activeScanners] } : { phase: 'preparing-scanners' })
  }
  function publish(next: PluginSettings) {
    if (closed) return
    state = next
    options.onSettings?.(state)
    for (const listener of listeners) listener(state)
  }
  async function report(error: unknown, notifyError = true) {
    const message = error instanceof Error ? error.message : String(error)
    const next = await readPluginSettings(root, checks, options)
    publish({ ...next, notice: { tone: 'error', message } })
    if (notifyError) options.onError?.(error)
  }
  async function fold({ observations, failures }: ScanBatch, files: string[]) {
    if (observations.length) options.onProgress?.({ phase: 'updating-architecture' })
    const summary = await reconcileScanObservations(root, observations)
    if (failures.length) summary.scannerFailures = failures.map(({ scanner, message }) => ({ scanner, message }))
    checks = [
      ...observations.map((observation): ProjectReadiness => ({ id: observation.scanner.id, package: 'found', project: 'ready', message: 'Scan completed.' })),
      ...failures.map((failure): ProjectReadiness => ({ id: failure.scanner, package: 'found', project: 'blocked', message: failure.message })),
    ]
    publish(await readPluginSettings(root, checks, options))
    if (observations.length || failures.length || files.some(file => options.watchesFile?.(file))) await options.onFold?.(summary)
  }
  async function start(scan: boolean) {
    await watcher?.close()
    watcher = undefined
    if (closed) return
    scannerConfig = await scannerSignature(root)
    checks = []
    publish(await readPluginSettings(root, checks, options))
    const registry = await loadScannerRegistry(root, options)
    if (closed) return
    // With no selected scanner, only declaration matching runs; no scan evidence is written.
    watcher = await watchObservations(root, registry, {
      scan, onScan: scanProgress, onObservations: fold, onError: report, watchesFile: options.watchesFile,
    })
  }
  function enqueue(action: () => Promise<void>, propagate = false): Promise<void> {
    const next = serial.then(async () => { if (!closed) await action() }).catch(async error => {
      await report(error, !propagate)
      if (propagate) throw error
    })
    serial = next.catch(() => {})
    return next
  }
  function reconfigure() {
    return enqueue(async () => {
      if (await scannerSignature(root) !== scannerConfig) await start(true)
    })
  }
  const ready = enqueue(() => start(options.scan !== false), true)
  // Registry work never joins the startup/close queue. Completed updates use the existing rescan path.
  void ready.then(async () => {
    if (!closed && await updateNpmScanners(root, { ...options, signal: updates.signal })) await reconfigure()
  }, () => {}).catch(error => { if (!closed) return report(error) })

  return {
    /** Resolves after the initial scan and failure reporting; rejects when session setup fails. */
    ready,
    get state() { return state },
    subscribe(listener: (state: PluginSettings) => void) {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    async refresh() { publish(await readPluginSettings(root, checks, options)); return state },
    reconfigure,
    change(action: PluginSettingsAction) {
      return enqueue(async () => {
        // Stop in-flight evidence before a new selection can own source updates.
        await watcher?.close()
        watcher = undefined
        try { await changePluginSettings(root, action, options); await options.onPluginsChanged?.() }
        catch (error) { await start(true); throw error }
        await start(true)
      }, true)
    },
    async close() {
      closed = true
      updates.abort()
      await serial
      await watcher?.close()
    },
  }
}
export type ScannerSession = Awaited<ReturnType<typeof createScannerSession>>
