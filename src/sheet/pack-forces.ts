import { ENTRY_DRIFT, GAP, PARTNER_ALIGN, PARTNER_PULL, SIBLING_PUSH, SIBLING_SPREAD, SURFACE_GRAVITY } from './forces.ts'
import { shelfAround, type Partnered, type Shelf } from './pack.ts'

/** Rounds of the force balance. */
const ROUNDS = 240
/** Cells a child may move in the first round; the step shrinks to nothing over the rounds, so the balance comes to rest. */
const STEP = 1
/** Sweeps of half-way pushes before snapping; the whole-cell steps after snapping clear whatever they leave. */
const SWEEPS = 200
/** Rounding tolerance when a gap is compared with the sibling gap. */
const EPSILON = 1e-6

/** A child by its centre and size, with the force gathered on it in the current round. */
interface Body {
  x: number
  y: number
  w: number
  d: number
  entry: boolean
  fx: number
  fy: number
}

/** Two partners and the number of relationships between them. */
type Spring = [Body, Body, number]

/** Centres farther than these neighbouring cells cannot exert a short-range sibling force. */
class NearbyBodies {
  private cells = new Map<number, Map<number, Set<number>>>()
  private xs: number[] = []
  private ys: number[] = []
  private width: number
  private depth: number
  private bodies: readonly Body[]
  private padding: number

  constructor(bodies: readonly Body[], padding: number) {
    this.bodies = bodies
    this.padding = padding
    this.width = Math.max(...bodies.map(body => body.w)) + padding
    this.depth = Math.max(...bodies.map(body => body.d)) + padding
    bodies.forEach((_, index) => { this.move(index) })
  }

  move(index: number): void {
    const body = this.bodies[index]!
    const x = Math.floor(body.x / this.width)
    const y = Math.floor(body.y / this.depth)
    if (x === this.xs[index] && y === this.ys[index]) return
    this.cells.get(this.xs[index]!)?.get(this.ys[index]!)?.delete(index)
    const column = this.cells.get(x) ?? new Map<number, Set<number>>()
    const cell = column.get(y) ?? new Set<number>()
    cell.add(index)
    column.set(y, cell)
    this.cells.set(x, column)
    this.xs[index] = x
    this.ys[index] = y
  }

  later(index: number, after: number): number[] {
    const body = this.bodies[index]!
    const radiusX = (body.w + this.width + this.padding) / 2
    const radiusY = (body.d + this.depth + this.padding) / 2
    const x0 = Math.floor((body.x - radiusX) / this.width)
    const x1 = Math.floor((body.x + radiusX) / this.width)
    const y0 = Math.floor((body.y - radiusY) / this.depth)
    const y1 = Math.floor((body.y + radiusY) / this.depth)
    const later: number[] = []
    for (let x = x0; x <= x1; x += 1) {
      for (let y = y0; y <= y1; y += 1) {
        for (const other of this.cells.get(x)?.get(y) ?? []) {
          if (other <= after) continue
          const candidate = this.bodies[other]!
          if (this.close(body, candidate)) later.push(other)
        }
      }
    }
    return later.sort((a, b) => a - b)
  }

  private close(a: Body, b: Body): boolean {
    return Math.abs(b.x - a.x) - (b.w + a.w) / 2 < this.padding
      && Math.abs(b.y - a.y) - (b.d + a.d) / 2 < this.padding
  }
}

/** Keep the original pair order, including new neighbours created by a collision move. */
function nearbyPairs(bodies: readonly Body[], padding: number, visit: (a: Body, b: Body) => boolean): void {
  const nearby = new NearbyBodies(bodies, padding)
  for (let i = 0; i < bodies.length; i += 1) {
    let after = i
    for (let later = nearby.later(i, after); later.length; later = nearby.later(i, after)) {
      let moved = false
      for (const j of later) {
        after = j
        if (!visit(bodies[i]!, bodies[j]!)) continue
        nearby.move(i)
        nearby.move(j)
        moved = true
        break
      }
      if (!moved) break
    }
  }
}

/** The clear cells between two bodies and the axis across that gap: side by side (x) or one behind the other (y). */
function gapBetween(a: Body, b: Body): { gap: number, alongX: boolean, sign: number } {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const gx = Math.abs(dx) - (a.w + b.w) / 2
  const gy = Math.abs(dy) - (a.d + b.d) / 2
  const alongX = gx >= gy
  return { gap: alongX ? gx : gy, alongX, sign: Math.sign(alongX ? dx : dy) || 1 }
}

/** Equal and opposite forces along one axis: `b` gets `amount` and `a` gets `-amount`. */
function forcePair(a: Body, b: Body, alongX: boolean, amount: number): void {
  if (alongX) {
    a.fx -= amount
    b.fx += amount
  } else {
    a.fy -= amount
    b.fy += amount
  }
}

/** Every two siblings push apart until SIBLING_SPREAD cells of ground stand between them, partners too. */
function push(bodies: readonly Body[]): void {
  nearbyPairs(bodies, SIBLING_SPREAD, (a, b) => {
    const { gap, alongX, sign } = gapBetween(a, b)
    if (gap < SIBLING_SPREAD) forcePair(a, b, alongX, sign * SIBLING_PUSH * (SIBLING_SPREAD - gap))
    return false
  })
}

