import type { IconName } from '../../../../icons.ts'
import { ICON_BASELINE, PLANE } from '../../../../sheet/measure.ts'
import type { Point } from '../../../../types.ts'
import { iconObjects } from '../../icons/objects.ts'
import type { IconMark, IconPart, Prism } from '../../icons/parts.ts'
import { CELL_HEIGHT, CELL_LENGTH, planeMatrix, project } from '../projection/project.ts'
import type { ProjectionView } from '../projection/project.ts'
import { iconStroke, type Still } from './icon-camera.ts'
import { backToFront, boundsOf, frontOf, laidFlat, markPoints, prismFaces, type IconPoint } from './icon-faces.ts'
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

/**
 * From this pitch up the map is seen from above and an icon is drawn as its plan; below it the object stands. The
 * tilted views stay below this pitch and the plan view is above it. While the map turns from one to the other the
 * icon switches at once, with no blend of its own.
 */
const PLAN_PITCH = 75

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
 * How far an object stands from where it is drawn in its footprint, in box sides towards the reader: its front
 * stands on the baseline of its name, where the name's letters stand.
 */
export function standsForward(parts: readonly IconPart[]): number {
  return ICON_BASELINE - frontOf(parts)
}

/** The object of an icon in a box `cells` map cells wide, as it stands on a tilted map and turns with it. */
function objectSvg(name: IconName, cells: number, view: ProjectionView): SvgNode[] {
  const parts = iconObjects[name]
  const forward = standsForward(parts)
  const at: Layer = ([x, y, z]) => project(x * cells, (y + forward) * cells, z * cells * CELL_HEIGHT, view)
  return backToFront(parts, view).flatMap(part => partSvg(part, at, cells * CELL_LENGTH, view))
}

/** The camera above an object: straight down with north up, as the 2D view looks at the map. */
const PLAN_VIEW: ProjectionView = { yaw: 0, pitch: 90 }

/**
 * The plan of the same object: seen from straight above with its upright panels laid flat, centred in a square
 * `side` wide whose corner is at 0, 0. The 2D view lays this on the map's plane, and the panes show it as it is.
 */
export function planSvg(name: IconName, side: number): SvgNode[] {
  const parts = laidFlat(iconObjects[name])
  const bounds = parts.map(boundsOf)
  /** The middle of the object along x (0) or y (1). */
  const middle = (axis: 0 | 1): number =>
    (Math.min(...bounds.map(({ min }) => min[axis])) + Math.max(...bounds.map(({ max }) => max[axis]))) / 2
  const centre = { x: middle(0), y: middle(1) }
  // A plan is drawn with x to the right and y down, its middle in the middle of the square.
  const at: Layer = ([x, y]) => ({ x: (x - centre.x + 0.5) * side, y: (y - centre.y + 0.5) * side })
  return backToFront(parts, PLAN_VIEW).flatMap(part => partSvg(part, at, side, PLAN_VIEW))
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
 * The icon in its box. It is one object, and it follows the map's view: on a tilted map the object stands in the
 * box and turns with the map; seen from above its plan lies on the map's plane, in the box. It is the same
 * drawing at every size: only the width of its lines follows the camera. Pass `still` for a drawing without a live stylesheet; lineStyle explains why.
 */
export function iconSvg(box: IconBox, view: ProjectionView, still?: Still): SvgNode {
  const style = lineStyle(box, still)
  const drawing = view.pitch < PLAN_PITCH
    ? node('g', {}, 'icon-object', objectSvg(box.name, box.side / PLANE, view))
    : node('g', { transform: planeMatrix('ground', undefined, view) }, 'icon-plan', planSvg(box.name, box.side))
  return node('g', { transform: `translate(${round(box.corner.x)} ${round(box.corner.y)})`, style }, 'icon', [drawing])
}
