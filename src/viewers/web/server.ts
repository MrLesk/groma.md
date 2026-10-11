import path from 'node:path'
import type { WorkSource } from '@groma/work-source'

import {
  initializeRepository,
  type RepositoryInitDependencies,
} from '../../init-command.ts'
import { gromaInitialization } from '../../initialize.ts'
import { loadProjectProfile } from '../../project-profile.ts'
import { discoverScanners, type ScannerDiscovery } from '../../scanner/modules/discovery.ts'
import { installSelectedScanners } from '../../scanner/modules/setup.ts'
import { createWebMapSession } from './map-session.ts'
import { renderSetupPage } from './startup/page.ts'
import { createStartupProgress } from './startup/progress.ts'

/** The host names that mean this machine, whatever the port. */
const loopbackHosts = new Set(['localhost', '127.0.0.1', '[::1]'])

/**
 * Whether a browser sent this request on behalf of a page that is not this viewer. Any site the
 * user visits can make their browser call a local address, and the map shows private source and
 * writes to the repository.
 *
 * - The Host header must name this machine. A site that points its own name at 127.0.0.1 (DNS
 *   rebinding) would otherwise read the map as a page of its own.
 * - A request that changes something and names its page in an Origin or Referer header must come
 *   from this viewer; a form on another site would otherwise reach the write routes. A client that
 *   is not a browser sends neither header and passes.
 */
function fromAnotherSite(request: Request): boolean {
  const viewer = URL.parse(`http://${request.headers.get('host') ?? ''}`)
  if (viewer === null || !loopbackHosts.has(viewer.hostname)) return true
  if (request.method === 'GET' || request.method === 'HEAD') return false
  const sender = request.headers.get('origin') ?? request.headers.get('referer')
  return sender !== null && URL.parse(sender)?.host !== viewer.host
}

type MapSession = Awaited<ReturnType<typeof createWebMapSession>>

/** One local server owns setup and the ready map; the map starts only after initialization. */
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

  function openMap(scan: boolean): Promise<void> {
    error = undefined
    preparing = (async () => {
      map = await createWebMapSession(repositoryRoot, {
        ...options, scan,
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

  const server = Bun.serve({
    // The IPv4 loopback address: no other machine can connect.
    hostname: '127.0.0.1',
    port: options.port ?? 4747,
    // The map's live event stream must stay open between changes.
    idleTimeout: 0,
    async fetch(request) {
      if (fromAnotherSite(request)) return new Response('Forbidden', { status: 403 })
      const route = `${request.method} ${new URL(request.url).pathname}`
      if (route === 'GET /startup-events') return progress.response()
      if (route === 'GET /ready') {
        await preparing
        return new Response(null, { status: error === undefined ? 204 : 500 })
      }
      if (map !== undefined) return map.fetch(request)
      if (route === 'POST /scanners') {
        return prepare(() => selectScanners(request))
      }
      if (route === 'POST /initialize') {
        return prepare(() => initialize(request))
      }
      return setupResponse()
    },
  })

  // `localhost` reaches 127.0.0.1 on every platform; a client that tries `::1` first falls back to it.
  const url = `http://localhost:${server.port}`
  options.onListening?.(url)
  if (initial.initialized) await openMap(options.scan === true)

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
