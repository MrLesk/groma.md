import { TextAttributes } from '@opentui/core'
import type { OptimizedBuffer } from '@opentui/core'

import { cell } from '../atoms/cell.ts'
import { LineCanvas, type LineLook } from '../atoms/lines.ts'
import type { ViewerTheme } from '../atoms/theme.ts'
import { routeTouches, visibleIn } from '../projection-camera.ts'
import { buildingLook, drawBuildingName } from '../molecules/building.ts'
import { drawFlowMarker } from '../molecules/flow-marker.ts'
import { drawArrows, drawPulses, drawRouteLabel, routeEnds, routeLook, routePath } from '../molecules/route.ts'
import { drawSurfaceName, surfaceLook, type ShapeState } from '../molecules/surface.ts'
import { drawWorkCorner } from '../molecules/work-marker.ts'
import type { ProjectedFlowStep } from '../flow.ts'
import type { ProjectedMapItem, ProjectedMapRoute, TerminalProjection } from '../projection.ts'
import type { WorkMap } from '../work/model.ts'
import type { Bounds } from '../../../types.ts'

/** Ground dots repeat every few cells, fixed to the map so they travel with it. */
const GRID = { x: 4, y: 2 }
/** Lit routes name themselves only while few enough to stay readable. */
const MAX_LABELS = 6

/** The items and routes the painter visits: only what touches the viewport. */
export function paintedWorld(projection: TerminalProjection): {
  items: ProjectedMapItem[]
  routes: ProjectedMapRoute[]
} {
  return {
    items: projection.items.filter(item => visibleIn(item.cellBounds, projection.viewport)),
    routes: projection.relationships.filter(route => routeTouches(route.cellRoute, projection.viewport)),
  }
}

function inside(bounds: Bounds, x: number, y: number): boolean {
  return x >= bounds.x && y >= bounds.y && x < bounds.x + bounds.width && y < bounds.y + bounds.height
}

/** A quiet dotted ground around the islands; the islands themselves are plain paper. */
function drawGround(buffer: OptimizedBuffer, projection: TerminalProjection, islands: readonly ProjectedMapItem[], theme: ViewerTheme): void {
  const { camera, viewport } = projection
  const firstX = viewport.x + ((GRID.x - camera.x % GRID.x) % GRID.x)
  const firstY = viewport.y + ((GRID.y - camera.y % GRID.y) % GRID.y)
  for (let y = firstY; y < viewport.y + viewport.height; y += GRID.y) {
    for (let x = firstX; x < viewport.x + viewport.width; x += GRID.x) {
      if (islands.some(island => inside(island.cellBounds, x, y))) continue
      cell(buffer, x, y, '·', theme.quiet, theme.background, TextAttributes.DIM)
    }
  }
}

export interface WorldTrace {
  pathIds: Set<string>
  onPath: (elementId: string) => boolean
  work: WorkMap
  step?: ProjectedFlowStep
  /** Advances while a lit flow moves; undefined keeps the map still. */
  animationPhase?: number
}

/** What lights up: a traced flow's legs, otherwise touched work and every route of the selection. */
interface Lighting {
  lit: (route: ProjectedMapRoute) => boolean
  routeLook: (route: ProjectedMapRoute) => LineLook
  shapeLook: (item: ProjectedMapItem) => LineLook
}

function lighting(projection: TerminalProjection, items: readonly ProjectedMapItem[], routes: readonly ProjectedMapRoute[], trace: WorldTrace, theme: ViewerTheme): Lighting {
  const tracing = trace.pathIds.size > 0
  // The selection lights its routes even while its own box is panned out of view.
  const selected = projection.items.find(item => item.representationId !== undefined && item.representationId === projection.currentId)
  const onFlow = (route: ProjectedMapRoute): boolean => route.ids.some(id => trace.pathIds.has(id))
  const worked = (route: ProjectedMapRoute): boolean => trace.work.touched.has(route.source) || trace.work.touched.has(route.target)
  const touchesSelection = (route: ProjectedMapRoute): boolean => selected !== undefined && (route.source === selected.key || route.target === selected.key)
  const lit = (route: ProjectedMapRoute): boolean => tracing ? onFlow(route) : worked(route) || touchesSelection(route)
  // A traced flow and touched work accent their ends; the selection's peers stay as they are.
  const litEnds = new Set(routes.filter(route => tracing ? onFlow(route) : worked(route)).flatMap(route => [route.source, route.target]))
  const state = (item: ProjectedMapItem): ShapeState => ({
    selected: item.key === selected?.key,
    accented: trace.work.touched.has(item.key) || litEnds.has(item.key),
    dimmed: tracing && item.representationId !== undefined && !trace.onPath(item.representationId),
  })
  const shapeLooks = new Map(items.map(item => [item, item.shape === 'card' ? buildingLook(item, theme, state(item)) : surfaceLook(item, theme, state(item))]))
  const routeLooks = new Map(routes.map(route => [route, routeLook(route, theme, lit(route), tracing && onFlow(route), tracing && !onFlow(route))]))
  return { lit, routeLook: route => routeLooks.get(route)!, shapeLook: item => shapeLooks.get(item)! }
}

