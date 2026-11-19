import type { Axis, IconMark, IconPart, Solid, Spot } from '../../icons/parts.ts'
import type { ProjectionView } from '../projection/project.ts'

/**
 * What the reader sees of an icon object, in icon units: its parts back to front, the faces of each solid that
 * are turned to the reader, and where a mark lies. The painter in icons.ts lays these points onto the screen.
 */

/** A point of an icon object: x and y on its footprint and z up. */
export type IconPoint = readonly [x: number, y: number, z: number]

/** The way a face is turned, which decides its shade: up, towards +x (east) or towards +y (south). */
export type Tone = 'top' | 'east' | 'south'

export interface IconFace {
  points: IconPoint[]
  tone: Tone
}

const RAD = Math.PI / 180
/** A face turned less than this towards the reader is seen edge on and not drawn. */
const SEEN = 1e-6
/** Where an outline turns by more than this many degrees the two walls meet in an edge that is drawn; a gentler turn is a curve. */
const CREASE = 30
/** Parts that only touch along an edge do not count as overlapping. */
const TOUCH = 1e-6

/** The direction from an object to the reader, one unit long. */
function towardsReader(view: ProjectionView): IconPoint {
  const [yaw, pitch] = [view.yaw * RAD, view.pitch * RAD]
  return [Math.sin(yaw) * Math.cos(pitch), Math.cos(yaw) * Math.cos(pitch), Math.sin(pitch)]
}

function dot(left: IconPoint, right: IconPoint): number {
  return left[0] * right[0] + left[1] * right[1] + left[2] * right[2]
}

/** The point of an outline spot at `along` on the solid's axis. A direction on the outline's plane is lifted with `along` 0. */
function lift(axis: Axis, [a, b]: Spot, along: number): IconPoint {
  if (axis === 'z') return [a, b, along]
  if (axis === 'y') return [a, along, b]
  return [along, a, b]
}

const AXIS_TONE: Record<Axis, Tone> = { x: 'east', y: 'south', z: 'top' }

/** The shade of a wall that faces `outward`: up when it mostly faces up, else the side it faces more. */
function toneOf(outward: IconPoint): Tone {
  const [x, y, z] = outward
  if (z > Math.max(Math.abs(x), Math.abs(y))) return 'top'
  return Math.abs(x) > Math.abs(y) + SEEN ? 'east' : 'south'
}

/** An outline without points that repeat their neighbour, so every edge has a length. */
function distinct(outline: readonly Spot[]): Spot[] {
  return outline.filter(([a, b], index) => {
    const [c, d] = outline[(index + outline.length - 1) % outline.length]!
    return Math.hypot(a - c, b - d) > TOUCH
  })
}

/** One edge of a solid's outline: the wall that rises from it. */
interface Wall {
  /** The way the wall faces, one unit long. */
  outward: IconPoint
  seen: boolean
  /** True when this wall meets the wall before it in an edge, not in a curve. */
  creased: boolean
}

function walls(solid: Solid, outline: readonly Spot[], reader: IconPoint): Wall[] {
  const next = (index: number): Spot => outline[(index + 1) % outline.length]!
  // Twice the outline's area. Its sign tells which way round the outline runs, and so which side of an edge is outside.
  const round = Math.sign(outline.reduce((sum, [a, b], index) => sum + a * next(index)[1] - next(index)[0] * b, 0))
  const heading = outline.map(([a, b], index) => Math.atan2(next(index)[1] - b, next(index)[0] - a) / RAD)
  return outline.map(([a, b], index) => {
    const [c, d] = next(index)
    const length = Math.hypot(c - a, d - b)
    const outward = lift(solid.axis, [round * (d - b) / length, -round * (c - a) / length], 0)
    const turn = Math.abs(((heading[index]! - heading[(index + outline.length - 1) % outline.length]! + 540) % 360) - 180)
    return { outward, seen: dot(outward, reader) > SEEN, creased: turn > CREASE }
  })
}

/** The seen walls as runs of neighbours: a run ends where the next wall is hidden or meets it in an edge. */
function wallRuns(all: readonly Wall[]): number[][] {
  const count = all.length
  const startsRun = (index: number): boolean => all[index]!.seen && (!all[(index + count - 1) % count]!.seen || all[index]!.creased)
  const first = all.findIndex((_, index) => startsRun(index))
  if (first < 0) return []
  const runs: number[][] = []
  for (let step = 0; step < count; step++) {
    const index = (first + step) % count
    if (!all[index]!.seen) continue
    if (startsRun(index)) runs.push([])
    runs.at(-1)!.push(index)
  }
  return runs
}

