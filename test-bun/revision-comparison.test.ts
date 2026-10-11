import { componentReasons, comparisonDefaultTab, textChanges } from '../src/viewers/web/comparison/details.ts'
import { expect, test } from 'bun:test'
import { readFile } from 'node:fs/promises'
import { criticalitySummary } from '../src/criticality.ts'
import { compareArchitecture, type SourceTexts } from '../src/history/comparison.ts'
import { filterComparisonScene } from '../src/viewers/web/comparison/control.ts'
import { presentScene } from '../src/viewers/web/iso/view-motion/presentation.ts'
import { NESTED_POSE } from '../src/viewers/web/iso/view-motion/orbit.ts'
import { comparisonChanges, nextChange } from '../src/viewers/web/comparison/tree.ts'
import { sheetScene } from '../src/sheet/scene.ts'
import type { AnnotatedArchitectureModel } from '../src/types.ts'
import { readView, writeView } from '../src/viewers/web/url.ts'
import { box, uses, worldOf } from './helpers.ts'

async function fixture(): Promise<{ before: AnnotatedArchitectureModel; after: AnnotatedArchitectureModel; oldSources: SourceTexts; newSources: SourceTexts }> {
  return JSON.parse(await readFile(new URL('../test/fixtures/revision-comparison.json', import.meta.url), 'utf8'))
}

test.concurrent('comparison retains removed context, matches stable IDs, and keeps relationship changes independent', async () => {
  const { before, after, oldSources, newSources } = await fixture()
  const inputs = JSON.stringify([before, after])
  const compared = compareArchitecture(before, after, oldSources, newSources)
  expect(Object.fromEntries(Object.entries(compared.components).map(([id, item]) => [id, item.status]))).toEqual({
    checkout: 'modified', payment: 'unchanged', 'receipt-sender': 'removed', 'receipt-worker': 'added',
  })
  expect(compared.components['receipt-sender']!.files).toMatchObject([{ file: 'src/receipt.ts', status: 'unchanged', additions: 0, deletions: 0 }])
  expect(compared.components.checkout!.files).toMatchObject([{ additions: 1, deletions: 1 }])
  expect(compared.components['receipt-worker']!.files).toMatchObject([{ status: 'added', additions: 1, deletions: 0 }])
  expect(compared.relationships).toEqual({ 'relationship:9': 'modified', 'relationship:0': 'added', 'removed:relationship:1': 'removed' })
  expect(compared.world.elements.find(item => item.id === 'mail')?.children).toEqual(['receipt-sender'])
  expect(compared.world.elements.find(item => item.id === 'shop')?.children).toEqual(['api', 'mail'])
  expect(compared.components.shop).toBeUndefined()
  expect(JSON.stringify([before, after])).toBe(inputs)
})

test.concurrent('comparison source links retain former ownership without exposing it in the individual destination', async () => {
  const { before, after, oldSources, newSources } = await fixture()
  after.elements.find(item => item.id === 'checkout')!.code = []
  const compared = compareArchitecture(before, after, oldSources, newSources)
  const comparison = { from: null, components: compared.components, relationships: compared.relationships }
  const url = new URL('https://example.test/?component=checkout&file=src/checkout.ts')
  const state = readView(url, compared.world, [], [], 'auto', comparison)
  expect(state.file).toBe('src/checkout.ts')
  expect(state.tab).toBe('how')
  const shared = new URL(writeView(state, compared.world, [], '/', comparison), url)
  expect(shared.searchParams.get('file')).toBe('src/checkout.ts')
  expect(readView(shared, after, []).file).toBeUndefined()
})

test.concurrent('source-only and own-content changes modify only their owner; flows and layout measures do not', async () => {
  const { before, oldSources } = await fixture()
  const next = structuredClone(before)
  next.elements.find(item => item.id === 'checkout')!.title = 'Checkout service'
  next.elements.find(item => item.id === 'checkout')!.parent = 'mail'
  const payment = next.elements.find(item => item.id === 'payment')!
  payment.codeLines = 999
  payment.code[0]!.dependencies = 15
  next.flows = [{ id: 'purchase', title: 'Buy', overview: '', sourceFilename: 'flow.md', steps: [] }]
  const comparison = compareArchitecture(before, next, oldSources, { ...oldSources, 'src/receipt.ts': 'new implementation' })
  expect(comparison.components.checkout!.status).toBe('modified')
  expect(comparison.components.payment!.status).toBe('unchanged')
  expect(comparison.components['receipt-sender']!.status).toBe('modified')
  expect(comparison.world.flows).toBe(next.flows)
  expect(Object.values(comparison.components).some(item => item.status === 'added' || item.status === 'removed')).toBe(false)
})

