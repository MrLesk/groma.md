import { FOLD_ASPECT, GAP } from './forces.ts'
import { EMPTY, PAD, unionRects } from './grid.ts'
import { PackingPaths } from './pack-paths.ts'
import type { CellRect } from './types.ts'

export interface ShelfItem {
  key: string
  w: number
  d: number
}

export interface Shelf {
  w: number
  d: number
  /** Each item's north corner relative to the parent's north corner. */
  at: Map<string, { gx: number; gy: number }>
}

/**
 * Shelf packing: items keep their order and fill rows of `cols` left to right,
 * GAP cells apart, PAD cells inside the parent's edge. Adding one item moves only
 * the items after it, and only the parent's size grows.
 */
export function shelf(
  items: readonly ShelfItem[],
  cols = Math.ceil(Math.sqrt(items.length)),
): Shelf {
  const at = new Map<string, { gx: number; gy: number }>()
  if (items.length === 0) return { w: EMPTY, d: EMPTY, at }
  let gy = PAD
  let widest = 0
  for (let start = 0; start < items.length; start += cols) {
    let gx = PAD
    let depth = 0
    for (const item of items.slice(start, start + cols)) {
      at.set(item.key, { gx, gy })
      gx += item.w + GAP
      depth = Math.max(depth, item.d)
    }
    widest = Math.max(widest, gx - GAP)
    gy += depth + GAP
  }
  return { w: widest + PAD, d: gy - GAP + PAD, at }
}

/** Relationship endpoints relative to the centres of their sibling packing envelopes. */
export interface PartnerLink {
  own: { x: number; y: number }
  other: { x: number; y: number }
}

export interface Partnered extends ShelfItem {
  /** True when something outside the surface feeds the item; entries stand in the west column. */
  entry: boolean
  /** Sibling keys and the actual connections to their contents. */
  partners: ReadonlyMap<string, readonly PartnerLink[]>
}

interface Partner {
  rect: CellRect
  links: readonly PartnerLink[]
}

const centre = (rect: CellRect): { x: number; y: number } => ({ x: rect.gx + rect.w / 2, y: rect.gy + rect.d / 2 })
const longer = (rect: CellRect): number => Math.max(rect.w, rect.d)
/** The item centre that aligns its endpoints with this partner's endpoints. */
function alignment(partner: Partner): { x: number; y: number } {
  const on = centre(partner.rect)
  return {
    x: on.x + partner.links.reduce((sum, link) => sum + link.other.x - link.own.x, 0) / partner.links.length,
    y: on.y + partner.links.reduce((sum, link) => sum + link.other.y - link.own.y, 0) / partner.links.length,
  }
}

/** Slide along a partner's edge to fit beside an already placed neighbour. */
function slides(item: ShelfItem, spot: { gx: number; gy: number }, occupied: readonly CellRect[], alongX: boolean): { gx: number; gy: number }[] {
  return occupied.flatMap(rect => {
    if (alongX) {
      if (spot.gy >= rect.gy + rect.d + GAP || spot.gy + item.d + GAP <= rect.gy) return []
      return [{ ...spot, gx: rect.gx - GAP - item.w }, { ...spot, gx: rect.gx + rect.w + GAP }]
    }
    if (spot.gx >= rect.gx + rect.w + GAP || spot.gx + item.w + GAP <= rect.gx) return []
    return [{ ...spot, gy: rect.gy - GAP - item.d }, { ...spot, gy: rect.gy + rect.d + GAP }]
  })
}

/** Candidate edges follow the actual endpoints; occupied slots can slide along the same edge. */
function spots(item: ShelfItem, partners: readonly Partner[], all: CellRect, occupied: readonly CellRect[]): { gx: number; gy: number }[] {
  const beside = (rect: CellRect, on: { x: number; y: number }) => {
    const edges = [
      { gx: rect.gx + rect.w + GAP, gy: Math.round(on.y - item.d / 2) },
      { gx: Math.round(on.x - item.w / 2), gy: rect.gy - GAP - item.d },
      { gx: Math.round(on.x - item.w / 2), gy: rect.gy + rect.d + GAP },
      { gx: rect.gx - GAP - item.w, gy: Math.round(on.y - item.d / 2) },
    ]
    return [...edges, ...edges.flatMap((spot, index) => slides(item, spot, occupied, index === 1 || index === 2))]
  }
  const weight = partners.reduce((sum, partner) => sum + partner.links.length, 0)
  const middle = {
    x: partners.reduce((sum, partner) => sum + partner.links.length * alignment(partner).x, 0) / weight,
    y: partners.reduce((sum, partner) => sum + partner.links.length * alignment(partner).y, 0) / weight,
  }
  return [...partners.flatMap(partner => beside(partner.rect, alignment(partner))), ...beside(all, middle)]
}

