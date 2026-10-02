import type { SheetScene } from '../../sheet/types.ts'
import type { AnnotatedElement, Bounds, C4Kind, Origin, Point, TerminalLevel } from '../../types.ts'
import type { TerminalViewModel } from './model.ts'
import { projectBounds, projectPoint, type TerminalCamera } from './projection-camera.ts'
import { terminalRoutes, type SheetRoute } from './projection-routes.ts'
import { placeSheet, visibleItemFor, type SheetDepth } from './projection-sheet.ts'

export type MapKind = C4Kind | 'group'
export type MapShape = 'slab' | 'card' | 'group' | 'island'

export interface ProjectedMapItem {
  key: string
  representationId?: string
  id?: string
  title: string
  kind: MapKind
  origin: Origin
  shape: MapShape
  /** The shared building's roof name, rather than another layout of its source floors. */
  lines: string[]
  /** The drawn surface it stands in. */
  parent?: string
  /** A container or group drawn as one box standing for its contents. */
  collapsed?: boolean
  /** A collapsed box's count line. */
  note?: string
  /** The components a collapsed group stands for. */
  members?: string[]
  worldBounds: Bounds
  cellBounds: Bounds
  /** Still growing or gliding into place; its text waits until it lands. */
  moving?: boolean
}

export type WorldItem = Omit<ProjectedMapItem, 'cellBounds'>

export interface ProjectedMapRoute {
  ids: string[]
  source: string
  target: string
  description: string
  origin: Origin
  /** Relationships run both ways, so both ends carry an arrow. */
  twoWay: boolean
  /** From the source frame to the target frame, both ends on the frames. */
  worldRoute: Point[]
  cellRoute: Point[]
}

export interface TerminalProjection {
  level: TerminalLevel
  currentId: string | null
  /** Which container and groups are drawn open; empty at root. Each depth keeps its own camera. */
  depth: string
  /** The surface whose components receive keyboard navigation. */
  scope: string | null
  camera: TerminalCamera
  viewport: Bounds
  worldBounds: Bounds
  items: ProjectedMapItem[]
  relationships: ProjectedMapRoute[]
}

export interface TerminalProjectionOptions {
  viewport: Bounds
  level?: TerminalLevel
  currentId?: string
  /** Flow or task endpoints to reveal without changing architecture selection. */
  attentionIds?: readonly string[]
  /** The camera this depth showed last; selection moves it only as far as it must. */
  camera?: TerminalCamera
  /** False keeps a camera the user moved, only holding it inside the map. */
  follow?: boolean
}

/** Margins the selection keeps from the viewport edges before the camera follows it. */
const COMFORT = { x: 6, y: 2 }

const placed = new WeakMap<SheetScene, Map<string, WorldItem[]>>()
const routed = new WeakMap<WorldItem[], SheetRoute[]>()

/** Each depth is placed once per sheet, and routed once when it is drawn; selection and camera never recompute them. */
function itemsAt(model: TerminalViewModel, depth: SheetDepth | undefined): WorldItem[] {
  const cached = placed.get(model.sheet) ?? new Map<string, WorldItem[]>()
  placed.set(model.sheet, cached)
  const key = depthKey(depth)
  const items = cached.get(key) ?? placeSheet(model, depth)
  cached.set(key, items)
  return items
}

function routesOf(model: TerminalViewModel, items: WorldItem[]): SheetRoute[] {
  const routes = routed.get(items) ?? terminalRoutes(model, items)
  routed.set(items, routes)
  return routes
}

/** One key per depth, so each keeps its own camera. */
export function depthKey(depth: SheetDepth | undefined): string {
  return depth === undefined ? '' : `${depth.container}\n${depth.open ?? ''}`
}

/** The non-component surface a component scope navigates: its container, or its system when it has none. */
function focusSurface(model: TerminalViewModel, currentId: string | undefined): AnnotatedElement | undefined {
  const byId = new Map(model.elements.map(element => [element.representationId, element]))
  let current = currentId === undefined ? undefined : byId.get(currentId)
  while (current?.kind === 'component') current = current.parent === null ? undefined : byId.get(current.parent)
  return current?.external ? undefined : current
}

/**
 * The depth a scope draws. A component scope opens its container: every group when the open container fits the
 * map, otherwise only the selected component's group. A component without a container stands on its system at root.
 */
export function depthFor(model: TerminalViewModel, level: TerminalLevel, currentId: string | undefined, map: { width: number; height: number }): SheetDepth | undefined {
  if (level !== 'components') return undefined
  const surface = focusSurface(model, currentId)
  const container = surface?.representationId
  if (container === undefined || !model.sheet.slabs.some(slab => slab.representationId === container)) return undefined
  const all: SheetDepth = { container, open: 'all' }
  const open = itemsAt(model, all).find(item => item.key === container)!.worldBounds
  if (open.width <= map.width && open.height <= map.height) return all
  const group = model.sheet.zones.find(zone => zone.parent === container && currentId !== undefined && zone.members.includes(currentId))
  return { container, open: group?.key ?? null }
}

function unionBounds(bounds: readonly Bounds[], margin = 0): Bounds {
  if (bounds.length === 0) return { x: 0, y: 0, width: 1, height: 1 }
  const left = Math.min(...bounds.map(item => item.x)) - margin
  const top = Math.min(...bounds.map(item => item.y)) - margin
  const right = Math.max(...bounds.map(item => item.x + item.width)) + margin
  const bottom = Math.max(...bounds.map(item => item.y + item.height)) + margin
  return { x: left, y: top, width: right - left, height: bottom - top }
}

