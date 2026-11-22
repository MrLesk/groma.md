import { compareSemanticElements } from '../../element-order.ts'
import type { Zone } from '../../sheet/types.ts'
import type { AnnotatedElement, AnnotatedGroup, ArchitectureGraph, WorkItem } from '../../types.ts'

export type Selection =
  | { kind: 'none' }
  | { kind: 'architecture'; ids: readonly string[] }
  | { kind: 'task'; id: string }
  | { kind: 'flow'; id: string }

export const noSelection: Selection = { kind: 'none' }

/** The internal system a current map selects when its address names nothing. */
export function primarySystem(world: ArchitectureGraph): AnnotatedElement | undefined {
  return world.elements
    .filter(element => element.kind === 'system' && !element.external)
    .sort(compareSemanticElements)[0]
}

export function primarySelection(selection: Selection): string | undefined {
  if (selection.kind === 'task' || selection.kind === 'flow') return selection.id
  return selection.kind === 'architecture' ? selection.ids.at(-1) : undefined
}

export function selectedArchitecture(selection: Selection): readonly string[] {
  return selection.kind === 'architecture' ? selection.ids : []
}

/** Every concrete selection owns the inspector; the empty selection removes it from the shell. */
export function ownsDetails(selection: Selection): boolean {
  return selection.kind !== 'none'
}

/** The architecture selection of one target: an element, a relationship, a group or the placement group. */
export function selectOne(id: string): Selection {
  return { kind: 'architecture', ids: [id] }
}

/** A plain pick selects one target. An additive pick toggles it in order, except that a group is always selected alone. */
export function selectArchitecture(selection: Selection, id: string, additive: boolean, groups: readonly AnnotatedGroup[]): Selection {
  const selected = selectedArchitecture(selection)
  const picksGroup = groups.some(group => group.id === id)
  const groupIsSelected = groups.some(group => selected.includes(group.id))
  if (!additive || picksGroup || groupIsSelected) return selectOne(id)
  if (!selected.includes(id)) return { kind: 'architecture', ids: [...selected, id] }
  const ids = selected.filter(previous => previous !== id)
  return ids.length === 0 ? noSelection : { kind: 'architecture', ids }
}

export function selectTask(id: string): Selection {
  return { kind: 'task', id }
}

/** True when the id names something the map can select: stored architecture or the derived placement group. */
export function isKnownArchitecture(id: string, world: ArchitectureGraph, zones: readonly Zone[]): boolean {
  return world.elements.some(element => element.representationId === id)
    || world.groups.some(group => group.id === id)
    || world.relationships.some(relationship => relationship.id === id)
    || zones.some(zone => zone.unidentifiedContainer && zone.key === id)
}

/** System surfaces first release a component selection so large islands offer room to deselect. */
export function selectMapArchitecture(selection: Selection, id: string, additive: boolean, world: ArchitectureGraph): Selection {
  const target = world.elements.find(element => element.representationId === id)
  const selected = selectedArchitecture(selection)
  if (!additive && target?.kind === 'system' && !target.external
    && world.elements.some(element => element.kind === 'component' && selected.includes(element.representationId))) {
    return noSelection
  }
  return selectArchitecture(selection, id, additive, world.groups)
}

/** Drops the targets `known` rejects without changing the order of those that remain. */
export function retainSelection(selection: Selection, known: (id: string) => boolean): Selection {
  if (selection.kind === 'none') return selection
  if (selection.kind === 'task' || selection.kind === 'flow') return known(selection.id) ? selection : noSelection
  const ids = selection.ids.filter(known)
  return ids.length === 0 ? noSelection : { kind: 'architecture', ids }
}

/** Keep only targets that still exist in the updated architecture or work list. */
export function retainLiveSelection(selection: Selection, world: ArchitectureGraph, zones: readonly Zone[], work: readonly WorkItem[]): Selection {
  if (selection.kind === 'task') return retainSelection(selection, id => work.some(task => task.id === id))
  if (selection.kind === 'flow') return retainSelection(selection, id => world.flows.some(flow => flow.id === id))
  return retainSelection(selection, id => isKnownArchitecture(id, world, zones))
}
