import { expect, test } from 'bun:test'
import { selectByTags, type TagFocus } from '../src/tag-selection.ts'
import type { AnnotatedElement, ArchitectureGraph, C4Kind } from '../src/types.ts'
import { readView, writeView } from '../src/viewers/web/url.ts'

function element(id: string, kind: C4Kind, parent: string | null, tags?: string[]): AnnotatedElement {
  return {
    representationId: id, id, kind, title: id, overview: '', parent, children: [], external: false, code: [],
    origin: 'observed', ...(tags === undefined ? {} : { tags }),
  }
}

/** Orders inherits payments from its container. Only cart belongs to the group. */
function shop(): ArchitectureGraph {
  return {
    elements: [
      element('shop', 'system', null),
      element('api', 'container', 'shop', ['payments']),
      element('orders', 'component', 'api', ['internal']),
      element('web', 'container', 'shop'),
      { ...element('cart', 'component', 'web', ['checkout flow', 'internal']), group: 'basket' },
      element('catalog', 'component', 'web'),
    ],
    groups: [{ id: 'basket', title: 'Basket', overview: '', tags: ['store team'] }],
    relationships: [
      { id: 'submit', source: 'cart', target: 'orders', description: '', technology: '', origin: 'observed' },
      { id: 'lookup', source: 'orders', target: 'catalog', description: '', technology: '', origin: 'observed' },
    ],
    flows: [{
      id: 'buy', title: 'Buy', overview: '', sourceFilename: '', tags: ['purchase', 'pilot'],
      steps: [
        { relationshipId: 'submit', source: 'cart', target: 'orders', action: '' },
        { relationshipId: 'lookup', source: 'orders', target: 'catalog', action: '' },
      ],
    }],
  }
}

test.concurrent('a tag selects its carriers with everything inside them and keeps their parents', () => {
  const world = shop()
  const payments = selectByTags(world, { focused: ['payments'], match: 'any', excluded: [] })
  expect([...payments.lit].sort()).toEqual(['api', 'orders'])
  expect([...payments.parents]).toEqual(['shop'])

  const either = selectByTags(world, { focused: ['payments', 'checkout flow'], match: 'any', excluded: [] })
  expect([...either.lit].sort()).toEqual(['api', 'cart', 'orders'])
  expect([...either.parents].sort()).toEqual(['shop', 'web'])
})

test.concurrent('all can match a tag on a container and another on its component', () => {
  const both = selectByTags(shop(), { focused: ['payments', 'internal'], match: 'all', excluded: [] })
  expect([...both.lit]).toEqual(['orders'])
  expect([...both.parents].sort()).toEqual(['api', 'shop'])
})

test.concurrent('an excluded tag removes a match and parents kept only for that match', () => {
  const kept = selectByTags(shop(), { focused: ['internal', 'checkout flow'], match: 'any', excluded: ['payments'] })
  expect([...kept.lit]).toEqual(['cart'])
  expect([...kept.parents].sort()).toEqual(['shop', 'web'])
})

test.concurrent('only excluded tags light everything outside the excluded part', () => {
  const rest = selectByTags(shop(), { focused: [], match: 'any', excluded: ['payments'] })
  expect([...rest.lit].sort()).toEqual(['cart', 'catalog', 'shop', 'web'])
  expect(rest.matchingFlows).toEqual(new Set(['buy']))
})

test.concurrent('a group tag lights its members and leaves their siblings out', () => {
  const selection = selectByTags(shop(), { focused: ['store team'], match: 'any', excluded: [] })
  expect(selection.lit).toEqual(new Set(['cart']))
  expect(selection.parents).toEqual(new Set(['web', 'shop']))
  expect(selection.matchingFlows.size).toBe(0)
})

test.concurrent('a flow tag counts for every step end, and all joins it with the tags an end carries', () => {
  const world = shop()
  const purchase = selectByTags(world, { focused: ['purchase'], match: 'any', excluded: [] })
  expect(purchase.matchingFlows).toEqual(new Set(['buy']))
  expect(purchase.lit).toEqual(new Set(['cart', 'orders', 'catalog']))

  // Cart and orders carry internal and the purchase flow passes through them. Catalog carries no tag,
  // and the flow itself matches only on the tags it carries.
  const both = selectByTags(world, { focused: ['purchase', 'internal'], match: 'all', excluded: [] })
  expect(both.lit).toEqual(new Set(['cart', 'orders']))
  expect(both.matchingFlows.size).toBe(0)
})

test.concurrent('exclusion leaves public ends of an excluded flow lit and an excluded end of a matching flow out', () => {
  const world = shop()
  const withoutFlow = selectByTags(world, { focused: [], match: 'any', excluded: ['purchase'] })
  expect(withoutFlow.matchingFlows.size).toBe(0)
  expect(withoutFlow.lit).toEqual(new Set(world.elements.map(element => element.id)))

  const withoutOrders = selectByTags(world, { focused: ['purchase'], match: 'any', excluded: ['payments'] })
  expect(withoutOrders.matchingFlows).toEqual(new Set(['buy']))
  expect(withoutOrders.lit).toEqual(new Set(['cart', 'catalog']))

  // An excluded flow is out: its other tag reaches none of its ends.
  const withoutPilot = selectByTags(world, { focused: ['purchase'], match: 'any', excluded: ['pilot'] })
  expect(withoutPilot.matchingFlows.size).toBe(0)
  expect(withoutPilot.lit.size).toBe(0)
})

test.concurrent('a shared link carries the match mode and both lists of known tags', () => {
  const world = shop()
  const url = new URL('https://example.test/')
  const tagFocus = { focused: ['internal', 'store team', 'purchase'], match: 'all', excluded: ['checkout flow'] } satisfies TagFocus
  url.search = writeView({ ...readView(url, world, []), tagFocus }, world, [], url.pathname)
  expect(url.searchParams.getAll('tag')).toEqual(tagFocus.focused)
  expect(url.searchParams.get('match')).toBe('all')
  expect(url.searchParams.getAll('not')).toEqual(tagFocus.excluded)

  url.searchParams.append('tag', 'retired')
  url.searchParams.append('not', 'unknown')
  expect(readView(url, world, []).tagFocus).toEqual(tagFocus)
})
