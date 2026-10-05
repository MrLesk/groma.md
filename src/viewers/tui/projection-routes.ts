import { routeAll, type Endpoint, type RouteRequest } from '../../sheet/route/route.ts'
import type { Bounds, Origin, Point } from '../../types.ts'
import type { TerminalViewModel } from './model.ts'
import type { WorldItem } from './projection.ts'
import { visibleItemFor } from './projection-sheet.ts'

/** One route between the drawn ends of the relationships it stands for. */
export interface SheetRoute {
  ids: string[]
  source: string
  target: string
  description: string
  origin: Origin
  /** Relationships also run from target to source, so both ends carry an arrow. */
  twoWay: boolean
  /** Terminal cells from the source frame to the target frame. */
  cells: Point[]
}

type Request = RouteRequest & { relationshipIds: string[]; twoWay: boolean }

/** A building or collapsed surface: one box that routes end on and go around. */
function solid(item: WorldItem): boolean {
  return item.shape === 'card' || item.collapsed === true
}

/** Each directed pair of drawn ends gets one route carrying every relationship it stands for; opposite pairs share one. */
function routeRequests(model: TerminalViewModel, items: readonly WorldItem[]): Request[] {
  const requests = new Map<string, Request>()
  for (const relationship of model.relationships) {
    const source = visibleItemFor(model, items, relationship.source)?.key
    const target = visibleItemFor(model, items, relationship.target)?.key
    if (source === undefined || target === undefined || source === target) continue
    const reverse = requests.get(`${target}\n${source}`)
    const known = reverse ?? requests.get(`${source}\n${target}`)
    if (known === undefined) {
      requests.set(`${source}\n${target}`, { id: relationship.id, source, target, description: relationship.description, origin: relationship.origin, relationshipIds: [relationship.id], twoWay: false })
    } else {
      known.relationshipIds.push(relationship.id)
      if (reverse !== undefined) known.twoWay = true
    }
  }
  return [...requests.values()]
}

/** Groups are not route ends, so a shape inside an open group is routed on the surface that holds the group. */
function routeOwner(item: WorldItem, byKey: ReadonlyMap<string, WorldItem>): string | undefined {
  let parent = item.parent === undefined ? undefined : byKey.get(item.parent)
  while (parent !== undefined && parent.shape === 'group' && !parent.collapsed) {
    parent = parent.parent === undefined ? undefined : byKey.get(parent.parent)
  }
  return parent?.key
}

/** Every drawn shape except an open group, as a route end in terminal cells. */
function endpointsOf(items: readonly WorldItem[]): Map<string, Endpoint> {
  const byKey = new Map(items.map(item => [item.key, item]))
  return new Map(items.flatMap((item): [string, Endpoint][] => {
    if (item.shape === 'group' && !item.collapsed) return []
    const cells = item.worldBounds
    const kind = solid(item) ? 'building' : item.shape === 'island' ? 'island' : 'slab'
    const owner = routeOwner(item, byKey)
    return [[item.key, {
      key: item.key, kind, rect: { gx: cells.x, gy: cells.y, w: cells.width - 1, d: cells.height - 1 },
      ...(owner === undefined ? {} : { owner }), ...(kind === 'building' ? { roof: 0 } : {}),
    }]]
  }))
}

/** Which way a frame cell faces: -1 on the low side, 1 on the high side, 0 when the end is not on that axis's sides. */
function outward(end: Point, bounds: Bounds, axis: 'x' | 'y'): number {
  const start = axis === 'x' ? bounds.x : bounds.y
  const last = start + (axis === 'x' ? bounds.width : bounds.height) - 1
  if (end[axis] === start) return -1
  return end[axis] === last ? 1 : 0
}

/** A cell from its coordinate along a run and its coordinate across it. */
function cellAt(across: 'x' | 'y', acrossValue: number, alongValue: number): Point {
  return across === 'x' ? { x: acrossValue, y: alongValue } : { x: alongValue, y: acrossValue }
}

/** The run from the other end to `next` keeps its line near the other end and steps onto `value` halfway along. */
function jogged(cells: readonly Point[], other: number, next: number, across: 'x' | 'y', value: number): Point[] {
  const along = across === 'x' ? 'y' : 'x'
  const middle = Math.round((cells[other]![along] + cells[next]![along]) / 2)
  const near = cellAt(across, cells[other]![across], middle)
  const far = cellAt(across, value, middle)
  const result = [...cells]
  result[next] = { ...cells[next]!, [across]: value }
  result.splice(Math.max(other, next), 0, ...(other < next ? [near, far] : [far, near]))
  return result
}

