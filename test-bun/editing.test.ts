import assert from 'node:assert/strict'
import { cp, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'bun:test'
import { parseFrontmatter } from 'comark'
import { writes } from '../src/authoring.ts'
import { loadArchitecture } from '../src/architecture-reader.ts'
import { loadAnnotatedArchitecture } from '../src/core.ts'
import type { StructuralResult } from '../src/curate.ts'
import { scanRepository } from '../src/scanner.ts'
import { creationParent, enclosed, gestureBounds } from '../src/viewers/web/editing/intent.ts'
import { okfFixtureRoot, repositoryRoot, withFixture } from './helpers.ts'
import { EMPTY_WORK_SNAPSHOT } from '@groma/work-source'
import { createWebMapSession } from '../src/viewers/web/map-session.ts'
import { GromaFileSystem } from '../src/groma-filesystem.ts'
import { inspectDetails } from '../src/viewers/web/organisms/details.ts'
import { changedEdit } from '../src/authoring-conflict.ts'

async function fixture(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), 'groma-editing-'))
  await cp(path.join(repositoryRoot, 'test/fixtures/edit'), root, { recursive: true })
  assert.equal(Bun.spawnSync(['git', 'init'], { cwd: root }).exitCode, 0)
  return root
}

const relation = { kind: 'relation' as const, name: 'src/stock.ts', relation: 'src/orders.ts', description: 'Checks availability', technology: 'Call' }

test.concurrent('adding a virtual component writes a stable document in its container and keeps the other origins distinct', async () => {
  await withFixture(okfFixtureRoot, async root => {
    const component = {
      thing: 'component' as const, parent: 'api', name: 'Review', overview: 'A person reviews the order.',
      description: 'Manual review', technology: 'Paper',
    }
    await assert.rejects(writes.add(root, { ...component, parent: 'git' }))
    const id = await writes.add(root, component)
    const document = await GromaFileSystem.open(root).read(`systems/shop/containers/api/components/${id}.md`)
    const { data, content } = parseFrontmatter(document)
    assert.equal(data.type, 'C4 Component')
    assert.equal(data.status, 'stable')
    assert.equal(data.title, component.name)
    assert.equal(data.description, component.description)
    assert.deepEqual(data.groma, { id, parent: component.parent, technology: component.technology })
    assert.equal(content.trim(), component.overview)

    const { elements } = await loadAnnotatedArchitecture(root)
    const origin = (id: string) => elements.find(element => element.id === id)?.origin
    assert.equal(origin(id), 'virtual')
    assert.equal(origin('stock'), 'draft')
    assert.equal(origin('buyer'), 'observed')
    assert.equal(origin('orders'), 'observed')
  })
})

test.concurrent('a file links to a virtual component through its source owner until the unused relationship is removed', async () => {
  const root = await fixture()
  try {
    const id = await writes.add(root, { thing: 'component', name: 'Review', parent: 'api', overview: 'A person reviews the order.' })
    const link = { thing: 'relation' as const, name: 'src/stock.ts', relation: id, description: 'Requests review', technology: 'Form' }
    await assert.rejects(writes.add(root, { ...link, name: 'stock', relation: 'orders' }))
    await assert.rejects(writes.add(root, { ...link, name: 'stock' }))
    await writes.add(root, link)

    const world = await loadAnnotatedArchitecture(root)
    const relationship = world.relationships.find(row => row.source === 'stock' && row.target === id)!
    assert.deepEqual(relationship.connections?.map(row => [row.source, row.target]), [[link.name, id]])
    await assert.rejects(writes.remove(root, { id }))

    const folder = 'systems/shop/containers/api/components'
    const steps = ['| From | To | Action |', '| --- | --- | --- |',
      `| [Stock](../${folder}/stock.md) | [Review](../${folder}/${id}.md) | Request review |`].join('\n')
    const flow = await writes.add(root, { thing: 'flow', name: 'Order review', overview: 'Request a review.', steps })
    const after = await loadAnnotatedArchitecture(root)
    assert.equal(after.flows.find(record => record.id === flow)?.steps[0]?.relationshipId, relationship.id)
    const address = { id: link.name, relation: id }
    await assert.rejects(writes.remove(root, address))
    await writes.remove(root, { id: flow })
    await writes.remove(root, address)
    await writes.remove(root, { id })
    assert.ok(!(await loadAnnotatedArchitecture(root)).elements.some(element => element.id === id))
  } finally { await rm(root, { recursive: true, force: true }) }
})

