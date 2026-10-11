import { compareReviewPriority, type Criticality } from '../../../criticality.ts'
import type { Comparison, ChangeStatus } from '../../../history/comparison.ts'
import type { ArchitectureGraph } from '../../../types.ts'
import { ancestorsOf, type TreeRow } from '../../tui/tree.ts'

export const changeStatuses = ['added', 'modified', 'removed'] as const
export type VisibleStatus = typeof changeStatuses[number]
export type ChangeCounts = Record<VisibleStatus, number>
export const changeMarks = { added: '+', modified: '~', removed: '−' } as const
export const changeLabels = { added: 'Added', modified: 'Modified', removed: 'Removed' } as const
export function isChange(status: ChangeStatus | undefined): status is VisibleStatus {
  return status !== undefined && status !== 'unchanged'
}

/** One pass over the compared components collects what comparisonTree returns about them and their ancestors. */
function componentChanges(world: ArchitectureGraph, comparison: Comparison, enabled: ReadonlySet<VisibleStatus>) {
  const byId = new Map(world.elements.map(element => [element.representationId, element]))
  const counts = new Map<string, ChangeCounts>()
  /** Each changed component whose status is enabled, with what the review order compares. */
  const priorities = new Map<string, { criticality?: Criticality; size: number }>()
  const current = new Set<string>()
  const former = new Set<string>()
  for (const element of world.elements) {
    const change = comparison.components[element.id]
    if (change === undefined) continue
    const parents = ancestorsOf(element.representationId, byId)
    for (const id of parents) (change.after === undefined ? former : current).add(id)
    if (!isChange(change.status) || !enabled.has(change.status)) continue
    priorities.set(element.representationId, {
      criticality: element.criticality,
      size: change.files.reduce((total, file) => total + file.additions + file.deletions, 0),
    })
    for (const id of parents) {
      const total = counts.get(id) ?? { added: 0, modified: 0, removed: 0 }
      total[change.status] += 1
      counts.set(id, total)
    }
  }
  return { counts, priorities, former: new Set([...former].filter(id => !current.has(id))) }
}

/**
 * One comparison as the hierarchy pane, the changes bar and the map filter read it. A status missing from
 * `enabled` is left out of rows, relationships, order and counts.
 * - rows: the Changes list. Only changed components, flat, without their ancestors: critical first, then high,
 *   normal and low, and within one level the change with more added and deleted lines first.
 * - relationships: the changed relationships, listed below the rows.
 * - order: the row ids, then the relationship ids. Previous and Next walk it.
 * - counts: for each system and container, how many components below it were added, modified and removed. The
 *   All tree shows them on that row.
 * - former: systems and containers that hold only removed components. The All tree mutes them, and the map
 *   hides them while Removed is filtered out.
 * - elements: every element of `world`, so a relationship row can name its two ends.
 */
export function comparisonTree(world: ArchitectureGraph, comparison: Comparison,
  enabled: ReadonlySet<VisibleStatus> = new Set(changeStatuses)) {
  const { counts, priorities, former } = componentChanges(world, comparison, enabled)
  const ranked = world.elements.filter(element => priorities.has(element.representationId)).sort((left, right) =>
    compareReviewPriority(priorities.get(left.representationId)!, priorities.get(right.representationId)!)
      || left.title.localeCompare(right.title) || left.id.localeCompare(right.id))
  const rows: TreeRow[] = ranked.map(element => ({
    id: element.representationId, title: element.title, kind: element.kind, external: element.external,
    origin: element.origin, criticality: element.criticality,
    depth: 0, hasChildren: false, expanded: false, count: 0,
  }))
  const relationships = world.relationships.filter(item => {
    const status = comparison.relationships[item.id]
    return isChange(status) && enabled.has(status)
  })
  const order = [...ranked.map(element => element.representationId), ...relationships.map(item => item.id)]
  return { elements: world.elements, rows, counts, relationships, order, former }
}

/** Keyboard and button navigation wrap in the same visible list. */
export function nextChange(order: readonly string[], selected: string | undefined, direction: number): string | undefined {
  if (order.length === 0) return undefined
  const index = selected === undefined ? -1 : order.indexOf(selected)
  return order[index < 0 ? direction > 0 ? 0 : order.length - 1 : (index + direction + order.length) % order.length]
}
