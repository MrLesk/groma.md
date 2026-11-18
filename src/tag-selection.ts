import { knownTags } from './tags.ts'
import { ancestorIds, parentOfElements, type ParentOf } from './viewers/relationship-text.ts'
import type { AnnotatedArchitectureModel, AnnotatedElement, AnnotatedRelationship, ArchitectureFlow, ArchitectureGraph } from './types.ts'

/** The tags to focus or exclude on the map and in a filtered export. */
export interface TagFocus {
  readonly focused: readonly string[]
  readonly match: 'any' | 'all'
  readonly excluded: readonly string[]
}

/** What the map lights for a tag focus and the parents it keeps as context. */
export interface TagSelection {
  /**
   * Representation ids of the lit elements: those whose tags match, and the step ends of matching flows.
   * A lit element need not carry a focused tag.
   */
  lit: ReadonlySet<string>
  /** Representation ids of systems and containers shown as context for lit elements. */
  parents: ReadonlySet<string>
  /** Ids of flows whose own tags match the focus. */
  matchingFlows: ReadonlySet<string>
}

/** Keeps each known tag once. Exclusion wins a conflict and a single focused tag uses the default match mode. */
export function tagFocusInUse(world: ArchitectureGraph, focus: TagFocus): TagFocus {
  const used = new Set(knownTags(world))
  const excluded = [...new Set(focus.excluded)].filter(tag => used.has(tag))
  const focused = [...new Set(focus.focused)].filter(tag => used.has(tag) && !excluded.includes(tag))
  return { focused, match: focused.length < 2 ? 'any' : focus.match, excluded }
}

/** True when one of the excluded tags is in this set. */
function hasExcludedTag(tags: readonly string[], focus: TagFocus): boolean {
  return focus.excluded.some(tag => tags.includes(tag))
}

/** With only exclusions, every record that survived exclusion matches. */
function matchesFocusedTags(tags: readonly string[], focus: TagFocus): boolean {
  if (focus.focused.length === 0) return true
  if (focus.match === 'all') return focus.focused.every(tag => tags.includes(tag))
  return focus.focused.some(tag => tags.includes(tag))
}

/** A flow matches on the tags it carries. Nothing reaches a flow from the elements it passes through. */
function matchingFlows(world: ArchitectureGraph, focus: TagFocus): ArchitectureFlow[] {
  return world.flows.filter(flow => {
    const tags = flow.tags ?? []
    return !hasExcludedTag(tags, focus) && matchesFocusedTags(tags, focus)
  })
}

/**
 * The two ends of every step of these flows, as the map knows them. A step names its ends by element id;
 * the relationship it names carries their representation ids, which differ from element ids in a comparison.
 */
function flowEnds(flows: readonly ArchitectureFlow[], relationships: readonly AnnotatedRelationship[]): Set<string> {
  const relationshipIds = new Set(flows.flatMap(flow => flow.steps.map(step => step.relationshipId)))
  const ends = new Set<string>()
  for (const relationship of relationships) {
    if (!relationshipIds.has(relationship.id)) continue
    ends.add(relationship.source)
    ends.add(relationship.target)
  }
  return ends
}

/**
 * The elements a focus lights: those whose tags match, and the ends of the steps of matching flows.
 * An element an excluded tag selects stays out, also when a matching flow uses it.
 */
function litElements(world: ArchitectureGraph, focus: TagFocus, ends: ReadonlySet<string>, parentOf: ParentOf): Set<string> {
  const ownTags = new Map(world.elements.map(element => [element.representationId, element.tags ?? []]))
  const groupTags = new Map(world.groups.map(group => [group.id, group.tags ?? []]))

  /** An element matches on the tags it carries and those of its system, container and group. */
  function tagsForElement(element: AnnotatedElement): string[] {
    const lineage = ancestorIds(element.representationId, parentOf)
    const tags = lineage.flatMap(id => ownTags.get(id) ?? [])
    if (element.group !== undefined) tags.push(...(groupTags.get(element.group) ?? []))
    return tags
  }

  const lit = new Set<string>()
  for (const element of world.elements) {
    const tags = tagsForElement(element)
    if (hasExcludedTag(tags, focus)) continue
    const id = element.representationId
    // An element can take part in many flows. If ends inherited flow tags,
    // excluding an internal flow would drop its public components from an export.
    if (ends.has(id) || matchesFocusedTags(tags, focus)) lit.add(id)
  }
  return lit
}

/** The systems and containers above the lit elements that are not lit themselves. */
function parentsOfLitElements(lit: ReadonlySet<string>, parentOf: ParentOf): Set<string> {
  const parents = new Set<string>()
  for (const id of lit) {
    for (const ancestor of ancestorIds(id, parentOf).slice(1)) {
      if (!lit.has(ancestor)) parents.add(ancestor)
    }
  }
  return parents
}

/** Selects matching flows, lit elements and their parents for both the map and the filtered export. */
export function selectByTags(world: ArchitectureGraph, focus: TagFocus): TagSelection {
  const flows = matchingFlows(world, focus)
  const ends = flowEnds(flows, world.relationships)
  const parentOf = parentOfElements(world.elements)
  const lit = litElements(world, focus, ends, parentOf)
  return { lit, parents: parentsOfLitElements(lit, parentOf), matchingFlows: new Set(flows.map(flow => flow.id)) }
}

/**
 * Exports lit elements and their parents. A relationship stays when both ends stay.
 * A flow stays when all its steps stay and it carries no excluded tag. A group stays when one of
 * its members stays, so the name and tags of a group nobody exported are not published.
 * Draft ids pass through unchanged.
 * Scan findings are left out, because they name source files across the whole project.
 */
export function subsetByTags(world: AnnotatedArchitectureModel, focus: TagFocus): AnnotatedArchitectureModel {
  const { lit, parents } = selectByTags(world, focus)
  const kept = new Set([...lit, ...parents])
  const relationships = world.relationships.filter(relationship => kept.has(relationship.source) && kept.has(relationship.target))
  const relationshipIds = new Set(relationships.map(relationship => relationship.id))
  const elements = world.elements.filter(element => kept.has(element.representationId))
  const groupsWithMembers = new Set(elements.map(element => element.group))
  return {
    flows: world.flows.filter(flow => !hasExcludedTag(flow.tags ?? [], focus)
      && flow.steps.every(step => relationshipIds.has(step.relationshipId))),
    // The members of a group with an excluded tag are all left out, so that group goes with them.
    groups: world.groups.filter(group => groupsWithMembers.has(group.id)),
    drafts: world.drafts,
    elements: elements.map(element => ({ ...element, children: element.children.filter(child => kept.has(child)) })),
    relationships,
  }
}
