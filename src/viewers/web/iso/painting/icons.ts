import type { IconName } from '../../../../icons.ts'
import { PLANE } from '../../../../sheet/measure.ts'
import type { Point } from '../../../../types.ts'
import { iconObjects } from '../../icons/objects.ts'
import type { IconMark, IconPart, Prism } from '../../icons/parts.ts'
import { CELL_HEIGHT, CELL_LENGTH, project } from '../projection/project.ts'
import type { ProjectionView } from '../projection/project.ts'
import { iconStroke, type Still } from './icon-camera.ts'
import { backToFront, groundMiddle, markPoints, prismFaces, type IconPoint } from './icon-faces.ts'
import { node, pointsAttribute, round, type SvgNode } from './svg.ts'

/**
 * An icon's box on the map: a square on its name's plane, on the name's line and sized from the name's letters,
 * like the icon of any label. `corner` is the screen point of the box's north corner and `side` its side in
 * plane pixels.
 */
export interface IconBox {
  name: IconName
  corner: Point
  side: number
}

/** The screen point `x`, `y` plane pixels from a name's origin, on the name's plane. */
export function onPlane(origin: Point, x: number, y: number, view: ProjectionView): Point {
  const offset = project(x / PLANE, y / PLANE, 0, view)
  return { x: origin.x + offset.x, y: origin.y + offset.y }
}

/** Lays an icon point onto the drawing, from the box's north corner. */
type Layer = (point: IconPoint) => Point

/** One mark of a part as a path, or nothing when its face is turned away. */
function markSvg(part: Prism, mark: IconMark, at: Layer, view: ProjectionView): SvgNode[] {
  const points = markPoints(part, mark, view)
  if (points === undefined) return []
  const d = points.map((point, index) => {
    const { x, y } = at(point)
    return `${index === 0 ? 'M' : 'L'}${round(x)} ${round(y)}`
  }).join('')
  const accent = mark.accent || part.accent ? ' icon-accent' : ''
  return [node('path', { d: mark.kind === 'line' ? d : `${d}Z` }, `icon-part icon-${mark.kind}${accent}`)]
}

/** One part as shapes of the drawing, seen from `view`; `unit` is the length of one icon unit in it. */
function partSvg(part: IconPart, at: Layer, unit: number, view: ProjectionView): SvgNode[] {
  const accent = part.accent ? ' icon-accent' : ''
  if (part.shape === 'ball') {
    const centre = at([part.x, part.y, part.z])
    const radius = round(part.r * unit)
    return [node('ellipse', { cx: round(centre.x), cy: round(centre.y), rx: radius, ry: radius }, `icon-part icon-top${accent}`)]
  }
  return [
    ...prismFaces(part, view).map(face =>
      node('polygon', { points: pointsAttribute(face.points.map(at)) }, `icon-part icon-${face.tone}${accent}`)),
    ...part.marks.flatMap(mark => markSvg(part, mark, at, view)),
  ]
}

/**
 * The object of an icon in a box `cells` map cells wide, seen from `view`. The object lies on its name's plane
 * with the middle of its ground on the middle of the box. That keeps it in line with its name in every view with
 * no rule of its own, because the name lies on the same plane.
 */
function objectSvg(name: IconName, cells: number, view: ProjectionView): SvgNode[] {
  const parts = iconObjects[name]
  const [middleX, middleY] = groundMiddle(parts)
  const at: Layer = ([x, y, z]) => project((x - middleX + 0.5) * cells, (y - middleY + 0.5) * cells, z * cells * CELL_HEIGHT, view)
  return backToFront(parts, view).flatMap(part => partSvg(part, at, cells * CELL_LENGTH, view))
}

/** The camera above an object: straight down with north up, as the 2D view looks at the map. */
const FROM_ABOVE: ProjectionView = { yaw: 0, pitch: 90 }

/**
 * The same object as the panes show it: seen from straight above, in a square `side` pixels wide whose corner is
 * at 0, 0. It is the drawing the 2D view shows.
 */
export function fromAboveSvg(name: IconName, side: number): SvgNode[] {
  return objectSvg(name, side / CELL_LENGTH, FROM_ABOVE)
}

/**
 * The width of one icon's lines. On the live map the stylesheet sets it while the camera moves, so the icon only
 * carries its box's side. A still is drawn once, so the painter sets the width here; a still's renderer scales
 * lines with the drawing, hence the division. icon-camera.ts holds the rule.
 */
function lineStyle(box: IconBox, still: Still | undefined): string {
  if (still === undefined) return `--icon-side: ${round(box.side)}`
  return `stroke-width: ${round(iconStroke(box.side * still.zoom) / still.zoom)}`
}

/**
 * The icon in its box. It is one object that lies on the map, and every view looks at it from its own angle: a
 * tilted map sees its tops and the walls turned to the reader, and the view from straight above sees its tops
 * alone. It is the same drawing at every size: only the width of its lines follows the camera. Pass `still` for a
 * drawing without a live stylesheet; lineStyle explains why.
 */
export function iconSvg(box: IconBox, view: ProjectionView, still?: Still): SvgNode {
  const transform = `translate(${round(box.corner.x)} ${round(box.corner.y)})`
  return node('g', { transform, style: lineStyle(box, still) }, 'icon', objectSvg(box.name, box.side / PLANE, view))
}
