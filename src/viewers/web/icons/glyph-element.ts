import type { IconName } from '../../../icons.ts'
import { iconStroke } from '../iso/painting/icon-camera.ts'
import { fromAboveSvg } from '../iso/painting/icons.ts'
import { iconCss } from '../iso/painting/style.ts'
import { patch, svg } from '../iso/painting/svg.ts'

/** In a pane an icon is the drawing the 2D view shows, with the map's own icon look. */
export const glyphCss = `
  .glyph { flex: none; overflow: visible; }
  ${iconCss('.glyph')}
`

/**
 * An icon as an inline drawing `size` pixels wide: the object seen from straight above, exactly as the 2D view
 * draws it, with the line width an icon of that size gets on the map.
 */
export function glyphElement(name: IconName, size: number): SVGSVGElement {
  const look = { viewBox: `0 0 ${size} ${size}`, width: size, height: size, 'aria-hidden': 'true', style: `--icon-stroke: ${iconStroke(size)}px` }
  const element = svg('svg', look, 'glyph')
  patch(element, fromAboveSvg(name, size))
  return element
}
