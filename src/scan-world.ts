import { architectureElementPath } from './architecture-path.ts'
import { GromaFileSystem } from './groma-filesystem.ts'
import { renderArchitectureDocument, writeDocument } from './markdown-emitter.ts'
import { isReservedId, kebabCase } from './naming.ts'
import { c4Kind, requireGromaMapping } from './okf-profile.ts'
import type { ArchitectureDocument, ArchitectureRecords, C4Kind, CodeReference, ElementStatus } from './types.ts'

export function readCode(value: unknown): CodeReference[] {
  if (!Array.isArray(value)) return []
  return value.map(entry => {
    const reference = entry as CodeReference
    return {
      scanner: reference.scanner,
      file: reference.file,
      ...(Object.hasOwn(reference, 'symbol') ? { symbol: reference.symbol } : {}),
    }
  })
}

export interface WorldRecord {
  id: string
  title: string
  kind: C4Kind
  parent?: string | null
  status: ElementStatus
  sourceFilename: string
  code: CodeReference[]
}

export interface World {
  byId: Map<string, WorldRecord>
  byCodeFile: Map<string, WorldRecord>
}

function worldRecord(document: ArchitectureDocument): WorldRecord | undefined {
  const kind = c4Kind(document.frontmatter.type)
  if (kind === undefined) return undefined
  const groma = requireGromaMapping(document.frontmatter, document.sourceFilename)
  const { id, parent } = groma
  if (typeof id !== 'string') return undefined
  if (parent !== undefined && parent !== null && typeof parent !== 'string') return undefined
  return {
    id,
    title: String(document.frontmatter.title),
    kind,
    parent,
    status: document.frontmatter.status === 'draft' ? 'draft' : 'stable',
    sourceFilename: document.sourceFilename,
    code: readCode(groma.code),
  }
}

export function indexWorld(records: ArchitectureRecords): World {
  const world: World = { byId: new Map(), byCodeFile: new Map() }
  for (const document of records.documents) {
    const record = worldRecord(document)
    if (record === undefined) continue
    world.byId.set(record.id, record)
    for (const reference of record.code) {
      world.byCodeFile.set(reference.file, record)
    }
  }
  return world
}

/** The IDs a record of this name may take, in order: plain, qualified by its parent, then numbered. */
export function candidateId(name: string, parent: WorldRecord | undefined, index: number): string {
  const base = kebabCase(name) || 'source'
  if (index === 0) return base
  const qualified = `${parent?.id ?? 'source'}-${base}`
  return index === 1 ? qualified : `${qualified}-${index}`
}

export function isFree(world: World, id: string): boolean {
  return !world.byId.has(id) && !isReservedId(id)
}

/** The first candidate ID no record holds. */
function availableId(world: World, name: string, parent?: WorldRecord): string {
  let index = 0
  while (!isFree(world, candidateId(name, parent, index))) index += 1
  return candidateId(name, parent, index)
}

interface RecordInput {
  kind: C4Kind
  id?: string
  name: string
  parent?: WorldRecord
  code?: CodeReference[]
  technology?: string
}

/** Reserve identity in scan order; inferred entry placement can complete it before its first write. */
export function reserveRecord(
  repositoryRoot: string,
  world: World,
  input: RecordInput,
): WorldRecord {
  const id = input.id ?? availableId(world, input.name, input.parent)
  const name = input.name
  const record: WorldRecord = {
    id,
    title: name,
    kind: input.kind,
    parent: input.parent?.id,
    status: 'stable',
    sourceFilename: architectureElementPath({
      root: GromaFileSystem.open(repositoryRoot).sourceFilename(),
      kind: input.kind,
      id,
      parentSourceFilename: input.parent?.sourceFilename,
    }),
    code: input.code ?? [],
  }
  world.byId.set(id, record)
  for (const reference of record.code) {
    world.byCodeFile.set(reference.file, record)
  }
  return record
}

export async function writeRecord(repositoryRoot: string, record: WorldRecord, technology?: string): Promise<void> {
  await writeDocument(
    repositoryRoot,
    record.sourceFilename,
    renderArchitectureDocument({
      id: record.id,
      kind: record.kind,
      parent: record.parent,
      name: record.title,
      overview: '',
      technology,
      status: 'stable',
      code: record.code,
    }),
  )
}

export async function createRecord(repositoryRoot: string, world: World, input: RecordInput): Promise<WorldRecord> {
  const record = reserveRecord(repositoryRoot, world, input)
  await writeRecord(repositoryRoot, record, input.technology)
  return record
}
