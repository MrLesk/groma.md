import { ARC_STEP } from '../../icons/parts.ts'
import type { Axis, IconMark, IconPart, Prism, Spot } from '../../icons/parts.ts'
import { CELL_HEIGHT, towardsReader } from '../projection/project.ts'
import type { ProjectionView } from '../projection/project.ts'

/**
 * What the reader sees of an icon object, in icon units: its parts back to front, the faces of each prism that
 * are turned to the reader, and where a mark lies. The painter in icons.ts lays these points onto the screen.
 */

/** A point or a direction of an icon object: x and y on its footprint and z up. */
export type IconPoint = readonly [x: number, y: number, z: number]

/** The way a face is turned, which decides its shade as for a building: up, or a wall on the reader's left or right. */
export type Tone = 'top' | 'left' | 'right'

export interface IconFace {
  points: IconPoint[]
  tone: Tone
}

const RAD = Math.PI / 180
/** A face turned less than this towards the reader is seen edge on and not drawn. */
const SEEN = 1e-6
/** A wall turned less than this to one side faces the reader head on; like a curved building's band it takes the left shade. */
const HEAD_ON = 1e-6
/** Where an outline turns by more than this many degrees two walls meet in an edge that is drawn; a gentler turn is a curve. */
const CREASE = 2 * ARC_STEP
/** Points closer than this are one point, and parts closer than this touch without overlapping. */
const TOUCH = 1e-6

function dot(left: IconPoint, right: IconPoint): number {
  return left[0] * right[0] + left[1] * right[1] + left[2] * right[2]
}

/** The point of an outline spot at `along` on the prism's axis. A direction on the outline's plane is lifted with `along` 0. */
function lift(axis: Axis, [a, b]: Spot, along: number): IconPoint {
  return axis === 'z' ? [a, b, along] : [a, along, b]
}

/** The shade of a face turned `outward`: the top when it mostly faces up, else the wall on the reader's left or right. */
function toneOf(outward: IconPoint, view: ProjectionView): Tone {
  const [x, y, z] = outward
  if (z > Math.max(Math.abs(x), Math.abs(y))) return 'top'
  const yaw = view.yaw * RAD
  // The ground direction that runs to the right on screen is (cos yaw, -sin yaw).
  return x * Math.cos(yaw) - y * Math.sin(yaw) > HEAD_ON ? 'right' : 'left'
}

/** An outline without points that repeat their neighbour, so every edge has a length. */
function distinct(outline: readonly Spot[]): Spot[] {
  return outline.filter(([a, b], index) => {
    const [c, d] = outline[(index + outline.length - 1) % outline.length]!
    return Math.hypot(a - c, b - d) > TOUCH
  })
}

/** Degrees between two headings, from 0 (the same way) to 180 (the opposite way). */
function turnBetween(heading: number, other: number): number {
  return Math.abs(((heading - other + 540) % 360) - 180)
}

/** One edge of a prism's outline: the wall that rises from it. */
interface Wall {
  /** The way the wall faces, one unit long. */
  outward: IconPoint
  seen: boolean
  /** True when this wall meets the wall before it in an edge, not in a curve. */
  creased: boolean
}

