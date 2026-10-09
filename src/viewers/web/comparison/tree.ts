import { compareReviewPriority } from '../../../criticality.ts'
import type { Comparison, ChangeStatus } from '../../../history/comparison.ts'
import type { ArchitectureGraph } from '../../../types.ts'
import { ancestorsOf, semanticTreeRows } from '../../tui/tree.ts'

export const changeStatuses = ['added', 'modified', 'removed'] as const
export type VisibleStatus = typeof changeStatuses[number]
export type ChangeCounts = Record<VisibleStatus, number>
export const changeMarks = { added: '+', modified: '~', removed: '−' } as const
export const changeLabels = { added: 'Added', modified: 'Modified', removed: 'Removed' } as const
export function isChange(status: ChangeStatus | undefined): status is VisibleStatus {
  return status !== undefined && status !== 'unchanged'
}

function changedPaths(world: ArchitectureGraph, comparison: Comparison, enabled: ReadonlySet<VisibleStatus>) {
  const byId = new Map(world.elements.map(element => [element.representationId, element]))
  const counts = new Map<string, ChangeCounts>()
  const priorities = new Map<string, { criticality?: import('../../../criticality.ts').Criticality; size: number }>()
  const changed = new Set<string>()
  const current = new Set<string>()
  const former = new Set<string>()
  for (const element of world.elements) {
    const change = comparison.components[element.id]
    if (change === undefined) continue
    const parents = ancestorsOf(element.representationId, byId)
    for (const id of parents) (change.after === undefined ? former : current).add(id)
    if (!isChange(change.status) || !enabled.has(change.status)) continue
    changed.add(element.representationId)
    const priority = { criticality: (change.after ?? change.before)!.criticality,
      size: change.files.reduce((total, file) => total + file.additions + file.deletions, 0) }
    priorities.set(element.representationId, priority)
    for (const id of parents) {
      const total = counts.get(id) ?? { added: 0, modified: 0, removed: 0 }
      total[change.status] += 1
      counts.set(id, total)
    }
  }
  return { counts, priorities, changed, former: new Set([...former].filter(id => !current.has(id))) }
}

/** The Changes list and navigation share global review priority; All retains the containment tree. */
export function comparisonTree(world: ArchitectureGraph, comparison: Comparison,
  enabled: ReadonlySet<VisibleStatus> = new Set(changeStatuses)) {
  const { counts, priorities, changed, former } = changedPaths(world, comparison, enabled)
  const included = new Set([...changed, ...counts.keys()])
  const elements = world.elements.filter(element => included.has(element.representationId))
    .map(element => ({ ...element, children: element.children.filter(id => included.has(id)) }))
  const filtered = { ...world, elements }
  const compare = (left: typeof elements[number], right: typeof elements[number]) =>
    compareReviewPriority(priorities.get(left.representationId)!, priorities.get(right.representationId)!)
      || left.title.localeCompare(right.title) || left.id.localeCompare(right.id)
  const ranked = elements.filter(element => changed.has(element.representationId)).sort(compare)
  const byRowId = new Map(semanticTreeRows(filtered, [], { expanded: included, collapsed: new Set() }).map(row => [row.id, row]))
  const rows = ranked.map(element => ({ ...byRowId.get(element.representationId)!, depth: 0, hasChildren: false, expanded: false, count: 0 }))
  const relationships = world.relationships.filter(item => {
    const status = comparison.relationships[item.id]
    return isChange(status) && enabled.has(status)
  })
  const order = [...ranked.map(element => element.representationId), ...relationships.map(item => item.id)]
  return { world: filtered, elements: world.elements, rows, counts, relationships, order, former }
}

/** Keyboard and button navigation wrap in the same visible list. */
export function nextChange(order: readonly string[], selected: string | undefined, direction: number): string | undefined {
  if (order.length === 0) return undefined
  const index = selected === undefined ? -1 : order.indexOf(selected)
  return order[index < 0 ? direction > 0 ? 0 : order.length - 1 : (index + direction + order.length) % order.length]
}
