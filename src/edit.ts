import {
  buildArchitectureModel,
  draftRecordOf,
  requireDraftRecord,
} from './architecture-model.ts'
import type { DraftRecord } from './architecture-model.ts'
import { loadArchitecture } from './architecture-reader.ts'
import { curateElement } from './curate.ts'
import type { StructuralResult } from './curate.ts'
import {
  readDocument,
  replaceLeadProse,
  withMeaning,
  withTitle,
  writeDocument,
  validateElementSource,
} from './markdown-emitter.ts'
import type { MeaningChanges } from './markdown-emitter.ts'
import { requireText } from './naming.ts'
import { loadProjectProfile, saveProjectProfile } from './project-profile.ts'
import { assignGroup, editGroup, groupContext, relistedWrites, writeGroups } from './group.ts'
import { editRelation } from './relation.ts'
import { editFlow } from './flow-authoring.ts'
import { requireGromaMapping } from './okf-profile.ts'
import type { ArchitectureElement, ArchitectureModel, ArchitectureRecords } from './types.ts'
import { checkEdit, type EditValues } from './authoring-conflict.ts'
import { resolveFlows } from './flow-model.ts'

/** One edit of a record, or the same tag and appearance changes on several elements. */
export interface EditArchitectureInput extends MeaningChanges {
  id: string
  /** Additional elements that take the same tag changes, color and icon as the first. */
  alsoIds?: string[]
  original?: EditValues
  /** The target id of the relationship from id to edit instead of the element itself. */
  relation?: string
  /** The id of the group this component joins. */
  group?: string
  /** Takes this component out of its group. */
  ungroup?: boolean
  parent?: string
  combine?: string[]
  detach?: string[]
  /** The new id of an element; its document and the documents under it move with it. */
  newId?: string
  steps?: string
}

function optionalText(value: string | undefined): string | undefined {
  if (value === undefined || value === '') return undefined
  return value
}

function changesMembership(input: EditArchitectureInput): boolean {
  return input.group !== undefined || input.ungroup === true
}

/** The edits that curateElement applies to the element's own document and the documents under it. */
function movesOrReshapes(input: EditArchitectureInput): boolean {
  return input.parent !== undefined
    || (input.combine?.length ?? 0) > 0
    || (input.detach?.length ?? 0) > 0
    || input.newId !== undefined
}

/** Every flag that only an element takes besides its meaning. */
function isStructural(input: EditArchitectureInput): boolean {
  return changesMembership(input) || movesOrReshapes(input)
}

/** Tag changes. Elements, groups and flows take them. */
const tagFields = ['addTags', 'removeTags'] as const

/** The map color and icon. Only actors, systems, containers and components have them. */
const appearanceFields = ['color', 'icon'] as const

/** What several elements take in one edit. This list decides what the Edit of several elements can offer. */
const fieldsOfSeveralElements = [...tagFields, ...appearanceFields] as const

function hasTagChange(input: EditArchitectureInput): boolean {
  return tagFields.some(field => input[field] !== undefined)
}

function hasAppearance(input: EditArchitectureInput): boolean {
  return appearanceFields.some(field => input[field] !== undefined)
}

/** The project record: its title, description and overview, merged into the current profile. */
async function editProject(repositoryRoot: string, input: EditArchitectureInput): Promise<string> {
  if (isStructural(input) || input.draft !== undefined || input.technology !== undefined || hasTagChange(input) || hasAppearance(input)) {
    throw new Error('only --title, --description and --overview are valid on the project')
  }
  const overview = input.overview
  if (input.title === undefined && input.description === undefined && overview === undefined) {
    throw new Error('--title, --description or --overview is required')
  }
  const profile = await loadProjectProfile(repositoryRoot)
  if (profile === undefined) throw new Error('the project record is missing or invalid')
  checkEdit(input.original, profile, { ...input, title: input.title?.trim() })
  await saveProjectProfile(repositoryRoot, {
    title: input.title ?? profile.title,
    overview: overview ?? profile.overview,
    ...(input.description === undefined ? {} : { description: input.description }),
  })
  return 'project'
}

