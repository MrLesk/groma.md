import assert from 'node:assert/strict'
import { test } from 'bun:test'

import { projectWorld, type ProjectedMapRoute, type TerminalProjection } from '../src/viewers/tui/projection.ts'
import { terminalRoutes } from '../src/viewers/tui/projection-routes.ts'
import { placeSheet } from '../src/viewers/tui/projection-sheet.ts'
import type { Bounds, Point } from '../src/types.ts'
import { box, largeWorldFixtureRoot, mapViewportOf, openclawFixtureRoot, terminalModel, uses, worldOf } from './helpers.ts'

const CELL = { x: 0, y: 0, width: 1, height: 1 }

function twoSystems() {
  return worldOf([
    box('system', 'system', CELL, { children: ['observed:left', 'observed:other'] }),
    box('left', 'container', CELL, { parent: 'observed:system', children: ['observed:a', 'observed:d'] }),
    box('other', 'container', CELL, { parent: 'observed:system', children: ['observed:c'] }),
    box('far', 'system', CELL, { children: ['observed:right'] }),
    box('right', 'container', CELL, { parent: 'observed:far', children: ['observed:b'] }),
    box('a', 'component', CELL, { parent: 'observed:left' }),
    box('d', 'component', CELL, { parent: 'observed:left' }),
    box('b', 'component', CELL, { parent: 'observed:right' }),
    box('c', 'component', CELL, { parent: 'observed:other' }),
  ], [uses('a-uses-b', 'a', 'b'), uses('d-uses-b', 'd', 'b'), uses('a-uses-c', 'a', 'c'), uses('c-uses-d', 'c', 'd'), uses('a-uses-d', 'a', 'd')])
}

function onFrame(point: Point, bounds: Bounds): boolean {
  const right = bounds.x + bounds.width - 1
  const bottom = bounds.y + bounds.height - 1
  const side = (point.x === bounds.x || point.x === right) && point.y > bounds.y && point.y < bottom
  const edge = (point.y === bounds.y || point.y === bottom) && point.x > bounds.x && point.x < right
  return side || edge
}

function assertDrawable(route: ProjectedMapRoute, projection: TerminalProjection): void {
  for (let index = 1; index < route.worldRoute.length; index += 1) {
    const previous = route.worldRoute[index - 1]!
    const point = route.worldRoute[index]!
    assert.ok(previous.x === point.x || previous.y === point.y, 'every run is orthogonal')
  }
  const bounds = (key: string) => projection.items.find(item => item.key === key)!.worldBounds
  assert.ok(onFrame(route.worldRoute[0]!, bounds(route.source)), 'the route leaves its source frame away from the corners')
  assert.ok(onFrame(route.worldRoute.at(-1)!, bounds(route.target)), 'the route meets its target frame away from the corners')
}

test.concurrent('root routes join the drawn containers, one route carrying every relationship between them', () => {
  const model = twoSystems()
  const projection = projectWorld(model, { viewport: mapViewportOf({ width: 200, height: 60 }) })
  const pairs = projection.relationships.map(route => [route.source, route.target, [...route.ids].sort()])
  assert.deepEqual(pairs.sort(), [
    ['observed:left', 'observed:other', ['a-uses-c', 'c-uses-d']],
    ['observed:left', 'observed:right', ['a-uses-b', 'd-uses-b']],
  ].sort())
  assert.equal(projection.relationships.find(route => route.target === 'observed:other')?.twoWay, true)
  assert.equal(projection.relationships.find(route => route.target === 'observed:right')?.twoWay, false)
  for (const route of projection.relationships) assertDrawable(route, projection)
})

test.concurrent('an open container routes its components exactly and its relationships outward to collapsed peers', () => {
  const model = twoSystems()
  const projection = projectWorld(model, { viewport: mapViewportOf({ width: 200, height: 60 }), level: 'components', currentId: 'observed:a' })
  const pairs = projection.relationships.map(route => `${route.source} ${route.target}`).sort()
  assert.deepEqual(pairs, [
    'observed:a observed:d',
    'observed:a observed:other',
    'observed:a observed:right',
    'observed:d observed:right',
    'observed:other observed:d',
  ])
  for (const route of projection.relationships) assertDrawable(route, projection)
})

test.concurrent('projecting a depth leaves the shared sheet untouched', () => {
  const model = twoSystems()
  const original = structuredClone(model.sheet)
  projectWorld(model, { viewport: mapViewportOf({ width: 120, height: 36 }), level: 'components', currentId: 'observed:d' })
  assert.deepEqual(model.sheet, original)
})

test.concurrent('at every depth of real fixtures, routes end on their frames and never pass through a box', async () => {
  for (const root of [openclawFixtureRoot, largeWorldFixtureRoot]) {
    const model = await terminalModel(root)
    const depths = [undefined, ...model.sheet.slabs.flatMap(slab => [
      { container: slab.representationId, open: 'all' },
      ...model.sheet.zones.filter(zone => zone.parent === slab.representationId).map(zone => ({ container: slab.representationId, open: zone.key })),
    ])]
    for (const depth of depths) {
      const items = placeSheet(model, depth)
      const bounds = new Map(items.map(item => [item.key, item.worldBounds]))
      const boxes = items.filter(item => item.shape === 'card' || item.collapsed).map(item => item.worldBounds)
      for (const route of terminalRoutes(model, items)) {
        const where = `${route.source} -> ${route.target} at ${depth?.container ?? 'root'}`
        assert.ok(onFrame(route.cells[0]!, bounds.get(route.source)!) && onFrame(route.cells.at(-1)!, bounds.get(route.target)!), where)
        for (const cell of cellsOf(route.cells)) {
          assert.ok(!boxes.some(box => cell.x > box.x && cell.x < box.x + box.width - 1 && cell.y > box.y && cell.y < box.y + box.height - 1), where)
        }
      }
    }
  }
})

function cellsOf(points: readonly Point[]): Point[] {
  return points.slice(1).flatMap((point, index) => {
    const from = points[index]!
    const length = Math.abs(point.x - from.x) + Math.abs(point.y - from.y)
    return Array.from({ length: length + 1 }, (_, step) => ({
      x: from.x + Math.sign(point.x - from.x) * step,
      y: from.y + Math.sign(point.y - from.y) * step,
    }))
  })
}
