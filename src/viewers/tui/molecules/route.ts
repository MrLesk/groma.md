import { TextAttributes } from '@opentui/core'
import type { OptimizedBuffer } from '@opentui/core'

import { cell } from '../atoms/cell.ts'
import type { LineLook } from '../atoms/lines.ts'
import { text } from '../atoms/text.ts'
import type { ViewerTheme } from '../atoms/theme.ts'
import { visibleIn } from '../projection-camera.ts'
import type { ProjectedMapItem, ProjectedMapRoute } from '../projection.ts'
import type { Bounds, Point } from '../../../types.ts'

/** Cells between two pulses travelling along a lit route. */
const PULSE_SPACING = 8

/** Quiet thin lines; a lit route draws in the accent, a traced flow also bold. Drafts dash either. */
export function routeLook(route: ProjectedMapRoute, theme: ViewerTheme, lit: boolean, traced: boolean, dimmed: boolean): LineLook {
  return {
    color: lit ? theme.selected : theme.quiet,
    attributes: traced ? TextAttributes.BOLD : dimmed ? TextAttributes.DIM : 0,
    heavy: false,
    dashed: route.origin !== 'observed',
    rounded: true,
    rank: lit ? 28 : 1,
  }
}

function heading(from: Point, to: Point): Point {
  return { x: Math.sign(to.x - from.x), y: Math.sign(to.y - from.y) }
}

/**
 * The drawn line runs from the source frame, where it joins with a tee, to the cell before the target frame,
 * where its arrow sits. A two-way route stops short of both frames and carries an arrow at each end.
 */
export function routePath(route: ProjectedMapRoute): { path: Point[]; arrows: { at: Point; direction: Point }[] } | undefined {
  const points = route.cellRoute
  if (points.length < 2) return undefined
  const last = points.at(-1)!
  const toward = heading(points.at(-2)!, last)
  const end = { at: { x: last.x - toward.x, y: last.y - toward.y }, direction: toward }
  if (!route.twoWay) return { path: [...points.slice(0, -1), end.at], arrows: [end] }
  const first = points[0]!
  const away = heading(points[1]!, first)
  const start = { at: { x: first.x - away.x, y: first.y - away.y }, direction: away }
  return { path: [start.at, ...points.slice(1, -1), end.at], arrows: [start, end] }
}

function arrowGlyph(direction: Point): string {
  if (direction.x > 0) return '▶'
  if (direction.x < 0) return '◀'
  return direction.y > 0 ? '▼' : '▲'
}

/** Arrowheads at the route's ends; a two-way route squeezed into one cell shows both directions there. */
export function drawArrows(buffer: OptimizedBuffer, route: ProjectedMapRoute, look: LineLook, theme: ViewerTheme, viewport: Bounds): void {
  const arrows = routePath(route)?.arrows ?? []
  const shared = arrows.length === 2 && arrows[0]!.at.x === arrows[1]!.at.x && arrows[0]!.at.y === arrows[1]!.at.y
  for (const arrow of shared ? arrows.slice(1) : arrows) {
    const glyph = shared ? (arrow.direction.x === 0 ? '↕' : '↔') : arrowGlyph(arrow.direction)
    if (visibleIn({ ...arrow.at, width: 1, height: 1 }, viewport)) cell(buffer, arrow.at.x, arrow.at.y, glyph, look.color, theme.background, look.attributes)
  }
}

/** The frame cells routes touch at their ends, which names step around like crossings. */
export function routeEnds(route: ProjectedMapRoute): Point[] {
  const points = route.cellRoute
  return points.length < 2 ? [] : [points[0]!, points.at(-1)!]
}

/** Every cell of the drawn line in order from source to arrow. */
function lineCells(path: readonly Point[]): Point[] {
  const cells: Point[] = []
  for (let index = 1; index < path.length; index += 1) {
    const from = path[index - 1]!
    const to = path[index]!
    const step = heading(from, to)
    const length = Math.abs(to.x - from.x) + Math.abs(to.y - from.y)
    for (let at = index === 1 ? 0 : 1; at <= length; at += 1) cells.push({ x: from.x + step.x * at, y: from.y + step.y * at })
  }
  return cells
}

/** Pulses travel from source to target, one cell per animation phase, so a lit route shows its direction. */
export function drawPulses(buffer: OptimizedBuffer, route: ProjectedMapRoute, look: LineLook, theme: ViewerTheme, viewport: Bounds, phase: number): void {
  const drawn = routePath(route)
  if (drawn === undefined) return
  const cells = lineCells(drawn.path).slice(1, -1)
  for (const [distance, point] of cells.entries()) {
    const offset = ((distance - phase) % PULSE_SPACING + PULSE_SPACING) % PULSE_SPACING
    if (offset !== 0 || !visibleIn({ ...point, width: 1, height: 1 }, viewport)) continue
    cell(buffer, point.x, point.y, '●', look.color, theme.background, TextAttributes.BOLD)
  }
}

/** A lit route's short label beside its longest run, on free ground: clear of frames, lines, boxes and other labels. */
export function drawRouteLabel(
  buffer: OptimizedBuffer,
  route: ProjectedMapRoute,
  theme: ViewerTheme,
  items: readonly ProjectedMapItem[],
  taken: Bounds[],
  drawn: (x: number, y: number) => boolean,
): void {
  const label = ` ${route.description.split(' ').slice(0, 3).join(' ')} `
  const width = Math.min([...label].length, 24)
  const points = route.cellRoute
  const runs = points.slice(1).map((to, index) => ({ from: points[index]!, to }))
    .sort((a, b) => Math.abs(b.to.x - b.from.x) + Math.abs(b.to.y - b.from.y) - Math.abs(a.to.x - a.from.x) - Math.abs(a.to.y - a.from.y))
  const blocked = [...taken, ...items.filter(item => item.shape === 'card' || item.collapsed).map(item => item.cellBounds)]
  for (const { from, to } of runs) {
    const x = Math.round((from.x + to.x) / 2)
    const y = Math.round((from.y + to.y) / 2)
    const candidates = from.y === to.y
      ? [{ x: x - Math.floor(width / 2), y: y - 1 }, { x: x - Math.floor(width / 2), y: y + 1 }]
      : [{ x: x + 1, y }, { x: x - width, y }]
    const free = (candidate: Bounds) => !blocked.some(bounds => visibleIn(candidate, bounds))
      && Array.from({ length: candidate.width }, (_, offset) => !drawn(candidate.x + offset, candidate.y)).every(Boolean)
    const span = candidates.map(point => ({ ...point, width, height: 1 })).find(free)
    if (span === undefined) continue
    text(buffer, label, span.x, span.y, width, theme.selected, theme.background, 0)
    taken.push(span)
    return
  }
}
