import { GAP, SPOT_BEND, SPOT_DETOUR } from './forces.ts'
import { overlaps } from './grid.ts'
import type { Partnered, PartnerLink } from './pack.ts'
import type { CellRect } from './types.ts'

interface StripEntry { rect: CellRect }
interface BucketEntry<T> { entry: T; x: number; y: number }

/** Entries spanning several buckets are yielded once, at the first shared bucket. */
class Buckets<T extends StripEntry> {
  private cells = new Map<number, Map<number, BucketEntry<T>[]>>()
  private size = 16

  add(entry: T): void {
    const stored = { entry, x: Math.floor(entry.rect.gx / this.size), y: Math.floor(entry.rect.gy / this.size) }
    for (let x = stored.x; x <= Math.floor((entry.rect.gx + entry.rect.w) / this.size); x += 1) {
      const column = this.cells.get(x) ?? new Map<number, BucketEntry<T>[]>()
      this.cells.set(x, column)
      for (let y = stored.y; y <= Math.floor((entry.rect.gy + entry.rect.d) / this.size); y += 1) {
        const bucket = column.get(y) ?? []
        bucket.push(stored)
        column.set(y, bucket)
      }
    }
  }

  *query(rect: CellRect): Generator<T> {
    const x0 = Math.floor(rect.gx / this.size)
    const y0 = Math.floor(rect.gy / this.size)
    for (let x = x0; x <= Math.floor((rect.gx + rect.w) / this.size); x += 1) {
      const column = this.cells.get(x)
      if (!column) continue
      for (let y = y0; y <= Math.floor((rect.gy + rect.d) / this.size); y += 1) {
        for (const stored of column.get(y) ?? []) {
          if (x === Math.max(x0, stored.x) && y === Math.max(y0, stored.y)
            && overlaps(stored.entry.rect, rect)) yield stored.entry
        }
      }
    }
  }
}

const centre = (rect: CellRect) => ({ x: rect.gx + rect.w / 2, y: rect.gy + rect.d / 2 })
const endpoint = (rect: CellRect, offset: PartnerLink['own']) => ({ x: centre(rect).x + offset.x, y: centre(rect).y + offset.y })
const overlapX = (a: CellRect, b: CellRect) => a.gx < b.gx + b.w && b.gx < a.gx + a.w
const overlapY = (a: CellRect, b: CellRect) => a.gy < b.gy + b.d && b.gy < a.gy + a.d
const across = (x0: number, x1: number, y: number): CellRect => ({ gx: Math.min(x0, x1), gy: y - 0.5, w: Math.abs(x1 - x0), d: 1 })
const along = (x: number, y0: number, y1: number): CellRect => ({ gx: x - 0.5, gy: Math.min(y0, y1), w: 1, d: Math.abs(y1 - y0) })

function horizontalPaths(a: CellRect, b: CellRect, link: PartnerLink): CellRect[][] {
  const [west, east] = a.gx <= b.gx ? [a, b] : [b, a]
  const x0 = west.gx + west.w
  const x1 = east.gx
  const [cw, ce] = a === west
    ? [endpoint(a, link.own), endpoint(b, link.other)]
    : [endpoint(b, link.other), endpoint(a, link.own)]
  return [x0 + 0.5, (x0 + x1) / 2, x1 - 0.5].map(x => [
    across(x0, x, cw.y), along(x, cw.y, ce.y), across(x, x1, ce.y),
  ])
}

function verticalPaths(a: CellRect, b: CellRect, link: PartnerLink): CellRect[][] {
  const [north, south] = a.gy <= b.gy ? [a, b] : [b, a]
  const y0 = north.gy + north.d
  const y1 = south.gy
  const [cn, cs] = a === north
    ? [endpoint(a, link.own), endpoint(b, link.other)]
    : [endpoint(b, link.other), endpoint(a, link.own)]
  return [y0 + 0.5, (y0 + y1) / 2, y1 - 0.5].map(y => [
    along(cn.x, y0, y), across(cn.x, cs.x, y), along(cs.x, y, y1),
  ])
}

