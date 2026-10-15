import type { AnnotatedElement, AnnotatedRelationship, ArchitectureGraph } from './types.ts'

const OUTLIER_MEASURES = ['files', 'lines', 'connections'] as const
type OutlierMeasure = typeof OUTLIER_MEASURES[number]

/** A component with fewer files is never an outlier, whatever its measures. */
const OUTLIER_MIN_FILES = 10
/** A measure marks a component that reaches this many times its container's median of that measure. */
const OUTLIER_MEDIAN_FACTOR = 4

export interface ComponentMetrics {
  files: number
  lines: number
  connections: number
  instability: number
  /** The measures in which the component stands far above the others in its container. */
  outliers: OutlierMeasure[]
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2
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
  for (const measure of OUTLIER_MEASURES) {
    const middle = median(siblings.map(metric => metric[measure]))
    // A median of 0 means at least half the container has nothing of this measure, often no connection. Every
    // value reaches any multiple of 0, so such a measure marks nobody.
    if (middle === 0) continue
    for (const metric of siblings) {
      if (metric.files >= OUTLIER_MIN_FILES && metric[measure] >= OUTLIER_MEDIAN_FACTOR * middle) metric.outliers.push(measure)
    }
  }
}

interface Computed {
  relationships: readonly AnnotatedRelationship[]
  metrics: ReadonlyMap<string, ComponentMetrics>
}

/** One result per loaded elements snapshot, released with that snapshot, as in source-index.ts. */
const computed = new WeakMap<readonly AnnotatedElement[], Computed>()

/**
 * Runtime evidence about existing components, never architecture metadata.
 * Computed once per loaded world: again only when the elements or the relationships array is a different one.
 */
export function componentMetrics(world: ArchitectureGraph): ReadonlyMap<string, ComponentMetrics> {
  const existing = computed.get(world.elements)
  if (existing?.relationships === world.relationships) return existing.metrics
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
  computed.set(world.elements, { relationships: world.relationships, metrics: result })
  return result
}

const measureWords: Record<OutlierMeasure, string> = { files: 'files', lines: 'lines of code', connections: 'connections' }

/** The one wording of an outlier: the web and terminal details print it and the map's outlier mark carries it as its label. */
export function outlierLine(metrics: ComponentMetrics | undefined): string | undefined {
  if (!metrics?.outliers.length) return undefined
  return `Outlier: ${metrics.outliers.map(measure => measureWords[measure]).join(', ')} (at least ${OUTLIER_MEDIAN_FACTOR}× container median)`
}