test.concurrent('web edits reject conflicting fields as one request and accept unrelated or already-applied edits', async () => {
  const root = await fixture()
  let session: Awaited<ReturnType<typeof createWebMapSession>> | undefined
  try {
    session = await createWebMapSession(root, { scan: false, workSource: {
      async read() { return EMPTY_WORK_SNAPSHOT },
      async readItem() { throw new Error('No task') },
      watch() { return { close() {} } },
    } })
    const read = async () => (await loadAnnotatedArchitecture(root)).elements.find(element => element.id === 'stock')!
    const send = (input: object) => session!.fetch(new Request('http://localhost/edit', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 'stock', ...input }),
    }))
    const original = await read()
    const accepted = { title: 'Inventory', original: { title: original.title } }
    assert.equal((await send(accepted)).status, 200)
    assert.equal((await send(accepted)).status, 200)
    await writes.edit(root, { id: 'stock', title: 'Availability' })
    const filesystem = GromaFileSystem.open(root)
    const filename = 'systems/shop/containers/api/components/stock.md'
    const before = await filesystem.read(filename)
    const rejected = await send({
      title: 'Purchases', overview: 'A second field must stay unchanged on conflict.',
      original: { title: original.title, overview: original.overview },
    })
    assert.equal(rejected.status, 409)
    const error = await rejected.json()
    assert.equal(error.code, 'edit_conflict')
    assert.deepEqual(error.conflicts, [{ field: 'title', original: original.title, current: 'Availability', proposed: 'Purchases' }])
    assert.equal(await filesystem.read(filename), before)
    assert.equal((await send({ overview: 'Reserves items.', original: { overview: original.overview } })).status, 200)
    const current = await read()
    assert.equal(current.title, 'Availability')
    assert.equal(current.overview, 'Reserves items.')
    const description = { description: ' Holds inventory. ', original: { description: current.description ?? '' } }
    assert.equal((await send(description)).status, 200)
    assert.equal((await send(description)).status, 200)
    const overview = { overview: ' Holds inventory. ', original: { overview: current.overview } }
    assert.equal((await send(overview)).status, 200)
    assert.equal((await send(overview)).status, 200)
    const profile = await import('../src/project-profile.ts').then(module => module.loadProjectProfile(root))
    const project = { id: 'project', title: ' Inventory service ', original: { title: profile!.title } }
    assert.equal((await send(project)).status, 200)
    assert.equal((await send(project)).status, 200)
    await writes.edit(root, { id: 'stock', technology: 'TypeScript,Bun' })
    const world = await loadAnnotatedArchitecture(root)
    const inspected = inspectDetails(world.elements.find(element => element.id === 'stock')!, world)
    const technology = changedEdit({ technology: inspected.technology }, { technology: 'TypeScript' })
    assert.equal((await send(technology)).status, 200)
    assert.equal((await read()).technology, 'TypeScript')
    await writes.draft(root, relation)
    const relationship = {
      id: relation.name, relation: relation.relation,
      description: ' Reserves items. ', technology: ' HTTP ',
      original: { description: relation.description, technology: relation.technology },
    }
    assert.equal((await send(relationship)).status, 200)
    assert.equal((await send(relationship)).status, 200)
  } finally {
    await session?.close()
    await rm(root, { recursive: true, force: true })
  }
})