/** A draft record carries a title and its outcome. */
async function editDraftRecord(
  repositoryRoot: string,
  record: DraftRecord,
  input: EditArchitectureInput,
): Promise<string> {
  if (input.description !== undefined || input.technology !== undefined || hasTagChange(input) || hasAppearance(input)
    || input.draft !== undefined || isStructural(input)) {
    throw new Error('only --title and --overview are valid on a draft record')
  }
  const overview = input.overview
  if (input.title === undefined && overview === undefined) throw new Error('--title or --overview is required')
  checkEdit(input.original, { title: record.title, overview: record.outcome }, input)
  let source = await readDocument(repositoryRoot, record.sourceFilename)
  if (input.title !== undefined) source = withTitle(source, requireText(input.title, '--title'))
  if (overview !== undefined) source = replaceLeadProse(source, overview)
  await writeDocument(repositoryRoot, record.sourceFilename, source)
  return record.id
}

async function elementMeaning(
  repositoryRoot: string,
  records: ArchitectureRecords,
  element: ArchitectureElement,
  input: MeaningChanges,
): Promise<string> {
  if (input.draft) requireDraftRecord(records, input.draft)
  const source = withMeaning(await readDocument(repositoryRoot, element.sourceFilename), input)
  await validateElementSource(records.documents, element.sourceFilename, source)
  return source
}

/** A relation is a row between two elements, not an element; the flags of elements are refused there. */
function editRelationRow(repositoryRoot: string, input: EditArchitectureInput, target: string): Promise<string> {
  if (input.title !== undefined || input.overview !== undefined || hasTagChange(input) || hasAppearance(input)
    || input.draft !== undefined || isStructural(input)) {
    throw new Error('only --description and --technology are valid on a relation')
  }
  return editRelation(repositoryRoot, {
    source: input.id, target, description: input.description, technology: input.technology, original: input.original,
  })
}

/** An id that names no element and no flow names a group or a draft record. */
async function editGroupOrDraft(
  repositoryRoot: string,
  records: ArchitectureRecords,
  model: ArchitectureModel,
  input: EditArchitectureInput,
): Promise<string> {
  const context = groupContext(repositoryRoot, records, model)
  const group = context.groups.find(candidate => candidate.id === input.id)
  if (group !== undefined) {
    if (input.technology !== undefined || hasAppearance(input) || input.draft !== undefined
      || input.steps !== undefined || isStructural(input)) {
      throw new Error('only --title, --description, --overview, --add-tags and --remove-tags are valid on a group')
    }
    return editGroup(context, group, input)
  }
  const record = records.drafts.map(draftRecordOf).find(candidate => candidate.id === input.id)
  if (record === undefined) throw new Error(`unknown id "${input.id}"`)
  return editDraftRecord(repositoryRoot, record, input)
}

/** Membership is stored in the group's record, not in the component's document, so it is an edit of its own. */
function editMembership(
  repositoryRoot: string,
  records: ArchitectureRecords,
  model: ArchitectureModel,
  input: EditArchitectureInput,
): Promise<StructuralResult> {
  if (input.group !== undefined && input.ungroup === true) {
    throw new Error('--group and --ungroup cannot be used together')
  }
  const groupId = input.ungroup === true ? undefined : requireText(input.group, '--group').trim()
  return assignGroup(groupContext(repositoryRoot, records, model), input.id, groupId)
}

/** Routes the edit to the record or elements named by its address. */
export async function editArchitecture(
  repositoryRoot: string,
  input: EditArchitectureInput,
): Promise<string | StructuralResult> {
  if (input.alsoIds !== undefined) return editSeveralElements(repositoryRoot, input, input.alsoIds)
  if (input.relation !== undefined) return editRelationRow(repositoryRoot, input, input.relation)
  if (input.id === 'project') return editProject(repositoryRoot, input)
  const records = await loadArchitecture(repositoryRoot)
  const model = buildArchitectureModel(records.documents)
  const flow = records.flows.find(document => requireGromaMapping(document.frontmatter, document.sourceFilename).id === input.id)
  if (flow !== undefined) {
    if (input.newId !== undefined) throw new Error('--id renames systems, containers, and components')
    if (hasAppearance(input)) throw new Error('--color and --icon are valid only on actors, systems, containers, and components')
    checkEdit(input.original, resolveFlows([flow], model)[0]!, input)
    return editFlow(repositoryRoot, records, flow, input)
  }
  const element = model.elements.find(candidate => candidate.id === input.id)
  if (element === undefined) return editGroupOrDraft(repositoryRoot, records, model, input)
  return editElement(repositoryRoot, records, model, element, input)
}

