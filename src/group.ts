import { isArchitectureColor } from './architecture-color.ts'
import { architectureIcon } from './architecture-icons.ts'
import { buildArchitectureModel } from './architecture-model.ts'
import { loadArchitecture } from './architecture-reader.ts'
import { readDocument, withGromaField, withGroupAppearance, writeDocument } from './markdown-emitter.ts'
import { groupAddress, requireText } from './naming.ts'
import type { ArchitectureElement, GroupAppearance } from './types.ts'
import type { StructuralResult } from './curate.ts'
import { checkEdit, type EditValues } from './authoring-conflict.ts'

async function loadElements(repositoryRoot: string): Promise<ArchitectureElement[]> {
  return buildArchitectureModel((await loadArchitecture(repositoryRoot)).documents).elements
}

/** The sibling components that carry the addressed group. */
function membersOf(elements: readonly ArchitectureElement[], address: string): ArchitectureElement[] {
  const members = elements.filter(element => {
    return element.group !== undefined && element.parentId !== null && groupAddress(element.parentId, element.group) === address
  })
  if (members.length === 0) throw new Error(`no group "${address}"`)
  return members
}

async function writeGroup(
  repositoryRoot: string, elements: readonly ArchitectureElement[], members: ArchitectureElement[], name: string | undefined, id: string,
  appearance?: Record<string, GroupAppearance>,
): Promise<StructuralResult> {
  const parent = elements.find(element => element.id === members[0]!.parentId)!
  const memberIds = new Set(members.map(member => member.id))
  const names = new Set(elements.filter(element => element.parentId === parent.id)
    .map(element => memberIds.has(element.id) ? name : element.group))
  const remaining = Object.fromEntries(Object.entries(appearance ?? parent.groupAppearance ?? {})
    .filter(([group]) => names.has(group)))
  const changed: string[] = []
  const affectedIds: string[] = []
  for (const member of members) {
    if (member.group === name) continue
    const source = await readDocument(repositoryRoot, member.sourceFilename)
    await writeDocument(repositoryRoot, member.sourceFilename, withGromaField(source, 'group', name))
    changed.push(member.sourceFilename)
    affectedIds.push(member.id)
  }
  if (JSON.stringify(remaining) !== JSON.stringify(parent.groupAppearance ?? {})) {
    const source = await readDocument(repositoryRoot, parent.sourceFilename)
    await writeDocument(repositoryRoot, parent.sourceFilename, withGroupAppearance(source, remaining))
    changed.push(parent.sourceFilename)
    affectedIds.push(parent.id)
  }
  return { id, created: [], changed: [...new Set(changed)], removed: [], affectedIds: [...new Set(affectedIds)], replacements: [] }
}

/** Names a group on sibling components of one container. */
export async function addGroup(repositoryRoot: string, input: { name: string; members: string[] }): Promise<StructuralResult> {
  const name = requireText(input.name, 'name').trim()
  if (input.members.length === 0) throw new Error('a group takes at least one member id')
  const elements = await loadElements(repositoryRoot)
  const members = input.members.map(id => {
    const element = elements.find(candidate => candidate.id === id)
    if (element === undefined) throw new Error(`unknown id "${id}"`)
    if (element.kind !== 'component') throw new Error(`"${id}" is a ${element.kind}; only components form a group`)
    return element
  })
  const containers = new Set(members.map(member => member.parentId))
  if (containers.size > 1) throw new Error('group members must be sibling components of one container')
  return writeGroup(repositoryRoot, elements, members, name, groupAddress(members[0]!.parentId!, name))
}

function editedAppearance(current: GroupAppearance | undefined, input: GroupAppearance): GroupAppearance {
  if (input.icon !== undefined && input.icon !== '' && architectureIcon(input.icon) === undefined) {
    throw new Error('icon must name an embedded architecture icon')
  }
  if (input.color !== undefined && input.color !== '' && !isArchitectureColor(input.color)) {
    throw new Error('color must be an opaque hex color (#RRGGBB)')
  }
  const entry = { ...current }
  for (const field of ['icon', 'color'] as const) {
    if (input[field] === '') delete entry[field]
    else if (input[field] !== undefined) entry[field] = input[field]
  }
  return entry
}

/** Edits the shared name and the appearance held by the group's C4 parent. */
export async function editGroup(
  repositoryRoot: string, input: { address: string; title?: string; original?: EditValues } & GroupAppearance,
): Promise<StructuralResult> {
  if (input.title === undefined && input.icon === undefined && input.color === undefined) throw new Error('--title, --icon or --color is required')
  const elements = await loadElements(repositoryRoot)
  const members = membersOf(elements, input.address)
  const name = members[0]!.group!
  const title = input.title === undefined ? name : requireText(input.title, '--title').trim()
  const parent = elements.find(element => element.id === members[0]!.parentId)!
  const appearance = { ...parent.groupAppearance }
  checkEdit(input.original, { title: name, ...appearance[name] }, { title, icon: input.icon, color: input.color })
  const entry = editedAppearance(appearance[title] ?? appearance[name], input)
  if (title !== name) delete appearance[name]
  if (Object.keys(entry).length === 0) delete appearance[title]
  else appearance[title] = entry
  return writeGroup(repositoryRoot, elements, members, title, groupAddress(parent.id, title), appearance)
}

/** Takes the named members out of the group, or dissolves it when none is named. */
export async function removeGroup(repositoryRoot: string, input: { address: string; members?: string[] }): Promise<StructuralResult> {
  const elements = await loadElements(repositoryRoot)
  const members = membersOf(elements, input.address)
  const leaving = (input.members ?? []).map(id => {
    const member = members.find(candidate => candidate.id === id)
    if (member === undefined) throw new Error(`"${id}" is not in group "${input.address}"`)
    return member
  })
  return writeGroup(repositoryRoot, elements, leaving.length === 0 ? members : leaving, undefined, input.address)
}
