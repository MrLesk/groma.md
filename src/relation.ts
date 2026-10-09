import { buildArchitectureModel } from './architecture-model.ts'
import { loadArchitecture } from './architecture-reader.ts'
import { resolveFlows } from './flow-model.ts'
import { requireText } from './naming.ts'
import { storedRelationships, type StoredRelationship } from './relationship-markdown.ts'
import { placeRelationships, saveRelationships } from './relationship-storage.ts'
import { sourceIndex } from './source-index.ts'
import type { ArchitectureElement, RelationshipConnection, ElementStatus } from './types.ts'
import { checkEdit, type EditValues } from './authoring-conflict.ts'

/** Current code interactions use files; actor/external declarations and existing internal drafts may use concept IDs. */
export interface RelationEnds {
  source: string
  target: string
}

export interface RelationInput extends RelationEnds {
  description?: string
  technology?: string
  original?: EditValues
}

interface Ends {
  rows: StoredRelationship[]
  records: Awaited<ReturnType<typeof loadArchitecture>>
  model: ReturnType<typeof buildArchitectureModel>
  input: RelationEnds
  source: ArchitectureElement
  target: ArchitectureElement
  row: StoredRelationship | undefined
}

type Sentence = Pick<RelationshipConnection, 'description' | 'technology' | 'status'>

async function loadEnds(repositoryRoot: string, input: RelationEnds): Promise<Ends> {
  const records = await loadArchitecture(repositoryRoot)
  const { documents } = records
  const model = buildArchitectureModel(documents)
  const index = sourceIndex(model.elements)
  const source = index.owner(input.source) ?? index.resolve(input.source)
  if (!source) throw new Error(`unknown source "${input.source}"`)
  const target = index.owner(input.target) ?? index.resolve(input.target)
  if (!target) throw new Error(`unknown target "${input.target}"`)
  const connections = storedRelationships(documents, model.elements, (_code, filename, message) => {
    throw new Error(`${filename}: ${message}`)
  })
  const row = [...connections].sort((left, right) => Number(right.authored) - Number(left.authored))
    .find(item => item.source === input.source && item.target === input.target)
  const declaredConcept = [source, target].some(element => element.kind === 'actor' || element.external)
  const plannedConcepts = row?.status === 'draft' && input.source === source.id && input.target === target.id
  if (!declaredConcept && !plannedConcepts && (!index.byFile.has(input.source) || !index.byFile.has(input.target))) {
    throw new Error('code relationships require source-file endpoints')
  }
  return { rows: connections, records, model, input, source, target, row }
}

function requireRow(ends: Ends): RelationshipConnection {
  if (!ends.row) throw new Error(`${ends.input.source} does not relate to ${ends.input.target}`)
  return ends.row
}

async function writeRow(
  repositoryRoot: string,
  ends: Ends,
  change: { drop?: RelationshipConnection | RelationshipConnection[]; add?: Sentence },
): Promise<string> {
  const dropped = new Set(Array.isArray(change.drop) ? change.drop : [change.drop])
  const rows = ends.rows.filter(row => !dropped.has(row))
  if (change.add) rows.push({ ...ends.input, ...change.add, authored: true, document: ends.source.sourceFilename })
  await saveRelationships(repositoryRoot, ends.records.documents, ends.model.elements, ends.rows,
    placeRelationships(rows, ends.model.elements))
  return ends.source.id
}

/** Authored text takes ownership of the current interaction for these exact endpoints. */
export async function addRelation(repositoryRoot: string, input: RelationInput, status: ElementStatus = 'stable'): Promise<string> {
  const description = requireText(input.description, '--description')
  const technology = requireText(input.technology, '--technology')
  const ends = await loadEnds(repositoryRoot, input)
  if (ends.row?.authored) throw new Error(`${input.source} already relates to ${input.target}; use groma edit relation`)
  return writeRow(repositoryRoot, ends, { drop: status === 'stable' ? ends.row : undefined, add: { description, technology, status } })
}

export async function editRelation(repositoryRoot: string, input: RelationInput): Promise<string> {
  if (input.description === undefined && input.technology === undefined) {
    throw new Error('--description or --technology is required')
  }
  const ends = await loadEnds(repositoryRoot, input)
  const current = requireRow(ends)
  checkEdit(input.original, current, {
    description: input.description?.trim(), technology: input.technology?.trim(),
  })
  return writeRow(repositoryRoot, ends, {
    drop: current,
    add: {
      status: current.status,
      description: input.description === undefined ? current.description : requireText(input.description, '--description'),
      technology: input.technology === undefined ? current.technology : requireText(input.technology, '--technology'),
    },
  })
}

/** Planned concept links become current only through one existing exact-file connection. */
function acceptanceEnds(ends: Ends): RelationEnds {
  const index = sourceIndex(ends.model.elements)
  const declaredConcept = [ends.source, ends.target].some(element => element.kind === 'actor' || element.external)
  if (declaredConcept || (index.byFile.has(ends.input.source) && index.byFile.has(ends.input.target))) return ends.input
  const pairs = new Map(ends.rows.filter(row => row.status === 'stable'
    && index.byFile.get(row.source) === ends.source.id && index.byFile.get(row.target) === ends.target.id)
    .map(row => [`${row.source}\0${row.target}`, row]))
  if (pairs.size !== 1) {
    throw new Error(`cannot accept ${ends.input.source} → ${ends.input.target}: requires one current source-file connection, found ${pairs.size}`)
  }
  const { source, target } = [...pairs.values()][0]!
  return { source, target }
}

export async function acceptRelation(repositoryRoot: string, input: RelationEnds): Promise<string> {
  const ends = await loadEnds(repositoryRoot, input)
  const current = requireRow(ends)
  if (!current.authored || current.status !== 'draft') throw new Error('not a draft relationship')
  const accepted = acceptanceEnds(ends)
  const overwritten = ends.rows.filter(row => row.authored && row.source === accepted.source && row.target === accepted.target)
  return writeRow(repositoryRoot, { ...ends, input: accepted }, {
    drop: [current, ...overwritten],
    add: { description: current.description, technology: current.technology, status: 'stable' },
  })
}

export async function removeRelation(repositoryRoot: string, input: RelationEnds): Promise<string> {
  const ends = await loadEnds(repositoryRoot, input)
  const current = requireRow(ends)
  const flows = resolveFlows(ends.records.flows, ends.model)
    .filter(flow => flow.steps.some(step => step.source === ends.source.id && step.target === ends.target.id))
  if (flows.length) throw new Error(`cannot remove relationship: used by flows ${flows.map(flow => flow.id).join(', ')}`)
  if (!current.authored || current.status !== 'draft') throw new Error('only draft relationships can be removed')
  return writeRow(repositoryRoot, ends, { drop: current })
}
