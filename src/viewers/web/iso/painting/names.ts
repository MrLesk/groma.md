import type { IconName } from '../../../../icons.ts'
import { roofIconSlot } from '../../../../sheet/measure.ts'
import type { ProjectionView, SurfaceLabel, SurfaceText } from '../projection/project.ts'
import type { Still } from './icon-camera.ts'
import { iconSvg, onPlane } from './icons.ts'
import type { SvgNode } from './svg.ts'
import { surfaceLabel, surfaceLabelLayout, surfaceText } from './text.ts'

/**
 * A building's name on its roof, with its icon standing before it. One function draws both from one slot, so the
 * name always starts where the icon ends. `still` is set for a drawing without a live stylesheet, such as a cover.
 */
export function roofName(text: SurfaceText, size: number, view: ProjectionView, icon?: IconName, still?: Still): SvgNode[] {
  if (icon === undefined) return [surfaceText(text, size, 'label', view)]
  const slot = roofIconSlot(size)
  return [
    surfaceText(text, size, 'label', view, slot.lead),
    iconSvg({ name: icon, corner: onPlane(text.origin, slot.x, slot.y, view), side: slot.side, landmark: false }, view, still),
  ]
}

/**
 * A surface's title and icon share one slot layout in its front band. Both follow the title's zoom step.
 * `icon.landmark` is the caller's choice between the two kinds of icon in icon-camera.ts: a landmark may grow
 * beyond its slot to stay readable, any other icon stays in its slot. `still` is as for roofName.
 */
export function surfaceTitle(
  text: SurfaceLabel,
  size: number,
  view: ProjectionView,
  spacing: number,
  zoom: number,
  icon: { name?: IconName; landmark: boolean },
  still?: Still,
): SvgNode[] {
  const layout = surfaceLabelLayout(text, size, zoom, view, icon.name !== undefined)
  const label = surfaceLabel(text, layout, view, spacing)
  if (icon.name === undefined) return [label]
  const slot = layout.icon
  const corner = onPlane(text.origin, slot.x, slot.y, view)
  return [label, iconSvg({ name: icon.name, corner, side: slot.side, landmark: icon.landmark }, view, still)]
}
