import assert from 'node:assert/strict'

import { test } from 'bun:test'

import { renderPage } from '../src/viewers/web/page.ts'
import type { WebBootPayload } from '../src/viewers/web/payload.ts'
import { readView, writeView } from '../src/viewers/web/url.ts'

const payload = {
  project: { title: 'Shop' },
  world: { elements: [], relationships: [], flows: [] },
  work: { items: [] },
  pins: [],
  revisions: [],
  revision: null,
  delivery: { kind: 'live' },
} as unknown as WebBootPayload

const root = (url?: string) => renderPage(payload, url === undefined ? undefined : new URL(url)).match(/<html[^>]*>/)![0]

/** The link the map writes for the view it read from `url`. */
function synchronized(url: URL): URL {
  const written = new URL(url.href)
  written.search = writeView({ ...readView(url, payload.world, []), theme: 'dark', hudVisible: false }, payload.world, [], url.pathname)
  return written
}

test.concurrent('an embedding page keeps its palette when a synchronized view is reloaded', () => {
  const url = new URL('http://localhost:4747/?palette=paper:ffeedb,ink:2E180F,line:9B674A')
  const initialRoot = root(url.href)
  assert.match(initialRoot, /^<html style="--paper: #FFEEDB; --ink: #2E180F; --map-line: #9B674A; --map-grid: #[0-9a-f]{6}; --map-grid-major: #[0-9a-f]{6}">$/)
  const reloaded = synchronized(url)
  assert.equal(reloaded.searchParams.get('palette'), 'paper:FFEEDB,ink:2E180F,line:9B674A')
  assert.equal(root(reloaded.href), initialRoot)
})

test.concurrent('the grid keeps the theme\'s colours unless the link sets both paper and line', () => {
  assert.equal(root('http://localhost:4747/?palette=paper:FFEEDB'), '<html style="--paper: #FFEEDB">')
  assert.equal(root('http://localhost:4747/?palette=line:9B674A'), '<html style="--map-line: #9B674A">')
})

test.concurrent('only palette colours written as six hex digits reach the page', () => {
  assert.equal(root('http://localhost:4747/?palette=paper:FFEEDB,glow:112233,ink:brown,muted:FFF'), '<html style="--paper: #FFEEDB">')
  const ignored = [
    undefined,
    'http://localhost:4747/',
    'http://localhost:4747/?palette=',
    'http://localhost:4747/?palette=paper',
    'http://localhost:4747/?palette=paper:red',
    'http://localhost:4747/?palette=glow:FFEEDB',
    'http://localhost:4747/?palette=paper:FFEEDB%22%3E%3Cscript%3E',
    'http://localhost:4747/?paper=FFEEDB',
  ]
  for (const url of ignored) {
    assert.equal(root(url), '<html>')
    const reloaded = synchronized(new URL(url ?? 'http://localhost:4747/'))
    assert.equal(reloaded.searchParams.has('palette'), false)
    assert.equal(root(reloaded.href), '<html>')
  }
})