/**
 * Rounds core's cell coordinates to terminal cells. A route leaves and enters a frame across it, so the run beside
 * each end stays at least one cell off that frame even when core's half-cell jog would round onto it. When that run
 * also carries the other end and no single line meets both sides, it jogs halfway along.
 */
function toCells(points: readonly { gx: number; gy: number }[], ends: [Bounds, Bounds]): Point[] {
  const rounded = points.map(point => ({ x: Math.round(point.gx), y: Math.round(point.gy) }))
  return clearEnd(clearEnd(rounded, points, 0, ends), points, 1, ends)
}

/** Keeps the run beside one end a cell off that end's frame; `end` 0 is the source, 1 the target. */
function clearEnd(cells: Point[], points: readonly { gx: number; gy: number }[], end: 0 | 1, ends: [Bounds, Bounds]): Point[] {
  const index = end === 0 ? 0 : cells.length - 1
  const next = end === 0 ? 1 : cells.length - 2
  const other = end === 0 ? cells.length - 1 : 0
  const across = points[index]!.gx === points[next]!.gx ? 'y' : 'x'
  const away = outward(cells[index]!, ends[end], across)
  const wall = cells[index]![across]
  if (away === 0 || cells[next]![across] !== wall) return cells
  // The whole run beside the end moves: every point that shared its coordinate in core's route.
  const shared = across === 'x' ? 'gx' : 'gy'
  const moving = [...points.keys()].filter(at => at !== index && points[at]![shared] === points[next]![shared])
  if (moving.includes(other) && !meetsSide(ends[1 - end]!, across, wall + away)) return jogged(cells, other, next, across, wall + away)
  for (const at of moving) cells[at]![across] = wall + away
  return cells
}

/** Whether a line at `value` across this axis meets the box's side away from its corners. */
function meetsSide(box: Bounds, across: 'x' | 'y', value: number): boolean {
  const start = across === 'x' ? box.x : box.y
  return value > start && value < start + (across === 'x' ? box.width : box.height) - 1
}

function within(point: Point, box: Bounds): boolean {
  return point.x >= box.x && point.x <= box.x + box.width - 1 && point.y >= box.y && point.y <= box.y + box.height - 1
}

/** The first cell of the run from `from` toward `to` that lies on the box. */
function entering(from: Point, to: Point, box: Bounds): Point {
  const step = { x: Math.sign(to.x - from.x), y: Math.sign(to.y - from.y) }
  let cell = { ...from }
  while (!within(cell, box) && (cell.x !== to.x || cell.y !== to.y)) cell = { x: cell.x + step.x, y: cell.y + step.y }
  return cell
}

/**
 * Core finishes a route behind a building's back wall, where the iso roof hides it. Every terminal wall is visible, so
 * a route ends where it first meets its target frame and starts where it last leaves its source frame.
 */
function clipToEnds(points: readonly Point[], [source, target]: [Bounds, Bounds]): Point[] {
  let last = points.length - 2
  while (last > 0 && within(points[last]!, target)) last -= 1
  const clipped = [...points.slice(0, last + 1), entering(points[last]!, points[last + 1]!, target)]
  let first = 1
  while (first < clipped.length - 1 && within(clipped[first]!, source)) first += 1
  return [entering(clipped[first]!, clipped[first - 1]!, source), ...clipped.slice(first)]
}

function clamp(value: number, low: number, high: number): number {
  return Math.max(low, Math.min(high, value))
}

/** A route end on a frame meets its side away from the corners; the run leaving it moves along. */
function clampPort(points: Point[], end: 'first' | 'last', bounds: Bounds): void {
  const point = points[end === 'first' ? 0 : points.length - 1]!
  const neighbour = points[end === 'first' ? 1 : points.length - 2]
  const axis = point.x === bounds.x || point.x === bounds.x + bounds.width - 1 ? 'y' : 'x'
  const start = axis === 'y' ? bounds.y : bounds.x
  const value = clamp(point[axis], start + 1, start + (axis === 'y' ? bounds.height : bounds.width) - 2)
  if (neighbour !== undefined && neighbour[axis] === point[axis]) neighbour[axis] = value
  point[axis] = value
}

/** One straight run of a route: on row `at` across columns `low`..`high`, or on column `at` across rows. */
interface Run {
  horizontal: boolean
  at: number
  low: number
  high: number
}

