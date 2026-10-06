import type { Bounds } from '../../types.ts'
import type { ProjectedMapItem, TerminalProjection } from './projection.ts'

/** Starts quickly and settles gently. */
export function ease(t: number): number {
  return 1 - (1 - t) ** 3
}

function lerp(from: number, to: number, t: number): number {
  return Math.round(from + (to - from) * t)
}

function blend(from: Bounds, to: Bounds, t: number): Bounds {
  const x = lerp(from.x, to.x, t)
  const y = lerp(from.y, to.y, t)
  return { x, y, width: Math.max(1, lerp(from.x + from.width, to.x + to.width, t) - x), height: Math.max(1, lerp(from.y + from.height, to.y + to.height, t) - y) }
}

function same(a: Bounds, b: Bounds): boolean {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
}

/** Where a shape that only one side draws stands on the other: inside its nearest shared ancestor, at its relative place. */
function emergence(item: ProjectedMapItem, own: ReadonlyMap<string, ProjectedMapItem>, other: ReadonlyMap<string, ProjectedMapItem>): Bounds {
  let parent = item.parent === undefined ? undefined : own.get(item.parent)
  while (parent !== undefined && !other.has(parent.key)) parent = parent.parent === undefined ? undefined : own.get(parent.parent)
  if (parent === undefined) return item.cellBounds
  const before = parent.cellBounds
  const after = other.get(parent.key)!.cellBounds
  const scaleX = after.width / Math.max(1, before.width)
  const scaleY = after.height / Math.max(1, before.height)
  return {
    x: Math.round(after.x + (item.cellBounds.x - before.x) * scaleX),
    y: Math.round(after.y + (item.cellBounds.y - before.y) * scaleY),
    width: Math.max(1, Math.round(item.cellBounds.width * scaleX)),
    height: Math.max(1, Math.round(item.cellBounds.height * scaleY)),
  }
}

/**
 * One frame between two projections. Shapes both draw glide to their new cells; shapes only the new one
 * draws grow out of their container, and the ones it drops shrink into it. Routes return once the shapes settle.
 */
export function morph(from: TerminalProjection, to: TerminalProjection, t: number): TerminalProjection {
  if (t >= 1) return to
  const before = new Map(from.items.map(item => [item.key, item]))
  const after = new Map(to.items.map(item => [item.key, item]))
  const moving = (item: ProjectedMapItem, bounds: Bounds) => ({ ...item, cellBounds: bounds, ...(same(bounds, item.cellBounds) ? {} : { moving: true }) })
  const items = to.items.map(item => {
    const known = before.get(item.key)
    const start = known?.cellBounds ?? emergence(item, after, before)
    return moving(item, blend(start, item.cellBounds, t))
  })
  const leaving = from.items.filter(item => !after.has(item.key))
    .map(item => ({ ...item, cellBounds: blend(item.cellBounds, emergence(item, before, after), t), moving: true }))
  return { ...to, items: [...leaving, ...items].sort((a, b) => order(a) - order(b)), relationships: [] }
}

const DEPTH: Record<ProjectedMapItem['shape'], number> = { island: 0, slab: 1, group: 2, card: 3 }

function order(item: ProjectedMapItem): number {
  return DEPTH[item.shape]
}

/** The same projection seen from a camera that still lags behind by `offset` cells. */
function shifted(projection: TerminalProjection, offset: { x: number; y: number }): TerminalProjection {
  if (offset.x === 0 && offset.y === 0) return projection
  return {
    ...projection,
    items: projection.items.map(item => ({ ...item, cellBounds: { ...item.cellBounds, x: item.cellBounds.x + offset.x, y: item.cellBounds.y + offset.y } })),
    relationships: projection.relationships.map(route => ({ ...route, cellRoute: route.cellRoute.map(point => ({ x: point.x + offset.x, y: point.y + offset.y })) })),
  }
}

/** One frame of a camera glide: the new projection seen from a camera part way from the old one. */
export function glide(from: TerminalProjection, to: TerminalProjection, t: number): TerminalProjection {
  return shifted(to, {
    x: Math.round((to.camera.x - from.camera.x) * (1 - t)),
    y: Math.round((to.camera.y - from.camera.y) * (1 - t)),
  })
}
