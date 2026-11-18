import assert from 'node:assert/strict'

import { test } from 'bun:test'

import { sheetScene } from '../src/sheet/scene.ts'
import { withAppearance } from '../src/viewers/web/editing/appearance-preview.ts'
import { box, worldOf } from './helpers.ts'

const unit = { x: 0, y: 0, width: 1, height: 1 }

/** A container with two components. Stock carries a saved color and icon. */
function shopSheet() {
  return sheetScene(worldOf([
    box('shop', 'system', unit, { children: ['observed:api'] }),
    box('api', 'container', unit, { parent: 'observed:shop', children: ['observed:cart', 'observed:stock'] }),
    box('cart', 'component', unit, { parent: 'observed:api' }),
    { ...box('stock', 'component', unit, { parent: 'observed:api' }), color: 'red', icon: 'package' },
  ]))
}

test.concurrent('a picked color and icon show on the edited element and leave the others as saved', () => {
  const shown = withAppearance(shopSheet(), { ids: ['observed:cart'], color: 'blue', icon: 'database' })
  const building = (id: string) => shown.buildings.find(item => item.id === id)!
  assert.equal(building('cart').color, 'blue')
  assert.equal(building('cart').icon, 'database')
  assert.equal(building('stock').color, 'red')
  assert.equal(building('stock').icon, 'package')
})

test.concurrent('picking no color shows the element without its saved color', () => {
  const shown = withAppearance(shopSheet(), { ids: ['observed:stock'], color: '', icon: '' })
  assert.equal(shown.buildings.find(item => item.id === 'stock')!.color, undefined)
})

test.concurrent('a color pick reaches both selected elements and keeps their different icons', () => {
  const shown = withAppearance(shopSheet(), { ids: ['observed:cart', 'observed:stock'], color: 'blue' })
  const cart = shown.buildings.find(building => building.id === 'cart')!
  const stock = shown.buildings.find(building => building.id === 'stock')!
  assert.equal(cart.color, 'blue')
  assert.equal(stock.color, 'blue')
  assert.equal(cart.icon, undefined)
  assert.equal(stock.icon, 'package')
})
