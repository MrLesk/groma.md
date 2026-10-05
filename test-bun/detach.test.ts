import { expect, test } from 'bun:test'
import { cp, mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createScanObservation } from '@groma/scanner'
import { buildArchitectureModel } from '../src/architecture-model.ts'
import { loadArchitecture } from '../src/architecture-reader.ts'
import { loadAnnotatedArchitecture, reconcileScanObservations } from '../src/core.ts'
import type { StructuralResult } from '../src/curate.ts'
import { editArchitecture } from '../src/edit.ts'
import { removeThing } from '../src/remove.ts'
import { addRelation } from '../src/relation.ts'
import { storedConnections, storedRelationships } from '../src/relationship-markdown.ts'
import type { AnnotatedArchitectureModel } from '../src/types.ts'

const paths = ['emitter.ts', 'handler.ts', 'alternate.ts', 'host.html']

/** One project whose emitter and host page form a source unit; the emitter calls back into the handler. */
function observation() {
  return createScanObservation({
    scanner: { id: 'fixture', technology: 'fixture', engine: 'fixture', engineVersion: '1' },
    roots: [{ id: 'app', kind: 'project', name: 'App' }],
    files: paths.map(file => ({ file, roots: ['app'], symbols: [] })),
    sourceUnits: [{ primary: 'emitter.ts', files: ['emitter.ts', 'host.html'] }],
    operations: paths.slice(0, 2).map(file => ({ id: file, file, name: file, position: 0 })),
    invocations: [{ source: 'emitter.ts', targets: ['handler.ts'], unresolved: false, line: 2,
      member: 'saved', binding: { file: 'host.html', line: 1 } }],
    diagnostics: [],
  })
}

async function repository() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'groma-detach-'))
  await cp(path.resolve(import.meta.dir, '../test/fixtures/empty-project'), root, { recursive: true })
  await cp(path.resolve(import.meta.dir, '../test/fixtures/scanner-composition'), root, { recursive: true })
  await reconcileScanObservations(root, [observation()])
  return root
}

function ownerId(model: AnnotatedArchitectureModel, file: string): string | undefined {
  return model.elements.find(element => element.code.some(reference => reference.file === file))?.id
}

function pairs(model: AnnotatedArchitectureModel): string[] {
  return model.relationships.map(relationship => `${relationship.source}->${relationship.target}`).sort()
}

async function storedRowsNaming(root: string, file: string): Promise<number> {
  const records = await loadArchitecture(root)
  const connections = storedConnections(records.documents, buildArchitectureModel(records.documents).elements, (_code, _file, message) => {
    throw new Error(message)
  })
  return connections.filter(connection => connection.source === file || connection.target === file).length
}

async function storedSource(root: string, source: string) {
  const records = await loadArchitecture(root)
  const model = buildArchitectureModel(records.documents)
  const rows = storedRelationships(records.documents, model.elements, (_code, _file, message) => { throw new Error(message) })
  return { rows: rows.filter(row => row.source === source), elements: model.elements }
}

