import { expect, test } from 'bun:test'
import type { ColorName } from '../src/colors.ts'
import { sheetScene } from '../src/sheet/scene.ts'
import type { AnnotatedElement, ArchitectureGraph, C4Kind } from '../src/types.ts'
import { slabsSvg } from '../src/viewers/web/iso/painting/ground.ts'
import { projectScene } from '../src/viewers/web/iso/projection/project.ts'

function element(id: string, kind: C4Kind, parent: string | null, children: string[], color?: ColorName): AnnotatedElement {
  return {
    representationId: id, id, kind, title: id, overview: '', parent, children, external: false, code: [],
    origin: 'observed', ...(color === undefined ? {} : { color }),
  }
}

/** One system with one container that holds one component; only the container may be colored. */
function world(color?: ColorName): ArchitectureGraph {
  return {
    flows: [],
    relationships: [],
    elements: [
      element('shop', 'system', null, ['api']),
      element('api', 'container', 'shop', ['orders'], color),
      element('orders', 'component', 'api', []),
    ],
  }
}

test.concurrent('an authored color reaches the drawn slab, and an uncolored slab carries none', () => {
  const colored = slabsSvg(projectScene(sheetScene(world('violet'))))[0]!
  expect(colored.attributes['data-color']).toBe('violet')

  const plain = slabsSvg(projectScene(sheetScene(world())))[0]!
  expect('data-color' in plain.attributes).toBe(false)
})
