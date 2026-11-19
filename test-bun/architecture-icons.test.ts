import { expect, test } from 'bun:test'
import type { IconName } from '../src/icons.ts'
import { NESTED_CONTENT_PAD } from '../src/sheet/forces.ts'
import { CAPITAL_MIDDLE, COMPONENT_FONT, CONTAINER_FONT, GROUP_FONT, ICON_RATIO, ISLAND_FONT, PLANE, labelBand, roofIconSlot } from '../src/sheet/measure.ts'
import { sheetScene } from '../src/sheet/scene.ts'
import type { AnnotatedElement, ArchitectureGraph, C4Kind } from '../src/types.ts'
import { iconObjects } from '../src/viewers/web/icons/objects.ts'
import { box, cylinder } from '../src/viewers/web/icons/parts.ts'
import { buildingsSvg } from '../src/viewers/web/iso/painting/buildings.ts'
import { boundsOf, drawingSpan, prismFaces } from '../src/viewers/web/iso/painting/icon-faces.ts'
import { iconSvg } from '../src/viewers/web/iso/painting/icons.ts'
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
  const slot = roofIconSlot(COMPONENT_FONT)
  expect(Number(name.attributes.x)).toBeGreaterThanOrEqual(slot.x + slot.side)
  expect(scene.buildings[0]!.building.rect.w).toBeGreaterThan(plain.rect.w)
})

/** The class names of the drawings inside an icon: its object, its flat glyph, or both between two views. */
function drawingsOf(icon: SvgNode): string[] {
  return childrenOf(icon).map(child => child.attributes.class!)
}

/** A title's band as the packing reserves it for a surface of this font, wide enough that width never limits the title. */
function wideBand(font: number): { width: number; band: { width: number; height: number } } {
  return { width: 400, band: { width: 4000, height: labelBand(font) * PLANE } }
}

/** One zoom inside each of the title's size steps. */
const TITLE_ZOOMS = [0.1, 0.3, 0.7, 2]

test.concurrent('an icon follows the view of the map: its object on a tilted map, its flat glyph in the plan view', () => {
  const box = { name: 'database' as const, corner: { x: 0, y: 0 }, side: 24 }
  expect(drawingsOf(iconSvg(box, DEFAULT_PROJECTION))).toEqual(['icon-object'])
  expect(drawingsOf(iconSvg(box, { ...DEFAULT_PROJECTION, pitch: 90 }))).toEqual(['icon-glyph'])
})

test.concurrent('an icon is sized from the letters of its name and lies on the name\'s line, at every size of a title', () => {
  expect(roofIconSlot(COMPONENT_FONT).side).toBe(COMPONENT_FONT * ICON_RATIO)
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
        const { back, front } = drawingSpan(parts)
        // The drawing is centred on the box; 0 is the surface's edge and a negative depth lies on the surface.
        const reaches = icon.y + icon.side / 2 - (front - back) * icon.side / 2
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
