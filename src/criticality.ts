import type { ArchitectureElement, AnnotatedElement } from './types.ts'

export const criticalityLevels = ['low', 'normal', 'high', 'critical'] as const
export type Criticality = typeof criticalityLevels[number]

/** Resolve human judgment through containment; scans never choose a level. */
export function criticalityOf(element: ArchitectureElement, byId: ReadonlyMap<string, ArchitectureElement>): Criticality {
  if (element.criticality !== undefined) return element.criticality
  const parent = element.parentId === null ? undefined : byId.get(element.parentId)
  return parent === undefined ? 'normal' : criticalityOf(parent, byId)
}

export function criticalityRank(level: Criticality | undefined): number {
  return criticalityLevels.indexOf(level ?? 'normal')
}

/** Shape, not color, distinguishes review priority in every theme. */
export function criticalityMark(level: Criticality | undefined): string {
  return level === 'critical' ? '‼' : level === 'high' ? '!' : ''
}

export function criticalitySummary(elements: readonly Pick<AnnotatedElement, 'criticality'>[]): string {
  const count = (level: Criticality) => elements.filter(element => element.criticality === level).length
  return `${count('critical')} critical · ${count('high')} high`
}

/** Highest risk first; larger changes break ties within one level. */
export function compareReviewPriority(left: { criticality?: Criticality; size: number }, right: { criticality?: Criticality; size: number }): number {
  return criticalityRank(right.criticality) - criticalityRank(left.criticality) || right.size - left.size
}
