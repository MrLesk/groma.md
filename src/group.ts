import { renderFrontmatter } from 'comark/render'

import { markdownHref } from './architecture-markdown.ts'
import { freeId } from './architecture-model.ts'
import { checkEdit, type EditValues } from './authoring-conflict.ts'
import type { StructuralResult } from './curate.ts'
import { resolveGroups } from './group-model.ts'
import { GromaFileSystem } from './groma-filesystem.ts'
import {
  parsedDocument,
  readDocument,
  removeDocument,
  replaceLeadProse,
  withDescription,
  withTitle,
  writeDocument,
} from './markdown-emitter.ts'
import { kebabCase, requireText } from './naming.ts'
import { GROUP_TYPE } from './okf-profile.ts'
import type { ArchitectureElement, ArchitectureGroup, ArchitectureModel, ArchitectureRecords } from './types.ts'

/** What a group write reads: the stored documents, the elements their links name, and the groups they resolve to. */
export interface GroupContext {
  repositoryRoot: string
  records: ArchitectureRecords
  model: ArchitectureModel
  groups: ArchitectureGroup[]
}

/** One group document with the text it will hold. */
export interface GroupWrite {
  sourceFilename: string
  source: string
}

export function groupContext(repositoryRoot: string, records: ArchitectureRecords, model: ArchitectureModel): GroupContext {
  return { repositoryRoot, records, model, groups: resolveGroups(records.groups, model) }
}

const membersHeading = /^## Members[ \t]*$/m

