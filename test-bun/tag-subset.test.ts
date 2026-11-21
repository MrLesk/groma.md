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

/**
 * Two containers: api is tagged payments and holds a legacy component, the only member of the finance group;
 * web holds one untagged component. The pay flow is tagged internal and the buy flow purchase.
 */
function shop(): AnnotatedArchitectureModel {
  return {
    drafts: [],
    groups: [{ id: 'accounts', title: 'Accounts', overview: '', tags: ['finance'] }],
    elements: [
      element('shop', 'system', null, ['api', 'web']),
      element('api', 'container', 'shop', ['billing', 'orders'], ['payments']),
      { ...element('billing', 'component', 'api', [], ['legacy']), group: 'accounts' },
      element('orders', 'component', 'api', []),
      element('web', 'container', 'shop', ['cart']),
      element('cart', 'component', 'web', []),
    ],
    relationships: [relationship('orders', 'billing'), relationship('cart', 'orders')],
    flows: [
      { id: 'pay', title: 'Pay', overview: '', sourceFilename: '', tags: ['internal'],
        steps: [{ relationshipId: 'orders>billing', source: 'orders', target: 'billing', action: '' }] },
      { id: 'buy', title: 'Buy', overview: '', sourceFilename: '', tags: ['purchase'],
        steps: [{ relationshipId: 'cart>orders', source: 'cart', target: 'orders', action: '' }] },
    ],
  }
}

const ids = (subset: AnnotatedArchitectureModel) => subset.elements.map(item => item.id).sort()

test.concurrent('include keeps what the tags select with its parents, and drops relationships and flows that lose an end', () => {
  const subset = subsetByTags(shop(), { focused: ['payments'], match: 'any', excluded: [] })
  expect(ids(subset)).toEqual(['api', 'billing', 'orders', 'shop'])
  expect(subset.elements.find(item => item.id === 'shop')!.children).toEqual(['api'])
  expect(subset.relationships.map(item => item.id)).toEqual(['orders>billing'])
  expect(subset.flows.map(flow => flow.id)).toEqual(['pay'])
})

test.concurrent('exclude removes what its tags select and wins over include', () => {
  const world = shop()
  const withoutLegacy = subsetByTags(world, { focused: [], match: 'any', excluded: ['legacy'] })
  expect(ids(withoutLegacy)).toEqual(['api', 'cart', 'orders', 'shop', 'web'])
  expect(withoutLegacy.relationships.map(item => item.id)).toEqual(['cart>orders'])
  // The finance group's only member is left out, so its title and tags are not published either.
  expect(withoutLegacy.groups).toEqual([])

  const both = subsetByTags(world, { focused: ['payments'], match: 'any', excluded: ['legacy'] })
  expect(ids(both)).toEqual(['api', 'orders', 'shop'])
  expect(both.flows).toEqual([])
})

test.concurrent('excluding a flow leaves its ends and their relationship in the export', () => {
  const world = shop()
  const subset = subsetByTags(world, { focused: [], match: 'any', excluded: ['internal'] })
  expect(subset.flows.map(flow => flow.id)).toEqual(['buy'])
  expect(ids(subset)).toEqual(ids(world))
  expect(subset.relationships.map(relationship => relationship.id)).toContain('orders>billing')
})

test.concurrent('excluding a group leaves out the record and its members', () => {
  const subset = subsetByTags(shop(), { focused: [], match: 'any', excluded: ['finance'] })
  expect(subset.groups).toEqual([])
  expect(ids(subset)).toEqual(['api', 'cart', 'orders', 'shop', 'web'])
})

test.concurrent('including a flow keeps its step ends with their parents', () => {
  const subset = subsetByTags(shop(), { focused: ['purchase'], match: 'any', excluded: [] })
  expect(ids(subset)).toEqual(['api', 'cart', 'orders', 'shop', 'web'])
  expect(subset.flows.map(flow => flow.id)).toEqual(['buy'])
})
