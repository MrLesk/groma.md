import type { IconName } from '../../../../icons.ts'
import { PLANE, roofIconSide, textPadding } from '../../../../sheet/measure.ts'
import type { Point } from '../../../../types.ts'
import { GLYPH_SIZE, iconGlyphs } from '../../icons/glyphs.ts'
import { iconObjects } from '../../icons/objects.ts'
import type { IconMark, IconPart } from '../../icons/parts.ts'
import { CELL_HEIGHT, CELL_LENGTH, boxFaces, curvedFaces, paintOrder, planeMatrix, project } from '../projection/project.ts'
import type { Face, ProjectionView, SurfaceLabel, SurfaceText } from '../projection/project.ts'
import { ICON_DETAIL, iconStrokeAt, landmarkZoom } from './scale.ts'
import { node, pointsAttribute, round, type SvgNode } from './svg.ts'
import { surfaceLabelLayout } from './text.ts'

/**
 * An icon's place on the map. `corner` is the screen point of its slot's north corner and `side` the slot's side
 * in plane pixels. A landmark is enlarged to stay readable when the map is zoomed out, up to `room` times its
 * slot; other icons shrink with the map.
 */
interface IconSlot {
  name: IconName
  corner: Point
  side: number
  landmark?: { room: number }
}

/** A title icon stands on open ground before its surface, so it may grow as far as staying readable needs. */
const OPEN_GROUND = 99

/**
 * Icon units from the slot's north corner to the icon's anchor: the middle of the edge that faces the name.
 * Everything is drawn around the anchor, so a landmark that the stylesheet enlarges grows away from the name.
 */
const ANCHOR = { x: 1, y: 0.5 } as const

/** The screen point `x`, `y` plane pixels from a name's origin, on the name's plane. */
function onPlane(origin: Point, x: number, y: number, view: ProjectionView): Point {
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

/** The ground rectangle a part stands on, in icon units. */
function footprint(part: IconPart): { gx: number; gy: number; w: number; d: number } {
  if (part.shape === 'box') return { gx: part.x, gy: part.y, w: part.w, d: part.d }
  if (part.shape === 'ball') return { gx: part.x - part.r, gy: part.y - part.r, w: 2 * part.r, d: 2 * part.r }
  const xs = part.outline.map(([x]) => x)
  const ys = part.outline.map(([, y]) => y)
  return { gx: Math.min(...xs), gy: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), d: Math.max(...ys) - Math.min(...ys) }
}

/** Lowest parts first, then back to front, so a part standing on another is drawn over it. */
function drawOrder(parts: readonly IconPart[], view: ProjectionView): IconPart[] {
  const behindFirst = paintOrder(parts.map(part => ({ part, rect: footprint(part) })), view)
  return behindFirst.map(({ part }) => part).sort((left, right) => left.z - right.z)
}

/** Where a mark's pairs lie on its part, as icon-unit points; undefined when that wall faces away from the reader. */
function markPoints(part: Exclude<IconPart, { shape: 'ball' }>, mark: IconMark, view: ProjectionView): [number, number, number][] | undefined {
  const pairs = Array.from({ length: mark.line.length / 2 }, (_, index) => [mark.line[2 * index]!, mark.line[2 * index + 1]!] as const)
  if (mark.on === 'top') return pairs.map(([x, y]) => [x, y, part.z + part.h])
  if (part.shape !== 'box') return undefined
  const yaw = view.yaw * Math.PI / 180
  if (mark.on === 'south') return Math.cos(yaw) > 0 ? pairs.map(([x, z]) => [x, part.y + part.d, z]) : undefined
  return Math.sin(yaw) > 0 ? pairs.map(([y, z]) => [part.x + part.w, y, z]) : undefined
}

/** One part as screen shapes around the icon's anchor, with one icon unit drawn `cells` map cells long; `details` draws its inner lines too. */
function partSvg(part: IconPart, cells: number, view: ProjectionView, details: boolean): SvgNode[] {
  const at = (x: number, y: number, z: number): Point =>
    project((x - ANCHOR.x) * cells, (y - ANCHOR.y) * cells, z * cells * CELL_HEIGHT, view)
  if (part.shape === 'ball') {
    const centre = at(part.x, part.y, part.z)
    const radius = round(part.r * cells * CELL_LENGTH)
    return [node('ellipse', { cx: round(centre.x), cy: round(centre.y), rx: radius, ry: radius }, 'face top')]
  }
  const [low, high] = [part.z * cells * CELL_HEIGHT, (part.z + part.h) * cells * CELL_HEIGHT]
  const faces: Face[] = part.shape === 'box'
    ? boxFaces({ gx: (part.x - ANCHOR.x) * cells, gy: (part.y - ANCHOR.y) * cells, w: part.w * cells, d: part.d * cells }, low, high, view)
    : curvedFaces(part.outline.map(([x, y]) => ({ gx: (x - ANCHOR.x) * cells, gy: (y - ANCHOR.y) * cells })), low, high, view)
  const marks = part.marks.filter(mark => details || mark.kind === 'screen').flatMap(mark => {
    const points = markPoints(part, mark, view)
    if (points === undefined) return []
    const d = points.map(([x, y, z], index) => {
      const point = at(x, y, z)
      return `${index === 0 ? 'M' : 'L'}${round(point.x)} ${round(point.y)}`
    }).join('')
    return [node('path', { d: mark.kind === 'stroke' ? d : `${d}Z` }, `detail ${mark.kind}`)]
  })
  return [...faces.map(face => node('polygon', { points: pointsAttribute(face.points) }, `face ${face.side}`)), ...marks]
}