function runOf(from: Point, to: Point): Run {
  const horizontal = from.y === to.y
  const ends = horizontal ? [from.x, to.x] : [from.y, to.y]
  return { horizontal, at: horizontal ? from.y : from.x, low: Math.min(...ends), high: Math.max(...ends) }
}

/** The frame lines of every shape, each as a run. */
function frameRuns(items: readonly WorldItem[]): Run[] {
  return items.map(item => item.worldBounds).flatMap(b => [
    { horizontal: true, at: b.y, low: b.x, high: b.x + b.width - 1 },
    { horizontal: true, at: b.y + b.height - 1, low: b.x, high: b.x + b.width - 1 },
    { horizontal: false, at: b.x, low: b.y, high: b.y + b.height - 1 },
    { horizontal: false, at: b.x + b.width - 1, low: b.y, high: b.y + b.height - 1 },
  ])
}

function lying(run: Run, frames: readonly Run[]): boolean {
  return frames.some(frame => frame.horizontal === run.horizontal && frame.at === run.at && Math.min(run.high, frame.high) - Math.max(run.low, frame.low) >= 1)
}

function crossesInside(run: Run, boxes: readonly Bounds[]): boolean {
  return boxes.some(box => run.horizontal
    ? run.at > box.y && run.at < box.y + box.height - 1 && run.low < box.x + box.width - 1 && run.high > box.x
    : run.at > box.x && run.at < box.x + box.width - 1 && run.low < box.y + box.height - 1 && run.high > box.y)
}

/** Whether an end run on this line still meets its shape's side away from the corners. */
function meets(end: Bounds | undefined, run: Run): boolean {
  return end === undefined || meetsSide(end, run.horizontal ? 'y' : 'x', run.at)
}

/** Rounding can land a run on a frame line; it moves to the nearest free line within two cells, outside any box. */
function clearOfFrames(points: Point[], frames: readonly Run[], boxes: readonly Bounds[], ends: [Bounds, Bounds]): void {
  for (let index = 0; index + 1 < points.length; index += 1) {
    const run = runOf(points[index]!, points[index + 1]!)
    if (!lying(run, frames)) continue
    const own = [index === 0 ? ends[0] : undefined, index + 2 === points.length ? ends[1] : undefined]
    const moved = [run.at + 1, run.at - 1, run.at + 2, run.at - 2].map(at => ({ ...run, at }))
      .find(candidate => !lying(candidate, frames) && !crossesInside(candidate, boxes) && own.every(end => meets(end, candidate)))
    if (moved === undefined) continue
    for (const point of [points[index]!, points[index + 1]!]) {
      if (run.horizontal) point.y = moved.at
      else point.x = moved.at
    }
  }
}

/** Without repeated cells or a corner that does not turn. */
function compact(points: readonly Point[]): Point[] {
  const kept: Point[] = []
  for (const point of points) {
    const previous = kept.at(-1)
    if (previous !== undefined && previous.x === point.x && previous.y === point.y) continue
    const before = kept.at(-2)
    const straight = before !== undefined && previous !== undefined
      && (before.x === previous.x) === (previous.x === point.x) && (before.y === previous.y) === (previous.y === point.y)
    if (straight) kept[kept.length - 1] = point
    else kept.push(point)
  }
  return kept
}

/**
 * Core routes the relationships between the shapes one depth draws, on their terminal cells: a collapsed container
 * or group is one obstacle and one end. Its half-cell lanes close up into shared lines once rounded to cells, and the
 * finishing passes keep each end on its frame and every run off the frames it passes.
 */
export function terminalRoutes(model: TerminalViewModel, items: readonly WorldItem[]): SheetRoute[] {
  const requests = routeRequests(model, items)
  const twoWay = new Map(requests.map(request => [request.id, request.twoWay]))
  const bounds = new Map(items.map(item => [item.key, item.worldBounds]))
  const frames = frameRuns(items)
  const boxes = items.filter(solid).map(item => item.worldBounds)
  return routeAll(endpointsOf(items), requests.map(({ twoWay: _, ...request }) => request)).map(route => {
    const ends: [Bounds, Bounds] = [bounds.get(route.source)!, bounds.get(route.target)!]
    const cells = clipToEnds(compact(toCells(route.points, ends)), ends)
    clampPort(cells, 'first', ends[0])
    clampPort(cells, 'last', ends[1])
    clearOfFrames(cells, frames, boxes, ends)
    return {
      ids: [...route.relationshipIds ?? [route.id]], source: route.source, target: route.target,
      description: route.description, origin: route.origin, twoWay: twoWay.get(route.id) ?? false, cells: compact(cells),
    }
  })
}
