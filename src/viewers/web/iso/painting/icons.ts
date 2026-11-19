import type { IconName } from '../../../../icons.ts'
import { PLANE } from '../../../../sheet/measure.ts'
import type { Point } from '../../../../types.ts'
import { GLYPH_SIZE, iconGlyphs } from '../../icons/glyphs.ts'
import { iconObjects } from '../../icons/objects.ts'
import type { IconMark, IconPart } from '../../icons/parts.ts'
import { CELL_HEIGHT, CELL_LENGTH, boxFaces, curvedFaces, planeMatrix, project } from '../projection/project.ts'
import type { Face, ProjectionView } from '../projection/project.ts'
import { detailOpacity, landmarkZoom, objectStroke, roofIconOpacity, screenSide, type Still } from './icon-camera.ts'
import { node, pointsAttribute, round, type SvgNode } from './svg.ts'

/**
 * An icon's place on the map. `corner` is the screen point of its slot's north corner and `side` the slot's side
 * in plane pixels. A landmark is enlarged to stay readable when the map is zoomed out; any other icon shrinks
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

/** A part with the ground rectangle it stands on, in icon units. */
interface Standing {
  part: IconPart
  gx: number
  gy: number
  w: number
  d: number
}

function standing(part: IconPart): Standing {
  if (part.shape === 'box') return { part, gx: part.x, gy: part.y, w: part.w, d: part.d }
  if (part.shape === 'ball') return { part, gx: part.x - part.r, gy: part.y - part.r, w: 2 * part.r, d: 2 * part.r }
  const xs = part.outline.map(([x]) => x)
  const ys = part.outline.map(([, y]) => y)
  return { part, gx: Math.min(...xs), gy: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), d: Math.max(...ys) - Math.min(...ys) }
}

/** Parts that only touch along an edge do not count as overlapping. */
const TOUCH = 1e-6

/**
 * Which walls of an upright box the reader sees: the east wall (towards +x) or the west one, and the south wall
 * (towards +y) or the north one. boxFaces draws a box's walls by the same rule.
 */
function facing(view: ProjectionView): { east: boolean; south: boolean } {
  const yaw = view.yaw * Math.PI / 180
  return { east: Math.sin(yaw) > 0, south: Math.cos(yaw) > 0 }
}

/**
 * True when `front` hides part of `back`, so it is drawn later. Where the two footprints overlap, the higher
 * part stands on the lower one. Where a ground axis separates them, the part on the side of the wall the reader
 * sees is the nearer one.
 */
function hides(front: Standing, back: Standing, view: ProjectionView): boolean {
  const eastOf = front.gx >= back.gx + back.w - TOUCH
  const westOf = back.gx >= front.gx + front.w - TOUCH
  const southOf = front.gy >= back.gy + back.d - TOUCH
  const northOf = back.gy >= front.gy + front.d - TOUCH
  if (!eastOf && !westOf && !southOf && !northOf) return front.part.z > back.part.z
  const seen = facing(view)
  return (seen.east ? eastOf : westOf) || (seen.south ? southOf : northOf)
}

/** Back to front: a part is drawn once no part still waiting is hidden by it. */
function drawOrder(parts: readonly IconPart[], view: ProjectionView): IconPart[] {
  const waiting = parts.map(standing)
  const drawn: IconPart[] = []
  while (waiting.length > 0) {
    const next = waiting.findIndex(candidate => !waiting.some(other => other !== candidate && hides(candidate, other, view)))
    // Two parts that each hide the other cannot be ordered; draw the first and go on.
    drawn.push(waiting.splice(Math.max(next, 0), 1)[0]!.part)
  }
  return drawn
}

/** Where a mark's pairs lie on its part, as icon-unit points; undefined when that wall faces away from the reader. */
function markPoints(part: Exclude<IconPart, { shape: 'ball' }>, mark: IconMark, view: ProjectionView): [number, number, number][] | undefined {
  const pairs = Array.from({ length: mark.line.length / 2 }, (_, index) => [mark.line[2 * index]!, mark.line[2 * index + 1]!] as const)
  if (mark.on === 'top') return pairs.map(([x, y]) => [x, y, part.z + part.h])
  if (part.shape !== 'box') return undefined
  const seen = facing(view)
  if (mark.on === 'south') return seen.south ? pairs.map(([x, z]) => [x, part.y + part.d, z]) : undefined
  return seen.east ? pairs.map(([y, z]) => [part.x + part.w, y, z]) : undefined
}