test.concurrent('a detached file keeps its relationships, gets its own component on the next scan, and can be combined again', async () => {
  const root = await repository()
  try {
    const initial = await loadAnnotatedArchitecture(root)
    const survivor = ownerId(initial, 'alternate.ts')!
    const emitter = ownerId(initial, 'emitter.ts')!
    await editArchitecture(root, { id: survivor, combine: [ownerId(initial, 'handler.ts')!] })
    await addRelation(root, { source: 'handler.ts', target: 'emitter.ts', description: 'Reports the result', technology: 'Callback' })
    const combined = await loadAnnotatedArchitecture(root)
    const authored = await storedSource(root, 'handler.ts')
    const survivorDocument = authored.elements.find(element => element.id === survivor)!.sourceFilename
    expect(authored.rows.map(row => row.document)).toEqual([survivorDocument])
    expect(pairs(combined)).toEqual([`${emitter}->${survivor}`, `${survivor}->${emitter}`].sort())

    const result = await editArchitecture(root, { id: survivor, detach: ['handler.ts'] }) as StructuralResult
    expect(result.changed).toHaveLength(1)
    expect(result.affectedIds).toEqual([survivor])
    const detached = await loadAnnotatedArchitecture(root)
    expect(ownerId(detached, 'handler.ts')).toBeUndefined()
    expect(ownerId(detached, 'alternate.ts')).toBe(survivor)
    expect(detached.relationships).toEqual([])
    expect(await storedRowsNaming(root, 'handler.ts')).toBe(2)
    expect((await storedSource(root, 'handler.ts')).rows).toEqual(authored.rows)

    const bytes = await readFile(path.join(root, result.changed[0]!), 'utf8')
    await expect(editArchitecture(root, { id: survivor, detach: ['alternate.ts', 'handler.ts'] })).rejects.toThrow('does not own')
    await expect(editArchitecture(root, { id: survivor, detach: ['alternate.ts'], combine: [ownerId(detached, 'emitter.ts')!] }))
      .rejects.toThrow('separate edits')
    expect(await readFile(path.join(root, result.changed[0]!), 'utf8')).toBe(bytes)

    await reconcileScanObservations(root, [observation()])
    const rescanned = await loadAnnotatedArchitecture(root)
    const separate = ownerId(rescanned, 'handler.ts')!
    expect(separate).not.toBe(survivor)
    const moved = await storedSource(root, 'handler.ts')
    expect(moved.rows.map(row => row.document)).toEqual([moved.elements.find(element => element.id === separate)!.sourceFilename])
    expect(moved.rows[0]).toMatchObject({ description: 'Reports the result', technology: 'Callback', authored: true })
    const untouched = path.join(root, survivorDocument)
    const previous = await stat(untouched)
    const relationshipsDocument = path.join(root, moved.rows[0]!.document)
    const previousRelationship = await stat(relationshipsDocument)
    await reconcileScanObservations(root, [observation()])
    expect((await stat(untouched)).mtimeMs).toBe(previous.mtimeMs)
    expect((await stat(relationshipsDocument)).mtimeMs).toBe(previousRelationship.mtimeMs)
    expect(pairs(rescanned)).toEqual([`${emitter}->${separate}`, `${separate}->${emitter}`].sort())

    await editArchitecture(root, { id: survivor, combine: [separate] })
    const recombined = await loadAnnotatedArchitecture(root)
    expect(ownerId(recombined, 'handler.ts')).toBe(survivor)
    expect(pairs(recombined)).toEqual(pairs(combined))
    expect((await storedSource(root, 'handler.ts')).rows).toEqual(authored.rows)

    await editArchitecture(root, { id: survivor, detach: ['handler.ts', 'alternate.ts'] })
    await expect(removeThing(root, { id: survivor })).rejects.toThrow('groma scan')
    expect((await storedSource(root, 'handler.ts')).rows).toEqual(authored.rows)
    await reconcileScanObservations(root, [observation()])
    const restored = await storedSource(root, 'handler.ts')
    expect(restored.rows).toHaveLength(1)
    expect(restored.rows[0]).toMatchObject({ source: 'handler.ts', target: 'emitter.ts', authored: true })
    expect(restored.rows[0]!.document).not.toBe(survivorDocument)
    await removeThing(root, { id: survivor })
    expect((await storedSource(root, 'handler.ts')).rows).toEqual(restored.rows)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test.concurrent('a source unit returns to its owner unless every file of the unit is detached', async () => {
  const root = await repository()
  try {
    const unitOwner = ownerId(await loadAnnotatedArchitecture(root), 'emitter.ts')!
    const original = await storedSource(root, 'emitter.ts')
    expect(original.rows[0]?.authored).toBe(false)
    await editArchitecture(root, { id: unitOwner, detach: ['host.html'] })
    await reconcileScanObservations(root, [observation()])
    expect(ownerId(await loadAnnotatedArchitecture(root), 'host.html')).toBe(unitOwner)

    await editArchitecture(root, { id: unitOwner, detach: ['emitter.ts', 'host.html'] })
    await reconcileScanObservations(root, [observation()])
    const rescanned = await loadAnnotatedArchitecture(root)
    const newOwner = ownerId(rescanned, 'emitter.ts')
    expect(newOwner).not.toBe(unitOwner)
    expect(ownerId(rescanned, 'host.html')).toBe(newOwner)
    const transferred = await storedSource(root, 'emitter.ts')
    const document = transferred.elements.find(element => element.id === newOwner)!.sourceFilename
    expect(transferred.rows).toEqual(original.rows.map(row => ({ ...row, document })))
    const filename = path.join(root, document)
    const before = await stat(filename)
    await reconcileScanObservations(root, [observation()])
    expect((await stat(filename)).mtimeMs).toBe(before.mtimeMs)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test.concurrent('detaching the file behind a flow step is refused and writes nothing', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'groma-detach-flow-'))
  try {
    await cp(path.resolve(import.meta.dir, '../test/fixtures/flows'), root, { recursive: true })
    const world = await loadAnnotatedArchitecture(root)
    const flow = world.flows[0]!
    const step = world.relationships.find(relationship => relationship.id === flow.steps[1]!.relationshipId)!
    const owner = world.elements.find(element => element.id === step.target)!
    const document = path.join(root, 'groma/systems/service/containers/api/components/worker.md')
    const bytes = await readFile(document, 'utf8')

    await expect(editArchitecture(root, { id: owner.id, detach: [owner.code[0]!.file] })).rejects.toThrow(flow.id)
    expect(await readFile(document, 'utf8')).toBe(bytes)
    expect((await loadAnnotatedArchitecture(root)).flows).toHaveLength(1)
  } finally { await rm(root, { recursive: true, force: true }) }
})
