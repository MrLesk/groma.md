import { expect, test } from 'bun:test'
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createScanObservation } from '@groma/scanner'
import { writes } from '../src/authoring.ts'
import { loadAnnotatedArchitecture, reconcileScanObservations } from '../src/core.ts'
import type { StructuralResult } from '../src/curate.ts'
import type { AnnotatedArchitectureModel } from '../src/types.ts'
import { repositoryRoot } from './helpers.ts'

/** One system, its api container, and the components orders and stock, which both carry authored meaning. */
async function shop(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), 'groma-groups-'))
  await cp(path.join(repositoryRoot, 'test/fixtures/edit'), root, { recursive: true })
  return root
}

/** Each group id with the ids of the components that name it. */
function membership(world: AnnotatedArchitectureModel): Record<string, string[]> {
  return Object.fromEntries(world.groups.map(group => [
    group.id,
    world.elements.filter(element => element.group === group.id).map(element => element.id),
  ]))
}

/** A component with no meaning and no code, which may be removed and moved. */
function planned(root: string, name: string, parent: string): Promise<string> {
  return writes.draft(root, { kind: 'component', name, parent, overview: '' })
}

async function writeGroup(root: string, id: string, members: string[]): Promise<void> {
  await mkdir(path.join(root, 'groma/groups'), { recursive: true })
  const links = members.map(target => `- [member](${target})`).join('\n')
  await writeFile(path.join(root, `groma/groups/${id}.md`),
    `---\ntype: Groma Group\ntitle: ${id}\ngroma:\n  id: ${id}\n---\n\n## Members\n\n${links}\n`)
}

const api = '../systems/shop/containers/api'

test.concurrent('a group is one record that lists its members, and its commands write nothing on a component', async () => {
  const root = await shop()
  try {
    const stockDocument = path.join(root, 'groma/systems/shop/containers/api/components/stock.md')
    const stock = await readFile(stockDocument, 'utf8')

    const added = await writes.add(root, { thing: 'group', name: 'Checks', members: ['stock', 'orders'] }) as StructuralResult
    expect(added.created).toEqual([`groma/groups/${added.id}.md`])
    expect(membership(await loadAnnotatedArchitecture(root))).toEqual({ [added.id]: ['orders', 'stock'] })

    await writes.edit(root, { id: added.id, title: 'Order checks', description: 'What runs before an order.', overview: 'Both run first.' })
    await writes.edit(root, { id: 'orders', ungroup: true })
    const edited = await loadAnnotatedArchitecture(root)
    expect(edited.groups).toEqual([{ id: added.id, title: 'Order checks', description: 'What runs before an order.', overview: 'Both run first.' }])
    expect(membership(edited)).toEqual({ [added.id]: ['stock'] })

    // Grouping under a title the container already has joins that group, as Group as does in the web map.
    const rejoined = await writes.add(root, { thing: 'group', name: 'Order checks', members: ['orders'] }) as StructuralResult
    expect(rejoined.id).toBe(added.id)
    expect(membership(await loadAnnotatedArchitecture(root))).toEqual({ [added.id]: ['orders', 'stock'] })

    const second = await writes.add(root, { thing: 'group', name: 'Intake', members: ['orders'] }) as StructuralResult
    await writes.edit(root, { id: 'stock', group: second.id })
    expect(membership(await loadAnnotatedArchitecture(root))).toEqual({ [added.id]: [], [second.id]: ['orders', 'stock'] })

    await writes.remove(root, { id: second.id })
    const dissolved = await loadAnnotatedArchitecture(root)
    expect(membership(dissolved)).toEqual({ [added.id]: [] })
    expect(dissolved.elements.some(element => element.group !== undefined)).toBe(false)
    expect(await readFile(stockDocument, 'utf8')).toBe(stock)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test.concurrent('loading refuses a group whose members are not components of one container, each in one group', async () => {
  const root = await shop()
  try {
    await writes.draft(root, { kind: 'container', name: 'Web', parent: 'shop', overview: '' })
    await planned(root, 'Page', 'web')
    const cases: Array<[string[], RegExp]> = [
      [[`${api}/components/missing.md`], /does not resolve/],
      [[`${api}/container.md`], /only components form a group/],
      [[`${api}/components/stock.md`, '../systems/shop/containers/web/components/page.md'], /one container/],
    ]
    for (const [members, refusal] of cases) {
      await writeGroup(root, 'broken', members)
      await expect(loadAnnotatedArchitecture(root)).rejects.toThrow(refusal)
    }
    await writeGroup(root, 'broken', [`${api}/components/stock.md`])
    await writeGroup(root, 'second', [`${api}/components/stock.md`])
    await expect(loadAnnotatedArchitecture(root)).rejects.toThrow(/belongs to one group/)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test.concurrent('removing, renaming and moving keep every group loadable', async () => {
  const root = await shop()
  try {
    const leaving = await planned(root, 'Leaving check', 'api')
    const moving = await planned(root, 'Moving check', 'api')
    const group = await writes.add(root, { thing: 'group', name: 'Checks', members: ['stock', leaving, moving] }) as StructuralResult
    const members = async () => membership(await loadAnnotatedArchitecture(root))[group.id]

    await writes.remove(root, { id: leaving })
    expect(await members()).toEqual([moving, 'stock'])

    await writes.edit(root, { id: 'stock', newId: 'inventory' })
    await writes.edit(root, { id: 'api', newId: 'backend' })
    expect(await members()).toEqual(['inventory', moving])

    await writes.draft(root, { kind: 'system', name: 'Depot', overview: '' })
    await writes.edit(root, { id: 'backend', parent: 'depot' })
    expect(await members()).toEqual(['inventory', moving])

    // A group lists components of one container, so only a component that moves to another one leaves it.
    await writes.edit(root, { id: moving, parent: 'backend' })
    expect(await members()).toEqual(['inventory', moving])
    await writes.draft(root, { kind: 'container', name: 'Web', parent: 'depot', overview: '' })
    await writes.edit(root, { id: moving, parent: 'web' })
    expect(await members()).toEqual(['inventory'])
  } finally { await rm(root, { recursive: true, force: true }) }
})

test.concurrent('a scan never gives a new component the id of a group', async () => {
  const root = await shop()
  try {
    const group = await writes.add(root, { thing: 'group', name: 'Checks', members: ['stock'] }) as StructuralResult
    const file = `src/${group.id}.ts`
    await reconcileScanObservations(root, [createScanObservation({
      scanner: { id: 'typescript', technology: 'fixture', engine: 'fixture', engineVersion: '1' },
      roots: [{ id: 'app', kind: 'project', name: 'Shop' }],
      files: [{ file, roots: ['app'], symbols: [] }],
      diagnostics: [],
    })])
    const owner = (await loadAnnotatedArchitecture(root)).elements.find(element => element.code.some(code => code.file === file))
    expect(owner).toBeDefined()
    expect(owner!.id).not.toBe(group.id)
  } finally { await rm(root, { recursive: true, force: true }) }
})
