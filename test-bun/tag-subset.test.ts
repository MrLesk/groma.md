import { expect, test } from 'bun:test'
import { subsetByTags } from '../src/tag-selection.ts'
import type { AnnotatedArchitectureModel, AnnotatedElement, AnnotatedRelationship, C4Kind } from '../src/types.ts'

function element(id: string, kind: C4Kind, parent: string | null, children: string[], tags?: string[]): AnnotatedElement {
  return {
    representationId: id, id, kind, title: id, overview: '', parent, children, external: false, code: [],
    origin: 'observed', ...(tags === undefined ? {} : { tags }),
  }
}

function relationship(source: string, target: string): AnnotatedRelationship {
  return { id: `${source}>${target}`, source, target, description: '', technology: '', origin: 'observed' }
}

/** Two containers: api is tagged payments and holds a legacy component; web holds one untagged component. */
const world: AnnotatedArchitectureModel = {
  drafts: [],
  groups: [],
  elements: [
    element('shop', 'system', null, ['api', 'web']),
    element('api', 'container', 'shop', ['billing', 'orders'], ['payments']),
    element('billing', 'component', 'api', [], ['legacy']),
    element('orders', 'component', 'api', []),
    element('web', 'container', 'shop', ['cart']),
    element('cart', 'component', 'web', []),
  ],
  relationships: [relationship('orders', 'billing'), relationship('cart', 'orders')],
  flows: [
    { id: 'pay', title: 'Pay', overview: '', sourceFilename: '', steps: [{ relationshipId: 'orders>billing', source: 'orders', target: 'billing', action: '' }] },
    { id: 'buy', title: 'Buy', overview: '', sourceFilename: '', steps: [{ relationshipId: 'cart>orders', source: 'cart', target: 'orders', action: '' }] },
  ],
}

const ids = (subset: AnnotatedArchitectureModel) => subset.elements.map(item => item.id).sort()

test.concurrent('include keeps what the tags select with its parents, and drops relationships and flows that lose an end', () => {
  const subset = subsetByTags(world, { include: ['payments'], exclude: [] })
  expect(ids(subset)).toEqual(['api', 'billing', 'orders', 'shop'])
  expect(subset.elements.find(item => item.id === 'shop')!.children).toEqual(['api'])
  expect(subset.relationships.map(item => item.id)).toEqual(['orders>billing'])
  expect(subset.flows.map(flow => flow.id)).toEqual(['pay'])
})

test.concurrent('exclude removes what its tags select and wins over include', () => {
  const withoutLegacy = subsetByTags(world, { include: [], exclude: ['legacy'] })
  expect(ids(withoutLegacy)).toEqual(['api', 'cart', 'orders', 'shop', 'web'])
  expect(withoutLegacy.relationships.map(item => item.id)).toEqual(['cart>orders'])

  const both = subsetByTags(world, { include: ['payments'], exclude: ['legacy'] })
  expect(ids(both)).toEqual(['api', 'orders', 'shop'])
  expect(both.flows).toEqual([])
})
