import { ancestorIds, parentOfElements } from './viewers/relationship-text.ts'
import type { AnnotatedArchitectureModel, AnnotatedElement } from './types.ts'

/** The map's tag focus. Each tag can be focused or excluded. */
export interface TagFocus {
  readonly focused: readonly string[]
  readonly match: 'any' | 'all'
  readonly excluded: readonly string[]
}

/** What a tag focus selects in one architecture. Every id is a representation id. */
export interface TagSelection {
  /** Elements that match the focus after exclusions. */
  matched: ReadonlySet<string>
  /** Systems and containers that hold a matched element without being matched themselves. */
  parents: ReadonlySet<string>
}

type Tagged = Pick<AnnotatedElement, 'representationId' | 'parent' | 'tags'>

/** One tag in the list and the number of elements that carry it directly. */
export interface TagCount {
  tag: string
  count: number
}

/** Every tag in use, in alphabetical order, with the number of elements that carry it. */
export function tagCounts(elements: readonly Tagged[]): TagCount[] {
  const counts = new Map<string, number>()
  for (const element of elements) {
    for (const tag of element.tags ?? []) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  return [...counts].map(([tag, count]) => ({ tag, count })).sort((left, right) => left.tag.localeCompare(right.tag))
}

/** Keeps each known tag once. Exclusion wins a conflict and a single focused tag uses the default match mode. */
export function tagFocusInUse(elements: readonly Tagged[], focus: TagFocus): TagFocus {
  const used = new Set(elements.flatMap(element => element.tags ?? []))
  const excluded = [...new Set(focus.excluded)].filter(tag => used.has(tag))
  const focused = [...new Set(focus.focused)].filter(tag => used.has(tag) && !excluded.includes(tag))
  return { focused, match: focused.length < 2 ? 'any' : focus.match, excluded }
}

function matchesFocus(tags: ReadonlySet<string>, focus: TagFocus): boolean {
  if (focus.excluded.some(tag => tags.has(tag))) return false
  if (focus.focused.length === 0) return true
  if (focus.match === 'all') return focus.focused.every(tag => tags.has(tag))
  return focus.focused.some(tag => tags.has(tag))
}

/** The map and the filtered export both match each element against its own and its ancestors' tags. */
export function selectByTags(elements: readonly Tagged[], focus: TagFocus): TagSelection {
  const parentOf = parentOfElements(elements)
  const tagsById = new Map(elements.map(element => [element.representationId, element.tags ?? []]))
  const matched = new Set<string>()
  const parents = new Set<string>()
  for (const element of elements) {
    const lineage = ancestorIds(element.representationId, parentOf)
    const tags = new Set(lineage.flatMap(id => tagsById.get(id) ?? []))
    if (!matchesFocus(tags, focus)) continue
    matched.add(element.representationId)
    const ancestors = lineage.slice(1)
    for (const ancestor of ancestors) parents.add(ancestor)
  }
  // Parents supply context for a match. An ancestor that also matches belongs in matched alone.
  for (const id of matched) parents.delete(id)
  return { matched, parents }
}

/** The tags that choose a subset of an architecture. An empty include list keeps everything. */
export interface TagFilter {
  include: readonly string[]
  exclude: readonly string[]
}

/**
 * The part of an architecture a tag filter keeps. Include keeps what its tags select
 * together with the parents that hold it. Exclude then removes what its tags select,
 * and wins when both name the same element. A relationship stays when both of its ends
 * stay, and a flow stays when all of its steps stay. Draft ids pass through unchanged.
 * Scan findings are left out, because they name source files across the whole project.
 */
export function subsetByTags(world: AnnotatedArchitectureModel, filter: TagFilter): AnnotatedArchitectureModel {
  const { matched, parents } = selectByTags(world.elements, { focused: filter.include, match: 'any', excluded: filter.exclude })
  const kept = new Set([...matched, ...parents])
  const relationships = world.relationships.filter(item => kept.has(item.source) && kept.has(item.target))
  const relationshipIds = new Set(relationships.map(item => item.id))
  return {
    flows: world.flows.filter(flow => flow.steps.every(step => relationshipIds.has(step.relationshipId))),
    // A group whose members are all left out draws no zone, so every group passes through.
    groups: world.groups,
    drafts: world.drafts,
    elements: world.elements.filter(element => kept.has(element.representationId))
      .map(element => ({ ...element, children: element.children.filter(child => kept.has(child)) })),
    relationships,
  }
}
