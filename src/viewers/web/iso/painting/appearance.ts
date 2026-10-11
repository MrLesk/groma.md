import { accentColour } from '../../../../element-appearance.ts'
import type { SheetItem } from '../../../../sheet/types.ts'
import type { ResolvedIcon } from '../../../../types.ts'
import type { ProjectedScene } from '../projection/project.ts'
import { node, type SvgNode } from './svg.ts'

/**
 * Gives an element's group its authored accent. The group only carries the colour, as `color`; the accent rules in
 * style.ts paint the element's own faces, ground and title from it. Those rules follow the rest colours and precede
 * the draft, selection and comparison rules, so every state still wins, in the browser and in covers alike.
 */
export function withAccent(group: SvgNode, item: Pick<SheetItem, 'colour'>): SvgNode {
  const colour = accentColour(item.colour)
  if (colour === undefined) return group
  return { ...group, attributes: { ...group.attributes, color: colour, class: `${group.attributes.class} accented` } }
}

/** The distinct accents among a scene's elements; a cover's stylesheet needs a rule for each. */
export function sceneAccents(scene: ProjectedScene): string[] {
  const items = [
    ...scene.islands.map(item => item.island.element),
    ...scene.slabs.map(item => item.slab),
    ...scene.buildings.map(item => item.building),
  ]
  return [...new Set(items.flatMap(item => accentColour(item?.colour) ?? []))]
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
