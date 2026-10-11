import { expect, test } from 'bun:test'
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { EMPTY_WORK_SNAPSHOT } from '@groma/work-source'

import { buildArchitectureModel } from '../src/architecture-model.ts'
import { loadArchitecture } from '../src/architecture-reader.ts'
import { draftElement } from '../src/draft.ts'
import { resolveFlows } from '../src/flow-model.ts'
import { exportPlan, importPlan } from '../src/plan.ts'
import { editRelation, removeRelation } from '../src/relation.ts'
import { createWebMapSession } from '../src/viewers/web/map-session.ts'

async function repositories() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'groma-plan-'))
  const source = path.join(root, 'source'), destination = path.join(root, 'destination')
  await cp(path.resolve(import.meta.dir, '../test/fixtures/flows'), source, { recursive: true })
  await cp(path.resolve(import.meta.dir, '../test/fixtures/empty-project'), destination, { recursive: true })
  return { root, source, destination }
}

async function architecture(root: string) {
  const records = await loadArchitecture(root)
  const model = buildArchitectureModel(records.documents)
  return { ...model, flows: resolveFlows(records.flows, model) }
}

const entryPath = 'groma/systems/service/containers/api/components/entry.md'

/** Every path below the Groma directory, in a stable order: the listing order of a directory is not. */
async function architectureFiles(root: string): Promise<string[]> {
  return (await readdir(path.join(root, 'groma'), { recursive: true })).sort()
}

test.concurrent('a plan round trip carries element bodies as written, declarations as stable, and relationship and flow meaning', async () => {
  const { root, source, destination } = await repositories()
  try {
    // Formatting, an escaped list marker and a section of its own: none of it survives a decode and re-encode.
    const body = 'Coordinates the `*pending*` request for [the team](https://example.com/team), **in order**.\n\n'
      + '1986\\. A great year.\n\n## Requirements\n\nAnswers within one second.'
    const entry = path.join(source, entryPath)
    await writeFile(entry, (await readFile(entry, 'utf8'))
      .replace('  parent: api\n', '  parent: api\n  group: Core\n')
      .replace('Coordinates a request.', body)
      .replace('Dispatches work | Function call', 'Dispatches A \\| B | Function A \\| B'))
    const flowPath = path.join(source, 'groma/flows/process-request.md')
    await writeFile(flowPath, (await readFile(flowPath, 'utf8'))
      .replace('The requester submits work.', 'The requester submits `*pending*` work.')
      .replace('Run the first unit', 'Run A \\| B'))
    const before = await architecture(source)
    const bundle = await exportPlan(source, { ids: before.elements.map(element => element.id), to: '../shared-plan' })
    await importPlan(destination, { path: bundle })
    const after = await architecture(destination)
    expect(await readFile(path.join(destination, entryPath), 'utf8')).toContain(body)
    // Software is planned and becomes a ghost. A person and an external system are declared, in the plan and after import.
    expect(await readFile(path.join(bundle, 'actors/requester.md'), 'utf8')).toContain('status: stable')
    expect(Object.fromEntries(after.elements.map(element => [element.id, element.status]))).toEqual({
      requester: 'stable', journal: 'stable', service: 'draft', api: 'draft', entry: 'draft', worker: 'draft',
    })
    expect(after.elements.map(element => element.draft)).toEqual(after.elements.map(() => 'shared-plan'))
    // Code ownership and groups belong to the repository the elements came from.
    expect(after.elements.filter(element => element.code.length > 0 || element.group !== undefined)).toEqual([])
    const elements = (model: typeof before) => model.elements.map(({ id, kind, title, description, technology, parentId, overview }) =>
      ({ id, kind, title, description, technology, parentId, overview }))
    const relationships = (model: typeof before) => model.relationships.map(({ sourceId, targetId, description, technology }) =>
      ({ sourceId, targetId, description, technology }))
    const flows = (model: typeof before) => model.flows.map(({ id, title, description, overview, steps }) =>
      ({ id, title, description, overview, steps: steps.map(({ source, target, action }) => ({ source, target, action })) }))
    expect(elements(after)).toEqual(elements(before))
    expect(relationships(after)).toEqual(relationships(before))
    expect(flows(after)).toEqual(flows(before))
  } finally { await rm(root, { recursive: true, force: true }) }
})