/** Rewrites the "## Members" section as one link per member; a group without members has no such section. */
function withMembers(source: string, sourceFilename: string, members: readonly ArchitectureElement[]): string {
  const start = source.search(membersHeading)
  const before = start === -1 ? source : source.slice(0, start)
  const stored = start === -1 ? '' : source.slice(start).replace(membersHeading, '')
  const nextHeading = stored.search(/^## /m)
  const after = nextHeading === -1 ? '' : stored.slice(nextHeading)
  const links = members.map(member => `- [${member.id}](${markdownHref(sourceFilename, member.sourceFilename)})`)
  const section = links.length === 0 ? '' : `## Members\n\n${links.join('\n')}`
  return `${[before, section, after].map(part => part.trim()).filter(part => part !== '').join('\n\n')}\n`
}

function membersOf(context: GroupContext, group: ArchitectureGroup): ArchitectureElement[] {
  return group.memberIds.map(id => context.model.elements.find(element => element.id === id)!)
}

/** The rewritten document of each group that lists one of these components, now without them. */
export async function leavingWrites(context: GroupContext, componentIds: readonly string[]): Promise<GroupWrite[]> {
  const leaving = new Set(componentIds)
  const left = context.groups.filter(group => group.memberIds.some(id => leaving.has(id)))
  return Promise.all(left.map(async group => ({
    sourceFilename: group.sourceFilename,
    source: withMembers(
      await readDocument(context.repositoryRoot, group.sourceFilename),
      group.sourceFilename,
      membersOf(context, group).filter(member => !leaving.has(member.id)),
    ),
  })))
}

/**
 * The documents that change when these components join a group. A component belongs to one group,
 * so each one leaves the group it was in. Components the group already lists change nothing.
 */
async function joiningWrites(
  context: GroupContext,
  group: ArchitectureGroup,
  components: readonly ArchitectureElement[],
): Promise<GroupWrite[]> {
  const joining = components.filter(component => !group.memberIds.includes(component.id))
  if (joining.length === 0) return []
  const source = await readDocument(context.repositoryRoot, group.sourceFilename)
  return [
    ...await leavingWrites(context, joining.map(component => component.id)),
    {
      sourceFilename: group.sourceFilename,
      source: withMembers(source, group.sourceFilename, [...membersOf(context, group), ...joining]),
    },
  ]
}

/**
 * The one way to write group documents: loads the groups as these writes would leave them, then writes.
 * A refused change writes nothing.
 */
export async function writeGroups(context: GroupContext, writes: readonly GroupWrite[]): Promise<void> {
  const written = new Set(writes.map(write => write.sourceFilename))
  const documents = [
    ...context.records.groups.filter(document => !written.has(document.sourceFilename)),
    ...await Promise.all(writes.map(write => parsedDocument(write.sourceFilename, write.source))),
  ]
  resolveGroups(documents, context.model)
  for (const write of writes) await writeDocument(context.repositoryRoot, write.sourceFilename, write.source)
}

function requireComponent(model: ArchitectureModel, id: string): ArchitectureElement {
  const element = model.elements.find(candidate => candidate.id === id)
  if (element === undefined) throw new Error(`unknown id "${id}"`)
  if (element.kind !== 'component') throw new Error(`"${id}" is a ${element.kind}; only components form a group`)
  return element
}

/** The facts a structural command prints: the record it names, the files it wrote, and the components it touched. */
function writeResult(
  id: string,
  created: readonly GroupWrite[],
  changed: readonly GroupWrite[],
  components: readonly ArchitectureElement[],
): StructuralResult {
  return {
    id,
    created: created.map(write => write.sourceFilename),
    changed: changed.map(write => write.sourceFilename),
    removed: [],
    affectedIds: components.map(component => component.id),
    replacements: [],
  }
}

export interface AddGroupInput {
  name: string
  members: string[]
  description?: string
  overview?: string
}

/** The group of this title that already lists a component of this container. */
function groupTitled(context: GroupContext, title: string, containerId: string | null): ArchitectureGroup | undefined {
  return context.groups.find(group => group.title === title
    && membersOf(context, group).some(member => member.parentId === containerId))
}

/**
 * Groups components of one container under a name. When their container already has a group of exactly
 * this title, they join it. Otherwise a record is created; its id is the container's id followed by the
 * kebab-case name, so two containers can each have a group of the same name.
 */
export async function addGroup(context: GroupContext, input: AddGroupInput): Promise<StructuralResult> {
  const title = requireText(input.name, 'name').trim()
  if (kebabCase(title) === '') throw new Error('name must contain a letter or a digit')
  if (input.members.length === 0) throw new Error('a group takes at least one member id')
  const members = input.members.map(id => requireComponent(context.model, id))
  const containerId = members[0]!.parentId
  const existing = groupTitled(context, title, containerId)
  if (existing !== undefined) {
    if (input.description !== undefined || input.overview !== undefined) {
      throw new Error(`group ${existing.id} already has this name; groma edit ${existing.id} changes its description and overview`)
    }
    const writes = await joiningWrites(context, existing, members)
    await writeGroups(context, writes)
    return writeResult(existing.id, [], writes, members)
  }
  const id = freeId(context.records, context.model, `${containerId}-${title}`)
  const sourceFilename = GromaFileSystem.open(context.repositoryRoot).sourceFilename(`groups/${id}.md`)
  const frontmatter = renderFrontmatter({
    type: GROUP_TYPE,
    title,
    ...(input.description === undefined ? {} : { description: input.description }),
    groma: { id },
  })
  const prose = input.overview === undefined ? '' : `\n${input.overview.trim()}\n`
  const created = { sourceFilename, source: withMembers(`---\n${frontmatter}\n---\n${prose}`, sourceFilename, members) }
  const left = await leavingWrites(context, members.map(member => member.id))
  await writeGroups(context, [...left, created])
  return writeResult(id, [created], left, members)
}

export interface GroupMeaning {
  title?: string
  description?: string
  overview?: string
  original?: EditValues
}

/** Changes what a group says about itself; its id and members stay. */
export async function editGroup(context: GroupContext, group: ArchitectureGroup, input: GroupMeaning): Promise<string> {
  if (input.title === undefined && input.description === undefined && input.overview === undefined) {
    throw new Error('--title, --description or --overview is required')
  }
  checkEdit(input.original, group, input)
  let source = await readDocument(context.repositoryRoot, group.sourceFilename)
  if (input.title !== undefined) source = withTitle(source, requireText(input.title, '--title').trim())
  if (input.overview !== undefined) source = replaceLeadProse(source, input.overview)
  source = withDescription(source, input.description)
  await writeGroups(context, [{ sourceFilename: group.sourceFilename, source }])
  return group.id
}

/** Puts a component in the group with this id, or takes it out of its group when no id is given. */
export async function assignGroup(context: GroupContext, componentId: string, groupId: string | undefined): Promise<StructuralResult> {
  const component = requireComponent(context.model, componentId)
  const group = groupId === undefined ? undefined : context.groups.find(candidate => candidate.id === groupId)
  if (groupId !== undefined && group === undefined) {
    throw new Error(`unknown group "${groupId}"; groma add group <name> <ids...> creates one`)
  }
  const writes = group === undefined
    ? await leavingWrites(context, [component.id])
    : await joiningWrites(context, group, [component])
  await writeGroups(context, writes)
  return writeResult(component.id, [], writes, [component])
}

/** Deletes the group's record. Its members are untouched: nothing on a component names its group. */
export async function removeGroup(context: GroupContext, group: ArchitectureGroup): Promise<string> {
  await removeDocument(context.repositoryRoot, group.sourceFilename)
  return group.id
}
