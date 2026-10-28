import assert from 'node:assert/strict'

import { test } from 'bun:test'

import type { Camera } from '../src/viewers/web/iso/camera/camera.ts'
import { createCameraLayer } from '../src/viewers/web/iso/camera/layer.ts'

// The layer asks the page for a div and animation frames. These stubs stay in this file because the repository check
// runs bun test --parallel, which gives each test file its own globals; a plain bun test run would share them.
Object.assign(globalThis, {
  document: { createElement: () => ({ style: {}, offsetWidth: 0 }) },
  requestAnimationFrame: (frame: FrameRequestCallback) => setTimeout(() => frame(performance.now()), 16),
})

const view = (k: number, x = 0) => ({ camera: { k, x, y: 0 }, zoomRatio: k })

/** A layer showing a map drawn at scale 1; it records every camera it draws from then on. */
function drawnLayer(userAgent?: string) {
  const drawn: Camera[] = []
  let settle = (): void => {}
  const layer = createCameraLayer({ drawCamera: ({ camera }) => { drawn.push(camera) }, moveStarted() {}, settled: () => settle() }, userAgent)
  layer.move(view(1))
  drawn.length = 0
  /** Resolves when the map next settles. */
  const settled = () => new Promise<void>(resolve => { settle = resolve })
  return { layer, drawn, settled }
}

test.concurrent('a pan moves the cached picture without drawing', async () => {
  const { layer, drawn, settled } = drawnLayer()
  layer.move(view(1, 10))
  layer.move(view(1, 20))
  await settled()
  assert.equal(drawn.length, 0)
})

test.concurrent('a zoom-in draws its scale once the map settles', async () => {
  const { layer, drawn, settled } = drawnLayer()
  layer.move(view(1.5))
  layer.move(view(2))
  assert.equal(drawn.length, 0)
  await settled()
  assert.deepEqual(drawn.map(camera => camera.k), [2])
})

test.concurrent('a zoom-out navigation draws its destination once, before it moves', async () => {
  const { layer, drawn, settled } = drawnLayer()
  layer.approach(view(0.5))
  assert.deepEqual(drawn.map(camera => camera.k), [0.5])
  layer.move(view(0.8))
  layer.move(view(0.5))
  await settled()
  assert.deepEqual(drawn.map(camera => camera.k), [0.5])
})

test.concurrent('the move after a repaint draws the camera at once', async () => {
  const { layer, drawn, settled } = drawnLayer()
  layer.invalidate()
  layer.move(view(1, 10))
  assert.deepEqual(drawn.map(camera => camera.x), [10])
  await settled()
  assert.deepEqual(drawn.map(camera => camera.x), [10])
})

// Full tokens matter: Chromium also advertises AppleWebKit and Safari, while Chrome on iOS uses WebKit.
const browsers = [
  { name: 'Chrome', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36', promotion: 'auto' },
  { name: 'Edge', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', promotion: 'auto' },
  { name: 'Safari', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Safari/605.1.15', promotion: 'transform' },
  { name: 'Chrome on iOS', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 27_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/155.0.0.0 Mobile/15E148 Safari/604.1', promotion: 'transform' },
]

for (const { name, userAgent, promotion } of browsers) {
  test.concurrent(`${name} keeps its camera cache policy across pan and zoom`, async () => {
    const { layer, settled } = drawnLayer(userAgent)
    assert.equal(layer.element.style.willChange, promotion)
    const changes: string[] = []
    let current = promotion
    Object.defineProperty(layer.element.style, 'willChange', {
      get: () => current,
      set: (value: string) => { changes.push(value); current = value },
    })
    layer.move(view(1, 20))
    assert.equal(layer.element.style.willChange, promotion)
    await settled()
    assert.equal(layer.element.style.willChange, promotion)
    assert.deepEqual(changes, [])

    layer.move(view(4, 20))
    await settled()
    // A zoom rebuild is scheduled one frame after settling.
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
    assert.equal(layer.element.style.willChange, promotion)
    assert.deepEqual(changes, promotion === 'transform' ? ['auto', 'transform'] : [])
    changes.length = 0

    layer.move(view(4, 40))
    assert.equal(layer.element.style.willChange, promotion)
    await settled()
    assert.equal(layer.element.style.willChange, promotion)
    assert.deepEqual(changes, [])
  })
}
