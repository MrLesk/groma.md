import path from 'node:path'
import type { WorkSource } from '@groma/work-source'

import {
  initializeRepository,
  type RepositoryInitDependencies,
} from '../../init-command.ts'
import { gromaInitialization } from '../../initialize.ts'
import { pluginPresence } from '../../plugin-management.ts'
import { loadProjectProfile } from '../../project-profile.ts'
import { discoverScanners, type ScannerDiscovery } from '../../scanner/modules/discovery.ts'
import { installSelectedScanners } from '../../scanner/modules/setup.ts'
import { createWebMapSession } from './map-session.ts'
import { renderSetupPage } from './startup/page.ts'
import { createStartupProgress } from './startup/progress.ts'
import { restoreEach, restoreRows, type RestoreRow } from './startup/restore.ts'

type MapSession = Awaited<ReturnType<typeof createWebMapSession>>

/**
 * One local server owns setup and the ready map; the map starts only after initialization. When a plugin config.json
 * lists is missing on this computer, the server first asks whether to restore it, or opens the map read-only.
 */
export async function startWebViewer(
  repositoryRoot: string,
  options: {
    port?: number
    workSource?: WorkSource
    scan?: boolean
    onListening?: (url: string) => void
    initDependencies?: Partial<RepositoryInitDependencies>
  } = {},
): Promise<{ url: string; close: () => Promise<void> }> {
  const initial = gromaInitialization(repositoryRoot)
  const progress = createStartupProgress()
  let projectName = (await loadProjectProfile(repositoryRoot))?.title ?? path.basename(repositoryRoot)
  let proposal: ScannerDiscovery | undefined
  let restore: RestoreRow[] | undefined
  let map: MapSession | undefined
  let error: string | undefined
  let preparing = Promise.resolve()
  let submission: Promise<Response> | undefined

  /** Browser windows share the pending setup step and its one initial map session. */
  function prepare(action: () => Promise<Response>): Promise<Response> {
    if (submission === undefined) {
      submission = action()
      preparing = submission.then(() => {}).finally(() => { submission = undefined })
    }
    return submission.then(response => response.clone())
  }

  function openMap(scan: boolean, readOnly = false): Promise<void> {
    error = undefined
    preparing = (async () => {
      map = await createWebMapSession(repositoryRoot, {
        ...options, scan, readOnly,
        onProgress: update => {
          if (map !== undefined) return
          progress.report(update)
          // Flush startup events before synchronous map layout blocks this server.
          if (update.phase === 'preparing-map') return new Promise<void>(resolve => setTimeout(resolve, 0))
        },
      })
    })().catch(failed)
    return preparing
  }

  function failed(cause: unknown): void {
    error = cause instanceof Error ? cause.message : String(cause)
    progress.clear()
  }

  function setupResponse(status = error === undefined ? 200 : 500): Response {
    return new Response(renderSetupPage({
      projectName,
      firstRun: !initial.initialized,
      progress: progress.current,
      ...gromaInitialization(repositoryRoot),
      error,
      proposal,
      restore,
    }), {
      status,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  }

  async function initialize(request: Request): Promise<Response> {
    try {
      const input = await request.formData()
      projectName = String(input.get('projectName') ?? '')
      progress.report({ phase: 'creating-project' })
      await initializeRepository(repositoryRoot, {
        projectName,
        directory: String(input.get('directory') ?? ''),
      }, options.initDependencies)
      progress.report({ phase: 'finding-scanners' })
      proposal = await discoverScanners(repositoryRoot)
      error = undefined
      progress.clear()
      return new Response(null, { status: 303, headers: { Location: '/' } })
    } catch (cause) {
      failed(cause)
      return setupResponse(400)
    }
  }

  async function selectScanners(request: Request): Promise<Response> {
    if (proposal === undefined) return new Response('No scanner proposal to review.', { status: 400 })
    try {
      const input = await request.formData()
      const selected = input.getAll('scanner').map(String)
      progress.report({ phase: selected.length ? 'installing-scanners' : 'finding-scanners' })
      try {
        await installSelectedScanners(repositoryRoot, proposal, selected)
      } finally {
        progress.report({ phase: 'finding-scanners' })
        proposal = await discoverScanners(repositoryRoot)
      }
      await openMap(true)
      if (error !== undefined) return setupResponse(400)
      proposal = undefined
      return new Response(null, { status: 303, headers: { Location: '/' } })
    } catch (cause) {
      failed(cause)
      return setupResponse(400)
    }
  }

  const home = (): Response => new Response(null, { status: 303, headers: { Location: '/' } })
  const opened = (): Response => error === undefined ? home() : setupResponse(400)

  /** When every missing plugin is restored the map opens as usual; otherwise the restore view returns with the rest. */
  async function restorePlugins(): Promise<Response> {
    if (restore === undefined) return new Response('No plugins to restore.', { status: 400 })
    const rows = await restoreEach(repositoryRoot, restore, plugins => progress.report({ phase: 'restoring-plugins', plugins }))
    progress.clear()
    const failed = rows.filter(row => row.state === 'failed')
    if (failed.length) {
      restore = failed
      return home()
    }
    restore = undefined
    await openMap(options.scan === true)
    return opened()
  }

  async function proceedWithoutPlugins(): Promise<Response> {
    restore = undefined
    await openMap(false, true)
    return opened()
  }

  /** The setup forms; each runs once however many browser windows submit it. */
  const setupActions: Record<string, (request: Request) => Promise<Response>> = {
    'POST /initialize': initialize,
    'POST /scanners': selectScanners,
    'POST /restore': restorePlugins,
    'POST /proceed': proceedWithoutPlugins,
  }

  const server = Bun.serve({
    port: options.port ?? 4747,
    // The map's live event stream must stay open between changes.
    idleTimeout: 0,
    async fetch(request) {
      const route = `${request.method} ${new URL(request.url).pathname}`
      if (route === 'GET /startup-events') return progress.response()
      if (route === 'GET /ready') {
        await preparing
        return new Response(null, { status: error === undefined ? 204 : 500 })
      }
      if (map !== undefined) return map.fetch(request)
      const action = setupActions[route]
      return action === undefined ? setupResponse() : prepare(() => action(request))
    },
  })

  const url = `http://localhost:${server.port}`
  options.onListening?.(url)
  if (initial.initialized) {
    const missing = await pluginPresence(repositoryRoot).then(plugins => plugins.filter(plugin => !plugin.present), cause => { failed(cause); return [] })
    if (missing.length) restore = restoreRows(missing)
    else if (error === undefined) await openMap(options.scan === true)
  }

  return {
    url,
    async close() {
      progress.close()
      await server.stop(true)
      // A map still being prepared would otherwise finish after this close and leave its watchers running.
      await preparing
      await map?.close()
    },
  }
}