/** Frames and routes in one canvas, then arrows, and the pulses of a lit flow while it moves. */
function drawLines(buffer: OptimizedBuffer, projection: TerminalProjection, items: readonly ProjectedMapItem[], routes: readonly ProjectedMapRoute[], light: Lighting, theme: ViewerTheme, phase: number | undefined): LineCanvas {
  const canvas = new LineCanvas(projection.viewport)
  for (const item of items) canvas.frame(item.cellBounds, light.shapeLook(item))
  for (const route of routes) {
    const drawn = routePath(route)
    if (drawn !== undefined) canvas.path(drawn.path, light.routeLook(route))
  }
  canvas.paint(buffer, theme.background)
  for (const route of routes) drawArrows(buffer, route, light.routeLook(route), theme, projection.viewport)
  if (phase === undefined) return canvas
  for (const route of routes.filter(light.lit)) drawPulses(buffer, route, light.routeLook(route), theme, projection.viewport, phase)
  return canvas
}

/** Names over the lines: a surface steps its name around the routes meeting its frame. Shapes still moving wait. */
function drawNames(buffer: OptimizedBuffer, items: readonly ProjectedMapItem[], routes: readonly ProjectedMapRoute[], canvas: LineCanvas, light: Lighting, theme: ViewerTheme): void {
  const ends = new Set(routes.flatMap(route => routeEnds(route).map(point => `${point.x},${point.y}`)))
  const crossings = (x: number, y: number) => canvas.crossedVertically(x, y) || ends.has(`${x},${y}`)
  for (const item of items.filter(candidate => !candidate.moving)) {
    if (item.shape === 'card') drawBuildingName(buffer, item, light.shapeLook(item), theme)
    else drawSurfaceName(buffer, item, light.shapeLook(item), theme, crossings)
  }
  const lit = routes.filter(light.lit)
  if (lit.length > MAX_LABELS) return
  const taken: Bounds[] = []
  for (const route of lit) drawRouteLabel(buffer, route, theme, items, taken, (x, y) => canvas.drawn(x, y))
}

/**
 * The world as nested frames on a dotted ground. Frames and routes share one line canvas so routes join
 * their ends with tees and cross frames with junctions; names, arrows and markers are written over it.
 */
export function drawWorld(buffer: OptimizedBuffer, projection: TerminalProjection, theme: ViewerTheme, trace: WorldTrace): void {
  const { viewport } = projection
  buffer.pushScissorRect(viewport.x, viewport.y, viewport.width, viewport.height)
  const { items, routes } = paintedWorld(projection)
  const light = lighting(projection, items, routes, trace, theme)
  // The buffer starts clear, so islands and boxes are plain wherever the ground leaves them.
  drawGround(buffer, projection, items.filter(item => item.shape === 'island'), theme)
  const canvas = drawLines(buffer, projection, items, routes, light, theme, trace.animationPhase)
  drawNames(buffer, items, routes, canvas, light, theme)
  for (const corner of trace.work.corners) {
    const item = items.find(candidate => candidate.key === corner.elementId && !candidate.moving)
    if (item !== undefined) drawWorkCorner(buffer, item, corner, theme)
  }
  if (trace.step) drawStep(buffer, items, projection, theme, trace.step)
  buffer.popScissorRect()
}

function drawStep(buffer: OptimizedBuffer, items: readonly ProjectedMapItem[], projection: TerminalProjection, theme: ViewerTheme, step: ProjectedFlowStep): void {
  const source = items.find(item => item.key === step.source.visibleKey)
  const target = items.find(item => item.key === step.target.visibleKey)
  if (source && source.key !== target?.key) drawFlowMarker(buffer, source, projection, theme, '●')
  if (target) drawFlowMarker(buffer, target, projection, theme, `▶ ${step.index + 1}/${step.total}`)
}
