import { expect, test } from 'bun:test'
import type { IconName } from '../src/icons.ts'
import { NESTED_CONTENT_PAD } from '../src/sheet/forces.ts'
import { BASELINE, CAPITAL_MIDDLE, COMPONENT_FONT, CONTAINER_FONT, GROUP_FONT, ICON_RATIO, ISLAND_FONT, PLANE, buildingFont, iconAbove, labelBand, roofIconSlot, textWidth } from '../src/sheet/measure.ts'
import { sheetScene } from '../src/sheet/scene.ts'
import type { AnnotatedElement, ArchitectureGraph, C4Kind } from '../src/types.ts'
import { iconObjects } from '../src/viewers/web/icons/objects.ts'
import { box, cylinder } from '../src/viewers/web/icons/parts.ts'
import type { IconPart } from '../src/viewers/web/icons/parts.ts'
import { buildingsSvg } from '../src/viewers/web/iso/painting/buildings.ts'
import { backToFront, boundsOf, prismFaces, reachBehind } from '../src/viewers/web/iso/painting/icon-faces.ts'
import { iconSvg, planSvg } from '../src/viewers/web/iso/painting/icons.ts'
import type { SvgNode } from '../src/viewers/web/iso/painting/svg.ts'
import { surfaceLabelLayout } from '../src/viewers/web/iso/painting/text.ts'
import { DEFAULT_PROJECTION, projectScene } from '../src/viewers/web/iso/projection/project.ts'

function element(id: string, kind: C4Kind, parent: string | null, children: string[], icon?: IconName): AnnotatedElement {
  return {
    representationId: id, id, kind, title: id, overview: '', parent, children, external: false, code: [],
    origin: 'observed', ...(icon === undefined ? {} : { icon }),
  }
}

/** One system with one container that holds one component; the container and the component may carry an icon. */
function world(icons: { container?: IconName; component?: IconName } = {}): ArchitectureGraph {
  return {
    flows: [],
    groups: [],
    relationships: [],
    elements: [
      element('shop', 'system', null, ['api']),
      element('api', 'container', 'shop', ['orders'], icons.container),
      element('orders', 'component', 'api', [], icons.component),
    ],
  }
}

function childrenOf(item: SvgNode): readonly SvgNode[] {
  return typeof item.children === 'string' ? [] : item.children
}

function iconOf(item: SvgNode): SvgNode | undefined {
  return childrenOf(item).find(child => child.attributes.class?.split(' ').includes('icon'))
}

test.concurrent('a roof name starts after its icon slot, and the building grows to hold both', () => {
  const plain = projectScene(sheetScene(world())).buildings[0]!.building
  const scene = projectScene(sheetScene(world({ component: 'database' })))
  const building = buildingsSvg(scene)[0]!
  expect(iconOf(building)).toBeDefined()
  expect(iconOf(buildingsSvg(projectScene(sheetScene(world())))[0]!)).toBeUndefined()

  const name = childrenOf(childrenOf(building).find(child => child.attributes.class === 'label')!)[0]!
  const slot = roofIconSlot(['orders'], COMPONENT_FONT, false)
  expect(Number(name.attributes.x)).toBeGreaterThanOrEqual(slot.x + slot.side)
  expect(scene.buildings[0]!.building.rect.w).toBeGreaterThan(plain.rect.w)
})

test.concurrent('on a round roof the icon lies above the name, centred over it', () => {
  // An actor's building is round and centres its name.
  const graph = world()
  const scene = projectScene(sheetScene({ ...graph, elements: [...graph.elements, element('buyer', 'actor', null, [], 'person')] }))
  const actor = scene.buildings.findIndex(({ building }) => building.kind === 'actor')
  const { building } = scene.buildings[actor]!
  const font = buildingFont(building)
  const name = childrenOf(childrenOf(buildingsSvg(scene)[actor]!).find(child => child.attributes.class === 'label')!)[0]!
  const slot = roofIconSlot(building.lines, font, iconAbove(building.shape))

  // The top of the name's line, BASELINE font sizes above its baseline, is below the icon's box.
  expect(Number(name.attributes.y) - font * BASELINE).toBeGreaterThanOrEqual(slot.y + slot.side)
  const nameMiddle = Number(name.attributes.x) + textWidth(building.lines[0]!, font) / 2
  expect(slot.x + slot.side / 2).toBeCloseTo(nameMiddle)
})

/** The looks of the faces an icon draws: a top, or a wall on the reader's left or right. */
function facesOf(icon: SvgNode): string[] {
  return childrenOf(icon).filter(child => child.tag === 'polygon').map(child => child.attributes.class!.split(' ')[1]!)
}

/** A title's band as the packing reserves it for a surface of this font, wide enough that width never limits the title. */
function wideBand(font: number): { width: number; band: { width: number; height: number } } {
  return { width: 400, band: { width: 4000, height: labelBand(font) * PLANE } }
}

/** One zoom inside each of the title's size steps. */
const TITLE_ZOOMS = [0.1, 0.3, 0.7, 2]

test.concurrent('an icon lies on the map as one object: a tilted map shows the walls of its parts, the view from above only their tops', () => {
  const box = { name: 'browser' as const, corner: { x: 0, y: 0 }, side: 24 }
  const tilted = facesOf(iconSvg(box, DEFAULT_PROJECTION))
  const above = facesOf(iconSvg(box, { ...DEFAULT_PROJECTION, pitch: 90 }))
  expect(tilted.some(face => face === 'icon-left' || face === 'icon-right')).toBe(true)
  expect(above.length).toBeGreaterThan(0)
  expect(above.every(face => face === 'icon-top')).toBe(true)
  // Both views draw the same parts: each top once.
  expect(tilted.filter(face => face === 'icon-top')).toHaveLength(above.length)
})

