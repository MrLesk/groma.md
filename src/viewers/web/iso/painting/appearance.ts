import { accentColour, accentTint } from '../../../../element-appearance.ts'
import type { SheetItem } from '../../../../sheet/types.ts'
import { node, type SvgNode } from './svg.ts'

/** Explicit colours also work in static SVG, which has no CSS variables. */
export function paintAppearance(nodes: readonly SvgNode[], item: Pick<SheetItem, 'colour'>): SvgNode[] {
  const colour = accentColour(item.colour)
  if (!colour) return [...nodes]
  return nodes.map(child => {
    // Nested architecture elements and zones keep their own presentation.
    if (child.attributes['data-id'] || child.attributes.class === 'zone') return child
    const classes = child.attributes.class?.split(' ') ?? []
    const style = classes.includes('text') ? `fill:${colour}`
      : classes.includes('face') || classes.includes('ground') ? `stroke:${colour};fill:${accentTint(colour)}` : undefined
    return { ...child,
      attributes: style ? { ...child.attributes, style } : child.attributes,
      children: typeof child.children === 'string' ? child.children : paintAppearance(child.children, item),
    }
  })
}

export function iconImage(uri: string, x: number, y: number, size: number): SvgNode {
  return node('image', { href: uri, 'xlink:href': uri, x, y, width: size, height: size, 'pointer-events': 'none' }, 'element-icon')
}
