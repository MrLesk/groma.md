import type { IconName } from '../../../icons.ts'
import { GLYPH_SIZE, iconGlyphs } from './glyphs.ts'

const NAMESPACE = 'http://www.w3.org/2000/svg'

export const glyphCss = `
  .glyph { flex: none; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
`

/** An icon's flat glyph as an inline drawing `size` pixels wide, in the colour of the text around it. */
export function glyphElement(name: IconName, size: number): SVGSVGElement {
  const svg = document.createElementNS(NAMESPACE, 'svg')
  svg.setAttribute('class', 'glyph')
  svg.setAttribute('viewBox', `0 0 ${GLYPH_SIZE} ${GLYPH_SIZE}`)
  svg.setAttribute('width', String(size))
  svg.setAttribute('height', String(size))
  svg.setAttribute('aria-hidden', 'true')
  const path = document.createElementNS(NAMESPACE, 'path')
  path.setAttribute('d', iconGlyphs[name])
  svg.append(path)
  return svg
}
