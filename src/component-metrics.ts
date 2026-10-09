import type { ArchitectureGraph } from './types.ts'

export interface ComponentMetrics {
  files: number
  lines: number
  connections: number
  instability: number
  outliers: string[]
}

export interface HistoryMetrics {
  commits: number
  committers: number
  cochange: { id: string; commits: number }[]
}

export interface CodeHistory {
  window: number
  components: Record<string, HistoryMetrics>
}

function median(values: number[]): number {
  values.sort((a, b) => a - b)
  const middle = Math.floor(values.length / 2)
  return values.length % 2 ? values[middle]! : (values[middle - 1]! + values[middle]!) / 2
}

function neighbours(world: ArchitectureGraph) {
  const incoming = new Map<string, Set<string>>()
  const outgoing = new Map<string, Set<string>>()
  for (const relationship of world.relationships) {
    if (relationship.source === relationship.target) continue
    const sources = incoming.get(relationship.target) ?? new Set<string>()
    sources.add(relationship.source)
    incoming.set(relationship.target, sources)
    const targets = outgoing.get(relationship.source) ?? new Set<string>()
    targets.add(relationship.target)
    outgoing.set(relationship.source, targets)
  }
  return { incoming, outgoing }
}

function markOutliers(siblings: ComponentMetrics[]): void {
  for (const measure of ['files', 'lines', 'connections'] as const) {
    const middle = median(siblings.map(metric => metric[measure]))
    for (const metric of siblings) {
      if (metric.files >= 10 && metric[measure] > middle && metric[measure] >= 4 * middle) {
        metric.outliers.push(measure === 'lines' ? 'lines of code' : measure)
      }
    }
  }
}

/** Runtime evidence about existing components, never architecture metadata. */
export function componentMetrics(world: ArchitectureGraph): Map<string, ComponentMetrics> {
  const { incoming, outgoing } = neighbours(world)
  const byId = new Map(world.elements.map(element => [element.id, element]))
  const result = new Map<string, ComponentMetrics>()
  const siblings = new Map<string, ComponentMetrics[]>()
  for (const element of world.elements) {
    if (element.kind !== 'component') continue
    const ins = incoming.get(element.id)?.size ?? 0
    const outs = outgoing.get(element.id)?.size ?? 0
    const metrics: ComponentMetrics = {
      files: new Set(element.code.map(reference => reference.file)).size,
      lines: element.codeLines ?? 0,
      connections: ins + outs,
      instability: ins + outs === 0 ? 0 : outs / (ins + outs),
      outliers: [],
    }
    result.set(element.id, metrics)
    if (element.parent === null) continue
    const parent = byId.get(element.parent)
    if (parent?.kind !== 'container') continue
    const group = siblings.get(element.parent) ?? []
    group.push(metrics)
    siblings.set(element.parent, group)
  }
  for (const group of siblings.values()) markOutliers(group)
  return result
}

export function outlierLine(metrics: ComponentMetrics | undefined): string | undefined {
  return metrics?.outliers.length ? `Outlier: ${metrics.outliers.join(', ')} (at least 4× container median)` : undefined
}
