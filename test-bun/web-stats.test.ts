import assert from 'node:assert/strict'
import { test } from 'bun:test'

import { accentColours } from '../src/element-appearance.ts'
import { colourCounts } from '../src/viewers/web/chrome/colour-legend.ts'
import { c4Counts } from '../src/viewers/web/chrome/stats.ts'
import { box, worldOf } from './helpers.ts'

test.concurrent('header counts separate internal C4 levels from actors and external systems', () => {
  const bounds = { x: 0, y: 0, width: 1, height: 1 }
  const world = worldOf([
    box('person', 'actor', bounds),
    box('outside', 'system', bounds, { external: true }),
    box('inside', 'system', bounds),
    box('service', 'container', bounds, { parent: 'observed:inside' }),
    box('worker', 'component', bounds, { parent: 'observed:service' }),
    box('planned', 'component', bounds, { parent: 'observed:service', origin: 'draft' }),
  ])
  const before = structuredClone(world)

  assert.deepEqual(c4Counts(world), { system: 1, container: 1, component: 2 })
  assert.deepEqual(c4Counts(worldOf([])), { system: 0, container: 0, component: 0 })
  assert.deepEqual(world, before)
})

test.concurrent('the colour legend counts a colour once, whether elements name it or spell its hex', () => {
  const grey = accentColours.grey!
  const counts = colourCounts([
    { colour: 'grey' }, { colour: grey }, { colour: grey.toUpperCase() }, { colour: 'blue' }, { colour: '#123456' }, {},
  ])

  assert.deepEqual(counts.map(({ label, count }) => [label, count]), [['#123456', 1], ['blue', 1], ['grey', 3]])
  assert.deepEqual(colourCounts([{}]), [])
})
