import type { AnnotatedElement, Bounds, C4Kind, TerminalLevel } from '../../types.ts'
import type { TerminalViewModel } from './model.ts'
import type { MapDirection, ViewerState } from './navigation.ts'
import { mapAnchors } from './projection.ts'

function elementsById(model: TerminalViewModel): Map<string, AnnotatedElement> {
  return new Map(model.elements.map(element => [element.representationId, element]))
}

export function ancestorOfKind(
  element: AnnotatedElement | undefined,
  kind: C4Kind,
  byId: Map<string, AnnotatedElement>,
): AnnotatedElement | undefined {
  let current = element
  while (current && current.kind !== kind) {
    current = current.parent === null ? undefined : byId.get(current.parent)
  }
  return current
}

/** The listed building that stands first on the sheet: northmost, then westmost. */
export function firstPlaced(model: TerminalViewModel, ids: readonly string[]): string | undefined {
  const wanted = new Set(ids)
  return model.sheet.buildings.filter(building => wanted.has(building.representationId))
    .sort((a, b) => a.rect.gy - b.rect.gy || a.rect.gx - b.rect.gx)[0]?.representationId
}

/** The component an opened container selects first. */
export function firstBuilding(model: TerminalViewModel, surface: AnnotatedElement): string | undefined {
  return firstPlaced(model, model.sheet.buildings.filter(building => building.surface === surface.representationId && building.kind === 'component')
    .map(building => building.representationId))
}

/** The container with the most components, where an overview starts. */
export function firstContainer(model: TerminalViewModel): AnnotatedElement | undefined {
  const count = (id: string) => model.sheet.buildings.filter(building => building.surface === id).length
  const id = [...model.sheet.slabs].sort((a, b) => count(b.representationId) - count(a.representationId)
    || a.rect.gy - b.rect.gy || a.rect.gx - b.rect.gx)[0]?.representationId
  return model.elements.find(element => element.representationId === id)
}

export function canEnter(element: AnnotatedElement): boolean {
  return !element.external && element.kind === 'container' && element.children.length > 0
}

/** Opens a container map on its first building in map order. */
export function enterView(
  model: TerminalViewModel,
  element: AnnotatedElement,
): Pick<ViewerState, 'level' | 'currentId'> {
  return {
    level: 'components',
    currentId: firstBuilding(model, element) ?? element.representationId,
  }
}

export function leaveView(
  model: TerminalViewModel,
  state: ViewerState,
  selected: AnnotatedElement | undefined,
): Pick<ViewerState, 'level' | 'currentId'> {
  if (state.level === 'context') {
    return { level: state.level, currentId: selected?.representationId }
  }
  const byId = elementsById(model)
  const surface = ancestorOfKind(selected, 'container', byId) ?? ancestorOfKind(selected, 'system', byId)
  return {
    level: 'context',
    currentId: surface?.representationId ?? selected?.representationId,
  }
}

export function levelFor(element: AnnotatedElement): TerminalLevel {
  return element.kind === 'component' ? 'components' : 'context'
}

interface DirectionalBounds {
  start: number
  end: number
  crossStart: number
  crossEnd: number
}

function directionalBounds(bounds: Bounds, direction: MapDirection): DirectionalBounds {
  const horizontal = direction === 'left' || direction === 'right'
  const reversed = direction === 'left' || direction === 'up'
  const rawStart = horizontal ? bounds.x : bounds.y
  const rawEnd = rawStart + (horizontal ? bounds.width : bounds.height)
  return {
    start: reversed ? -rawEnd : rawStart,
    end: reversed ? -rawStart : rawEnd,
    crossStart: horizontal ? bounds.y : bounds.x,
    crossEnd: horizontal ? bounds.y + bounds.height : bounds.x + bounds.width,
  }
}

function middle(start: number, end: number): number {
  return (start + end) / 2
}

function inDirection(from: DirectionalBounds, to: DirectionalBounds): boolean {
  const forward = middle(to.start, to.end) - middle(from.start, from.end)
  return forward > 0 && (to.start >= from.end || perpendicularGap(from, to) === 0)
}

function perpendicularGap(from: DirectionalBounds, to: DirectionalBounds): number {
  return Math.max(
    0,
    Math.max(from.crossStart, to.crossStart) - Math.min(from.crossEnd, to.crossEnd),
  )
}