test.concurrent('tag edits keep carried tags in order, append new tags once and remove an empty OKF field', async () => {
  const root = await fixture()
  try {
    const filesystem = GromaFileSystem.open(root)
    const frontmatter = async () => parseFrontmatter(await filesystem.read('systems/shop/containers/api/components/stock.md')).data
    await writes.edit(root, { id: 'stock', addTags: 'inventory, legacy, checkout, audit' })
    await writes.edit(root, { id: 'stock', addTags: 'inventory, warehouse, cold, warehouse', removeTags: 'legacy, unused' })
    await writes.edit(root, { id: 'stock', title: 'Availability' })
    await scanRepository(root)
    const { tags, groma } = await frontmatter() as { tags: unknown; groma: Record<string, unknown> }
    assert.deepEqual(tags, ['inventory', 'checkout', 'audit', 'warehouse', 'cold'])
    assert.equal('tags' in groma, false)
    await assert.rejects(writes.edit(root, { id: 'stock', addTags: 'cold', removeTags: 'cold' }))
    await writes.edit(root, { id: 'stock', removeTags: 'cold, warehouse, audit, inventory, checkout' })
    assert.equal('tags' in await frontmatter(), false)
    await assert.rejects(writes.edit(root, { id: 'project', title: 'Shop', addTags: 'warehouse' }))
  } finally { await rm(root, { recursive: true, force: true }) }
})

test.concurrent('one edit adds a tag and sets the color on every named element', async () => {
  const root = await fixture()
  try {
    await writes.edit(root, { id: 'stock', addTags: 'inventory' })
    const result = await writes.edit(root, { id: 'shop', alsoIds: ['api', 'stock'], addTags: 'checkout', color: 'blue' })
    assert.ok(typeof result !== 'string')
    assert.equal(result.id, 'shop')
    assert.deepEqual(new Set(result.affectedIds), new Set(['shop', 'api', 'stock']))
    const filesystem = GromaFileSystem.open(root)
    const edited: Record<string, { color: string; tags: string[] }> = {}
    for (const filename of result.changed) {
      const { tags, groma } = parseFrontmatter(await filesystem.readSource(filename)).data
      edited[groma.id] = { color: groma.color, tags }
    }
    assert.deepEqual(edited, {
      shop: { color: 'blue', tags: ['checkout'] },
      api: { color: 'blue', tags: ['checkout'] },
      stock: { color: 'blue', tags: ['inventory', 'checkout'] },
    })
  } finally { await rm(root, { recursive: true, force: true }) }
})

