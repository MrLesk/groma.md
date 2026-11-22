import { expect, test } from 'bun:test'
import path from 'node:path'
import { loadAnnotatedArchitecture } from '../src/core.ts'
import { createMapHighlights } from '../src/viewers/web/iso/highlights.ts'
import { noSelection, selectArchitecture, selectTask } from '../src/viewers/web/selection.ts'

async function session(fixture = 'relationship-pairs') {
  const world = await loadAnnotatedArchitecture(path.resolve(import.meta.dir, `../test/fixtures/${fixture}`))
  let selected: readonly string[] = []
  let focused: ReadonlySet<string> = new Set()
  let neighbors: ReadonlySet<string> = new Set()
  let lit: ReadonlySet<string> = new Set()
  const highlights = createMapHighlights({
    select(ids) { selected = ids },
    mark() {},
    markNeighbors(ids, peers) { focused = ids; neighbors = peers },
    setLitRoutes(ids) { lit = ids },
  })
  return { world, highlights, selected: () => selected, focused: () => [...focused], neighbors: () => neighbors, lit: () => lit }
}

test.concurrent('selection separates direct neighbors from the focused component without following a second hop', async () => {
  const s = await session()
  const selection = selectArchitecture(noSelection, 'talks', false, s.world.groups)
  const original = structuredClone({ world: s.world, selection })
  s.highlights.paint(selection, s.world, [], [])
  expect(s.focused()).toEqual(['talks'])
  expect(s.selected()).toEqual(['talks'])
  expect([...s.neighbors()].sort()).toEqual(['people', 'sessions'])
  expect(s.neighbors().has('speakers')).toBe(false)
  expect(s.neighbors().has('talks')).toBe(false)
  expect({ world: s.world, selection }).toEqual(original)
})

test.concurrent('incoming-only neighbors are included and a new selection replaces the old neighborhood', async () => {
  const s = await session()
  s.highlights.paint(selectArchitecture(noSelection, 'talks', false, s.world.groups), s.world, [], [])
  s.highlights.paint(selectArchitecture(noSelection, 'people', false, s.world.groups), s.world, [], [])
  expect(s.focused()).toEqual(['people'])
  expect([...s.neighbors()].sort()).toEqual(['speakers', 'talks'])
  expect(s.neighbors().has('sessions')).toBe(false)
})

test.concurrent('every selected component is focused, and their neighbors are the components one hop from any of them', async () => {
  const s = await session()
  const first = selectArchitecture(noSelection, 'talks', false, s.world.groups)
  const selection = selectArchitecture(first, 'people', true, s.world.groups)
  s.highlights.paint(selection, s.world, [], [])
  expect(s.focused().sort()).toEqual(['people', 'talks'])
  expect([...s.neighbors()].sort()).toEqual(['sessions', 'speakers'])
})

test.concurrent('task, relationship, container, and empty selections clear component emphasis', async () => {
  const s = await session()
  const container = s.world.elements.find(element => element.kind === 'container')!
  for (const next of [selectTask('task'), noSelection,
    selectArchitecture(noSelection, s.world.relationships[0]!.id, false, s.world.groups),
    selectArchitecture(noSelection, container.representationId, false, s.world.groups)]) {
    s.highlights.paint(selectArchitecture(noSelection, 'talks', false, s.world.groups), s.world, [], [])
    s.highlights.paint(next, s.world, [], [])
    expect(s.focused()).toEqual([])
    expect(s.neighbors().size).toBe(0)
  }
})

test.concurrent('component neighbors coexist with active flow filtering without claiming actors or external systems', async () => {
  const s = await session('flows')
  const flows = [{ id: s.world.flows[0]!.id }]
  s.highlights.paint(noSelection, s.world, flows, [])
  const before = [...s.lit()]
  expect(before.length).toBeGreaterThan(0)
  s.highlights.paint(selectArchitecture(noSelection, 'entry', false, s.world.groups), s.world, flows, [])
  expect([...s.lit()]).toEqual(before)
  expect([...s.neighbors()]).toEqual(['worker'])
  expect(s.focused()).toEqual(['entry'])
})