/** The existing placement choices: three Z paths for facing siblings, or both L paths. */
function paths(a: CellRect, b: CellRect, link: PartnerLink): CellRect[][] {
  if (overlapY(a, b)) return horizontalPaths(a, b, link)
  if (overlapX(a, b)) return verticalPaths(a, b, link)
  const ca = endpoint(a, link.own)
  const cb = endpoint(b, link.other)
  const ax = ca.x < cb.x ? a.gx + a.w : a.gx
  const bx = ca.x < cb.x ? b.gx : b.gx + b.w
  const ay = ca.y < cb.y ? a.gy + a.d : a.gy
  const by = ca.y < cb.y ? b.gy : b.gy + b.d
  return [
    [across(ax, cb.x, ca.y), along(cb.x, ca.y, by)],
    [along(ca.x, ay, cb.y), across(ca.x, bx, cb.y)],
  ]
}

interface Connection { source: string; target: string; link: PartnerLink }
interface Arrow { clear: number }
interface ArrowStrip extends StripEntry { arrow: Arrow; bit: number }

/** Tracks which paths remain clear as placement adds siblings, without repricing old obstacles. */
export class PackingPaths {
  private obstacles = new Buckets<StripEntry>()
  private strips = new Buckets<ArrowStrip>()
  private incident = new Map<string, Connection[]>()

  constructor(items: readonly Partnered[], placed: ReadonlyMap<string, CellRect>) {
    for (const rect of placed.values()) this.obstacles.add({ rect })
    for (const item of items) {
      for (const [target, links] of item.partners) {
        if (item.key >= target) continue
        for (const link of links) {
          const connection = { source: item.key, target, link }
          this.remember(item.key, connection)
          this.remember(target, connection)
          this.addConnection(connection, placed)
        }
      }
    }
  }

  private remember(key: string, connection: Connection): void {
    const group = this.incident.get(key) ?? []
    group.push(connection)
    this.incident.set(key, group)
  }

  private blocked(path: readonly CellRect[], a: CellRect, b: CellRect): boolean {
    for (const strip of path) {
      if (strip.w <= 0 || strip.d <= 0) continue
      for (const entry of this.obstacles.query(strip)) {
        if (entry.rect !== a && entry.rect !== b) return true
      }
    }
    return false
  }

  private addConnection(connection: Connection, placed: ReadonlyMap<string, CellRect>): void {
    const a = placed.get(connection.source)
    const b = placed.get(connection.target)
    if (!a || !b) return
    const clear = paths(a, b, connection.link).filter(path => !this.blocked(path, a, b))
    const arrow: Arrow = { clear: (1 << clear.length) - 1 }
    for (const [index, path] of clear.entries()) {
      for (const rect of path) {
        if (rect.w > 0 && rect.d > 0) this.strips.add({ rect, arrow, bit: 1 << index })
      }
    }
  }

  private affected(rect: CellRect): Map<Arrow, number> {
    const hits = new Map<Arrow, number>()
    for (const piece of this.strips.query(rect)) {
      if (piece.arrow.clear & piece.bit) hits.set(piece.arrow, (hits.get(piece.arrow) ?? 0) | piece.bit)
    }
    return hits
  }

  apart(rect: CellRect): boolean {
    const padded = { gx: rect.gx - GAP, gy: rect.gy - GAP, w: rect.w + GAP * 2, d: rect.d + GAP * 2 }
    return this.obstacles.query(padded).next().done === true
  }

  arrowCost(a: CellRect, b: CellRect, links: readonly PartnerLink[]): number {
    return links.reduce((cost, link) => {
      const ca = endpoint(a, link.own)
      const cb = endpoint(b, link.other)
      const dx = Math.abs(ca.x - cb.x)
      const dy = Math.abs(ca.y - cb.y)
      const bends = dx <= 0.5 || dy <= 0.5 ? 0 : overlapX(a, b) || overlapY(a, b) ? 2 : 1
      const detour = paths(a, b, link).every(path => this.blocked(path, a, b))
      return cost + dx + dy + SPOT_BEND * bends + (detour ? SPOT_DETOUR : 0)
    }, 0)
  }

  placementCost(rect: CellRect): number {
    let cost = 0
    for (const [arrow, blocked] of this.affected(rect)) {
      if (blocked === arrow.clear) cost += SPOT_DETOUR
    }
    return cost
  }

  add(key: string, rect: CellRect, placed: ReadonlyMap<string, CellRect>): void {
    for (const [arrow, blocked] of this.affected(rect)) arrow.clear &= ~blocked
    this.obstacles.add({ rect })
    for (const connection of this.incident.get(key) ?? []) this.addConnection(connection, placed)
  }
}
