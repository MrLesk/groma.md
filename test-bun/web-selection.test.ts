import assert from 'node:assert/strict'
import path from 'node:path'
import { loadAnnotatedArchitecture } from '../src/core.ts'

import { test } from 'bun:test'

import {
  noSelection,
  ownsDetails,
  primarySelection,
  retainSelection,
  selectArchitecture,
  selectMapArchitecture,
  selectedArchitecture,
  selectTask,
} from '../src/viewers/web/selection.ts'
import { readView, writeView } from '../src/viewers/web/url.ts'
import type { ArchitectureGraph } from '../src/types.ts'

test.concurrent('a system map click clears a selected component before a second click selects the system', async () => {
  const world = await loadAnnotatedArchitecture(path.resolve(import.meta.dir, '../test/fixtures/relationship-pairs'))
  const component = world.elements.find(element => element.kind === 'component')!
  const system = world.elements.find(element => element.kind === 'system' && !element.external)!
  const selected = selectArchitecture(noSelection, component.representationId, false, world.groups)

  const cleared = selectMapArchitecture(selected, system.representationId, false, world)
  assert.deepEqual(cleared, noSelection)
  assert.equal(ownsDetails(cleared), false)
  assert.deepEqual(selectMapArchitecture(cleared, system.representationId, false, world),
    { kind: 'architecture', ids: [system.representationId] })
  assert.deepEqual(selectMapArchitecture(selected, system.representationId, true, world),
    { kind: 'architecture', ids: [component.representationId, system.representationId] })
  assert.deepEqual(selectArchitecture(selected, system.representationId, false, world.groups),
    { kind: 'architecture', ids: [system.representationId] })
})

test.concurrent('every concrete selection owns details and the empty selection does not', () => {
  assert.equal(ownsDetails(noSelection), false)
  assert.equal(ownsDetails(selectArchitecture(noSelection, 'observed:a', false, [])), true)
  assert.equal(ownsDetails(selectTask('TASK-7')), true)
})

test.concurrent('a plain architecture pick replaces the current selection', () => {
  const several = selectArchitecture(
    selectArchitecture(noSelection, 'observed:a', false, []),
    'relationship:0',
    true,
    [],
  )

  const selected = selectArchitecture(several, 'observed:b', false, [])

  assert.deepEqual(selected, { kind: 'architecture', ids: ['observed:b'] })
  assert.equal(primarySelection(selected), 'observed:b')
})

test.concurrent('additive architecture picks append and toggle in selection order', () => {
  let selected = selectArchitecture(noSelection, 'observed:a', true, [])
  selected = selectArchitecture(selected, 'relationship:0', true, [])
  selected = selectArchitecture(selected, 'observed:b', true, [])

  assert.deepEqual(selected, {
    kind: 'architecture',
    ids: ['observed:a', 'relationship:0', 'observed:b'],
  })
  assert.equal(primarySelection(selected), 'observed:b')

  selected = selectArchitecture(selected, 'observed:b', true, [])
  assert.equal(primarySelection(selected), 'relationship:0')
  selected = selectArchitecture(selected, 'observed:a', true, [])
  selected = selectArchitecture(selected, 'relationship:0', true, [])
  assert.deepEqual(selected, noSelection)
})

test.concurrent('a group is selected alone on either side of an additive pick', () => {
  const groups = [{ id: 'checks', title: 'Checks', overview: '' }]
  const component = selectArchitecture(noSelection, 'stock', false, groups)
  const group = selectArchitecture(component, 'checks', true, groups)
  assert.deepEqual(group, { kind: 'architecture', ids: ['checks'] })
  assert.deepEqual(selectArchitecture(group, 'stock', true, groups), component)
})

test.concurrent('a group link restores and shares only an id that names a group', () => {
  // One component and one group: enough for a link to tell a group's id from an element's.
  const world: ArchitectureGraph = {
    elements: [{
      representationId: 'cart', id: 'cart', kind: 'component', title: 'Cart', overview: '', parent: null,
      children: [], external: false, code: [], origin: 'observed',
    }],
    groups: [{ id: 'basket', title: 'Basket', overview: '' }],
    relationships: [],
    flows: [],
  }
  const url = new URL('https://example.test/?group=basket')
  const opened = readView(url, world, [])
  assert.deepEqual(opened.selection, { kind: 'architecture', ids: ['basket'] })
  url.search = writeView(opened, world, [], url.pathname)
  assert.deepEqual(url.searchParams.getAll('group'), ['basket'])

  for (const id of ['cart', 'missing']) {
    url.search = `?group=${id}`
    assert.deepEqual(readView(url, world, []).selection, { kind: 'none' })
  }
})

test.concurrent('task selection is separate from architecture selection', () => {
  const task = selectTask('TASK-7')
  assert.equal(primarySelection(task), 'TASK-7')
  assert.deepEqual(selectedArchitecture(task), [])

  const architecture = selectArchitecture(task, 'observed:a', true, [])
  assert.deepEqual(architecture, { kind: 'architecture', ids: ['observed:a'] })
  assert.deepEqual(selectedArchitecture(architecture), ['observed:a'])
  assert.equal(primarySelection(noSelection), undefined)
})

test.concurrent('live selection keeps known targets in their original order', () => {
  const selected = {
    kind: 'architecture' as const,
    ids: ['observed:a', 'relationship:0', 'observed:b'],
  }

  assert.deepEqual(retainSelection(selected, id => id !== 'relationship:0'), {
    kind: 'architecture',
    ids: ['observed:a', 'observed:b'],
  })
  assert.deepEqual(retainSelection(selected, () => false), noSelection)
  assert.deepEqual(retainSelection(selectTask('TASK-7'), () => false), noSelection)
})
