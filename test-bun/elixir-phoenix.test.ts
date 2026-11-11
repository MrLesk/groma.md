import { expect, test } from 'bun:test'
import { cp, mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { HttpEndpointSegment, ScanObservation, ScannerPlugin } from '@groma/scanner'
import { buildPackage as buildElixir } from '../plugins/scanners/elixir/build.ts'
import { buildPackage as buildJavaScript } from '../plugins/scanners/javascript/build.ts'
import { httpRelationships } from '../src/http-relationships.ts'
import { discoverScanners } from '../src/scanner/modules/discovery.ts'
import { officialScannerCatalog } from '../src/scanner/modules/official-catalog.ts'
import { scannerFiles } from '../src/scanner/modules/selection.ts'

const fixture = path.resolve(import.meta.dir, '../test/fixtures/elixir-phoenix')

/** Scan a fresh copy of the fixture with each built package, as a repository that configures them together would. */
async function scanWith(builds: Record<string, (destination: string) => Promise<void>>,
  inspect: (observations: Record<string, ScanObservation>, root: string) => Promise<void>) {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'groma-elixir-phoenix-'))
  try {
    const root = path.join(temporary, 'project')
    await cp(fixture, root, { recursive: true })
    const git = Bun.spawn(['git', 'init', '--quiet', root], { stdout: 'ignore', stderr: 'pipe' })
    expect(await git.exited, await new Response(git.stderr).text()).toBe(0)
    const observations: Record<string, ScanObservation> = {}
    for (const [id, build] of Object.entries(builds)) {
      const artifact = path.join(temporary, id)
      await build(artifact)
      const manifest = JSON.parse(await readFile(path.join(artifact, 'package.json'), 'utf8'))
      const scanner = (await import(pathToFileURL(path.join(artifact, manifest.groma.scanner.entry)).href)).default as ScannerPlugin
      observations[id] = (await scanner.scan(root, {}, await scannerFiles(root, manifest.groma.scanner)))!
    }
    await inspect(observations, root)
  } finally { await rm(temporary, { recursive: true, force: true }) }
}

/** `!` marks a constrained segment and `?` an optional one, as in the relationship rule's own examples. */
function segmentText(segment: HttpEndpointSegment): string {
  if (segment.kind === 'literal') return segment.value
  return `${segment.kind === 'parameter' ? ':' : '*'}${segment.name}${segment.optional ? '?' : ''}${segment.constrained ? '!' : ''}`
}

test.concurrent('Phoenix routes become endpoints with their scope prefixes, handlers and registration order', async () => {
  await scanWith({ elixir: buildElixir }, async ({ elixir }, root) => {
    const names = new Map(elixir!.operations!.map(operation => [operation.id, operation.name]))
    const endpoints = elixir!.httpEndpoints!.map(endpoint => [
      endpoint.order!.position, endpoint.method, `/${endpoint.path.map(segmentText).join('/')}`, names.get(endpoint.operation),
    ])
    const blocked = '*unresolved?!'
    expect(endpoints).toEqual([
      [0, 'GET', '/api/items/:id', 'PortalWeb.ItemController.show/2'],
      // `resources` registers its own routes before its nested block; the nested path names the parent record.
      [1, 'GET', '/api/items', 'PortalWeb.ItemController.index/2'],
      [2, 'POST', '/api/items', 'PortalWeb.ItemController.create/2'],
      [3, 'GET', '/api/items/:item_id/notes/:id', 'PortalWeb.NoteController.show/2'],
      [4, 'GET', '/api/:version!/status', 'PortalWeb.ItemController.status/2'],
      [5, 'GET', '/api/files/*path?', 'PortalWeb.ItemController.download/2'],
      // `alias: false` leaves the scope's module prefix off; the lexical alias still applies.
      [6, 'GET', '/api/reports', 'PortalWeb.Reports.SummaryController.index/2'],
      // A controller outside the source, and an action that is private, are unknown handlers.
      [7, '*', `/api/hooks/${blocked}`, '(module)'],
      [8, '*', `/api/secret/${blocked}`, '(module)'],
      // A LiveView route is the exact GET its page answers, through `live_session` too.
      [9, 'GET', '/', 'PortalWeb.BoardLive.mount/3'],
      [10, 'GET', '/plain', 'PortalWeb.PlainLive.render/1'],
      [11, '*', `/empty/${blocked}`, '(module)'],
      // An unknown plug, another library's macro, a host-bound scope and a conditional block.
      [12, '*', `/admin/jobs/${blocked}`, '(module)'],
      [13, '*', `/admin/${blocked}`, '(module)'],
      [14, 'GET', '/admin/late', 'PortalWeb.LateController.show/2'],
      [15, '*', `/tenant/${blocked}`, '(module)'],
      [16, '*', `/${blocked}`, '(module)'],
      [17, '*', '/fallback', 'PortalWeb.ItemController.fallback/2'],
    ])
    expect(elixir!.httpEndpoints!.every(endpoint => endpoint.order!.application === 'lib/portal_web/router.ex')).toBeTrue()

    const discovery = await discoverScanners(root, {}, officialScannerCatalog.filter(item => item.id === 'elixir'))
    expect(discovery.findings.map(finding => [finding.technology, finding.file, finding.version])).toEqual([
      ['phoenix', 'lib/portal_web/router.ex', undefined], ['elixir', 'mix.exs', '~> 1.17'],
    ])
  })
}, 60000)

test.concurrent('a browser request derives a row to its Phoenix handler, and none past an earlier blocker', async () => {
  await scanWith({ elixir: buildElixir, javascript: buildJavaScript }, async observations => {
    const combined = Object.values(observations)
    const owners = new Map(combined.flatMap(observation => observation.files.map(file => [file.file, file.file])))
    const rows = httpRelationships(combined, owners).map(row => [row.source, row.target])
    // `/admin/late` is registered after another library's routes under `/admin`, so its row stays unproven.
    expect(rows.sort()).toEqual([
      ['assets/js/app.js', 'lib/portal_web/controllers/item_controller.ex'],
      ['assets/js/app.js', 'lib/portal_web/controllers/note_controller.ex'],
    ])
  })
}, 60000)
