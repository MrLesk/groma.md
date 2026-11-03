import { ARCHITECTURE_ICON_VIEWBOX, architectureIcon } from '../../../../architecture-icons.ts'
import { mark, node, type SvgNode } from './svg.ts'

/** Embedded artwork shares its title's plane and scales as a glyph, including its strokes. */
export function architectureIconSvg(id: string | undefined, x: number, y: number, size: number): SvgNode[] {
  const icon = architectureIcon(id)
  if (icon === undefined) return []
  return [node('g', {
    'data-icon': icon.id,
    'aria-hidden': 'true',
    transform: `translate(${x} ${y}) scale(${size / ARCHITECTURE_ICON_VIEWBOX})`,
  }, 'architecture-icon', icon.paths.map(path => mark('path', { d: path.d, class: `icon-${path.tone}` })))]
}
