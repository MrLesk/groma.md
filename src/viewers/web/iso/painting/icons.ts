import type { IconName } from '../../../../icons.ts'
import { ICON_BASELINE, PLANE } from '../../../../sheet/measure.ts'
import type { Point } from '../../../../types.ts'
import { iconObjects, type IconObject } from '../../icons/objects.ts'
import type { IconMark, IconPart, Prism } from '../../icons/parts.ts'
import { CELL_HEIGHT, CELL_LENGTH, planeMatrix, project } from '../projection/project.ts'
import type { ProjectionView } from '../projection/project.ts'
import { detailOpacity, iconStroke, type Still } from './icon-camera.ts'
import { backToFront, boundsOf, frontOf, markPoints, prismFaces, type IconPoint } from './icon-faces.ts'
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

/** Above this pitch the standing object starts to give way to its flat drawing; the tilted views stay below it. */
const STANDING_PITCH = 60
/** At this pitch, the plan view, only the flat drawing is left. */
const FLAT_PITCH = 85

/** 0 in the tilted views, where an icon's object stands; 1 in the plan view, where it is drawn flat. */
function flatness(view: ProjectionView): number {
  return Math.min(1, Math.max(0, (view.pitch - STANDING_PITCH) / (FLAT_PITCH - STANDING_PITCH)))
}

/** Lays an icon point onto the drawing, from the box's north corner. */
type Layer = (point: IconPoint) => Point

/**
 * One mark of a part as a path, or nothing when its face is turned away or it is too small to show. A mark is
 * quiet unless it is a screen, which is a face of the object, or belongs to the accent, which is what the object
 * is about. `detail` is the opacity of quiet marks when the painter decides it, as for a still; the live
 * stylesheet decides it otherwise.
 */
function markSvg(part: Prism, mark: IconMark, at: Layer, view: ProjectionView, detail: number | undefined): SvgNode[] {
  const inAccent = mark.accent || part.accent
  const quiet = mark.kind !== 'screen' && !inAccent
  const points = quiet && detail === 0 ? undefined : markPoints(part, mark, view)
  if (points === undefined) return []
  const d = points.map((point, index) => {
    const { x, y } = at(point)
    return `${index === 0 ? 'M' : 'L'}${round(x)} ${round(y)}`
  }).join('')
  const faded: Record<string, number> = !quiet || detail === undefined || detail === 1 ? {} : { opacity: round(detail) }
  const look = `icon-${mark.kind}${quiet ? ' icon-detail' : ''}${inAccent ? ' icon-accent' : ''}`
  return [node('path', { d: mark.kind === 'line' ? d : `${d}Z`, ...faded }, `icon-part ${look}`)]
}

/** One part as shapes of the drawing, seen from `view`; `unit` is the length of one icon unit in it and `detail` is as for markSvg. */
function partSvg(part: IconPart, at: Layer, unit: number, view: ProjectionView, detail: number | undefined): SvgNode[] {
  const accent = part.accent ? ' icon-accent' : ''
  if (part.shape === 'ball') {
    const centre = at([part.x, part.y, part.z])
    const radius = round(part.r * unit)
    return [node('ellipse', { cx: round(centre.x), cy: round(centre.y), rx: radius, ry: radius }, `icon-part icon-top${accent}`)]
  }
  return [
    ...prismFaces(part, view).map(face =>
      node('polygon', { points: pointsAttribute(face.points.map(at)) }, `icon-part icon-${face.tone}${accent}`)),
    ...part.marks.flatMap(mark => markSvg(part, mark, at, view, detail)),
  ]
}

/**
 * How far an object stands from where it is drawn in its footprint, in box sides towards the reader. An object
 * that stands has its front on the baseline of its name, where the name's letters stand. One that lies stays as
 * it is: centred on the name's line, like its flat drawing.
 */
export function standsForward(object: IconObject): number {
  return object.flat === 'front' ? ICON_BASELINE - frontOf(object.parts) : 0
}

/** The object of an icon in a box `cells` map cells wide, as it stands or lies on a tilted map and turns with it. */
function objectSvg(name: IconName, cells: number, view: ProjectionView, detail: number | undefined): SvgNode[] {
  const object = iconObjects[name]
  const forward = standsForward(object)
  const at: Layer = ([x, y, z]) => project(x * cells, (y + forward) * cells, z * cells * CELL_HEIGHT, view)
  return backToFront(object.parts, view).flatMap(part => partSvg(part, at, cells * CELL_LENGTH, view, detail))
}

/** The views an object is drawn flat from: level from the south for its front, straight down for its top. */
const FLAT_VIEW: Record<IconObject['flat'], ProjectionView> = { front: { yaw: 0, pitch: 0 }, top: { yaw: 0, pitch: 90 } }

/**
 * The same object drawn flat in a square `side` wide whose corner is at 0, 0: its front or its top (objects.ts
 * says which), centred in the square. The 2D view lays this on the map's plane, and the panes show it as it is.
 */
export function flatSvg(name: IconName, side: number, detail?: number): SvgNode[] {
  const { parts, flat } = iconObjects[name]
  // A front is drawn with x to the right and z up; a top with x to the right and y down.
  const lay = ([x, y, z]: IconPoint): Point => flat === 'front' ? { x, y: -z } : { x, y }
  const corners = parts.map(boundsOf).flatMap(({ min, max }) => [lay(min), lay(max)])
  const middle = (values: number[]): number => (Math.min(...values) + Math.max(...values)) / 2
  const centre = { x: middle(corners.map(corner => corner.x)), y: middle(corners.map(corner => corner.y)) }
  const at: Layer = point => {
    const { x, y } = lay(point)
    return { x: (x - centre.x + 0.5) * side, y: (y - centre.y + 0.5) * side }
  }
  return backToFront(parts, FLAT_VIEW[flat]).flatMap(part => partSvg(part, at, side, FLAT_VIEW[flat], detail))
}

/**
 * What the camera scale decides about one icon; icon-camera.ts holds the rules. On the live map the stylesheet
 * applies them while the camera moves, so the icon only carries its box's side. A still is drawn once, so the
 * painter applies them here: the line width and the opacity of the quiet inner lines. A still's renderer scales
 * lines with the drawing, hence the division.
 */
function cameraLook(box: IconBox, still: Still | undefined): { style: string; detail: number | undefined } {
  if (still === undefined) return { style: `--icon-side: ${round(box.side)}`, detail: undefined }
  const side = box.side * still.zoom
  return { style: `stroke-width: ${round(iconStroke(side) / still.zoom)}`, detail: detailOpacity(side) }
}

/**
 * The icon in its box. It is one object, and it follows the map's view: on a tilted map the object stands in the
 * box and turns with the map; in the plan view the same object is drawn flat, lying in the box. Between the two
 * views one fades into the other. Pass `still` for a drawing without a live stylesheet; cameraLook explains why.
 */
export function iconSvg(box: IconBox, view: ProjectionView, still?: Still): SvgNode {
  const flat = flatness(view)
  const { style, detail } = cameraLook(box, still)
  const object = flat === 1 ? [] : [node('g', flat === 0 ? {} : { opacity: round(1 - flat) }, 'icon-object',
    objectSvg(box.name, box.side / PLANE, view, detail))]
  const lying = flat === 0 ? [] : [node('g', { transform: planeMatrix('ground', undefined, view), ...(flat === 1 ? {} : { opacity: round(flat) }) }, 'icon-flat',
    flatSvg(box.name, box.side, detail))]
  return node('g', { transform: `translate(${round(box.corner.x)} ${round(box.corner.y)})`, style }, 'icon', [...object, ...lying])
}