function walls(prism: Prism, outline: readonly Spot[], reader: IconPoint): Wall[] {
  const next = (index: number): Spot => outline[(index + 1) % outline.length]!
  // Twice the outline's area. Its sign is the way round the outline runs, which tells the outer side of an edge.
  const winding = Math.sign(outline.reduce((sum, [a, b], index) => sum + a * next(index)[1] - next(index)[0] * b, 0))
  const heading = outline.map(([a, b], index) => Math.atan2(next(index)[1] - b, next(index)[0] - a) / RAD)
  return outline.map(([a, b], index) => {
    const [c, d] = next(index)
    const length = Math.hypot(c - a, d - b)
    const outward = lift(prism.axis, [winding * (d - b) / length, -winding * (c - a) / length], 0)
    const before = heading[(index + outline.length - 1) % outline.length]!
    return { outward, seen: dot(outward, reader) > SEEN, creased: turnBetween(heading[index]!, before) > CREASE }
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
 * The faces of a prism that are turned to the reader, back to front: its walls, then the end that faces the
 * reader. Walls along a curve form one face, so a cylinder shows no line between them.
 */
export function prismFaces(prism: Prism, view: ProjectionView): IconFace[] {
  const reader = towardsReader(view)
  const outline = distinct(prism.outline)
  const ends = [prism.from, prism.from + prism.length]
  const all = walls(prism, outline, reader)
  const depth = (face: IconFace): number => face.points.reduce((sum, point) => sum + dot(point, reader), 0) / face.points.length
  const seenWalls = wallRuns(all).map((run): IconFace => {
    const spots = [...run, (run.at(-1)! + 1) % outline.length].map(index => outline[index]!)
    const facing = run.reduce<IconPoint>((sum, index) => {
      const [x, y, z] = all[index]!.outward
      return [sum[0] + x, sum[1] + y, sum[2] + z]
    }, [0, 0, 0])
    return {
      points: [...spots.map(spot => lift(prism.axis, spot, ends[0]!)), ...spots.map(spot => lift(prism.axis, spot, ends[1]!)).reverse()],
      tone: toneOf(facing, view),
    }
  }).sort((left, right) => depth(left) - depth(right))
  // The end at `from + length` faces along the axis, the end at `from` against it.
  const axis = lift(prism.axis, [0, 0], 1)
  const along = dot(axis, reader)
  if (Math.abs(along) <= SEEN) return seenWalls
  const [end, outward]: [number, IconPoint] = along > 0 ? [ends[1]!, axis] : [ends[0]!, [-axis[0], -axis[1], -axis[2]]]
  return [...seenWalls, { points: outline.map(spot => lift(prism.axis, spot, end)), tone: toneOf(outward, view) }]
}

/** The box around a part: its least and greatest x, y and z. */
export function boundsOf(part: IconPart): { min: IconPoint; max: IconPoint } {
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

/** The front of an object: how far its foremost part reaches towards the reader, in footprint sides from the north edge. */
export function frontOf(parts: readonly IconPart[]): number {
  return Math.max(...parts.map(part => boundsOf(part).max[1]))
}

/**
 * How far behind its footprint an object's drawing reaches, in footprint sides. An object rises on screen: in the
 * map's home view a point at height z is drawn over the ground z * CELL_HEIGHT / 2 behind it.
 */
export function reachBehind(parts: readonly IconPart[]): number {
  return Math.max(...parts.map(boundsOf).map(({ min, max }) => max[2] * CELL_HEIGHT / 2 - min[1]))
}

/**
 * Where a mark's pairs lie on its part: on the part's top, or on its wall towards +y or +x. Undefined when
 * that face is turned away from the reader.
 */
export function markPoints(part: Prism, mark: IconMark, view: ProjectionView): IconPoint[] | undefined {
  const reader = towardsReader(view)
  const { max } = boundsOf(part)
  const pairs = Array.from({ length: mark.line.length / 2 }, (_, index) => [mark.line[2 * index]!, mark.line[2 * index + 1]!] as const)
  if (mark.on === 'top') return reader[2] > SEEN ? pairs.map(([x, y]) => [x, y, max[2]]) : undefined
  if (mark.on === 'south') return reader[1] > SEEN ? pairs.map(([x, z]) => [x, max[1], z]) : undefined
  return reader[0] > SEEN ? pairs.map(([y, z]) => [max[0], y, z]) : undefined
}

/**
 * True when `front` hides part of `back`, so it is drawn later. Where the two footprints overlap, the higher
 * part stands on the lower one. Where a ground axis separates them, the part on the reader's side of that axis
 * is the nearer one. A part that is nearer on one axis and farther on the other stands beside the other on
 * screen, so neither hides the other.
 */
function hides(front: { min: IconPoint; max: IconPoint }, back: { min: IconPoint; max: IconPoint }, reader: IconPoint): boolean {
  const eastOf = front.min[0] >= back.max[0] - TOUCH
  const westOf = back.min[0] >= front.max[0] - TOUCH
  const southOf = front.min[1] >= back.max[1] - TOUCH
  const northOf = back.min[1] >= front.max[1] - TOUCH
  if (!eastOf && !westOf && !southOf && !northOf) return front.min[2] > back.min[2]
  const [nearerX, fartherX] = reader[0] > 0 ? [eastOf, westOf] : [westOf, eastOf]
  const [nearerY, fartherY] = reader[1] > 0 ? [southOf, northOf] : [northOf, southOf]
  return (nearerX && !fartherY) || (nearerY && !fartherX)
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
