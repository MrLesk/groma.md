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
    iconSvg({ name: icon, slot: { corner: onPlane(text.origin, slot.x, slot.y, view), side: slot.side } }, view, still),
  ]
}

/**
 * A surface's title and icon share one layout in its front band. The icon's object stands in its slot, clear of
 * the surface; its flat glyph lies in the mark on the title's line and follows the title's zoom step.
 * `still` is as for roofName.
 */
export function surfaceTitle(
  text: SurfaceLabel,
  size: number,
  view: ProjectionView,
  spacing: number,
  zoom: number,
  icon: IconName | undefined,
  still?: Still,
): SvgNode[] {
  const layout = surfaceLabelLayout(text, size, zoom, view, icon !== undefined)
  const label = surfaceLabel(text, layout, view, spacing)
  if (icon === undefined) return [label]
  const square = (place: { x: number; y: number; side: number }) => ({ corner: onPlane(text.origin, place.x, place.y, view), side: place.side })
  return [label, iconSvg({ name: icon, slot: square(layout.icon), mark: square(layout.mark) }, view, still)]
}
