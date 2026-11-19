import type { IconName } from '../../../../icons.ts'
import { PLANE } from '../../../../sheet/measure.ts'
import type { Point } from '../../../../types.ts'
import { GLYPH_SIZE, iconGlyphs } from '../../icons/glyphs.ts'
import { iconObjects } from '../../icons/objects.ts'
import type { IconMark, IconPart, Prism } from '../../icons/parts.ts'
import { CELL_HEIGHT, CELL_LENGTH, planeMatrix, project } from '../projection/project.ts'
import type { ProjectionView } from '../projection/project.ts'
import { detailOpacity, glyphStroke, objectStroke, roofIconOpacity, standing, type Still } from './icon-camera.ts'
import { backToFront, markPoints, prismFaces, type IconPoint } from './icon-faces.ts'
import { node, pointsAttribute, round, type SvgNode } from './svg.ts'

/** A square on a name's plane: the screen point of its north corner and its side in plane pixels. */
export interface Square {
  corner: Point
  side: number
}

/**
 * An icon's place on the map. Its object stands in `slot`. Only a title's icon has `mark`: the square beside the
 * title in which the icon lies flat as its glyph while its object would be too small to read. A roof's icon has
 * no mark: it lies flat in its own slot, and only in the plan view. icon-camera.ts holds the rules.
 */
export interface IconPlace {
  name: IconName
  slot: Square
  mark?: Square
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

/** 0 while the map is tilted and the object can stand; 1 in the plan view, where every icon lies flat. */
function flatness(view: ProjectionView): number {
  return Math.min(1, Math.max(0, (view.pitch - OBJECT_PITCH) / (GLYPH_PITCH - OBJECT_PITCH)))
}

/** Lays an icon point onto the screen, from the slot's north corner. */
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
function partSvg(part: IconPart, cells: number, view: ProjectionView, detail: number | undefined): SvgNode[] {
  const at: Layer = ([x, y, z]) => project(x * cells, y * cells, z * cells * CELL_HEIGHT, view)
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

/** How much of an icon is its standing object (the rest is its flat glyph), and how the camera scale draws both. */
interface Look {
  /** Share of the object, from 0 (only the glyph lies there) to 1; undefined when the live stylesheet decides it. */
  object: number | undefined
  /** Attributes of the icon's group, of its object and of its glyph. */
  icon: Record<string, string | number>
  objectStyle: Record<string, string | number>
  glyphStyle: Record<string, string | number>
  detail: number | undefined
}

/**
 * What the view and the camera scale decide about one icon; icon-camera.ts holds the scale rules. On the live map
 * the stylesheet applies them while the camera moves, so the icon only carries its sides and how flat the view
 * is. A still is drawn once, so the painter applies them here. A still's renderer scales lines with the
 * drawing, hence the divisions: by the camera's zoom, and for the glyph also by the scale that lays it into its mark.
 */
function lookOf(place: IconPlace, flat: number, still: Still | undefined): Look {
  const mark = place.mark ?? place.slot
  if (still === undefined) {
    return {
      object: undefined,
      icon: { style: `--icon-side: ${round(place.slot.side)}${flat === 0 ? '' : `; --icon-flat: ${round(flat)}`}` },
      objectStyle: {},
      glyphStyle: { style: `--icon-side: ${round(mark.side)}` },
      detail: undefined,
    }
  }
  const side = place.slot.side * still.zoom
  const object = (1 - flat) * (place.mark === undefined ? 1 : standing(side))
  const fade = place.mark === undefined ? roofIconOpacity(side) : 1
  const opacity = (share: number): Record<string, number> => share === 1 ? {} : { opacity: round(share) }
  return {
    object,
    icon: opacity(fade),
    objectStyle: { ...opacity(object), style: `stroke-width: ${round(objectStroke(side) / still.zoom)}` },
    glyphStyle: { ...opacity(1 - object), style: `stroke-width: ${round(glyphStroke(mark.side * still.zoom) / (still.zoom * mark.side / GLYPH_SIZE))}` },
    detail: detailOpacity(side),
  }
}

/**
 * The icon at its place. Its object stands in the slot and turns with the map. Its flat glyph lies in the
 * mark, or in the slot when the icon has no mark. Which of the two shows is decided by the view (towards the
 * plan view every object gives way to its glyph) and, for a title's icon, by the camera scale.
 * Pass `still` for a drawing without a live stylesheet; lookOf explains why.
 */
export function iconSvg(place: IconPlace, view: ProjectionView, still?: Still): SvgNode {
  const flat = flatness(view)
  const look = lookOf(place, flat, still)
  const { slot } = place
  const mark = place.mark ?? slot
  // On the live map a title's icon keeps both drawings, because the stylesheet picks one as the camera moves.
  const drawsObject = look.object === undefined ? flat < 1 : look.object > 0
  const drawsGlyph = look.object === undefined ? flat > 0 || place.mark !== undefined : look.object < 1
  const object = !drawsObject ? [] : [node('g', { transform: `translate(${round(slot.corner.x)} ${round(slot.corner.y)})`, ...look.objectStyle }, 'icon-object',
    backToFront(iconObjects[place.name], view).flatMap(part => partSvg(part, slot.side / PLANE, view, look.detail)))]
  const glyph = !drawsGlyph ? [] : [node('g', look.glyphStyle, 'icon-glyph', [
    node('path', { d: iconGlyphs[place.name], transform: `${planeMatrix('ground', mark.corner, view)} scale(${round(mark.side / GLYPH_SIZE)})` }),
  ])]
  return node('g', look.icon, place.mark === undefined ? 'icon' : 'icon title', [...object, ...glyph])
}