/**
 * One part as screen shapes around the icon's anchor, with one icon unit drawn `cells` map cells long.
 * `detail` is the opacity of its inner lines when the painter decides it, as for a still; the live
 * stylesheet decides it otherwise. A screen is a face of the object, not an inner line, so it always shows.
 */
function partSvg(part: IconPart, cells: number, view: ProjectionView, detail: number | undefined): SvgNode[] {
  const at = (x: number, y: number, z: number): Point =>
    project((x - ANCHOR.x) * cells, (y - ANCHOR.y) * cells, z * cells * CELL_HEIGHT, view)
  if (part.shape === 'ball') {
    const centre = at(part.x, part.y, part.z)
    const radius = round(part.r * cells * CELL_LENGTH)
    return [node('ellipse', { cx: round(centre.x), cy: round(centre.y), rx: radius, ry: radius }, 'icon-part icon-top')]
  }
  const [low, high] = [part.z * cells * CELL_HEIGHT, (part.z + part.h) * cells * CELL_HEIGHT]
  const faces: Face[] = part.shape === 'box'
    ? boxFaces({ gx: (part.x - ANCHOR.x) * cells, gy: (part.y - ANCHOR.y) * cells, w: part.w * cells, d: part.d * cells }, low, high, view)
    : curvedFaces(part.outline.map(([x, y]) => ({ gx: (x - ANCHOR.x) * cells, gy: (y - ANCHOR.y) * cells })), low, high, view)
  const marks = part.marks.flatMap(mark => {
    const points = mark.kind !== 'screen' && detail === 0 ? undefined : markPoints(part, mark, view)
    if (points === undefined) return []
    const d = points.map(([x, y, z], index) => {
      const point = at(x, y, z)
      return `${index === 0 ? 'M' : 'L'}${round(point.x)} ${round(point.y)}`
    }).join('')
    const faded: Record<string, number> = mark.kind === 'screen' || detail === undefined || detail === 1 ? {} : { opacity: round(detail) }
    return [node('path', { d: mark.kind === 'line' ? d : `${d}Z`, ...faded }, `icon-part icon-${mark.kind}`)]
  })
  return [...faces.map(face => node('polygon', { points: pointsAttribute(face.points) }, `icon-part icon-${face.side}`)), ...marks]
}

/**
 * What the camera scale decides about one icon; icon-camera.ts holds the rules. On the live map the stylesheet
 * applies them while the camera moves, so the icon only carries its slot's side. A still is drawn once, so the
 * painter applies them here: a landmark's enlargement, a roof icon's fading, the line width and the opacity
 * of the inner lines. A still's renderer scales lines with the drawing, hence the division.
 */
function cameraLook(slot: IconSlot, still: Still | undefined): { style: string; enlarge: Record<string, string>; detail: number | undefined } {
  if (still === undefined) return { style: `--icon-side: ${round(slot.side)}`, enlarge: {}, detail: undefined }
  const zoom = slot.landmark ? landmarkZoom(still.zoom, slot.side) : 1
  const side = screenSide(still.zoom, slot.side, zoom)
  const opacity = slot.landmark ? 1 : roofIconOpacity(side)
  return {
    style: `stroke-width: ${round(objectStroke(side) / (still.zoom * zoom))}${opacity === 1 ? '' : `; opacity: ${round(opacity)}`}`,
    enlarge: zoom === 1 ? {} : { transform: `scale(${round(zoom)})` },
    detail: detailOpacity(side),
  }
}

/**
 * The icon in its slot. In the tilted views its object stands on the slot, built from the same faces as the
 * buildings, so it turns with the map. Towards the plan view the object fades into the flat glyph lying in the slot.
 * Pass `still` for a drawing without a live stylesheet; cameraLook explains why.
 */
export function iconSvg(slot: IconSlot, view: ProjectionView, still?: Still): SvgNode {
  const flat = flatness(view)
  const cells = slot.side / PLANE
  const anchor = onPlane(slot.corner, ANCHOR.x * slot.side, ANCHOR.y * slot.side, view)
  const { style, enlarge, detail } = cameraLook(slot, still)
  const object = flat === 1 ? [] : [node('g', { ...enlarge, ...(flat === 0 ? {} : { opacity: round(1 - flat) }) }, 'icon-object',
    drawOrder(iconObjects[slot.name], view).flatMap(part => partSvg(part, cells, view, detail)))]
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
