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
import { assignGroup, editGroup, groupContext } from './group.ts'
import { editRelation } from './relation.ts'
import { editFlow } from './flow-authoring.ts'
import { requireGromaMapping } from './okf-profile.ts'
import type { ArchitectureElement, ArchitectureModel, ArchitectureRecords } from './types.ts'
import { checkEdit, type EditValues } from './authoring-conflict.ts'
import { resolveFlows } from './flow-model.ts'
import { formatTags } from './tags.ts'

export interface EditArchitectureInput extends MeaningChanges {
  id: string
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

/** Tags, color and icon exist only on C4 elements; every other edit target refuses them. */
function hasElementOnlyField(input: EditArchitectureInput): boolean {
  return input.tags !== undefined || input.color !== undefined || input.icon !== undefined
}

/** The project record: its title, description and overview, merged into the current profile. */
async function editProject(repositoryRoot: string, input: EditArchitectureInput): Promise<string> {
  if (isStructural(input) || input.draft !== undefined || input.technology !== undefined || hasElementOnlyField(input)) {
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

/** A draft record carries a title and its outcome; everything else belongs to elements. */
async function editDraftRecord(
  repositoryRoot: string,
  record: DraftRecord,
  input: EditArchitectureInput,
): Promise<string> {
  if (input.description !== undefined || input.technology !== undefined || hasElementOnlyField(input)
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
  input: EditArchitectureInput,
): Promise<string> {
  if (input.draft) requireDraftRecord(records, input.draft)
  const source = withMeaning(await readDocument(repositoryRoot, element.sourceFilename), input)
  await validateElementSource(records.documents, element.sourceFilename, source)
  return source
}

/** A relation is a row between two elements, not an element; the flags of elements are refused there. */
function editRelationRow(repositoryRoot: string, input: EditArchitectureInput, target: string): Promise<string> {
  if (input.title !== undefined || input.overview !== undefined || hasElementOnlyField(input)
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
    if (input.technology !== undefined || hasElementOnlyField(input) || input.draft !== undefined
      || input.steps !== undefined || isStructural(input)) {
      throw new Error('only --title, --description and --overview are valid on a group')
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

export async function editArchitecture(
  repositoryRoot: string,
  input: EditArchitectureInput,
): Promise<string | StructuralResult> {
  if (input.relation !== undefined) return editRelationRow(repositoryRoot, input, input.relation)
  if (input.id === 'project') return editProject(repositoryRoot, input)
  const records = await loadArchitecture(repositoryRoot)
  const model = buildArchitectureModel(records.documents)
  const flow = records.flows.find(document => requireGromaMapping(document.frontmatter, document.sourceFilename).id === input.id)
  if (flow !== undefined) {
    if (input.newId !== undefined) throw new Error('--id renames systems, containers, and components')
    if (hasElementOnlyField(input)) throw new Error('--tags, --color and --icon are valid on actors, systems, containers, and components')
    checkEdit(input.original, resolveFlows([flow], model)[0]!, input)
    return editFlow(repositoryRoot, records, flow, input)
  }
  const element = model.elements.find(candidate => candidate.id === input.id)
  if (element === undefined) return editGroupOrDraft(repositoryRoot, records, model, input)
  return editElement(repositoryRoot, records, model, element, input)
}

/** An element takes new meaning, a move or reshape together with meaning, or a membership change on its own. */
async function editElement(
  repositoryRoot: string,
  records: ArchitectureRecords,
  model: ArchitectureModel,
  element: ArchitectureElement,
  input: EditArchitectureInput,
): Promise<string | StructuralResult> {
  checkEdit(input.original, { ...element, tags: formatTags(element.tags), parent: element.parentId ?? '' }, input)
  const meaning = [input.title, input.overview, input.description, input.technology, input.tags, input.color, input.icon, input.draft]
  const hasMeaning = meaning.some(value => value !== undefined)
  if (!hasMeaning && !isStructural(input)) {
    throw new Error('--title, --overview, --description, --technology, --tags, --color, --icon or --draft is required')
  }
  if (changesMembership(input)) {
    if (hasMeaning || movesOrReshapes(input)) throw new Error('--group and --ungroup must be a separate edit')
    return editMembership(repositoryRoot, records, model, input)
  }
  const source = hasMeaning ? await elementMeaning(repositoryRoot, records, element, input) : undefined

  if (movesOrReshapes(input)) {
    return curateElement(repositoryRoot, records, model, {
      id: input.id,
      title: input.title,
      technology: input.technology,
      tags: input.tags,
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
  }

  await writeDocument(repositoryRoot, element.sourceFilename, source!)
  return element.id
}
