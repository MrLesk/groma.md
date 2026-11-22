import { readFileSync } from 'node:fs'
import { initWasm, Resvg } from '@resvg/resvg-wasm'
import wasm from '@resvg/resvg-wasm/index_bg.wasm' with { type: 'file' }
import { fontBuffers } from '../atoms/fonts/index.ts'
import type { ThemeDefinition } from '../../../themes/definition.ts'
import { renderCover, type CoverPayload } from './cover.ts'

let ready: Promise<void> | undefined

function renderPng(svg: string): Uint8Array<ArrayBuffer> {
  const renderer = new Resvg(svg, { font: {
    fontBuffers,
    defaultFontFamily: 'DejaVu Sans Mono',
    monospaceFamily: 'DejaVu Sans Mono',
    sansSerifFamily: 'DejaVu Sans',
  } })
  try {
    const image = renderer.render()
    try {
      return new Uint8Array(image.asPng())
    } finally {
      image.free()
    }
  } finally {
    renderer.free()
  }
}

/** One theme's cover as a PNG. The embedded renderer and fonts draw live and exported covers entirely in process. */
export async function generateCover(payload: CoverPayload, theme: ThemeDefinition): Promise<Uint8Array<ArrayBuffer>> {
  ready ??= initWasm(readFileSync(wasm))
  await ready
  return renderPng(renderCover(payload, theme))
}