test.concurrent('a refused edit of several elements leaves every document unchanged', async () => {
  const root = await fixture()
  try {
    const { documents } = await loadArchitecture(root)
    const bytes = () => Promise.all(documents.map(document => readFile(path.join(root, document.sourceFilename))))
    const before = await bytes()
    // An unknown id after two known ones, and a field several elements do not take.
    await assert.rejects(writes.edit(root, { id: 'shop', alsoIds: ['api', 'missing'], addTags: 'checkout', color: 'blue' }))
    await assert.rejects(writes.edit(root, { id: 'shop', alsoIds: ['api'], addTags: 'checkout', title: 'Storefront' }))
    assert.deepEqual(await bytes(), before)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test.concurrent('color edits set and clear the name, refuse an unknown one, and other edits and scans keep it', async () => {
  const root = await fixture()
  try {
    const read = async () => (await loadAnnotatedArchitecture(root)).elements.find(element => element.id === 'api')!
    await writes.edit(root, { id: 'api', color: 'violet' })
    await writes.edit(root, { id: 'api', title: 'Order API' })
    await scanRepository(root)
    assert.equal((await read()).color, 'violet')
    await assert.rejects(writes.edit(root, { id: 'api', color: 'teal' }))
    assert.equal((await read()).color, 'violet')
    // A form opened while the element had no color proposes blue: the color stored meanwhile is not overwritten.
    await assert.rejects(writes.edit(root, { id: 'api', color: 'blue', original: { color: '' } }), { code: 'edit_conflict' })
    assert.equal((await read()).color, 'violet')
    await writes.edit(root, { id: 'api', color: '' })
    assert.equal((await read()).color, undefined)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test.concurrent('icon edits set and clear the name, refuse an unknown one and the project record, and other edits and scans keep it', async () => {
  const root = await fixture()
  try {
    const read = async () => (await loadAnnotatedArchitecture(root)).elements.find(element => element.id === 'api')!
    await writes.edit(root, { id: 'api', icon: 'database' })
    await writes.edit(root, { id: 'api', title: 'Order API' })
    await scanRepository(root)
    assert.equal((await read()).icon, 'database')
    await assert.rejects(writes.edit(root, { id: 'api', icon: 'postgres' }))
    await assert.rejects(writes.edit(root, { id: 'project', title: 'Shop', icon: 'database' }))
    assert.equal((await read()).icon, 'database')
    await writes.edit(root, { id: 'api', icon: '' })
    assert.equal((await read()).icon, undefined)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test.concurrent('draft relationships survive edits and scans and require explicit acceptance', async () => {
  const root = await fixture()
  try {
    const drafted = Bun.spawn(['bun', path.join(repositoryRoot, 'src/cli.ts'), 'draft', 'relation', 'src/stock.ts', 'src/orders.ts', '--description', relation.description, '--technology', relation.technology], { cwd: root, stderr: 'pipe' })
    assert.equal(await drafted.exited, 0, await new Response(drafted.stderr).text())
    const read = async () => (await loadAnnotatedArchitecture(root)).relationships.find(row => row.source === 'stock' && row.target === 'orders')!
    assert.equal((await read()).origin, 'draft')
    await writes.edit(root, { id: 'src/stock.ts', relation: 'src/orders.ts', description: 'Reserves availability' })
    assert.equal((await read()).origin, 'draft')
    await scanRepository(root)
    assert.equal((await read()).origin, 'draft')
    const accepted = Bun.spawn(['bun', path.join(repositoryRoot, 'src/cli.ts'), 'accept', 'relation', 'src/stock.ts', 'src/orders.ts'], { cwd: root, stderr: 'pipe' })
    assert.equal(await accepted.exited, 0, await new Response(accepted.stderr).text())
    assert.equal((await read()).origin, 'observed')
    const before = await read()
    await assert.rejects(writes.remove(root, { id: 'src/stock.ts', relation: 'src/orders.ts' }))
    assert.deepEqual(await read(), before)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test.concurrent('drop intent chooses ancestry and grouping keeps world ownership', async () => {
  const root = await fixture()
  try {
    const world = await loadAnnotatedArchitecture(root)
    assert.equal(creationParent(world.elements, 'component', 'stock'), 'api')
    assert.equal(creationParent(world.elements, 'container', 'stock'), 'shop')
    assert.equal(creationParent(world.elements, 'system', undefined), undefined)
    assert.throws(() => creationParent(world.elements, 'component', undefined))
    const id = await writes.draft(root, { kind: 'component', name: 'Planned check', parent: 'api', overview: '' })
    const group = await writes.add(root, { thing: 'group', name: 'Checks', members: ['stock', id] }) as StructuralResult
    await writes.edit(root, { id, title: 'Inventory check', technology: 'Bun' })
    const selected = (await loadAnnotatedArchitecture(root)).elements.filter(element => ['stock', id].includes(element.id))
    assert.equal(selected.length, 2)
    assert.ok(selected.every(element => element.parent === 'api' && element.group === group.id))
    const created = selected.find(element => element.id === id)!
    assert.equal(created.origin, 'draft')
    const bounds = gestureBounds({ x: 100, y: 100 }, { x: 0, y: 0 })
    assert.equal(enclosed(bounds, { x: 10, y: 10, width: 40, height: 40 }), true)
    assert.equal(enclosed(bounds, { x: 80, y: 10, width: 40, height: 40 }), false)
  } finally { await rm(root, { recursive: true, force: true }) }
})
