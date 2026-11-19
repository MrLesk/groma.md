import { expect, test } from 'bun:test'
import type { IconName } from '../src/icons.ts'
import { COMPONENT_FONT, roofIconSlot } from '../src/sheet/measure.ts'
import { sheetScene } from '../src/sheet/scene.ts'
import type { AnnotatedElement, ArchitectureGraph, C4Kind } from '../src/types.ts'
import { iconObjects } from '../src/viewers/web/icons/objects.ts'
import { box, cylinder, type IconPart } from '../src/viewers/web/icons/parts.ts'
import { buildingsSvg } from '../src/viewers/web/iso/painting/buildings.ts'
import { slabsSvg } from '../src/viewers/web/iso/painting/ground.ts'
import { solidFaces } from '../src/viewers/web/iso/painting/icon-faces.ts'
import type { SvgNode } from '../src/viewers/web/iso/painting/svg.ts'
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

test.concurrent('a container icon is a landmark and a component icon is not', () => {
  const scene = projectScene(sheetScene(world({ container: 'browser', component: 'database' })))
  expect(iconOf(slabsSvg(scene)[0]!)!.attributes.class).toBe('icon landmark')
  expect(iconOf(buildingsSvg(scene)[0]!)!.attributes.class).toBe('icon')
})

/** The ground rectangle a part stands on, as its two opposite corners. */
function groundCorners(part: IconPart): number[][] {
  if (part.shape === 'ball') return [[part.x - part.r, part.y - part.r], [part.x + part.r, part.y + part.r]]
  if (part.axis === 'z') return part.outline.map(([x, y]) => [x, y])
  const across = part.outline.map(([a]) => a)
  const along = [part.from, part.from + part.length]
  return part.axis === 'y'
    ? [[Math.min(...across), Math.min(...along)], [Math.max(...across), Math.max(...along)]]
    : [[Math.min(...along), Math.min(...across)], [Math.max(...along), Math.max(...across)]]
}

test.concurrent('every icon object stays inside its footprint, so it never stands on the name beside it', () => {
  for (const [name, parts] of Object.entries(iconObjects)) {
    for (const part of parts) {
      for (const [x, y] of groundCorners(part)) {
        expect(x! >= -1e-9 && x! <= 1 + 1e-9 && y! >= -1e-9 && y! <= 1 + 1e-9, `${name} leaves its footprint at ${x}, ${y}`).toBe(true)
      }
    }
  }
})

test.concurrent('a solid shows the faces turned to the reader, and a curved wall is one face', () => {
  expect(solidFaces(box(0, 0, 0, 1, 1, 1), DEFAULT_PROJECTION).map(face => face.tone).sort()).toEqual(['east', 'south', 'top'])
  // Seen from the opposite side the box still shows two walls and its top: the north and west ones.
  const behind = solidFaces(box(0, 0, 0, 1, 1, 1), { ...DEFAULT_PROJECTION, yaw: DEFAULT_PROJECTION.yaw + 180 })
  expect(behind).toHaveLength(3)
  expect(behind.flatMap(face => face.points).some(([x, y, z]) => x === 1 && y === 1 && z === 0)).toBe(false)
  expect(solidFaces(cylinder(0.5, 0.5, 0.5, 0, 1), DEFAULT_PROJECTION)).toHaveLength(2)
})
