import type { ArchitectureGraph, RelationshipConnection } from './types.ts'

/**
 * Why a relationship row cannot be removed right now, or undefined when the verb would succeed.
 *
 * - A flow that steps through the relationship keeps it.
 * - A planned row is a proposal a person may withdraw.
 * - A current row between source files stays: the next scan would derive it again.
 * - A current row with a virtual component at one end has no source behind it, so a person removes it.
 *   That is also what frees the component for removal.
 */
export function relationshipRemovalBlocker(
  row: RelationshipConnection,
  hasVirtualEnd: boolean,
  flowIds: readonly string[],
): string | undefined {
  if (flowIds.length > 0) return `cannot remove relationship: used by flows ${flowIds.join(', ')}`
  const planned = row.authored && row.status === 'draft'
  if (!planned && !hasVirtualEnd) return 'only draft relationships and relationships with a virtual component can be removed'
  return undefined
}

/** Why an element cannot be removed right now, or undefined when the verb would succeed. */
export function removalBlocker(graph: ArchitectureGraph, id: string): string | undefined {
  const element = graph.elements.find(candidate => candidate.id === id)
  if (element === undefined) return `unknown id "${id}"`
  if (element.origin === 'observed' && element.kind !== 'actor' && !element.external && element.code.length > 0) {
    return `${id} is found by the scanner; remove its code or combine it instead`
  }
  const flows = graph.flows.filter(flow => flow.steps.some(step => step.source === id || step.target === id))
  if (flows.length > 0) return `cannot remove ${id}: used by flows ${flows.map(flow => flow.id).join(', ')}`
  if (element.children.length > 0) {
    return `cannot remove ${id}: it contains ${element.children.join(', ')}`
  }
  const dependents = [...new Set(graph.relationships
    .filter(relationship => relationship.target === id)
    .map(relationship => relationship.source))]
  if (dependents.length > 0) {
    return `cannot remove ${id}: ${dependents.join(', ')} relate to it`
  }
  return undefined
}

/** A draft record leaves only once no ghost belongs to it; the stable parts it touched just lose the tag. */
export function draftRemovalBlocker(graph: ArchitectureGraph, draft: string): string | undefined {
  const ghosts = graph.elements
    .filter(element => element.origin === 'draft' && element.draft === draft)
    .map(element => element.id)
  if (ghosts.length > 0) {
    return `cannot remove ${draft}: ghosts ${ghosts.join(', ')} still belong to it`
  }
  return undefined
}
