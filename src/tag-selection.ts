import { ancestorIds, parentOfElements } from './viewers/relationship-text.ts'
import type { AnnotatedArchitectureModel, AnnotatedElement } from './types.ts'

/** What a set of tags selects in one architecture. Every id is a representation id. */
export interface TagSelection {
  /** Elements that carry one of the tags, and everything inside them. */
  matched: ReadonlySet<string>
  /** Systems and containers that hold a matched element without being matched themselves. */
  parents: ReadonlySet<string>
}

type Tagged = Pick<AnnotatedElement, 'representationId' | 'parent' | 'tags'>

/** Every tag in use, in alphabetical order, with the number of elements that carry it. */
export function tagCounts(elements: readonly Tagged[]): { tag: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const element of elements) {
    for (const tag of element.tags ?? []) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  return [...counts].map(([tag, count]) => ({ tag, count })).sort((left, right) => left.tag.localeCompare(right.tag))
}

/** The given tags that at least one element carries, in the given order. */
export function tagsInUse(elements: readonly Tagged[], tags: readonly string[]): string[] {
  const used = new Set(elements.flatMap(element => element.tags ?? []))
  return tags.filter(tag => used.has(tag))
}

/**
 * An element matches when it carries any of the tags. A match takes everything inside it,
 * and the elements that hold a match are its parents. The map's tag focus and the filtered
 * export both read this one rule.
 */
export function selectByTags(elements: readonly Tagged[], tags: readonly string[]): TagSelection {
  const wanted = new Set(tags)
  const carriers = new Set(elements
    .filter(element => element.tags?.some(tag => wanted.has(tag)))
    .map(element => element.representationId))
  const parentOf = parentOfElements(elements)
  const matched = new Set<string>()
  const parents = new Set<string>()
  for (const element of elements) {
    const lineage = ancestorIds(element.representationId, parentOf)
    if (lineage.some(id => carriers.has(id))) matched.add(element.representationId)
  }
  for (const id of matched) {
    for (const ancestor of ancestorIds(id, parentOf)) if (!matched.has(ancestor)) parents.add(ancestor)
  }
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
 * stay, and a flow stays when all of its steps stay. A subset carries no scan findings,
 * because they name source files across the whole project.
 */
export function subsetByTags(world: AnnotatedArchitectureModel, filter: TagFilter): AnnotatedArchitectureModel {
  const excluded = selectByTags(world.elements, filter.exclude).matched
  const included = filter.include.length === 0
    ? world.elements.map(element => element.representationId)
    : [...selectByTags(world.elements, filter.include).matched]
  const parentOf = parentOfElements(world.elements)
  const kept = new Set<string>()
  for (const id of included) {
    // An excluded parent already excludes everything inside it, so a kept element's parents are never excluded.
    if (!excluded.has(id)) for (const ancestor of ancestorIds(id, parentOf)) kept.add(ancestor)
  }
  const relationships = world.relationships.filter(item => kept.has(item.source) && kept.has(item.target))
  const relationshipIds = new Set(relationships.map(item => item.id))
  return {
    flows: world.flows.filter(flow => flow.steps.every(step => relationshipIds.has(step.relationshipId))),
    drafts: world.drafts,
    elements: world.elements.filter(element => kept.has(element.representationId))
      .map(element => ({ ...element, children: element.children.filter(child => kept.has(child)) })),
    relationships,
  }
}
