import { buildArchitectureModel } from './architecture-model.ts'
import { loadArchitecture } from './architecture-reader.ts'
import { resolveFlows } from './flow-model.ts'
import { requireText } from './naming.ts'
import { isDeclaredConcept, storedRelationships, type StoredRelationship } from './relationship-markdown.ts'
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
  index: ReturnType<typeof sourceIndex>
  input: RelationEnds
  source: ArchitectureElement
  target: ArchitectureElement
  row: StoredRelationship | undefined
  /** A draft row between two internal concepts. Only a plan import writes one; no source file stands behind it yet. */
  planned: boolean
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
  const declared = [source, target].some(isDeclaredConcept)
  const files = index.byFile.has(input.source) && index.byFile.has(input.target)
  const planned = !declared && !files && row?.status === 'draft' && input.source === source.id && input.target === target.id
  if (!declared && !files && !planned) throw new Error('code relationships require source-file endpoints')
  return { rows: connections, records, model, index, input, source, target, row, planned }
}

function requireRow(ends: Ends): RelationshipConnection {
  if (!ends.row) throw new Error(`${ends.input.source} does not relate to ${ends.input.target}`)
  return ends.row
}

async function writeRow(
  repositoryRoot: string,
  ends: Ends,
  change: { drop: readonly RelationshipConnection[]; add?: Sentence },
  /** Where the added row is stored. Only the acceptance of a planned relationship names other endpoints than the input. */
  { source, target }: RelationEnds = ends.input,
): Promise<string> {
  const rows = ends.rows.filter(row => !change.drop.includes(row))
  if (change.add) rows.push({ source, target, ...change.add, authored: true, document: ends.source.sourceFilename })
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
  const replaced = status === 'stable' && ends.row ? [ends.row] : []
  return writeRow(repositoryRoot, ends, { drop: replaced, add: { description, technology, status } })
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
    drop: [current],
    add: {
      status: current.status,
      description: input.description === undefined ? current.description : requireText(input.description, '--description'),
      technology: input.technology === undefined ? current.technology : requireText(input.technology, '--technology'),
    },
  })
}

/** The endpoints under which an accepted relationship is stored. */
function acceptanceEnds(ends: Ends): RelationEnds {
  // A declared concept or a pair of source files: the draft already names the endpoints of a current relationship.
  if (!ends.planned) return ends.input
  // Planned: the text moves to the one current file pair that connects the two components.
  const pairs = new Map(ends.rows.filter(row => row.status === 'stable'
    && ends.index.byFile.get(row.source) === ends.source.id && ends.index.byFile.get(row.target) === ends.target.id)
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
  return writeRow(repositoryRoot, ends, {
    drop: [current, ...overwritten],
    add: { description: current.description, technology: current.technology, status: 'stable' },
  }, accepted)
}

export async function removeRelation(repositoryRoot: string, input: RelationEnds): Promise<string> {
  const ends = await loadEnds(repositoryRoot, input)
  const current = requireRow(ends)
  const flows = resolveFlows(ends.records.flows, ends.model)
    .filter(flow => flow.steps.some(step => step.source === ends.source.id && step.target === ends.target.id))
  if (flows.length) throw new Error(`cannot remove relationship: used by flows ${flows.map(flow => flow.id).join(', ')}`)
  if (!current.authored || current.status !== 'draft') throw new Error('only draft relationships can be removed')
  return writeRow(repositoryRoot, ends, { drop: [current] })
}