/**
 * A map that fits stays centred. A larger one keeps the subject inside a comfortable margin, moving the
 * previous camera only as far as needed, and never past the map's edges.
 */
function cameraAxis(subjectStart: number, subjectSize: number, worldStart: number, worldSize: number, size: number, margin: number, previous: number | undefined): number {
  if (worldSize <= size) return worldStart - Math.floor((size - worldSize) / 2)
  let camera = previous ?? Math.round(subjectStart + subjectSize / 2 - size / 2)
  const room = size - 2 * margin
  if (subjectSize > room) camera = subjectStart - margin
  else if (subjectStart - margin < camera) camera = subjectStart - margin
  else if (subjectStart + subjectSize + margin > camera + size) camera = subjectStart + subjectSize + margin - size
  return Math.max(worldStart, Math.min(worldStart + worldSize - size, camera))
}

/** Without a subject the previous camera only stays inside the map. */
function cameraFor(subject: Bounds | undefined, world: Bounds, viewport: Bounds, previous: TerminalCamera | undefined): TerminalCamera {
  const held = subject ?? { x: previous?.x ?? world.x, y: previous?.y ?? world.y, width: 0, height: 0 }
  const margin = subject === undefined ? { x: 0, y: 0 } : COMFORT
  return {
    x: cameraAxis(held.x, held.width, world.x, world.width, viewport.width, margin.x, previous?.x),
    y: cameraAxis(held.y, held.height, world.y, world.height, viewport.height, margin.y, previous?.y),
  }
}

/**
 * Scope decides keyboard stops. Root browses every box it draws: containers, island buildings and systems with
 * nothing on them. A container browses its drawn components and its collapsed groups, keyed by the group, which an
 * arrow opens on its nearest member.
 */
export function mapAnchors(model: TerminalViewModel, level: TerminalLevel, currentId: string | undefined, map: { width: number; height: number }): Map<string, Bounds> {
  const surface = level === 'components' ? focusSurface(model, currentId) : undefined
  const children = new Set(surface?.children ?? [])
  const items = itemsAt(model, depthFor(model, level, currentId, map))
  const holders = new Set(items.flatMap(item => item.parent === undefined ? [] : [item.parent]))
  return new Map(items.flatMap(item => {
    if (item.members !== undefined) return level === 'components' && item.members.some(id => children.has(id)) ? [[item.key, item.worldBounds] as const] : []
    if (item.representationId === undefined) return []
    const selectable = level === 'context'
      ? item.shape !== 'island' || !holders.has(item.key)
      : item.kind === 'component' && children.has(item.representationId)
    return selectable ? [[item.representationId, item.worldBounds] as const] : []
  }))
}

export function projectWorld(model: TerminalViewModel, options: TerminalProjectionOptions): TerminalProjection {
  const level = options.level ?? 'context'
  const depth = depthFor(model, level, options.currentId, options.viewport)
  const worldItems = itemsAt(model, depth)
  const routes = routesOf(model, worldItems)
  const worldBounds = unionBounds(worldItems.map(item => item.worldBounds), 1)
  const selected = options.currentId === undefined ? undefined : visibleItemFor(model, worldItems, options.currentId)
  const attention = (options.attentionIds ?? []).flatMap(id => visibleItemFor(model, worldItems, id) ?? [])
  const attentionBounds = attention.length > 0 ? unionBounds(attention.map(item => item.worldBounds)) : undefined
  const fits = (bounds: Bounds | undefined): bounds is Bounds => bounds !== undefined && bounds.width <= options.viewport.width && bounds.height <= options.viewport.height
  // An open group frames itself around its selected component when the viewport holds it.
  const group = selected?.parent === undefined ? undefined : worldItems.find(item => item.key === selected.parent && item.shape === 'group')
  // Distant task anchors cannot share one viewport; start at the first touched element.
  const subject = fits(attentionBounds) ? attentionBounds
    : attention[0]?.worldBounds ?? (fits(group?.worldBounds) ? group.worldBounds : selected?.worldBounds) ?? worldBounds
  const camera = cameraFor(options.follow === false && options.camera !== undefined ? undefined : subject, worldBounds, options.viewport, options.camera)
  return {
    level,
    currentId: selected?.representationId ?? null,
    depth: depthKey(depth),
    scope: level === 'components' ? focusSurface(model, options.currentId)?.representationId ?? null : null,
    camera,
    viewport: options.viewport,
    worldBounds,
    items: worldItems.map(item => ({ ...item, cellBounds: projectBounds(item.worldBounds, camera, options.viewport) })),
    relationships: routes.map(route => ({
      ids: route.ids,
      source: route.source,
      target: route.target,
      description: route.description,
      origin: route.origin,
      twoWay: route.twoWay,
      worldRoute: route.cells,
      cellRoute: route.cells.map(point => projectPoint(point, camera, options.viewport)),
    })),
  }
}

/** Inner buildings and collapsed groups win over the surfaces behind them. */
export function itemAt(items: readonly ProjectedMapItem[], x: number, y: number): ProjectedMapItem | undefined {
  return items.findLast(item => {
    const b = item.cellBounds
    return (item.representationId !== undefined || item.collapsed === true) && x >= b.x && x < b.x + b.width && y >= b.y && y < b.y + b.height
  })
}
