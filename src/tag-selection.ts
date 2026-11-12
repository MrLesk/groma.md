import { ancestorIds, parentOfElements } from './viewers/relationship-text.ts'
import type { AnnotatedElement } from './types.ts'

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
