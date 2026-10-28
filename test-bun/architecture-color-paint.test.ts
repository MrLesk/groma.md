import assert from 'node:assert/strict'
import { test } from 'bun:test'
import { palettes } from '../src/viewers/web/atoms/theme.ts'
import { appearancePaint, contrastRatio } from '../src/viewers/web/iso/painting/appearance.ts'

test.concurrent('authored icon and boundary accents remain readable on every themed surface', () => {
  assert.equal(contrastRatio('#000000', '#ffffff'), 21)
  assert.equal(contrastRatio('#456789', '#456789'), 1)
  const colors = ['#ffffff', '#000000', '#efff00', '#22262e', '#00ffff', '#ff00ff', '#3c75be']
  for (const palette of Object.values(palettes)) {
    for (const color of colors) {
      for (const depth of [-0.5, 1, 2]) {
        const paint = appearancePaint(color, depth, palette)
        for (const surface of [palette.paper, paint.top, paint.right, paint.left]) {
          assert.ok(contrastRatio(paint.accent, surface) >= 3, `${color} must remain visible on ${surface}`)
        }
      }
    }
  }
})
