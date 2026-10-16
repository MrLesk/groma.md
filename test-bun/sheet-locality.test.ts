import assert from 'node:assert/strict'
import { test } from 'bun:test'

import { placeWorld } from '../src/sheet/place.ts'
import type { ArchitectureGraph } from '../src/types.ts'
import { box, uses } from './helpers.ts'

const unit = { x: 0, y: 0, width: 1, height: 1 }
const helpers = ['helper-a', 'helper-b', 'helper-c']

function localWorld(): ArchitectureGraph {
  return {
    flows: [],
    elements: [
      box('person', 'actor', unit),
      box('system', 'system', unit),
      box('host', 'container', unit, { parent: 'observed:system' }),
      ...helpers.map(id => box(id, 'container', unit, { parent: 'observed:system' })),
      ...helpers.map(id => box(`${id}-entry`, 'component', unit, { parent: `observed:${id}` })),
      ...['a', 'b', 'c', 'd'].flatMap(region => Array.from({ length: 9 }, (_, index) =>
        box(`${region}${index}`, 'component', unit, { parent: 'observed:host', group: region }))),
    ],
    relationships: [
      uses('entry', 'person', 'a0'),
      ...helpers.map((id, index) => uses(id, `b${index}`, `${id}-entry`)),
    ],
  }
}

test.concurrent('separate helpers serving one local region remain beside that region', () => {
  const world = localWorld()
  const original = structuredClone(world)
  const placement = placeWorld(world)
  const region = placement.zones.find(zone => zone.name === 'b')!.rect
  const helperRects = helpers.map(id => placement.slabs.find(slab => slab.id === id)!.rect)
  for (const rect of helperRects) {
    const distance = Math.hypot(
      Math.max(0, region.gx - rect.gx - rect.w, rect.gx - region.gx - region.w),
      Math.max(0, region.gy - rect.gy - rect.d, rect.gy - region.gy - region.d),
    )
    assert.ok(distance < Math.max(region.w, region.d) + Math.max(rect.w, rect.d),
      'a helper was placed far from the region it serves')
  }
  assert.deepEqual(world, original)
  assert.deepEqual(placeWorld(world), placement)
})
