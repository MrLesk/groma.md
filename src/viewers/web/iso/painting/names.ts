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
 * A surface's title in its front band, with its icon standing before it. The icon grows with the title's zoom
 * step, which `zoom` picks, and is a landmark: it stands on open ground, so it may be enlarged to stay readable.
 * `still` is as for roofName.
 */
export function surfaceTitle(
  text: SurfaceLabel,
  size: number,
  view: ProjectionView,
  spacing: number,
  zoom: number,
  icon?: IconName,
  still?: Still,
): SvgNode[] {
  const label = surfaceLabel(text, size, view, spacing, zoom, icon !== undefined)
  if (icon === undefined) return [label]
  const slot = surfaceLabelLayout(text, size, zoom, view, true).icon
  return [label, iconSvg({ name: icon, corner: onPlane(text.origin, slot.x, slot.y, view), side: slot.side, landmark: true }, view, still)]
}
