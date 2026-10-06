import { centredRect } from '../../sheet/grid.ts'
import { CONTAINER_FONT, GROUP_FONT, ISLAND_FONT, labelBand } from '../../sheet/measure.ts'
import type { Building, CellRect } from '../../sheet/types.ts'
import type { AnnotatedElement, Bounds } from '../../types.ts'
import type { TerminalViewModel } from './model.ts'
import type { WorldItem } from './projection.ts'
import { spacedAxes } from './projection-spacing.ts'

/** What one depth draws open: none at root, or one container with every group open or only one of them. */
export interface SheetDepth {
  container: string
  /** The group drawn open: every one, one by key, or none while a component outside groups is selected. */
  open: 'all' | string | null
}

/** A shape the current depth draws: its painted sheet body and the terminal cells its text needs. */
interface SheetShape {
  item: Omit<WorldItem, 'worldBounds'>
  body: CellRect
  columns: number
  rows: number
}

/** Packing reserves a front band below each surface for its name, outside the painted boundary. */
function surfaceBody(rect: CellRect, font: number): CellRect {
  return { ...rect, d: rect.d - labelBand(font) }
}

/** The largest floor, as the 2D overhead view draws a building's footprint. */
function footprint(building: Building): CellRect {
  const base = building.floors[0]
  return base === undefined ? building.rect : centredRect(building.rect, base.footprint)
}

function width(text: string): number {
  return [...text].length
}

/** A terminal line holds this many characters before a long name wraps at its middle space. */
const LINE = 16

/** The roof lines, rewrapped when a single line would make the box wider than its neighbours. */
function terminalLines(building: Building): string[] {
  if (building.lines.every(line => width(line) <= LINE)) return building.lines
  const name = building.title
  let split = -1
  for (let index = 0; index < name.length; index += 1) {
    if (name[index] === ' ' && (split < 0 || Math.abs(index - name.length / 2) < Math.abs(split - name.length / 2))) split = index
  }
  return split < 0 ? building.lines : [name.slice(0, split), name.slice(split + 1)]
}

/** An open surface writes its name into its front edge; a collapsed one holds its name over its count. */
function boxSize(name: string, note: string | undefined): { columns: number; rows: number } {
  return note === undefined
    ? { columns: width(name) + 6, rows: 3 }
    : { columns: Math.max(width(name), width(note)) + 6, rows: 4 }
}

function countOf(count: number): string {
  return `${count} ${count === 1 ? 'component' : 'components'}`
}

/** A collapsed shape stands for its contents: its count is its note, its members what it draws in their place. */
function collapsing(note: string | undefined, members?: readonly string[]): Partial<WorldItem> {
  if (note === undefined) return {}
  return { collapsed: true, note, ...(members === undefined ? {} : { members: [...members] }) }
}

/**
 * Root draws islands, collapsed containers and the buildings standing on islands. A depth opens one container:
 * its open groups show their buildings, every other group and container stays collapsed where it stands.
 */
function sheetShapes(model: TerminalViewModel, depth: SheetDepth | undefined): SheetShape[] {
  const { islands, slabs, zones, buildings } = model.sheet
  const surfaces = new Set([...islands.map(island => island.key), ...(depth === undefined ? [] : [depth.container])])
  const drawnZones = zones.filter(zone => surfaces.has(zone.parent))
  const isOpen = (zone: { key: string; parent: string }) => !slabs.some(slab => slab.representationId === zone.parent)
    || depth?.open === 'all' || depth?.open === zone.key
  const zoneOf = new Map(drawnZones.flatMap(zone => zone.members.map(member => [member, zone] as const)))
  return [
    ...islands.map(island => {
      const title = island.name.toUpperCase()
      return {
        item: {
          key: island.key, ...island.element, title,
          kind: island.kind === 'actors' ? 'actor' as const : 'system' as const,
          origin: island.element?.origin ?? 'observed' as const, shape: 'island' as const, lines: [],
        },
        body: surfaceBody(island.rect, ISLAND_FONT),
        ...boxSize(title, undefined),
      }
    }),
    ...slabs.map(slab => {
      const note = slab.representationId === depth?.container
        ? undefined
        : countOf(buildings.filter(building => building.surface === slab.representationId).length)
      return {
        item: {
          ...slab, key: slab.representationId, kind: 'container' as const, shape: 'slab' as const, lines: [],
          parent: slab.island, ...collapsing(note),
        },
        body: surfaceBody(slab.rect, CONTAINER_FONT),
        ...boxSize(slab.title, note),
      }
    }),
    ...drawnZones.map(zone => {
      const note = isOpen(zone) ? undefined : countOf(zone.members.length)
      return {
        item: {
          key: zone.key, title: zone.name, kind: 'group' as const, origin: 'observed' as const, shape: 'group' as const,
          lines: [], parent: zone.parent, ...collapsing(note, zone.members),
        },
        body: surfaceBody(zone.rect, GROUP_FONT),
        ...boxSize(zone.name, note),
      }
    }),
    ...buildings.filter(building => {
      const zone = zoneOf.get(building.representationId)
      return surfaces.has(building.surface) && (zone === undefined || isOpen(zone))
    }).map(building => {
      const lines = terminalLines(building)
      return {
        item: {
          ...building, lines, key: building.representationId, shape: 'card' as const,
          parent: zoneOf.get(building.representationId)?.key ?? building.surface,
        },
        body: footprint(building),
        columns: Math.max(...lines.map(width)) + 4,
        rows: lines.length + 2,
      }
    }),
  ]
}

/** A box at its own size, centred across its span and on its top edge, so neighbours never stretch it and rows stay level. */
function natural(span: Bounds, shape: SheetShape): Bounds {
  const columns = Math.min(span.width, shape.columns)
  return { x: span.x + Math.floor((span.width - columns) / 2), y: span.y, width: columns, height: Math.min(span.height, shape.rows) }
}

/** The shared sheet at one depth as terminal cells: its nesting and the order of neighbours kept, every box as large as its text. */
export function placeSheet(model: TerminalViewModel, depth: SheetDepth | undefined): WorldItem[] {
  const shapes = sheetShapes(model, depth)
  const [x, y] = spacedAxes(shapes)
  return shapes.map(shape => {
    const left = x(shape.body.gx)
    const top = y(shape.body.gy)
    const span = { x: left, y: top, width: x(shape.body.gx + shape.body.w) - left + 1, height: y(shape.body.gy + shape.body.d) - top + 1 }
    const solid = shape.item.shape === 'card' || shape.item.collapsed === true
    return { ...shape.item, worldBounds: solid ? natural(span, shape) : span }
  })
}

/** The drawn item that stands for an element: itself, its collapsed group, or the nearest ancestor this depth draws. */
export function visibleItemFor<T extends WorldItem>(model: TerminalViewModel, items: readonly T[], id: string): T | undefined {
  const byRepresentation = new Map(items.flatMap(item => item.representationId === undefined ? [] : [[item.representationId, item] as const]))
  const exact = byRepresentation.get(id) ?? items.find(item => item.members?.includes(id))
  if (exact !== undefined) return exact
  const elements = new Map(model.elements.map(element => [element.representationId, element]))
  for (let current: AnnotatedElement | undefined = elements.get(id); current !== undefined; current = current.parent === null ? undefined : elements.get(current.parent)) {
    const item = byRepresentation.get(current.representationId)
    if (item !== undefined) return item
  }
  return undefined
}