test.concurrent('element parent IDs drive missing-parent validation and destination replacement', async () => {
  const { root, source, destination } = await repositories()
  try {
    const bundle = await exportPlan(source, { ids: ['entry', 'worker'], to: '../shared-plan' })
    const before = await architectureFiles(destination)
    await expect(importPlan(destination, { path: bundle })).rejects.toThrow('"api"')
    expect(await architectureFiles(destination)).toEqual(before)
    await draftElement(destination, { kind: 'system', name: 'Destination', overview: '' })
    await draftElement(destination, { kind: 'container', name: 'Application', parent: 'destination', overview: '' })
    await importPlan(destination, { path: bundle, parent: 'application' })
    const imported = (await architecture(destination)).elements.filter(element => ['entry', 'worker'].includes(element.id))
    expect(imported.map(element => element.parentId)).toEqual(['application', 'application'])
    expect(imported.every(element => element.sourceFilename.includes('/containers/application/components/'))).toBe(true)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test.concurrent('imported concept draft relationships can be edited and removed before implementation', async () => {
  const { root, source, destination } = await repositories()
  try {
    const bundle = await exportPlan(source, { ids: ['service', 'api', 'entry', 'worker'], to: '../shared-plan' })
    await importPlan(destination, { path: bundle })
    const ends = { source: 'entry', target: 'worker' }
    await editRelation(destination, { ...ends, description: 'Dispatches work in batches', technology: 'Queue' })
    const changed = (await architecture(destination)).relationships.find(row => row.sourceId === 'entry' && row.targetId === 'worker')!
    expect(changed).toMatchObject({ status: 'draft', description: 'Dispatches work in batches', technology: 'Queue' })
    await removeRelation(destination, ends)
    expect((await architecture(destination)).relationships.some(row => row.sourceId === 'entry' && row.targetId === 'worker')).toBe(false)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test.concurrent('the live map exports a plan only into a new directory inside its repository', async () => {
  const { root, source } = await repositories()
  let session: Awaited<ReturnType<typeof createWebMapSession>> | undefined
  try {
    session = await createWebMapSession(source, { scan: false, workSource: {
      async read() { return EMPTY_WORK_SNAPSHOT },
      async readItem() { throw new Error('No task') },
      watch() { return { close() {} } },
    } })
    const send = (to: string) => session!.fetch(new Request('http://localhost/plan/export', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: ['entry', 'worker'], to }),
    }))
    // Outside by a relative path, outside by an absolute path, and the repository itself, which is not new.
    for (const refused of ['../outside-plan', path.join(root, 'absolute-plan'), '.']) {
      expect((await send(refused)).status).toBe(400)
    }
    expect((await readdir(root)).sort()).toEqual(['destination', 'source'])
    expect((await send('plans/inside')).ok).toBe(true)
    expect(await readdir(path.join(source, 'plans/inside'))).toContain('plan.md')
    expect((await send('plans/inside')).status).toBe(400)
  } finally {
    await session?.close()
    await rm(root, { recursive: true, force: true })
  }
})

test.concurrent('a plan is never exported into the Groma directory', async () => {
  const { root, source } = await repositories()
  try {
    const before = await architectureFiles(source)
    await expect(exportPlan(source, { ids: ['entry', 'worker'], to: 'groma/plans/inside' })).rejects.toThrow('inside groma/')
    expect(await architectureFiles(source)).toEqual(before)
  } finally { await rm(root, { recursive: true, force: true }) }
})