test.concurrent('an icon or colour change alone modifies its component and is named as the reason', async () => {
  const { before, oldSources } = await fixture()
  for (const [field, value] of [['icon', 'database'], ['colour', 'blue']] as const) {
    const next = structuredClone(before)
    next.elements.find(item => item.id === 'payment')![field] = value
    const compared = compareArchitecture(before, next, oldSources, oldSources)
    expect(compared.components.payment!.status).toBe('modified')
    expect(componentReasons(compared.components.payment).map(reason => reason.key)).toEqual([field])
  }
})

test.concurrent('an id that changes kind keeps both elements, so both comparison directions place everything', () => {
  // `export` is a component in the older world and a container holding revision-control in the newer one.
  const unit = { x: 0, y: 0, width: 1, height: 1 }
  const older = worldOf([
    box('shop', 'system', unit), box('web', 'container', unit, { parent: 'observed:shop' }),
    box('export', 'component', unit, { parent: 'observed:web' }), box('developer', 'actor', unit),
  ], [uses('uses-export', 'developer', 'export')])
  const newer = worldOf([
    box('shop', 'system', unit), box('export', 'container', unit, { parent: 'observed:shop' }),
    box('revision-control', 'component', unit, { parent: 'observed:export' }), box('developer', 'actor', unit),
  ], [uses('uses-revision-control', 'developer', 'revision-control')])
  for (const [before, after] of [[older, newer], [newer, older]] as const) {
    const scene = sheetScene(compareArchitecture(before, after, {}, {}).world)
    const placed = [...scene.buildings, ...scene.slabs].map(item => item.representationId)
    expect(placed).toEqual(expect.arrayContaining(['observed:revision-control', 'observed:export', 'removed:observed:export']))
  }
})


test.concurrent('the Changes list ranks changed components by criticality, then by size, ahead of independent relationships; counts belong to ancestors', async () => {
  const { before, after, oldSources, newSources } = await fixture()
  // The removed component has the smallest change, so only its level can put it first.
  before.elements.find(element => element.id === 'receipt-sender')!.criticality = 'critical'
  const compared = compareArchitecture(before, after, oldSources, newSources)
  const comparison = { ...compared, from: null }
  const changes = comparisonChanges(compared.world, comparison)
  const ranked = ['receipt-sender', 'checkout', 'receipt-worker']
  expect(changes.rows.map(row => row.id)).toEqual(ranked)
  expect(changes.order).toEqual([...ranked, ...compared.world.relationships.map(item => item.id)])
  expect(changes.counts.get('shop')).toEqual({ added: 1, modified: 1, removed: 1 })
  expect(changes.counts.get('api')).toEqual({ added: 1, modified: 1, removed: 0 })
  expect(changes.former.has('mail')).toBe(true)
  const empty = compareArchitecture(after, after, newSources, newSources)
  expect(comparisonChanges(empty.world, { ...empty, from: null }).order).toEqual([])
})


test.concurrent('comparison filters share list counts and navigation while removing only deleted map context', async () => {
  const { before, after, oldSources, newSources } = await fixture()
  const compared = compareArchitecture(before, after, oldSources, newSources)
  const comparison = { ...compared, from: null }
  const enabled = new Set(['added'] as const)
  const changes = comparisonChanges(compared.world, comparison, enabled)
  expect(changes.counts.get('shop')).toEqual({ added: 1, modified: 0, removed: 0 })
  expect(changes.order).toEqual(['receipt-worker', 'relationship:0'])
  expect(nextChange(changes.order, undefined, 1)).toBe('receipt-worker')
  expect(nextChange(changes.order, 'relationship:0', 1)).toBe('receipt-worker')
  expect(nextChange(changes.order, 'receipt-worker', -1)).toBe('relationship:0')
  expect(nextChange([], undefined, 1)).toBeUndefined()
  const scene = presentScene(sheetScene(compared.world), undefined, NESTED_POSE)
  const original = structuredClone(scene)
  const filtered = filterComparisonScene(scene, compared.world, comparison, enabled)
  expect(filtered.buildings.some(item => item.building.representationId === 'receipt-sender')).toBe(false)
  expect(filtered.buildings.some(item => item.building.representationId === 'payment')).toBe(true)
  expect(filtered.slabs.some(item => item.slab.representationId === 'mail')).toBe(false)
  expect(filtered.routes.some(item => item.route.target === 'receipt-sender')).toBe(false)
  expect(filtered.bounds).toBe(scene.bounds)
  expect(scene).toEqual(original)
})


