import assert from 'node:assert/strict'
import { test } from 'bun:test'


import { initialState, reduceViewer } from '../src/viewers/tui/navigation.ts'
import { projectWorld } from '../src/viewers/tui/projection.ts'
import { encloses } from '../src/viewers/tui/projection-camera.ts'
import { containersFixtureRoot, terminalModel } from './helpers.ts'

const VIEWPORT = { x: 0, y: 0, width: 60, height: 29 }

test.concurrent('the open container and its group enclose a visible selected component', async () => {
  const model = await terminalModel(containersFixtureRoot)
  const projection = projectWorld(model, { viewport: VIEWPORT, level: 'components', currentId: 'page' })
  const slab = projection.items.find(item => item.representationId === 'web')!
  const card = projection.items.find(item => item.representationId === 'page')!
  const zone = projection.items.find(item => item.kind === 'group' && encloses(item.worldBounds, card.worldBounds))!
  assert.ok(encloses(VIEWPORT, card.cellBounds))
  assert.ok(encloses(slab.worldBounds, zone.worldBounds) && encloses(zone.worldBounds, card.worldBounds))
  assert.ok(projection.items.find(item => item.representationId === 'api')?.note !== undefined, 'the neighbouring container stays collapsed')
})

test.concurrent('past the last component that way the arrows open the neighbouring container', async () => {
  const model = await terminalModel(containersFixtureRoot)
  const root = projectWorld(model, { viewport: VIEWPORT })
  const x = (id: string) => root.items.find(item => item.representationId === id)!.worldBounds.x
  const towardsApi = x('api') > x('web') ? 'right' : 'left'
  const state = {
    ...initialState(model),
    level: 'components' as const,
    currentId: 'page',
  }
  const crossed = reduceViewer(model, state, towardsApi)
  assert.deepEqual(
    { level: crossed.level, currentId: crossed.currentId },
    { level: 'components', currentId: 'orders' },
  )
  const back = reduceViewer(model, crossed, towardsApi === 'right' ? 'left' : 'right')
  assert.equal(back.currentId, 'page')
})
