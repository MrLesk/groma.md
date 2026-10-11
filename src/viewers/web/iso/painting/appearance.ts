import { accentColour, accentTint } from '../../../../element-appearance.ts'
import type { SheetItem } from '../../../../sheet/types.ts'
import type { ResolvedIcon } from '../../../../types.ts'
import { node, type SvgNode } from './svg.ts'

/** Presentation attributes supply rest colours; state CSS still owns interaction and lifecycle. */
export function paintAppearance(nodes: readonly SvgNode[], item: Pick<SheetItem, 'colour'>): SvgNode[] {
  const colour = accentColour(item.colour)
  if (!colour) return [...nodes]
  return nodes.map(child => {
    // Nested architecture elements and zones keep their own presentation.
    if (child.attributes['data-id'] || child.attributes.class === 'zone') return child
    const classes = child.attributes.class?.split(' ') ?? []
    const appearance: Record<string, string> | undefined = classes.includes('text') ? { fill: colour }
      : classes.includes('face') || classes.includes('ground') ? { stroke: colour, fill: accentTint(colour) } : undefined
    return { ...child,
      attributes: appearance ? { ...child.attributes, ...appearance, class: `${child.attributes.class} accented` } : child.attributes,
      children: typeof child.children === 'string' ? child.children : paintAppearance(child.children, item),
    }
  })
}

/**
 * An element's icon in the square at `x`, `y`. A pack icon is an image. An emoji is text in the reader's own
 * emoji font, centred in the square because that font decides how wide the glyph is.
 */
export function iconNode(icon: ResolvedIcon, x: number, y: number, size: number): SvgNode {
  if (icon.kind === 'image') {
    return node('image', { href: icon.uri, 'xlink:href': icon.uri, x, y, width: size, height: size, 'pointer-events': 'none' }, 'element-icon')
  }
  return node('text', { x: x + size / 2, y: y + size * 0.9, 'font-size': size, 'text-anchor': 'middle' }, 'text emoji-icon', icon.text)
}
