import { expect, test } from 'bun:test'
import type { IconName } from '../src/icons.ts'
import { COMPONENT_FONT, roofIconSlot } from '../src/sheet/measure.ts'
import { sheetScene } from '../src/sheet/scene.ts'
import type { AnnotatedElement, ArchitectureGraph, C4Kind } from '../src/types.ts'
import { iconObjects } from '../src/viewers/web/icons/objects.ts'
import { buildingsSvg } from '../src/viewers/web/iso/painting/buildings.ts'
import { slabsSvg } from '../src/viewers/web/iso/painting/ground.ts'
import type { SvgNode } from '../src/viewers/web/iso/painting/svg.ts'
import { projectScene } from '../src/viewers/web/iso/projection/project.ts'

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

test.concurrent('every icon object stays inside its footprint, so it never stands on the name beside it', () => {
  for (const [name, parts] of Object.entries(iconObjects)) {
    for (const part of parts) {
      const spots = part.shape === 'box' ? [[part.x, part.y], [part.x + part.w, part.y + part.d]]
        : part.shape === 'ball' ? [[part.x - part.r, part.y - part.r], [part.x + part.r, part.y + part.r]]
          : part.outline
      for (const [x, y] of spots) {
        expect(x! >= -1e-9 && x! <= 1 + 1e-9 && y! >= -1e-9 && y! <= 1 + 1e-9, `${name} leaves its footprint at ${x}, ${y}`).toBe(true)
      }
    }
  }
})
