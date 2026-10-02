import assert from 'node:assert/strict'
import { test } from 'bun:test'
import { projectFlowStep } from '../src/viewers/tui/flow.ts'

import { encloses, visibleIn } from '../src/viewers/tui/projection-camera.ts'
import { projectWorld, type ProjectedMapItem } from '../src/viewers/tui/projection.ts'
import type { Bounds } from '../src/types.ts'
import {
  box,
  mapViewportOf,
  navigationWorld,
  uses,
  worldOf,
} from './helpers.ts'

const CELL = { x: 0, y: 0, width: 1, height: 1 }

function groupedWorld() {
  const model = worldOf([
    box('person', 'actor', CELL),
    box('product', 'system', CELL, { children: ['observed:service', 'observed:store'] }),
    box('service', 'container', CELL, { parent: 'observed:product', children: ['observed:read', 'observed:write'] }),
    box('store', 'container', CELL, { parent: 'observed:product', children: ['observed:rows'] }),
    box('read', 'component', CELL, { parent: 'observed:service', group: 'Queries' }),
    box('write', 'component', CELL, { parent: 'observed:service', group: 'Commands' }),
    box('rows', 'component', CELL, { parent: 'observed:store' }),
    box('vendor', 'system', CELL, { external: true }),
  ], [
    uses('person-uses-service', 'person', 'read'),
    uses('write-uses-vendor', 'write', 'vendor'),
    uses('write-uses-rows', 'write', 'rows'),
  ])
  model.flows = [{ id: 'write-request', title: 'Write request', overview: 'Write to the vendor.', sourceFilename: '', steps: [
    { relationshipId: 'write-uses-vendor', source: 'observed:write', target: 'observed:vendor', action: 'Write' },
  ] }]
  return model
}

function item(items: readonly ProjectedMapItem[], id: string): ProjectedMapItem | undefined {
  return items.find(candidate => candidate.representationId === id)
}

function right(bounds: Bounds): number {
  return bounds.x + bounds.width
}

test.concurrent('root draws containers collapsed with their contents counted and no component inside them', () => {
  const model = groupedWorld()
  const projection = projectWorld(model, { viewport: mapViewportOf({ width: 200, height: 60 }) })
  const system = item(projection.items, 'observed:product')!
  const service = item(projection.items, 'observed:service')!
  assert.ok(encloses(system.worldBounds, service.worldBounds))
  assert.ok(service.note?.startsWith('2 '))
  assert.equal(item(projection.items, 'observed:read'), undefined)
  assert.equal(projection.items.some(candidate => candidate.kind === 'group'), false)
  assert.ok(item(projection.items, 'observed:vendor'), 'island buildings stand at root')
})

test.concurrent('opening a container draws its groups and components inside it and keeps the others collapsed', () => {
  const model = groupedWorld()
  const projection = projectWorld(model, { viewport: mapViewportOf({ width: 200, height: 60 }), level: 'components', currentId: 'observed:read' })
  const service = item(projection.items, 'observed:service')!
  assert.equal(service.note, undefined)
  for (const id of ['observed:read', 'observed:write']) {
    const card = item(projection.items, id)!
    const group = projection.items.find(candidate => candidate.key === card.parent)!
    assert.equal(group.kind, 'group')
    assert.ok(encloses(service.worldBounds, group.worldBounds) && encloses(group.worldBounds, card.worldBounds))
  }
  assert.ok(item(projection.items, 'observed:store')!.note !== undefined, 'the other container stays collapsed')
  assert.equal(item(projection.items, 'observed:rows'), undefined)
})

test.concurrent('a container too large for the map opens only the selected component group', () => {
  const model = groupedWorld()
  const small = projectWorld(model, { viewport: { x: 0, y: 0, width: 20, height: 8 }, level: 'components', currentId: 'observed:write' })
  assert.ok(item(small.items, 'observed:write'))
  assert.equal(item(small.items, 'observed:read'), undefined)
  const collapsed = small.items.find(candidate => candidate.members?.includes('observed:read'))!
  assert.equal(collapsed.kind, 'group')
  assert.equal(projectFlowStep(model, small, 'write-request', 0)?.source.visibleKey, 'observed:write')
  const large = projectWorld(model, { viewport: mapViewportOf({ width: 200, height: 60 }), level: 'components', currentId: 'observed:write' })
  assert.ok(item(large.items, 'observed:read') && item(large.items, 'observed:write'))
})

