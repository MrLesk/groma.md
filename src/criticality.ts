import { sourceIndex } from './source-index.ts'
import type { AnnotatedElement, ArchitectureElement, CriticalChangeFinding, WorkSnapshot } from './types.ts'

/** Ascending order: validation and the details form list the levels this way, and criticalityRank is a level's position here. */
export const criticalityLevels = ['low', 'normal', 'high', 'critical'] as const
export type Criticality = typeof criticalityLevels[number]

/** Resolve human judgment through containment; scans never choose a level. */
export function criticalityOf(element: ArchitectureElement, byId: ReadonlyMap<string, ArchitectureElement>): Criticality {
  if (element.declaredCriticality !== undefined) return element.declaredCriticality
  const parent = element.parentId === null ? undefined : byId.get(element.parentId)
  return parent === undefined ? 'normal' : criticalityOf(parent, byId)
}

function criticalityRank(level: Criticality | undefined): number {
  return criticalityLevels.indexOf(level ?? 'normal')
}

/**
 * Shape, not color, distinguishes review priority in every theme. Both marks are plain ASCII: a terminal counts
 * one cell for each character, so a card that holds a mark keeps its borders in line.
 */
export function criticalityMark(level: Criticality | undefined): string {
  return level === 'critical' ? '!!' : level === 'high' ? '!' : ''
}

/** How many of the changed components are critical and high. Empty when none is, so a review shows no line of zeros. */
export function criticalitySummary(elements: readonly Pick<AnnotatedElement, 'criticality'>[]): string {
  const count = (level: Criticality) => elements.filter(element => element.criticality === level).length
  const critical = count('critical')
  const high = count('high')
  return critical + high === 0 ? '' : `${critical} critical · ${high} high`
}

/** Highest risk first; larger changes break ties within one level. */
export function compareReviewPriority(left: { criticality?: Criticality; size: number }, right: { criticality?: Criticality; size: number }): number {
  return criticalityRank(right.criticality) - criticalityRank(left.criticality) || right.size - left.size
}

/**
 * What `groma lint` reports about tasks: one finding for each in-progress or done task and each critical
 * component that owns one of its modified files, however many of that component's files the task lists.
 */
export function criticalTaskFindings(elements: readonly ArchitectureElement[], work: WorkSnapshot): CriticalChangeFinding[] {
  const byId = new Map(elements.map(element => [element.id, element]))
  const index = sourceIndex(elements)
  // In progress or done: the task has left the default status, in which it waits to be started.
  const inProgressOrDone = work.items.filter(item => item.status !== work.defaultStatus)
  return inProgressOrDone.flatMap(item => {
    // Only a component declares code, so every owner is a component.
    const owners = new Set(item.modifiedFiles.map(file => index.owner(file)).filter(owner => owner !== undefined))
    return [...owners]
      .filter(owner => criticalityOf(owner, byId) === 'critical')
      .map(owner => ({
        kind: 'critical-change' as const,
        title: `${item.id} (${item.title}) changes critical component ${owner.id} (${owner.title})`,
      }))
  })
}
