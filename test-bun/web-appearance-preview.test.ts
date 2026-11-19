import assert from 'node:assert/strict'

import { test } from 'bun:test'

import { sheetScene } from '../src/sheet/scene.ts'
import { withAppearance } from '../src/viewers/web/editing/appearance-preview.ts'
import { box, worldOf } from './helpers.ts'

const unit = { x: 0, y: 0, width: 1, height: 1 }

/** A container with two components; `stock` is saved red. */
function shopSheet() {
  return sheetScene(worldOf([
    box('shop', 'system', unit, { children: ['observed:api'] }),
    box('api', 'container', unit, { parent: 'observed:shop', children: ['observed:cart', 'observed:stock'] }),
    box('cart', 'component', unit, { parent: 'observed:api' }),
    { ...box('stock', 'component', unit, { parent: 'observed:api' }), color: 'red' },
  ]))
}

test.concurrent('a picked color shows on the edited element and leaves the others as saved', () => {
  const shown = withAppearance(shopSheet(), { id: 'cart', color: 'blue' })
  const building = (id: string) => shown.buildings.find(item => item.id === id)!
  assert.equal(building('cart').color, 'blue')
  assert.equal(building('stock').color, 'red')
})

test.concurrent('picking no color shows the element without its saved color', () => {
  const shown = withAppearance(shopSheet(), { id: 'stock', color: '' })
  assert.equal(shown.buildings.find(item => item.id === 'stock')!.color, undefined)
})
