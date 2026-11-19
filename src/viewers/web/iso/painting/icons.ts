import type { IconName } from '../../../../icons.ts'
import { PLANE } from '../../../../sheet/measure.ts'
import type { Point } from '../../../../types.ts'
import { GLYPH_SIZE, iconGlyphs } from '../../icons/glyphs.ts'
import { iconObjects } from '../../icons/objects.ts'
import type { IconMark, IconPart, Prism } from '../../icons/parts.ts'
import { CELL_HEIGHT, CELL_LENGTH, planeMatrix, project } from '../projection/project.ts'
import type { ProjectionView } from '../projection/project.ts'
import { detailOpacity, iconOpacity, objectStroke, type Still } from './icon-camera.ts'
import { backToFront, drawingOffset, markPoints, prismFaces, type IconPoint } from './icon-faces.ts'
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

/** Above this pitch the object starts to give way to the flat glyph; the tilted views stay below it. */
const OBJECT_PITCH = 60
/** At this pitch, the plan view, only the glyph is left. */
const GLYPH_PITCH = 85

/** 0 in the tilted views, where an icon is its object; 1 in the plan view, where it is its flat glyph. */
function flatness(view: ProjectionView): number {
  return Math.min(1, Math.max(0, (view.pitch - OBJECT_PITCH) / (GLYPH_PITCH - OBJECT_PITCH)))
}

/** Lays an icon point onto the screen, from the box's north corner. */
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

/** One part as screen shapes, with one icon unit drawn `cells` map cells long; `detail` is as for markSvg. */
function partSvg(part: IconPart, cells: number, at: Layer, view: ProjectionView, detail: number | undefined): SvgNode[] {
  const accent = part.accent ? ' icon-accent' : ''
  if (part.shape === 'ball') {
    const centre = at([part.x, part.y, part.z])
    const radius = round(part.r * cells * CELL_LENGTH)
    return [node('ellipse', { cx: round(centre.x), cy: round(centre.y), rx: radius, ry: radius }, `icon-part icon-top${accent}`)]
  }
  return [
    ...prismFaces(part, view).map(face =>
      node('polygon', { points: pointsAttribute(face.points.map(at)) }, `icon-part icon-${face.tone}${accent}`)),
    ...part.marks.flatMap(mark => markSvg(part, mark, at, view, detail)),
  ]
}

/**
 * The object of an icon in a box `cells` map cells wide. An object rises on screen, so it stands a little in
 * front of its box (drawingOffset): that puts its drawing, not its foot, in the middle of the box, on the line
 * of the name.
 */
function objectSvg(name: IconName, cells: number, view: ProjectionView, detail: number | undefined): SvgNode[] {
  const parts = iconObjects[name]
  const forward = drawingOffset(parts)
  const at: Layer = ([x, y, z]) => project(x * cells, (y + forward) * cells, z * cells * CELL_HEIGHT, view)
  return backToFront(parts, view).flatMap(part => partSvg(part, cells, at, view, detail))
}

/**
 * What the camera scale decides about one icon; icon-camera.ts holds the rules. On the live map the stylesheet
 * applies them while the camera moves, so the icon only carries its box's side. A still is drawn once, so the
 * painter applies them here: the fading of a tiny icon, the line width and the opacity of the quiet inner lines.
 * A still's renderer scales lines with the drawing, hence the division.
 */
function cameraLook(box: IconBox, still: Still | undefined): { style: string; detail: number | undefined } {
  if (still === undefined) return { style: `--icon-side: ${round(box.side)}`, detail: undefined }
  const side = box.side * still.zoom
  const opacity = iconOpacity(side)
  return {
    style: `stroke-width: ${round(objectStroke(side) / still.zoom)}${opacity === 1 ? '' : `; opacity: ${round(opacity)}`}`,
    detail: detailOpacity(side),
  }
}

/**
 * The icon in its box. It follows the map's view: in the tilted views it is its object, which turns with the
 * map, and in the plan view it is its flat glyph, lying in the box. Between the two views one fades into the other.
 * Pass `still` for a drawing without a live stylesheet; cameraLook explains why.
 */
export function iconSvg(box: IconBox, view: ProjectionView, still?: Still): SvgNode {
  const flat = flatness(view)
  const { style, detail } = cameraLook(box, still)
  const object = flat === 1 ? [] : [node('g', flat === 0 ? {} : { opacity: round(1 - flat) }, 'icon-object',
    objectSvg(box.name, box.side / PLANE, view, detail))]
  const glyph = flat === 0 ? [] : [node('g', flat === 1 ? {} : { opacity: round(flat) }, 'icon-glyph', [
    node('path', { d: iconGlyphs[box.name], transform: `${planeMatrix('ground', undefined, view)} scale(${round(box.side / GLYPH_SIZE)})` }),
  ])]
  return node('g', { transform: `translate(${round(box.corner.x)} ${round(box.corner.y)})`, style }, 'icon', [...object, ...glyph])
}