export function nearestInDirection(
  anchors: ReadonlyMap<string, Bounds>,
  selectedId: string,
  originBounds: Bounds,
  direction: MapDirection,
): string | undefined {
  const origin = directionalBounds(originBounds, direction)
  let best: { id: string; distance: number; centers: number } | undefined
  for (const [id, bounds] of anchors) {
    if (id === selectedId) continue
    const candidate = directionalBounds(bounds, direction)
    if (!inDirection(origin, candidate)) continue
    const cross = perpendicularGap(origin, candidate)
    const forward = middle(candidate.start, candidate.end) - middle(origin.start, origin.end)
    const perpendicular = middle(candidate.crossStart, candidate.crossEnd)
      - middle(origin.crossStart, origin.crossEnd)
    const gap = Math.max(0, candidate.start - origin.end)
    const distance = gap * gap + cross * cross
    const centers = forward * forward + perpendicular * perpendicular
    if (
      best === undefined
      || distance < best.distance
      || (distance === best.distance && centers < best.centers)
      || (distance === best.distance && centers === best.centers && id < best.id)
    ) {
      best = { id, distance, centers }
    }
  }
  return best?.id
}

type MapSize = ViewerState['mapSize']

/** At root an arrow chooses the nearest container or island building on the drawn map. */
function moveRoot(
  model: TerminalViewModel,
  currentId: string,
  direction: MapDirection,
  map: MapSize,
): string | undefined {
  const anchors = mapAnchors(model, 'context', currentId, map)
  const origin = anchors.get(currentId)
  return origin === undefined ? undefined : nearestInDirection(anchors, currentId, origin, direction)
}

/** Past the last component that way, an arrow opens the neighbouring container on the root map. */
function crossContainer(
  model: TerminalViewModel,
  selected: AnnotatedElement,
  direction: MapDirection,
  map: MapSize,
): string | undefined {
  const container = ancestorOfKind(selected, 'container', elementsById(model))
  if (container === undefined) return undefined
  const containers = new Map([...mapAnchors(model, 'context', container.representationId, map)]
    .filter(([id]) => model.sheet.slabs.some(slab => slab.representationId === id)))
  const origin = containers.get(container.representationId)
  const next = origin === undefined ? undefined : nearestInDirection(containers, container.representationId, origin, direction)
  const neighbour = model.elements.find(element => element.representationId === next)
  return neighbour === undefined ? undefined : firstBuilding(model, neighbour)
}

/** Apply the approved root and container arrow rules without changing level. */
export function moveView(
  model: TerminalViewModel,
  state: ViewerState,
  selected: AnnotatedElement,
  direction: MapDirection,
): Pick<ViewerState, 'level' | 'currentId'> {
  const level = state.level
  if (level === 'context') {
    return {
      level,
      currentId: moveRoot(model, selected.representationId, direction, state.mapSize)
        ?? selected.representationId,
    }
  }
  const anchors = mapAnchors(model, level, selected.representationId, state.mapSize)
  const origin = anchors.get(selected.representationId)
  if (origin === undefined) return { level, currentId: selected.representationId }
  const next = nearestInDirection(anchors, selected.representationId, origin, direction)
  const member = next === undefined ? undefined : nearestMember(model, next, selected.representationId)
  return { level, currentId: member ?? crossContainer(model, selected, direction, state.mapSize) ?? selected.representationId }
}

/** An arrow onto a collapsed group opens it on the member nearest the component it left. */
function nearestMember(model: TerminalViewModel, id: string, from: string): string {
  const group = model.sheet.zones.find(zone => zone.key === id)
  if (group === undefined) return id
  const centre = (key: string) => {
    const rect = model.sheet.buildings.find(building => building.representationId === key)?.rect
    return rect === undefined ? { x: 0, y: 0 } : { x: rect.gx + rect.w / 2, y: rect.gy + rect.d / 2 }
  }
  const origin = centre(from)
  const distance = (key: string) => (centre(key).x - origin.x) ** 2 + (centre(key).y - origin.y) ** 2
  return [...group.members].sort((a, b) => distance(a) - distance(b))[0] ?? id
}