/** Partners pull toward the sibling gap across and toward facing each other along it. */
function pull(springs: readonly Spring[]): void {
  for (const [a, b, count] of springs) {
    const { gap, alongX, sign } = gapBetween(a, b)
    if (gap > GAP) forcePair(a, b, alongX, -sign * PARTNER_PULL * count * (gap - GAP))
    const offset = alongX ? b.y - a.y : b.x - a.x
    forcePair(a, b, !alongX, -PARTNER_ALIGN * count * offset)
  }
}

function settleRound(bodies: readonly Body[], springs: readonly Spring[], step: number): void {
  for (const body of bodies) {
    body.fx = 0
    body.fy = 0
  }
  push(bodies)
  pull(springs)
  const cx = bodies.reduce((sum, body) => sum + body.x, 0) / bodies.length
  const cy = bodies.reduce((sum, body) => sum + body.y, 0) / bodies.length
  for (const body of bodies) {
    const fx = body.fx + SURFACE_GRAVITY * (cx - body.x) - (body.entry ? ENTRY_DRIFT : 0)
    const fy = body.fy + SURFACE_GRAVITY * (cy - body.y)
    const length = Math.hypot(fx, fy)
    const scale = length > step ? step / length : 1
    body.x += fx * scale
    body.y += fy * scale
  }
  keepEntriesWest(bodies)
}

/** Nothing stands west of the entries: the outside feeds a surface from the west. */
function keepEntriesWest(bodies: readonly Body[]): void {
  const edges = bodies.flatMap(body => body.entry ? [body.x - body.w / 2] : [])
  if (edges.length === 0) return
  const west = Math.min(...edges)
  for (const body of bodies) {
    if (!body.entry) body.x = Math.max(body.x, west + body.w / 2)
  }
}

/** Calls `fix` for every pair closer than the sibling gap, with the gap still missing; reports whether any was. */
function tooClose(bodies: readonly Body[], fix: (a: Body, b: Body, missing: number, alongX: boolean, sign: number) => void): boolean {
  let found = false
  nearbyPairs(bodies, GAP, (a, b) => {
    const { gap, alongX, sign } = gapBetween(a, b)
    if (gap >= GAP - EPSILON) return false
    found = true
    fix(a, b, GAP - gap, alongX, sign)
    return true
  })
  return found
}

/** Pushes both bodies of a too-close pair apart, half each way, across their separating axis. */
function separate(bodies: readonly Body[]): boolean {
  return tooClose(bodies, (a, b, missing, alongX, sign) => {
    const axis = alongX ? 'x' : 'y'
    b[axis] += sign * missing / 2
    a[axis] -= sign * missing / 2
  })
}

/**
 * Once corners sit on whole cells, the east or south body of a too-close pair steps further east or south by whole
 * cells. Bodies only ever move east and south, so the sweeps end.
 */
function separateCells(bodies: readonly Body[]): boolean {
  return tooClose(bodies, (a, b, missing, alongX) => {
    const axis = alongX ? 'x' : 'y'
    const later = b[axis] >= a[axis] ? b : a
    later[axis] += Math.ceil(missing - EPSILON)
  })
}

/**
 * Settles the children of one surface like electrons around a nucleus, starting from growth placement, with the forces
 * of forces.ts: siblings push apart until SIBLING_SPREAD cells stand between them, partners pull toward the sibling gap
 * and toward facing each other, all are drawn toward their middle, and entries drift west where the outside feeds
 * them while nothing passes west of them. Pairs left closer than the sibling gap are then pushed apart and the corners snapped to whole cells;
 * those last pushes only move east or south. The same items and start always give the same placement.
 */
export function balance(items: readonly Partnered[], start: Shelf): Shelf {
  const bodies: Body[] = items.map(item => {
    const at = start.at.get(item.key)!
    return { x: at.gx + item.w / 2, y: at.gy + item.d / 2, w: item.w, d: item.d, entry: item.entry, fx: 0, fy: 0 }
  })
  const index = new Map(items.map((item, at) => [item.key, at]))
  const springs = items.flatMap((item, i) => [...item.partners].flatMap(([key, count]): Spring[] => {
    const j = index.get(key)
    return j !== undefined && j > i ? [[bodies[i]!, bodies[j]!, count]] : []
  }))
  // Without partners nothing pulls, and the growth placement stays.
  if (springs.length === 0) return start
  for (let round = 0; round < ROUNDS; round += 1) settleRound(bodies, springs, STEP * (1 - round / ROUNDS))
  for (let sweep = 0; sweep < SWEEPS && separate(bodies); sweep += 1) keepEntriesWest(bodies)
  for (const body of bodies) {
    // Bodies the forces lined up can differ by rounding error; the tolerance keeps them on the same cell.
    body.x = Math.round(body.x - body.w / 2 + 1e-3) + body.w / 2
    body.y = Math.round(body.y - body.d / 2 + 1e-3) + body.d / 2
  }
  while (separateCells(bodies)) { /* until no pair is too close */ }
  return shelfAround(new Map(bodies.map((body, i) => [items[i]!.key, { gx: body.x - body.w / 2, gy: body.y - body.d / 2, w: body.w, d: body.d }])))
}
