import assert from 'node:assert/strict'
import { cp, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'bun:test'
import { writes } from '../src/authoring.ts'
import { loadAnnotatedArchitecture } from '../src/core.ts'
import { scanRepository } from '../src/scanner.ts'
import { creationParent, enclosed, gestureBounds } from '../src/viewers/web/editing/intent.ts'
import { repositoryRoot } from './helpers.ts'
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
    await writes.add(root, { thing: 'group', name: 'Checks', members: ['stock', id] })
    await writes.edit(root, { id, group: 'Checks', title: 'Inventory check', technology: 'Bun' })
    const selected = (await loadAnnotatedArchitecture(root)).elements.filter(element => ['stock', id].includes(element.id))
    assert.equal(selected.length, 2)
    assert.ok(selected.every(element => element.parent === 'api' && element.group === 'Checks'))
    const created = selected.find(element => element.id === id)!
    assert.equal(created.origin, 'draft')
    const bounds = gestureBounds({ x: 100, y: 100 }, { x: 0, y: 0 })
    assert.equal(enclosed(bounds, { x: 10, y: 10, width: 40, height: 40 }), true)
    assert.equal(enclosed(bounds, { x: 80, y: 10, width: 40, height: 40 }), false)
  } finally { await rm(root, { recursive: true, force: true }) }
})