/**
 * How an icon follows the camera. On the live map the stylesheet does it from --camera-scale, so the icon only
 * carries its slot's side and a landmark's room. A still is drawn once at `stillZoom` with no live stylesheet, so
 * the same rules are fixed here: a landmark's enlargement, the line width, and whether the object is large
 * enough for its inner lines. A still's renderer scales lines with the drawing, hence the division.
 */
function cameraLook(slot: IconSlot, stillZoom: number | undefined): { style: string; enlarge: Record<string, string>; details: boolean } {
  if (stillZoom === undefined) {
    const room = slot.landmark === undefined ? '' : `; --icon-room: ${round(slot.landmark.room)}`
    return { style: `--icon-side: ${round(slot.side)}${room}`, enlarge: {}, details: true }
  }
  const zoom = slot.landmark === undefined ? 1 : landmarkZoom(stillZoom, slot.side, slot.landmark.room)
  const screenSide = slot.side * stillZoom * zoom
  return {
    style: `stroke-width: ${round(iconStrokeAt(stillZoom * zoom, slot.side) / (stillZoom * zoom))}`,
    enlarge: zoom === 1 ? {} : { transform: `scale(${round(zoom)})` },
    details: screenSide >= ICON_DETAIL.to,
  }
}

/**
 * The icon in its slot. In the tilted views its object stands on the slot, built from the same faces as the
 * buildings, so it turns with the map. Towards the plan view the object fades into the flat glyph lying in the slot.
 * Pass the camera scale of a still image as `stillZoom`; cameraLook explains why.
 */
function iconSvg(slot: IconSlot, view: ProjectionView, stillZoom?: number): SvgNode {
  const flat = flatness(view)
  const cells = slot.side / PLANE
  const anchor = onPlane(slot.corner, ANCHOR.x * slot.side, ANCHOR.y * slot.side, view)
  const { style, enlarge, details } = cameraLook(slot, stillZoom)
  const object = flat === 1 ? [] : [node('g', { ...enlarge, ...(flat === 0 ? {} : { opacity: round(1 - flat) }) }, 'icon-object',
    drawOrder(iconObjects[slot.name], view).flatMap(part => partSvg(part, cells, view, details)))]
  const scale = round(slot.side / GLYPH_SIZE)
  const glyph = flat === 0 ? [] : [node('g', { ...enlarge, ...(flat === 1 ? {} : { opacity: round(flat) }) }, 'icon-glyph', [
    node('path', {
      d: iconGlyphs[slot.name],
      transform: `${planeMatrix('ground', undefined, view)} scale(${scale}) translate(${-ANCHOR.x * GLYPH_SIZE} ${-ANCHOR.y * GLYPH_SIZE})`,
    }),
  ])]
  return node('g', { transform: `translate(${round(anchor.x)} ${round(anchor.y)})`, style },
    slot.landmark === undefined ? 'icon minor' : 'icon landmark', [...object, ...glyph])
}

/**
 * A building's icon stands on its roof before the name, inset like the name. `roofSide` is the roof's shorter
 * side in plane pixels: an actor's or external system's icon is a landmark that never outgrows its roof.
 * A component's icon is no landmark, because a map has too many; pass no `roofSide` for it.
 */
export function roofIcon(
  name: IconName,
  text: SurfaceText,
  size: number,
  view: ProjectionView,
  roofSide?: number,
  stillZoom?: number,
): SvgNode {
  const padding = textPadding(size)
  const side = roofIconSide(size)
  return iconSvg({
    name,
    corner: onPlane(text.origin, padding, padding / 2, view),
    side,
    ...(roofSide === undefined ? {} : { landmark: { room: Math.max(1, roofSide / side) } }),
  }, view, stillZoom)
}

/** A surface's icon stands in its front band before the title, and grows with the title's zoom step. */
export function titleIcon(
  name: IconName,
  text: SurfaceLabel,
  size: number,
  view: ProjectionView,
  zoom: number,
  stillZoom?: number,
): SvgNode {
  const { icon } = surfaceLabelLayout(text, size, zoom, view, true)
  return iconSvg({ name, corner: onPlane(text.origin, icon.x, icon.y, view), side: icon.side, landmark: { room: OPEN_GROUND } }, view, stillZoom)
}
