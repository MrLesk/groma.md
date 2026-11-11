import { expect, test } from 'bun:test'
import { buildPackage as buildElixir } from '../plugins/scanners/elixir/build.ts'
import { buildPackage as buildJavaScript } from '../plugins/scanners/javascript/build.ts'
import { httpRelationships } from '../src/http-relationships.ts'
import { discoverScanners } from '../src/scanner/modules/discovery.ts'
import { officialScannerCatalog } from '../src/scanner/modules/official-catalog.ts'
import { blocked, endpointRows, scanFixture } from './elixir-fixture.ts'

test.concurrent('Phoenix routes become endpoints with their scope prefixes, handlers and registration order', async () => {
  await scanFixture('elixir-phoenix', { elixir: buildElixir }, async ({ elixir }, root) => {
    expect(endpointRows(elixir!.observation)).toEqual([
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
      [7, '*', blocked('/api/hooks'), '(module)'],
      [8, '*', blocked('/api/secret'), '(module)'],
      // A LiveView route is the exact GET its page answers, through `live_session` too.
      [9, 'GET', '/', 'PortalWeb.BoardLive.mount/3'],
      [10, 'GET', '/plain', 'PortalWeb.PlainLive.render/1'],
      [11, '*', blocked('/empty'), '(module)'],
      // An unknown plug, another library's macro, a host-bound scope and a conditional block.
      [12, '*', blocked('/admin/jobs'), '(module)'],
      [13, '*', blocked('/admin'), '(module)'],
      [14, 'GET', '/admin/late', 'PortalWeb.LateController.show/2'],
      [15, '*', blocked('/tenant'), '(module)'],
      [16, '*', blocked(''), '(module)'],
      [17, '*', '/fallback', 'PortalWeb.ItemController.fallback/2'],
    ])
    expect(elixir!.observation.httpEndpoints!.every(endpoint => endpoint.order!.application === 'lib/portal_web/router.ex')).toBeTrue()

    const discovery = await discoverScanners(root, {}, officialScannerCatalog.filter(item => item.id === 'elixir'))
    expect(discovery.findings.map(finding => [finding.technology, finding.file, finding.version])).toEqual([
      ['phoenix', 'lib/portal_web/router.ex', undefined], ['elixir', 'mix.exs', '~> 1.17'],
    ])
  })
}, 60000)

test.concurrent('a browser request derives a row to its Phoenix handler, and none past an earlier blocker', async () => {
  await scanFixture('elixir-phoenix', { elixir: buildElixir, javascript: buildJavaScript }, async scans => {
    const combined = Object.values(scans).map(scan => scan.observation)
    const owners = new Map(combined.flatMap(observation => observation.files.map(file => [file.file, file.file])))
    const rows = httpRelationships(combined, owners).map(row => [row.source, row.target])
    // `/admin/late` is registered after another library's routes under `/admin`, so its row stays unproven.
    expect(rows.sort()).toEqual([
      ['assets/js/app.js', 'lib/portal_web/controllers/item_controller.ex'],
      ['assets/js/app.js', 'lib/portal_web/controllers/note_controller.ex'],
    ])
  })
}, 60000)