test.concurrent('the terminal keeps the sheet order of siblings and gives every box room for its name', () => {
  const model = navigationWorld()
  const projection = projectWorld(model, { viewport: mapViewportOf({ width: 200, height: 60 }), level: 'components', currentId: 'observed:pleft' })
  const sheet = new Map([...model.sheet.slabs, ...model.sheet.buildings].map(shape => [shape.representationId, shape.rect]))
  const drawn = projection.items.filter(candidate => candidate.representationId !== undefined && sheet.has(candidate.representationId))
  for (const a of drawn) {
    for (const b of drawn) {
      const before = sheet.get(a.representationId!)!
      const after = sheet.get(b.representationId!)!
      if (a.parent === b.parent && before.gx + before.w <= after.gx && before.gy < after.gy + after.d && after.gy < before.gy + before.d) {
        assert.ok(right(a.worldBounds) <= b.worldBounds.x, `${a.title} stays west of ${b.title}`)
      }
    }
  }
  for (const card of projection.items.filter(candidate => candidate.shape === 'card')) {
    assert.ok(card.worldBounds.width >= Math.max(...card.lines.map(line => line.length)) + 4)
    assert.ok(card.worldBounds.height >= card.lines.length + 2)
  }
  const pleft = item(projection.items, 'observed:pleft')!
  assert.ok(encloses(item(projection.items, 'observed:cleft')!.worldBounds, pleft.worldBounds))
})

test.concurrent('component follow stays within the displayed world', () => {
  const model = groupedWorld()
  const viewport = { x: 0, y: 0, width: 24, height: 10 }
  for (const currentId of ['observed:read', 'observed:write']) {
    const projection = projectWorld(model, { viewport, level: 'components', currentId })
    const selected = item(projection.items, currentId)!
    assert.ok(visibleIn(selected.cellBounds, viewport))
    const world = projection.worldBounds
    if (world.width > viewport.width) {
      assert.ok(projection.camera.x >= world.x && projection.camera.x + viewport.width <= world.x + world.width)
    }
    if (world.height > viewport.height) {
      assert.ok(projection.camera.y >= world.y && projection.camera.y + viewport.height <= world.y + world.height)
    }
  }
})

test.concurrent('selection moves the camera but never the shapes of one depth', () => {
  const model = navigationWorld()
  const viewport = { x: 0, y: 0, width: 40, height: 12 }
  const before = structuredClone(model.sheet)
  const start = projectWorld(model, { viewport, currentId: 'observed:cleft' })
  const moved = projectWorld(model, { viewport, currentId: 'observed:ext', camera: start.camera })
  assert.notDeepEqual(moved.camera, start.camera)
  assert.deepEqual(model.sheet, before)
  assert.deepEqual(moved.items.map(candidate => [candidate.key, candidate.worldBounds]), start.items.map(candidate => [candidate.key, candidate.worldBounds]))
  assert.deepEqual(moved.relationships.map(route => route.worldRoute), start.relationships.map(route => route.worldRoute))
})

test.concurrent('flow steps mark the drawn endpoint: the collapsed container at root, the exact component inside', () => {
  const model = groupedWorld()
  const root = projectWorld(model, { viewport: mapViewportOf({ width: 200, height: 60 }) })
  const step = projectFlowStep(model, root, 'write-request', 0)
  assert.equal(step?.source.visibleKey, 'observed:service')
  assert.equal(step?.target.visibleKey, 'observed:vendor')
  const inside = projectWorld(model, { viewport: mapViewportOf({ width: 200, height: 60 }), level: 'components', currentId: 'observed:write' })
  assert.equal(projectFlowStep(model, inside, 'write-request', 0)?.source.visibleKey, 'observed:write')
})

test.concurrent('flow attention reveals its endpoint without changing architecture selection', () => {
  const model = groupedWorld()
  const viewport = { x: 0, y: 0, width: 30, height: 12 }
  const followed = projectWorld(model, { viewport, currentId: 'observed:person', attentionIds: ['observed:vendor'] })
  assert.equal(followed.currentId, 'observed:person')
  assert.ok(visibleIn(item(followed.items, 'observed:vendor')!.cellBounds, viewport))
})

test.concurrent('task attention frames every visible touched element together', () => {
  const model = navigationWorld()
  const viewport = mapViewportOf({ width: 200, height: 60 })
  const followed = projectWorld(model, { viewport, currentId: 'observed:cleft', attentionIds: ['observed:cleft', 'observed:cright'] })
  const touched = followed.items.filter(candidate => candidate.representationId === 'observed:cleft' || candidate.representationId === 'observed:cright')
  assert.equal(followed.currentId, 'observed:cleft')
  assert.equal(touched.length, 2)
  assert.equal(touched.every(candidate => visibleIn(candidate.cellBounds, viewport)), true)
})

test.concurrent('a root that fits stays centred across selection and viewport height changes', () => {
  const model = groupedWorld()
  for (const height of [60, 80, 70]) {
    const viewport = mapViewportOf({ width: 300, height })
    for (const currentId of ['observed:service', 'observed:person', 'observed:vendor']) {
      const projection = projectWorld(model, { viewport, currentId })
      const top = Math.min(...projection.items.map(candidate => candidate.cellBounds.y))
      const bottom = Math.max(...projection.items.map(candidate => candidate.cellBounds.y + candidate.cellBounds.height))
      assert.ok(Math.abs((top - viewport.y) - (viewport.y + viewport.height - bottom)) <= 2)
    }
  }
})
