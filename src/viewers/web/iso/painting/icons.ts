import type { IconName } from '../../../../icons.ts'
import { PLANE } from '../../../../sheet/measure.ts'
import type { Point } from '../../../../types.ts'
import { GLYPH_SIZE, iconGlyphs } from '../../icons/glyphs.ts'
import { iconObjects } from '../../icons/objects.ts'
import type { IconPart } from '../../icons/parts.ts'
import { CELL_HEIGHT, CELL_LENGTH, planeMatrix, project } from '../projection/project.ts'
import type { ProjectionView } from '../projection/project.ts'
import { detailOpacity, landmarkZoom, objectStroke, screenSide, smallIconOpacity, type Still } from './icon-camera.ts'
import { backToFront, markPoints, solidFaces, type IconPoint } from './icon-faces.ts'
import { node, pointsAttribute, round, type SvgNode } from './svg.ts'

/**
 * An icon's place on the map. `corner` is the screen point of its slot's north corner and `side` the slot's side
 * in plane pixels. A landmark keeps a least size on screen when the map is zoomed out; any other icon shrinks
 * with the map. icon-camera.ts holds those rules.
 */
export interface IconSlot {
  name: IconName
  corner: Point
  side: number
  landmark: boolean
}

/**
 * Icon units from the slot's north corner to the icon's anchor: the middle of the edge that faces the name.
 * Everything is drawn around the anchor, so a landmark that is enlarged grows away from the name.
 */
const ANCHOR = { x: 1, y: 0.5 } as const

/** The screen point `x`, `y` plane pixels from a name's origin, on the name's plane. */
export function onPlane(origin: Point, x: number, y: number, view: ProjectionView): Point {
  const offset = project(x / PLANE, y / PLANE, 0, view)
  return { x: origin.x + offset.x, y: origin.y + offset.y }
}

/** Above this pitch the object starts to give way to the flat glyph; the tilted views stay below it. */
const OBJECT_PITCH = 60
/** At this pitch, the plan view, only the glyph is left. */
const GLYPH_PITCH = 85

/** 0 while the map is tilted and the object stands; 1 in the plan view, where the glyph lies flat. */
function flatness(view: ProjectionView): number {
  return Math.min(1, Math.max(0, (view.pitch - OBJECT_PITCH) / (GLYPH_PITCH - OBJECT_PITCH)))
}

/**
 * One part as screen shapes around the icon's anchor, with one icon unit drawn `cells` map cells long.
 * `detail` is the opacity of its quiet inner lines when the painter decides it, as for a still; the live
 * stylesheet decides it otherwise. A screen is a face of the object and the accent is what the object is about,
 * so those always show.
 */
function partSvg(part: IconPart, cells: number, view: ProjectionView, detail: number | undefined): SvgNode[] {
  const at = ([x, y, z]: IconPoint): Point =>
    project((x - ANCHOR.x) * cells, (y - ANCHOR.y) * cells, z * cells * CELL_HEIGHT, view)
  const accent = part.accent ? ' icon-accent' : ''
  if (part.shape === 'ball') {
    const centre = at([part.x, part.y, part.z])
    return [node('circle', { cx: round(centre.x), cy: round(centre.y), r: round(part.r * cells * CELL_LENGTH) }, `icon-part icon-top${accent}`)]
  }
  const faces = solidFaces(part, view).map(face =>
    node('polygon', { points: pointsAttribute(face.points.map(at)) }, `icon-part icon-${face.tone}${accent}`))
  const marks = part.marks.flatMap(mark => {
    const quiet = mark.kind !== 'screen' && !mark.accent && !part.accent
    const points = quiet && detail === 0 ? undefined : markPoints(part, mark, view)
    if (points === undefined) return []
    const d = points.map((point, index) => {
      const { x, y } = at(point)
      return `${index === 0 ? 'M' : 'L'}${round(x)} ${round(y)}`
    }).join('')
    const faded: Record<string, number> = !quiet || detail === undefined || detail === 1 ? {} : { opacity: round(detail) }
    const look = `icon-${mark.kind}${quiet ? ' icon-detail' : ''}${mark.accent ? ' icon-accent' : accent}`
    return [node('path', { d: mark.kind === 'line' ? d : `${d}Z`, ...faded }, `icon-part ${look}`)]
  })
  return [...faces, ...marks]
}

/**
 * What the camera scale decides about one icon; icon-camera.ts holds the rules. On the live map the stylesheet
 * applies them while the camera moves, so the icon only carries its slot's side. A still is drawn once, so the
 * painter applies them here: a landmark's enlargement, the fading of a small icon that is no landmark, the line
 * width and the opacity of the quiet inner lines. A still's renderer scales lines with the drawing, hence the division.
 */
function cameraLook(slot: IconSlot, still: Still | undefined): { style: string; enlarge: Record<string, string>; detail: number | undefined } {
  if (still === undefined) return { style: `--icon-side: ${round(slot.side)}`, enlarge: {}, detail: undefined }
  const zoom = slot.landmark ? landmarkZoom(still.zoom, slot.side) : 1
  const side = screenSide(still.zoom, slot.side, zoom)
  const opacity = slot.landmark ? 1 : smallIconOpacity(side)
  return {
    style: `stroke-width: ${round(objectStroke(side) / (still.zoom * zoom))}${opacity === 1 ? '' : `; opacity: ${round(opacity)}`}`,
    enlarge: zoom === 1 ? {} : { transform: `scale(${round(zoom)})` },
    detail: detailOpacity(side),
  }
}

/**
 * The icon in its slot. In the tilted views its object stands on the slot and turns with the map. Towards the
 * plan view the object fades into the flat glyph lying in the slot.
 * Pass `still` for a drawing without a live stylesheet; cameraLook explains why.
 */
export function iconSvg(slot: IconSlot, view: ProjectionView, still?: Still): SvgNode {
  const flat = flatness(view)
  const cells = slot.side / PLANE
  const anchor = onPlane(slot.corner, ANCHOR.x * slot.side, ANCHOR.y * slot.side, view)
  const { style, enlarge, detail } = cameraLook(slot, still)
  const object = flat === 1 ? [] : [node('g', { ...enlarge, ...(flat === 0 ? {} : { opacity: round(1 - flat) }) }, 'icon-object',
    backToFront(iconObjects[slot.name], view).flatMap(part => partSvg(part, cells, view, detail)))]
  const scale = round(slot.side / GLYPH_SIZE)
  const glyph = flat === 0 ? [] : [node('g', { ...enlarge, ...(flat === 1 ? {} : { opacity: round(flat) }) }, 'icon-glyph', [
    node('path', {
      d: iconGlyphs[slot.name],
      transform: `${planeMatrix('ground', undefined, view)} scale(${scale}) translate(${-ANCHOR.x * GLYPH_SIZE} ${-ANCHOR.y * GLYPH_SIZE})`,
    }),
  ])]
  return node('g', { transform: `translate(${round(anchor.x)} ${round(anchor.y)})`, style },
    slot.landmark ? 'icon landmark' : 'icon', [...object, ...glyph])
}
