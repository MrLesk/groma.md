import { expect, test } from 'bun:test'
import { selectByTags } from '../src/tag-selection.ts'
import type { AnnotatedElement, ArchitectureGraph, C4Kind } from '../src/types.ts'
import { readView, writeView } from '../src/viewers/web/url.ts'

function element(id: string, kind: C4Kind, parent: string | null, tags?: string[]): AnnotatedElement {
  return {
    representationId: id, id, kind, title: id, overview: '', parent, children: [], external: false, code: [],
    origin: 'observed', ...(tags === undefined ? {} : { tags }),
  }
}

/** One system with two containers: the first container is tagged, and so is one component of the second. */
const elements = [
  element('shop', 'system', null),
  element('api', 'container', 'shop', ['payments']),
  element('orders', 'component', 'api'),
  element('web', 'container', 'shop'),
  element('cart', 'component', 'web', ['checkout flow']),
  element('catalog', 'component', 'web'),
]

test.concurrent('a tag selects its carriers with everything inside them and keeps their parents', () => {
  const payments = selectByTags(elements, ['payments'])
  expect([...payments.matched].sort()).toEqual(['api', 'orders'])
  expect([...payments.parents]).toEqual(['shop'])

  const either = selectByTags(elements, ['payments', 'checkout flow'])
  expect([...either.matched].sort()).toEqual(['api', 'cart', 'orders'])
  expect([...either.parents].sort()).toEqual(['shop', 'web'])
})

test.concurrent('a shared link carries the focused tags and drops a tag the world does not use', () => {
  const world: ArchitectureGraph = { flows: [], groups: [], elements, relationships: [] }
  const url = new URL('https://example.test/')
  const state = { ...readView(url, world, []), focusTags: ['checkout flow', 'payments'] }
  url.search = writeView(state, world, [], url.pathname)
  expect(readView(url, world, []).focusTags).toEqual(['checkout flow', 'payments'])

  url.searchParams.append('tag', 'retired')
  expect(readView(url, world, []).focusTags).toEqual(['checkout flow', 'payments'])
})
