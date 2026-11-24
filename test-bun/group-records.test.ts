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

    await writes.edit(root, { id: added.id, addTags: 'checkout, internal' })
    await writes.edit(root, {
      id: added.id, title: 'Order checks', description: 'What runs before an order.', overview: 'Both run first.',
      removeTags: 'internal', color: 'blue', icon: 'board',
    })
    // An unknown name is refused and leaves the stored color as it was.
    await expect(writes.edit(root, { id: added.id, color: 'sky' })).rejects.toThrow()
    await writes.edit(root, { id: 'orders', ungroup: true })
    const edited = await loadAnnotatedArchitecture(root)
    expect(edited.groups).toEqual([{
      id: added.id, title: 'Order checks', description: 'What runs before an order.', overview: 'Both run first.',
      tags: ['checkout'], color: 'blue', icon: 'board',
    }])
    expect(membership(edited)).toEqual({ [added.id]: ['stock'] })

    await writes.edit(root, { id: added.id, color: '', icon: '' })
    const cleared = (await loadAnnotatedArchitecture(root)).groups[0]!
    expect(cleared).not.toHaveProperty('color')
    expect(cleared).not.toHaveProperty('icon')

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

/** Names a group the way groma 0.7 did: in a `group` field of the document's own groma mapping. */
async function writeOldGroupField(document: string, name: string): Promise<void> {
  const source = await readFile(document, 'utf8')
  const named = source.replace(/^groma:\n {2}id: .+\n/m, line => `${line}  group: ${name}\n`)
  expect(named).not.toBe(source)
  await writeFile(document, named)
}

const apiDocument = (root: string, file: string) => path.join(root, 'groma/systems/shop/containers/api', file)

test.concurrent('a project groma 0.7 wrote turns the group names on its components into group records', async () => {
  const root = await shop()
  try {
    // The container and a component without a container carry the name too, which no group can hold now.
    // Only a scan stores such a component, directly under its system.
    const loose = path.join(root, 'groma/systems/shop/components/loose.md')
    await mkdir(path.dirname(loose), { recursive: true })
    await writeFile(loose, '---\ntype: C4 Component\ntitle: Loose\nstatus: stable\ngroma:\n  id: loose\n  parent: shop\n---\n')
    const documents = [
      ...['container.md', 'components/orders.md', 'components/stock.md'].map(file => apiDocument(root, file)),
      loose,
    ]
    for (const document of documents) await writeOldGroupField(document, 'Checks')

    expect(membership(await loadAnnotatedArchitecture(root))).toEqual({ 'api-checks': ['orders', 'stock'] })
    for (const document of documents) expect(await readFile(document, 'utf8')).not.toMatch(/^ +group:/m)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test.concurrent('a group converted from groma 0.7 takes the next free id when its usual id is taken', async () => {
  const root = await shop()
  try {
    // An element holds the usual id of both names, and the two names differ only in letter case.
    expect(await planned(root, 'Api checks', 'api')).toBe('api-checks')
    await writeOldGroupField(apiDocument(root, 'components/orders.md'), 'Checks')
    await writeOldGroupField(apiDocument(root, 'components/stock.md'), 'checks')

    expect(membership(await loadAnnotatedArchitecture(root))).toEqual({ 'api-checks-2': ['orders'], 'api-checks-3': ['stock'] })
  } finally { await rm(root, { recursive: true, force: true }) }
})
