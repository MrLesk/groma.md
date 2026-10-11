import assert from 'node:assert/strict'
import { cp, mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { test } from 'bun:test'
import { EMPTY_WORK_SNAPSHOT, type WorkSource } from '@groma/work-source'
import { Resvg } from '@resvg/resvg-wasm'
import { accentColour, accentColours } from '../src/element-appearance.ts'
import { loadProjectProfile, saveProjectProfile } from '../src/project-profile.ts'
import { mixColour, palettes } from '../src/viewers/web/atoms/theme.ts'
import { exportWebViewer } from '../src/viewers/web/export.ts'
import { startWebViewer } from '../src/viewers/web/server.ts'
import { ACCENT_TINT, ACCENT_TITLE } from '../src/viewers/web/iso/painting/scale.ts'
import { COVER_SIZE } from '../src/viewers/web/sharing/cover.ts'
import { generateCovers } from '../src/viewers/web/sharing/images.ts'
import { sharingMetadata } from '../src/viewers/web/sharing/metadata.ts'
import { box, worldOf } from './helpers.ts'

const fixture = path.resolve(import.meta.dir, '../test/fixtures/empty-project')
const mappedFixture = path.resolve(import.meta.dir, '../test/fixtures/source-view')

function emptyWork(): WorkSource {
  return {
    async read() { return EMPTY_WORK_SNAPSHOT },
    async readItem() { throw new Error('No work items') },
    watch() { return { close() {} } },
  }
}

async function headMetadata(html: string): Promise<Map<string, string>> {
  const fields = new Map<string, string>()
  await new HTMLRewriter().on('head meta[property]', { element(element) {
    fields.set(element.getAttribute('property')!, element.getAttribute('content')!)
  } }).transform(new Response(html)).text()
  return fields
}

function assertCover(bytes: Buffer): void {
  assert.deepEqual(bytes.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  assert.equal(bytes.readUInt32BE(16), 1200)
  assert.equal(bytes.readUInt32BE(20), 630)
}

test.concurrent('export writes the themed image referenced by its initial sharing metadata', async () => {
  const output = await mkdtemp(path.join(os.tmpdir(), 'groma-sharing-export-'))
  try {
    const exported = await exportWebViewer(mappedFixture, output, {
      url: 'https://example.test/repository/architecture/blueprint',
    })
    await exported.close()
    const fields = await headMetadata(await readFile(path.join(output, 'index.html'), 'utf8'))
    assert.equal(fields.get('og:url'), 'https://example.test/repository/architecture/blueprint/')
    assert.equal(fields.get('og:image'), 'https://example.test/repository/architecture/blueprint/cover-blueprint.png')
    assert.equal(fields.get('og:type'), 'website')
    assert.equal(fields.get('og:image:type'), 'image/png')
    assert.equal(fields.get('og:image:width'), '1200')
    assert.equal(fields.get('og:image:height'), '630')
    assert.ok(fields.get('og:image:alt'))
    assert.equal(fields.has('og:description'), false)
    for (const theme of ['light', 'dark', 'blueprint']) {
      assertCover(await readFile(path.join(output, `cover-${theme}.png`)))
    }
  } finally {
    await rm(output, { recursive: true, force: true })
  }
})

test.concurrent('live initial metadata uses the project profile and links to a theme-matched PNG', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'groma-sharing-live-'))
  let viewer: Awaited<ReturnType<typeof startWebViewer>> | undefined
  try {
    await cp(fixture, root, { recursive: true })
    const project = await loadProjectProfile(root)
    await saveProjectProfile(root, { ...project!, title: 'Shared project', description: 'Tracks submitted requests.' })
    viewer = await startWebViewer(root, { port: 0, workSource: emptyWork() })
    for (const theme of ['light', 'dark', 'blueprint']) {
      const url: string = `${viewer.url}/?theme=${theme}`
      const fields = await headMetadata(await (await fetch(url)).text())
      assert.equal(fields.get('og:title'), 'Shared project')
      assert.equal(fields.get('og:description'), 'Tracks submitted requests.')
      assert.equal(fields.get('og:url'), url)
      assert.equal(fields.get('og:image'), `${viewer.url}/cover-${theme}.png`)
      const image = await fetch(fields.get('og:image')!)
      assert.equal(image.headers.get('content-type'), 'image/png')
      assertCover(Buffer.from(await image.arrayBuffer()))
    }
  } finally {
    await viewer?.close()
    await rm(root, { recursive: true, force: true })
  }
})

test.concurrent('Auto shares a light cover without inventing an unauthored project description', async () => {
  const project = await loadProjectProfile(fixture)
  const fields = await headMetadata(`<html><head>${sharingMetadata(project!, new URL('https://example.test/architecture/auto/'))}</head></html>`)
  assert.equal(fields.get('og:image'), 'https://example.test/architecture/auto/cover-light.png')
  assert.equal(fields.has('og:description'), false)
})

/** How many pixels of a cover have exactly this #rrggbb colour. resvg, which generateCovers has loaded, decodes the PNG it wrote. */
function pixelsOf(cover: Uint8Array, colour: string): number {
  const { width, height } = COVER_SIZE
  const renderer = new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`
    + `<image width="${width}" height="${height}" href="data:image/png;base64,${Buffer.from(cover).toString('base64')}"/></svg>`)
  const image = renderer.render()
  try {
    const [red, green, blue] = [1, 3, 5].map(start => parseInt(colour.slice(start, start + 2), 16))
    const pixels = image.pixels
    let count = 0
    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index] === red && pixels[index + 1] === green && pixels[index + 2] === blue) count += 1
    }
    return count
  } finally {
    image.free()
    renderer.free()
  }
}

test.concurrent('a cover paints every surface in its rest colour and an accented one in its accent mixed into the theme paper', async () => {
  const unit = { x: 0, y: 0, width: 1, height: 1 }
  const world = worldOf([
    box('shop', 'system', unit),
    { ...box('api', 'container', unit, { parent: 'observed:shop' }), colour: 'blue' },
    box('web', 'container', unit, { parent: 'observed:shop' }),
  ])
  const covers = await generateCovers({ sheet: world.sheet, project: null })
  for (const theme of ['light', 'dark'] as const) {
    // The cover renderer drops a style rule it cannot read, and a surface left without its fill is drawn black.
    assert.equal(pixelsOf(covers[theme], '#000000'), 0)
    assert.ok(pixelsOf(covers[theme], mixColour(palettes[theme].paper, accentColour('blue')!, ACCENT_TINT)) > 0)
  }
})

/** WCAG relative luminance of a #rrggbb colour. */
function luminance(colour: string): number {
  const [red, green, blue] = [1, 3, 5].map(start => {
    const channel = parseInt(colour.slice(start, start + 2), 16) / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * red! + 0.7152 * green! + 0.0722 * blue!
}

test.concurrent('the title of every named accent reads on its own surface in every theme', () => {
  for (const [theme, palette] of Object.entries(palettes)) {
    for (const [name, accent] of Object.entries(accentColours)) {
      const title = luminance(mixColour(accent, palette.ink, ACCENT_TITLE))
      const surface = luminance(mixColour(palette.paper, accent, ACCENT_TINT))
      const contrast = (Math.max(title, surface) + 0.05) / (Math.min(title, surface) + 0.05)
      assert.ok(contrast >= 4.5, `${name} in ${theme} has contrast ${contrast.toFixed(2)}`)
    }
  }
})
