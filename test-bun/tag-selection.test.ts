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

/** Orders and cart carry their own tags. Only orders also inherits payments from its container. */
const elements = [
  element('shop', 'system', null),
  element('api', 'container', 'shop', ['payments']),
  element('orders', 'component', 'api', ['internal']),
  element('web', 'container', 'shop'),
  element('cart', 'component', 'web', ['checkout flow', 'internal']),
  element('catalog', 'component', 'web'),
]

test.concurrent('a tag selects its carriers with everything inside them and keeps their parents', () => {
  const payments = selectByTags(elements, { focused: ['payments'], match: 'any', excluded: [] })
  expect([...payments.matched].sort()).toEqual(['api', 'orders'])
  expect([...payments.parents]).toEqual(['shop'])

  const either = selectByTags(elements, { focused: ['payments', 'checkout flow'], match: 'any', excluded: [] })
  expect([...either.matched].sort()).toEqual(['api', 'cart', 'orders'])
  expect([...either.parents].sort()).toEqual(['shop', 'web'])
})

test.concurrent('all can match a tag on a container and another on its component', () => {
  const both = selectByTags(elements, { focused: ['payments', 'internal'], match: 'all', excluded: [] })
  expect([...both.matched]).toEqual(['orders'])
  expect([...both.parents].sort()).toEqual(['api', 'shop'])
})

test.concurrent('an excluded tag removes a match and parents kept only for that match', () => {
  const kept = selectByTags(elements, { focused: ['internal', 'checkout flow'], match: 'any', excluded: ['payments'] })
  expect([...kept.matched]).toEqual(['cart'])
  expect([...kept.parents].sort()).toEqual(['shop', 'web'])
})

test.concurrent('only excluded tags light everything outside the excluded part', () => {
  const rest = selectByTags(elements, { focused: [], match: 'any', excluded: ['payments'] })
  expect([...rest.matched].sort()).toEqual(['cart', 'catalog', 'shop', 'web'])
})

test.concurrent('a shared link carries the match mode and both lists of known tags', () => {
  const world: ArchitectureGraph = { flows: [], groups: [], elements, relationships: [] }
  const url = new URL('https://example.test/')
  const tagFocus = { focused: ['internal', 'payments'], match: 'all', excluded: ['checkout flow'] } satisfies TagFocus
  url.search = writeView({ ...readView(url, world, []), tagFocus }, world, [], url.pathname)
  expect(url.searchParams.getAll('tag')).toEqual(tagFocus.focused)
  expect(url.searchParams.get('match')).toBe('all')
  expect(url.searchParams.getAll('not')).toEqual(tagFocus.excluded)

  url.searchParams.append('tag', 'retired')
  url.searchParams.append('not', 'unknown')
  expect(readView(url, world, []).tagFocus).toEqual(tagFocus)
})