test.concurrent('comparison details explain owned changes and respect explicit tabs for source-only changes', async () => {
  const { before, after, oldSources, newSources } = await fixture()
  const compared = compareArchitecture(before, after, oldSources, newSources)
  expect(componentReasons(compared.components.checkout).map(reason => reason.key)).toEqual(['description', 'files'])
  const sourceOnly = compareArchitecture(before, before, oldSources, { ...oldSources, 'src/checkout.ts': 'new source' })
  const comparison = { ...sourceOnly, from: null }
  expect(comparisonDefaultTab(sourceOnly.components.checkout)).toBe('how')
  const url = new URL('https://example.test/?component=checkout')
  expect(readView(url, sourceOnly.world, [], [], 'auto', comparison).tab).toBe('how')
  url.searchParams.set('tab', 'what')
  const explicit = readView(url, sourceOnly.world, [], [], 'auto', comparison)
  expect(explicit.tab).toBe('what')
  expect(new URL(writeView(explicit, sourceOnly.world, [], '/', comparison), url).searchParams.get('tab')).toBe('what')
  expect(comparisonDefaultTab(compared.components.checkout)).toBe('what')
  expect(componentReasons(compared.components['receipt-worker'])).toEqual([])
})

test.concurrent('prose presentation separates replacements and keeps large rewrites readable', () => {
  expect(textChanges('Writes', 'Packages').parts.map(part => part.value).join('')).toBe('Writes Packages')
  expect(textChanges('This service writes the current order.', 'This service reads the current order.').mode).toBe('words')
  expect(textChanges('The queue stores pending email.', 'Payment requests go directly to the provider.').mode).toBe('rewrite')
  expect(textChanges('', 'New explanation').mode).toBe('added')
  expect(textChanges('Old explanation', '').mode).toBe('removed')
})


test.concurrent('a component whose effective level changes with its parent stays unchanged and out of the Changes list', async () => {
  const { before, oldSources } = await fixture()
  for (const element of before.elements) element.criticality = 'normal'
  const after = structuredClone(before)
  const parent = after.elements.find(element => element.id === 'api')!
  parent.declaredCriticality = parent.criticality = 'critical'
  for (const element of after.elements) if (element.parent === parent.id) element.criticality = 'critical'
  const compared = compareArchitecture(before, after, oldSources, oldSources)
  expect(compared.components.checkout!.status).toBe('unchanged')
  expect(compared.components.payment!.status).toBe('unchanged')
  expect(comparisonChanges(compared.world, { ...compared, from: null }).order).toEqual([])
})

test.concurrent('declaring or clearing an inherited level is an own change with a criticality reason', async () => {
  const { before, oldSources } = await fixture()
  for (const level of ['normal', 'critical'] as const) {
    const inherited = structuredClone(before)
    inherited.elements.find(element => element.id === 'checkout')!.criticality = level
    const explicit = structuredClone(inherited)
    explicit.elements.find(element => element.id === 'checkout')!.declaredCriticality = level
    for (const [start, after] of [[inherited, explicit], [explicit, inherited]]) {
      const compared = compareArchitecture(start!, after!, oldSources, oldSources)
      const change = compared.components.checkout!
      expect(change.status).toBe('modified')
      expect(componentReasons(change)).toMatchObject([{ key: 'declaredCriticality', label: 'criticality', tab: 'what' }])
      expect(comparisonDefaultTab(change)).toBe('what')
      expect(compared.components.payment!.status).toBe('unchanged')
    }
  }
})

test.concurrent('the review summary says nothing unless a changed component is critical or high', () => {
  expect(criticalitySummary([{ criticality: 'normal' }, { criticality: 'low' }, {}])).toBe('')
  expect(criticalitySummary([{ criticality: 'normal' }, { criticality: 'high' }])).not.toBe('')
})