/**
 * The faces of a solid that are turned to the reader, back to front: its walls, then the end that faces the
 * reader. Walls along a curve form one face, so a cylinder shows no line between them.
 */
export function solidFaces(solid: Solid, view: ProjectionView): IconFace[] {
  const reader = towardsReader(view)
  const outline = distinct(solid.outline)
  const ends = [solid.from, solid.from + solid.length]
  const all = walls(solid, outline, reader)
  const depth = (face: IconFace): number => face.points.reduce((sum, point) => sum + dot(point, reader), 0) / face.points.length
  const seenWalls = wallRuns(all).map((run): IconFace => {
    const spots = [...run, (run.at(-1)! + 1) % outline.length].map(index => outline[index]!)
    const facing = run.reduce<IconPoint>((sum, index) => {
      const [x, y, z] = all[index]!.outward
      return [sum[0] + x, sum[1] + y, sum[2] + z]
    }, [0, 0, 0])
    return {
      points: [...spots.map(spot => lift(solid.axis, spot, ends[0]!)), ...spots.map(spot => lift(solid.axis, spot, ends[1]!)).reverse()],
      tone: toneOf(facing),
    }
  }).sort((left, right) => depth(left) - depth(right))
  // The end at `from + length` faces along the axis, the end at `from` against it.
  const along = dot(lift(solid.axis, [0, 0], 1), reader)
  if (Math.abs(along) <= SEEN) return seenWalls
  const end = along > 0 ? ends[1]! : ends[0]!
  return [...seenWalls, { points: outline.map(spot => lift(solid.axis, spot, end)), tone: AXIS_TONE[solid.axis] }]
}

/** The box around a part. */
function boundsOf(part: IconPart): { min: IconPoint; max: IconPoint } {
  if (part.shape === 'ball') {
    return { min: [part.x - part.r, part.y - part.r, part.z - part.r], max: [part.x + part.r, part.y + part.r, part.z + part.r] }
  }
  const [as, bs] = [part.outline.map(([a]) => a), part.outline.map(([, b]) => b)]
  const ends = [part.from, part.from + part.length]
  return {
    min: lift(part.axis, [Math.min(...as), Math.min(...bs)], Math.min(...ends)),
    max: lift(part.axis, [Math.max(...as), Math.max(...bs)], Math.max(...ends)),
  }
}

/**
 * Where a mark's pairs lie on its part: on the part's top, or on its wall towards +y or +x. Undefined when
 * that face is turned away from the reader.
 */
export function markPoints(part: Solid, mark: IconMark, view: ProjectionView): IconPoint[] | undefined {
  const reader = towardsReader(view)
  const { max } = boundsOf(part)
  const pairs = Array.from({ length: mark.line.length / 2 }, (_, index) => [mark.line[2 * index]!, mark.line[2 * index + 1]!] as const)
  if (mark.on === 'top') return reader[2] > SEEN ? pairs.map(([x, y]) => [x, y, max[2]]) : undefined
  if (mark.on === 'south') return reader[1] > SEEN ? pairs.map(([x, z]) => [x, max[1], z]) : undefined
  return reader[0] > SEEN ? pairs.map(([y, z]) => [max[0], y, z]) : undefined
}

/**
 * True when `front` hides part of `back`, so it is drawn later. Where the two footprints overlap, the higher
 * part stands on the lower one. Where a ground axis separates them, the part on the side the reader looks
 * from is the nearer one.
 */
function hides(front: { min: IconPoint; max: IconPoint }, back: { min: IconPoint; max: IconPoint }, reader: IconPoint): boolean {
  const eastOf = front.min[0] >= back.max[0] - TOUCH
  const westOf = back.min[0] >= front.max[0] - TOUCH
  const southOf = front.min[1] >= back.max[1] - TOUCH
  const northOf = back.min[1] >= front.max[1] - TOUCH
  if (!eastOf && !westOf && !southOf && !northOf) return front.min[2] > back.min[2]
  return (reader[0] > 0 ? eastOf : westOf) || (reader[1] > 0 ? southOf : northOf)
}

/** The parts back to front: a part is drawn once no part still waiting is hidden by it. */
export function backToFront(parts: readonly IconPart[], view: ProjectionView): IconPart[] {
  const reader = towardsReader(view)
  const waiting = parts.map(part => ({ part, bounds: boundsOf(part) }))
  const drawn: IconPart[] = []
  while (waiting.length > 0) {
    const next = waiting.findIndex(candidate =>
      !waiting.some(other => other !== candidate && hides(candidate.bounds, other.bounds, reader)))
    // Two parts that each hide the other cannot be ordered; draw the first and go on.
    drawn.push(waiting.splice(Math.max(next, 0), 1)[0]!.part)
  }
  return drawn
}
