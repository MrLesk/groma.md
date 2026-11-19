import type { IconName } from '../../../icons.ts'
import { flatSvg } from '../iso/painting/icons.ts'
import { patch, svg } from '../iso/painting/svg.ts'

/** The side of the square an icon is drawn flat in, in drawing units; the element scales it to its size. */
const SIDE = 24

/**
 * In a pane an icon is drawn in the colour of the text around it, in outlines only: its small marks would be
 * noise at this size, so only the accent's marks stay.
 */
export const glyphCss = `
  .glyph { flex: none; overflow: visible; }
  .glyph .icon-part { fill: none; stroke: currentColor; stroke-width: 1.2px; stroke-linecap: round; stroke-linejoin: round; }
  .glyph .icon-solid { fill: currentColor; }
  .glyph .icon-detail { display: none; }
`

/** An icon as an inline drawing `size` pixels wide: the same object the map shows, drawn flat. */
export function glyphElement(name: IconName, size: number): SVGSVGElement {
  const element = svg('svg', { viewBox: `0 0 ${SIDE} ${SIDE}`, width: size, height: size, 'aria-hidden': 'true' }, 'glyph')
  patch(element, flatSvg(name, SIDE))
  return element
}