/** Prepare and validate every document before writing the first, so a refusal leaves them all as they were. */
async function editSeveralElements(
  repositoryRoot: string, input: EditArchitectureInput, alsoIds: readonly string[],
): Promise<StructuralResult> {
  const allowed = new Set<string>(['id', 'alsoIds', ...fieldsOfSeveralElements])
  const unsupported = Object.entries(input).some(([field, value]) => value !== undefined && !allowed.has(field))
  const hasSharedField = hasTagChange(input) || hasAppearance(input)
  if (unsupported || !hasSharedField) {
    throw new Error('with several elements, use only --add-tags, --remove-tags, --color or --icon and supply at least one')
  }
  const records = await loadArchitecture(repositoryRoot)
  const model = buildArchitectureModel(records.documents)
  const byId = new Map(model.elements.map(element => [element.id, element]))
  const affectedIds = [input.id, ...alsoIds]
  // Only the fields several elements take reach the documents, whatever else the input carries.
  const shared: MeaningChanges = {}
  for (const field of fieldsOfSeveralElements) shared[field] = input[field]
  const documents = []
  for (const id of affectedIds) {
    const element = byId.get(id)
    if (element === undefined) throw new Error(`"${id}" must name an actor, system, container or component`)
    const source = await elementMeaning(repositoryRoot, records, element, shared)
    documents.push({ filename: element.sourceFilename, source })
  }
  for (const document of documents) await writeDocument(repositoryRoot, document.filename, document.source)
  const changed = documents.map(document => document.filename)
  return { id: input.id, changed, affectedIds, created: [], removed: [], replacements: [] }
}

/** An element takes new meaning, a move or reshape together with meaning, or a membership change on its own. */
async function editElement(
  repositoryRoot: string,
  records: ArchitectureRecords,
  model: ArchitectureModel,
  element: ArchitectureElement,
  input: EditArchitectureInput,
): Promise<string | StructuralResult> {
  checkEdit(input.original, { ...element, parent: element.parentId ?? '' }, input)
  const meaning = [input.title, input.overview, input.description, input.technology, input.draft]
  const hasMeaning = hasTagChange(input) || hasAppearance(input) || meaning.some(value => value !== undefined)
  if (!hasMeaning && !isStructural(input)) {
    throw new Error('--title, --overview, --description, --technology, --add-tags, --remove-tags, --color, --icon or --draft is required')
  }
  if (changesMembership(input)) {
    if (hasMeaning || movesOrReshapes(input)) throw new Error('--group and --ungroup must be a separate edit')
    return editMembership(repositoryRoot, records, model, input)
  }
  const source = hasMeaning ? await elementMeaning(repositoryRoot, records, element, input) : undefined
  // Only a component can be a member of a group, and a member's link shows its title.
  const retitlesComponent = input.title !== undefined && element.kind === 'component'

  if (movesOrReshapes(input)) {
    const result = await curateElement(repositoryRoot, records, model, {
      id: input.id,
      title: input.title,
      technology: input.technology,
      addTags: input.addTags,
      removeTags: input.removeTags,
      color: input.color,
      icon: input.icon,
      draft: input.draft,
      overview: input.overview,
      description: input.description,
      parent: optionalText(input.parent),
      combine: input.combine,
      detach: input.detach,
      newId: input.newId,
    })
    if (!retitlesComponent) return result
    // A rename already rewrote the group's record, so its document must not be named twice.
    const changed = new Set([...result.changed, ...await relistInGroups(repositoryRoot, result.id)])
    return { ...result, changed: [...changed] }
  }

  await writeDocument(repositoryRoot, element.sourceFilename, source!)
  const relisted = retitlesComponent ? await relistInGroups(repositoryRoot, element.id) : []
  if (relisted.length === 0) return element.id
  return { id: element.id, created: [], changed: relisted, removed: [], affectedIds: [element.id], replacements: [] }
}

/**
 * A group's member links show titles. Once a component's new title is stored, the Members list of each group
 * that lists it is written again from the stored records. Returns the group documents written.
 */
async function relistInGroups(repositoryRoot: string, componentId: string): Promise<string[]> {
  const records = await loadArchitecture(repositoryRoot)
  const context = groupContext(repositoryRoot, records, buildArchitectureModel(records.documents))
  const writes = await relistedWrites(context, [componentId])
  await writeGroups(context, writes)
  return writes.map(write => write.sourceFilename)
}
