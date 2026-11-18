/**
 * OKF `tags` are short strings that name cross-cutting categories of an element, group or flow.
 * Documents store them as a list. Edits name the tags to add and remove in comma-separated text.
 */
import type { ArchitectureGraph } from './types.ts'

/** The tags named by comma-separated text, in the order written, without blanks or repeats. */
export function parseTags(text: string): string[] {
  const tags = text.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
  return [...new Set(tags)]
}

/** One tag and the number of records that carry it directly. */
export interface TagCount {
  tag: string
  count: number
}

/** Every record whose document can carry tags in this architecture. */
function tagCarriers(world: ArchitectureGraph) {
  return [...world.elements, ...world.groups, ...world.flows]
}

/** Each tag in the order the given records first carry it, counted once per record. */
export function carriedTags(carriers: readonly { tags?: readonly string[] }[]): TagCount[] {
  const counts = new Map<string, number>()
  for (const carrier of carriers) {
    for (const tag of new Set(carrier.tags ?? [])) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  return Array.from(counts, ([tag, count]) => ({ tag, count }))
}

/** Every tag in the architecture, in alphabetical order, with its count of direct carriers. */
export function tagCounts(world: ArchitectureGraph): TagCount[] {
  return carriedTags(tagCarriers(world)).sort((left, right) => left.tag.localeCompare(right.tag))
}

/** The tag names available to edit forms and shared links, in the order the Tags list shows them. */
export function knownTags(world: ArchitectureGraph): string[] {
  return tagCounts(world).map(({ tag }) => tag)
}

/** The comma-separated text a command or form shows for a list of tags. */
export function formatTags(tags: readonly string[] | undefined): string {
  return (tags ?? []).join(', ')
}
