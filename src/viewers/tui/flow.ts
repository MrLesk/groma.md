import { flowLegs } from '../flows.ts'
import type { AnnotatedRelationship } from '../../types.ts'
import type { LitAction } from './navigation.ts'
import type { TerminalViewModel } from './model.ts'
import type { TerminalProjection } from './projection.ts'
import { visibleItemFor } from './projection-sheet.ts'

export interface ProjectedFlowEndpoint {
  title: string
  visibleKey?: string
}

export interface ProjectedFlowStep {
  id: string
  index: number
  total: number
  description: string
  source: ProjectedFlowEndpoint
  target: ProjectedFlowEndpoint
}

/** A flow contains only its authored legs; a relationship selection contains every relationship of its pair. */
export function litLegs(world: TerminalViewModel, lit: LitAction): AnnotatedRelationship[] {
  if (world.flows.some(flow => flow.id === lit.id)) return flowLegs(lit.id, world)
  const ids = lit.relationshipIds ?? [lit.id]
  return world.relationships.filter(item => ids.includes(item.id))
}

/** Exact authored endpoints paired with the shapes that draw them at the current depth. */
export function projectFlowStep(
  world: TerminalViewModel,
  projection: TerminalProjection,
  actionId: string | undefined,
  step: number | undefined,
): ProjectedFlowStep | undefined {
  if (step === undefined) return undefined
  const legs = flowLegs(actionId, world)
  const leg = legs[step]
  if (!leg) return undefined
  const byId = new Map(world.elements.map(element => [element.representationId, element]))
  const endpoint = (id: string): ProjectedFlowEndpoint => {
    const exact = byId.get(id)
    const visible = visibleItemFor(world, projection.items, id)
    return {
      title: exact?.title ?? id,
      visibleKey: visible?.key,
    }
  }
  return {
    id: leg.id,
    index: step,
    total: legs.length,
    description: leg.description,
    source: endpoint(leg.source),
    target: endpoint(leg.target),
  }
}
