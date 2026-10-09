import { expect, test } from 'bun:test'
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { buildArchitectureModel } from '../src/architecture-model.ts'
import { loadArchitecture } from '../src/architecture-reader.ts'
import { draftElement } from '../src/draft.ts'
import { resolveFlows } from '../src/flow-model.ts'
import { exportPlan, importPlan } from '../src/plan.ts'
import { editRelation, removeRelation } from '../src/relation.ts'

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

test.concurrent('a plan round trip preserves literal overview, relationship and ordered flow meaning', async () => {
  const { root, source, destination } = await repositories()
  try {
    const entry = path.join(source, entryPath)
    await writeFile(entry, (await readFile(entry, 'utf8'))
      .replace('Coordinates a request.', 'Coordinates the `*pending*` request and `&copy;` value.')
      .replace('Dispatches work | Function call', 'Dispatches A \\| B | Function A \\| B'))
    const flowPath = path.join(source, 'groma/flows/process-request.md')
    await writeFile(flowPath, (await readFile(flowPath, 'utf8'))
      .replace('The requester submits work.', 'The requester submits `*pending*` work.')
      .replace('Run the first unit', 'Run A \\| B'))
    const before = await architecture(source)
    const bundle = await exportPlan(source, { ids: before.elements.map(element => element.id), to: '../shared-plan' })
    await importPlan(destination, { path: bundle })
    const after = await architecture(destination)
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
    const before = await readdir(path.join(destination, 'groma'), { recursive: true })
    await expect(importPlan(destination, { path: bundle })).rejects.toThrow('api')
    expect(await readdir(path.join(destination, 'groma'), { recursive: true })).toEqual(before)
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
    await editRelation(destination, { ...ends, description: 'Dispatches A | B', technology: 'Callback | queue' })
    const changed = (await architecture(destination)).relationships.find(row => row.sourceId === 'entry' && row.targetId === 'worker')!
    expect(changed).toMatchObject({ status: 'draft', description: 'Dispatches A | B', technology: 'Callback | queue' })
    await removeRelation(destination, ends)
    expect((await architecture(destination)).relationships.some(row => row.sourceId === 'entry' && row.targetId === 'worker')).toBe(false)
  } finally { await rm(root, { recursive: true, force: true }) }
})
