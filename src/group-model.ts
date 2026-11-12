import { collectNodes, elementOverview, nodeText, relationshipTargetFilename } from './architecture-markdown.ts'
import { ArchitectureModelError } from './architecture-model.ts'
import { isArchitectureId } from './naming.ts'
import { requireGromaMapping } from './okf-profile.ts'
import type {
  ArchitectureDocument,
  ArchitectureElement,
  ArchitectureGroup,
  ArchitectureModel,
  MarkdownElement,
} from './types.ts'

function invalid(document: ArchitectureDocument, message: string): never {
  throw new ArchitectureModelError('INVALID_GROUP', document.sourceFilename, message)
}

/** The bullets under "## Members". A document without that section is a group with no members yet. */
function memberItems(document: ArchitectureDocument): MarkdownElement[] {
  const items: MarkdownElement[] = []
  let inMembers = false
  for (const node of document.nodes) {
    if (!Array.isArray(node)) continue
    if (node[0] === 'h2') {
      inMembers = nodeText(node).trim() === 'Members'
      continue
    }
    if (!inMembers) continue
    // Membership writes replace the whole section, so anything else stored here would be lost.
    if (node[0] !== 'ul') invalid(document, 'the Members section holds only a bullet list of links')
    items.push(...(node.slice(2) as MarkdownElement[]).filter(child => Array.isArray(child) && child[0] === 'li'))
  }
  return items
}

function resolveMember(document: ArchitectureDocument, item: MarkdownElement, model: ArchitectureModel): ArchitectureElement {
  const links = collectNodes(item, 'a')
  if (links.length !== 1) invalid(document, 'each member is exactly one Markdown link')
  const href = links[0]![1].href
  const filename = relationshipTargetFilename(document.sourceFilename, href)
  const element = model.elements.find(candidate => candidate.sourceFilename === filename)
  if (element === undefined) invalid(document, `member does not resolve to an element: ${String(href)}`)
  if (element.kind !== 'component') invalid(document, `"${element.id}" is a ${element.kind}; only components form a group`)
  return element
}

/** A group draws one zone on one container, so its members are components of that container. */
function requireOneContainer(document: ArchitectureDocument, members: readonly ArchitectureElement[], model: ArchitectureModel): void {
  const first = members[0]
  if (first === undefined) return
  if (members.some(member => member.parentId !== first.parentId)) {
    invalid(document, 'members must be components of one container')
  }
  // A component stored directly under its system has no identified container; a scan may still place it.
  if (model.elements.find(element => element.id === first.parentId)?.kind !== 'container') {
    invalid(document, `"${first.id}" has no container yet, so it cannot join a group`)
  }
}

function documentToGroup(document: ArchitectureDocument, model: ArchitectureModel): ArchitectureGroup {
  const groma = requireGromaMapping(document.frontmatter, document.sourceFilename)
  const id = groma.id
  if (typeof id !== 'string' || !isArchitectureId(id)) invalid(document, 'groma.id must be lowercase kebab-case')
  if (document.sourceFilename.split('/').slice(1).join('/') !== `groups/${id}.md`) {
    invalid(document, `group must be stored at groups/${id}.md`)
  }
  if (Object.keys(groma).some(field => field !== 'id')) invalid(document, 'group groma mapping only supports id')
  const { title, description } = document.frontmatter
  if (typeof title !== 'string' || title.trim() === '') invalid(document, 'title must be non-empty text')
  if (description !== undefined && typeof description !== 'string') invalid(document, 'description must be text')
  const members = memberItems(document).map(item => resolveMember(document, item, model))
  const memberIds = members.map(element => element.id)
  if (new Set(memberIds).size !== memberIds.length) invalid(document, 'a member is listed twice')
  requireOneContainer(document, members, model)
  return {
    id,
    title,
    ...(description === undefined ? {} : { description }),
    overview: elementOverview(document, (_code, _filename, message) => invalid(document, message)),
    memberIds,
    sourceFilename: document.sourceFilename,
  }
}

/**
 * Resolves each group document's member links against this revision's elements.
 * Two rules hold across groups: an id names one thing, and a component belongs to one group.
 */
export function resolveGroups(documents: readonly ArchitectureDocument[], model: ArchitectureModel): ArchitectureGroup[] {
  const ids = new Set(model.elements.map(element => element.id))
  const groupOfMember = new Map<string, string>()
  return documents.map(document => {
    const group = documentToGroup(document, model)
    if (ids.has(group.id)) invalid(document, `duplicate id "${group.id}"`)
    ids.add(group.id)
    for (const memberId of group.memberIds) {
      const other = groupOfMember.get(memberId)
      if (other !== undefined) invalid(document, `"${memberId}" is already in group "${other}"; a component belongs to one group`)
      groupOfMember.set(memberId, group.id)
    }
    return group
  })
}
