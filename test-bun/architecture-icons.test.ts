import { expect, test } from 'bun:test'
import type { IconName } from '../src/icons.ts'
import { COMPONENT_FONT, CONTAINER_FONT, GROUP_FONT, ICON_SIDE, ISLAND_FONT, PLANE, TITLE_ICON_CLEARANCE, labelBand, roofIconSlot } from '../src/sheet/measure.ts'
import { sheetScene } from '../src/sheet/scene.ts'
import type { AnnotatedElement, ArchitectureGraph, C4Kind } from '../src/types.ts'
import { iconObjects } from '../src/viewers/web/icons/objects.ts'
import { box, cylinder } from '../src/viewers/web/icons/parts.ts'
import { buildingsSvg } from '../src/viewers/web/iso/painting/buildings.ts'
import { slabsSvg } from '../src/viewers/web/iso/painting/ground.ts'
import { boundsOf, prismFaces } from '../src/viewers/web/iso/painting/icon-faces.ts'
import type { SvgNode } from '../src/viewers/web/iso/painting/svg.ts'
import { CELL_HEIGHT, DEFAULT_PROJECTION, projectScene } from '../src/viewers/web/iso/projection/project.ts'

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

function hasClass(item: SvgNode, name: string): boolean {
  return item.attributes.class?.split(' ').includes(name) ?? false
}

test.concurrent('a title icon can lie flat beside its title while the map is tilted, and a roof icon cannot', () => {
  const scene = projectScene(sheetScene(world({ container: 'browser', component: 'database' })))
  const lying = (icon: SvgNode): boolean => childrenOf(icon).some(child => hasClass(child, 'icon-glyph'))
  expect(lying(iconOf(slabsSvg(scene)[0]!)!)).toBe(true)
  expect(lying(iconOf(buildingsSvg(scene)[0]!)!)).toBe(false)
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

test.concurrent('no icon object covers the surface behind its title, and every title band holds the slot with its clear ground', () => {
  for (const [name, parts] of Object.entries(iconObjects)) {
    for (const part of parts) {
      const { min, max } = boundsOf(part)
      // In the default view a point at height z hides the ground z * CELL_HEIGHT / 2 slot sides behind it.
      const reach = max[2] * CELL_HEIGHT / 2 - min[1]
      expect(reach, `${name} reaches ${reach.toFixed(2)} slot sides behind its slot`).toBeLessThanOrEqual(TITLE_ICON_CLEARANCE)
    }
  }
  for (const font of [GROUP_FONT, CONTAINER_FONT, ISLAND_FONT]) {
    expect(labelBand(font) * PLANE).toBeGreaterThanOrEqual(ICON_SIDE * (TITLE_ICON_CLEARANCE + 1))
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