test.concurrent('the plan of every icon object shows the accent', () => {
  for (const name of Object.keys(iconObjects) as IconName[]) {
    const accents = planSvg(name, 24).filter(shape => shape.attributes.class!.split(' ').includes('icon-accent'))
    expect(accents.length, `${name} seen from above has no accent`).toBeGreaterThan(0)
  }
})

/** True when two parts cover a common area of the footprint: their boxes on the ground overlap. */
function overlap(one: IconPart, other: IconPart): boolean {
  const [a, b] = [boundsOf(one), boundsOf(other)]
  return ([0, 1] as const).every(axis => a.min[axis] < b.max[axis] - 1e-6 && b.min[axis] < a.max[axis] - 1e-6)
}

/** Every two parts of an object where the second overlaps the first and reaches higher than it. */
function coveringPairs(parts: readonly IconPart[]): [lower: IconPart, higher: IconPart][] {
  return parts.flatMap(lower => parts
    .filter(higher => overlap(lower, higher) && boundsOf(higher).max[2] > boundsOf(lower).max[2])
    .map((higher): [IconPart, IconPart] => [lower, higher]))
}

test.concurrent('where two parts of an object overlap, the one that reaches higher is drawn over the other, from above and on a tilted map', () => {
  for (const [name, parts] of Object.entries(iconObjects)) {
    for (const view of [DEFAULT_PROJECTION, { yaw: 0, pitch: 90 }]) {
      const drawn = backToFront(parts, view)
      for (const [lower, higher] of coveringPairs(parts)) {
        const place = `${name}, pitch ${view.pitch}: part ${parts.indexOf(lower)} is drawn over part ${parts.indexOf(higher)}, which reaches higher`
        expect(drawn.indexOf(higher) > drawn.indexOf(lower), place).toBe(true)
      }
    }
  }
})

test.concurrent('an icon is sized from the letters of its name and lies on the name\'s line, at every size of a title', () => {
  expect(roofIconSlot(['orders'], COMPONENT_FONT, false).side).toBe(COMPONENT_FONT * ICON_RATIO)
  for (const zoom of TITLE_ZOOMS) {
    const layout = surfaceLabelLayout(wideBand(CONTAINER_FONT), CONTAINER_FONT, zoom, DEFAULT_PROJECTION, true)
    expect(layout.icon.side).toBeCloseTo(layout.fontSize * ICON_RATIO)
    // The box's middle is the middle of the capitals: the line's top is 0.9 font sizes above the baseline.
    const capitalMiddle = layout.baseline - layout.fontSize * 0.9 + layout.fontSize * CAPITAL_MIDDLE
    expect(layout.icon.y + layout.icon.side / 2).toBeCloseTo(capitalMiddle)
  }
})

test.concurrent('every icon object stays inside its footprint, so it never stands on the name beside it', () => {
  for (const [name, parts] of Object.entries(iconObjects)) {
    for (const part of parts) {
      const { min, max } = boundsOf(part)
      for (const [x, y] of [min, max]) {
        expect(x >= -1e-9 && x <= 1 + 1e-9 && y >= -1e-9 && y <= 1 + 1e-9, `${name} leaves its footprint at ${x}, ${y}`).toBe(true)
      }
    }
  }
})

test.concurrent('no icon drawing before a title reaches what stands on the surface behind it', () => {
  // The packing keeps this much empty ground between a surface's edge and what stands on it.
  const emptyGround = NESTED_CONTENT_PAD * PLANE
  for (const font of [GROUP_FONT, CONTAINER_FONT, ISLAND_FONT]) {
    for (const zoom of TITLE_ZOOMS) {
      const { icon } = surfaceLabelLayout(wideBand(font), font, zoom, DEFAULT_PROJECTION, true)
      for (const [name, parts] of Object.entries(iconObjects)) {
        // 0 is the surface's edge and a negative depth lies on the surface.
        // The middle of an object's ground lies on the middle of its box.
        const reaches = icon.y + (0.5 - reachBehind(parts)) * icon.side
        expect(reaches, `${name} at font ${font} and zoom ${zoom}`).toBeGreaterThan(-emptyGround)
      }
    }
  }
})

test.concurrent('a prism shows the faces turned to the reader, and a curved wall is one face', () => {
  const cube = box(0, 0, 0, 1, 1, 1)
  const touches = (faces: ReturnType<typeof prismFaces>, corner: readonly number[]): boolean =>
    faces.flatMap(face => face.points).some(point => point.every((value, axis) => value === corner[axis]))
  const front = prismFaces(cube, DEFAULT_PROJECTION)
  expect(front.map(face => face.tone).sort()).toEqual(['left', 'right', 'top'])
  // The reader stands past the corner (1, 1, 0) and never sees the far corner (0, 0, 0); from the opposite side it is the other way round.
  expect(touches(front, [0, 0, 0])).toBe(false)
  const behind = prismFaces(cube, { ...DEFAULT_PROJECTION, yaw: DEFAULT_PROJECTION.yaw + 180 })
  expect(behind).toHaveLength(3)
  expect(touches(behind, [1, 1, 0])).toBe(false)
  expect(prismFaces(cylinder(0.5, 0.5, 0.5, 0, 1), DEFAULT_PROJECTION)).toHaveLength(2)
})