const weightOf = (item: Partnered): number => [...item.partners.values()].reduce((sum, links) => sum + links.length, 0)

interface PackingState {
  rects: Map<string, CellRect>
  paths: PackingPaths
  westEdge: number
}

function eastOfAll(rects: ReadonlyMap<string, CellRect>): { gx: number; gy: number } {
  const all = unionRects([...rects.values()])
  return all === null ? { gx: PAD, gy: PAD } : { gx: all.gx + all.w + GAP, gy: all.gy }
}

function chooseSpot(item: Partnered, state: PackingState): { gx: number; gy: number } {
  const partners: Partner[] = [...item.partners]
    .filter(([key]) => state.rects.has(key))
    .map(([key, links]) => ({ rect: state.rects.get(key)!, links }))
  let best = eastOfAll(state.rects)
  if (partners.length === 0) return best
  const all = unionRects([...state.rects.values()])!
  let bestCost = Infinity
  for (const spot of spots(item, partners, all, [...state.rects.values()])) {
    const rect = { gx: Math.max(spot.gx, state.westEdge), gy: spot.gy, w: item.w, d: item.d }
    if (!state.paths.apart(rect)) continue
    const growth = longer(unionRects([all, rect])!) - longer(all)
    const cost = partners.reduce((sum, partner) => sum + state.paths.arrowCost(rect, partner.rect, partner.links), growth)
      + state.paths.placementCost(rect)
    if (cost < bestCost) {
      best = { gx: rect.gx, gy: rect.gy }
      bestCost = cost
    }
  }
  return best
}

function placeConnected(connected: Partnered[], state: PackingState): void {
  while (connected.length > 0) {
    const index = connected.findIndex(item => [...item.partners.keys()].some(key => state.rects.has(key)))
    const [item] = connected.splice(Math.max(0, index), 1) as [Partnered]
    const rect = { ...chooseSpot(item, state), w: item.w, d: item.d }
    state.rects.set(item.key, rect)
    state.paths.add(item.key, rect, state.rects)
  }
}

function placeLoose(loose: readonly Partnered[], rects: Map<string, CellRect>): void {
  if (loose.length === 0) return
  const block = shelf(loose)
  const start = eastOfAll(rects)
  for (const item of loose) {
    const { gx, gy } = block.at.get(item.key)!
    rects.set(item.key, { gx: start.gx + gx - PAD, gy: start.gy + gy - PAD, w: item.w, d: item.d })
  }
}

/**
 * Growth placement. The entries (what the outside feeds) stand in a west
 * column, folded into a square-ish block when that column is over
 * FOLD_ASPECT times deeper than wide. Then every other connected child, the
 * heaviest first, takes the cheapest legal spot beside its placed partners
 * or beside everything placed so far; a child none of whose partners stands
 * yet starts east of everything. The children no relationship touches are
 * shelf-packed as one block last, so a world without relationships keeps
 * the shelf. Ties keep the first candidate, so the same items always give
 * the same placement.
 */
export function grow(items: readonly Partnered[]): Shelf {
  const entries = items.filter(item => item.entry)
  const weights = new Map(items.map(item => [item.key, weightOf(item)]))
  const connected = items.filter(item => !item.entry && item.partners.size > 0)
    .sort((a, b) => weights.get(b.key)! - weights.get(a.key)!)
  const loose = items.filter(item => !item.entry && item.partners.size === 0)
  if (entries.length + connected.length === 0) return shelf(items)
  const column = shelf(entries, 1)
  const west = column.d > FOLD_ASPECT * column.w ? shelf(entries) : column
  const rects = new Map<string, CellRect>(
    entries.map(item => [item.key, { ...west.at.get(item.key)!, w: item.w, d: item.d }]),
  )
  // Keep entries on the west boundary; other candidates slide east to it before scoring.
  const state = { rects, paths: new PackingPaths(items, rects), westEdge: entries.length > 0 ? PAD : -Infinity }
  placeConnected(connected, state)
  placeLoose(loose, rects)
  return shelfAround(rects)
}

/** The shelf holding `rects`, moved so their union starts PAD cells inside the parent's edge. */
export function shelfAround(rects: ReadonlyMap<string, CellRect>): Shelf {
  const all = unionRects([...rects.values()])!
  const at = new Map([...rects].map(([key, rect]) => [key, { gx: rect.gx - all.gx + PAD, gy: rect.gy - all.gy + PAD }]))
  return { w: all.w + 2 * PAD, d: all.d + 2 * PAD, at }
}
