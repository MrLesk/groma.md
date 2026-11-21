import { expect, test } from 'bun:test'
import { cp, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { writes } from '../src/authoring.ts'
import { loadAnnotatedArchitecture } from '../src/core.ts'
import type { StructuralResult } from '../src/curate.ts'
import { repositoryRoot } from './helpers.ts'

const actor = 'groma/actors/shopper.md'
const flow = 'groma/flows/shopper-orders.md'
const components = 'groma/systems/shop/containers/api/components'

/**
 * The shop system with its components orders and stock, a shopper who uses the system, a file of stock
 * that calls a file of orders, a group of both components, and a flow whose author typed other link texts.
 * Returns the root and the group's record.
 */
async function shop(): Promise<{ root: string; group: string }> {
  const root = await mkdtemp(path.join(tmpdir(), 'groma-links-'))
  await cp(path.join(repositoryRoot, 'test/fixtures/edit'), root, { recursive: true })
  await writes.add(root, { thing: 'actor', name: 'Shopper', overview: 'Buys things.' })
  await writes.add(root, { thing: 'relation', name: 'shopper', relation: 'shop', description: 'Places orders', technology: 'Browser' })
  await writes.add(root, { thing: 'relation', name: 'src/stock.ts', relation: 'src/orders.ts', description: 'Reports levels', technology: 'Function call' })
  const group = await writes.add(root, { thing: 'group', name: 'Checks', members: ['stock', 'orders'] }) as StructuralResult
  const steps = ['| From | To | Action |', '| --- | --- | --- |',
    '| [the person](../actors/shopper.md) | [x](../systems/shop/system.md) | Place an order |'].join('\n')
  await writes.add(root, { thing: 'flow', name: 'Shopper orders', overview: 'A shopper places an order.', steps })
  return { root, group: `groma/groups/${group.id}.md` }
}

/** Every inline link of a stored record as its text and its link title; a link without a title has none. */
async function links(root: string, record: string): Promise<[string, string | undefined][]> {
  const stored = await readFile(path.join(root, record), 'utf8')
  return [...stored.matchAll(/\[((?:\\.|[^\]\\])*)\]\(\S+?(?: "([^"]*)")?\)/g)].map(link => [link[1]!, link[2]])
}

test.concurrent('a link groma keeps to an element shows its title and carries its id', async () => {
  const { root, group } = await shop()
  try {
    expect(await links(root, actor)).toEqual([['Shopper', 'shopper'], ['Shop', 'shop']])
    expect(await links(root, group)).toEqual([['Stock', 'stock'], ['Orders', 'orders']])
    // The author's link texts are replaced; the action is kept as typed.
    expect(await links(root, flow)).toEqual([['Shopper', 'shopper'], ['Shop', 'shop']])
    expect(await readFile(path.join(root, flow), 'utf8')).toContain('| Place an order |')
    // An endpoint that names a source file keeps its path and gets no title.
    expect(await links(root, `${components}/stock.md`)).toEqual([['src/stock.ts', undefined], ['src/orders.ts', undefined]])
  } finally { await rm(root, { recursive: true, force: true }) }
})

test.concurrent('a new title or id reaches every record that links the element', async () => {
  const { root, group } = await shop()
  try {
    // The title holds a pipe and a closing bracket, which would end a table cell and a link text.
    const retitled = await writes.edit(root, { id: 'shopper', title: 'Shopper | EU ]' }) as StructuralResult
    expect(retitled.changed.toSorted()).toEqual([actor, flow])
    await writes.edit(root, { id: 'shop', newId: 'store' })
    await writes.edit(root, { id: 'stock', newId: 'inventory', title: 'Inventory' })

    expect(await links(root, actor)).toEqual([['Shopper \\| EU \\]', 'shopper'], ['Shop', 'store']])
    expect(await links(root, flow)).toEqual([['Shopper \\| EU \\]', 'shopper'], ['Shop', 'store']])
    expect(await links(root, group)).toEqual([['Inventory', 'inventory'], ['Orders', 'orders']])

    const world = await loadAnnotatedArchitecture(root)
    expect(world.relationships.some(row => row.source === 'shopper' && row.target === 'store')).toBe(true)
    expect(world.flows[0]?.steps.map(step => [step.source, step.target])).toEqual([['shopper', 'store']])
    expect(world.elements.filter(element => element.group !== undefined).map(element => element.id).toSorted()).toEqual(['inventory', 'orders'])
  } finally { await rm(root, { recursive: true, force: true }) }
})
