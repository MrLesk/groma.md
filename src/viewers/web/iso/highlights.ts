import type { ArchitectureGraph, WorkItem } from '../../../types.ts'
import { touchedElements } from '../../../work/pins.ts'
import { elementOnPath, type FlowRef } from '../../flows.ts'
import { flowHighlight } from '../flow/state.ts'
import type { IsoMap } from './painting/map.ts'
import { selectedArchitecture, type Selection } from '../selection.ts'

/**
 * Every selected component, and the components one hop from any of them in either direction. Surfaces are
 * left out, and a selected component is never also a neighbor.
 */
function componentNeighborhood(selection: Selection, world: ArchitectureGraph) {
  const components = new Set(world.elements.filter(element => element.kind === 'component').map(element => element.representationId))
  const selected = new Set(selectedArchitecture(selection).filter(id => components.has(id)))
  const neighbors = new Set(world.relationships.flatMap(edge => {
    if (selected.has(edge.source)) return [edge.target]
    if (selected.has(edge.target)) return [edge.source]
    return []
  }).filter(id => components.has(id) && !selected.has(id)))
  return { selected, neighbors }
}

/** Browser-only emphasis; the inspector selection and architecture stay unchanged. */
export function createMapHighlights(
  map: Pick<IsoMap, 'select' | 'mark' | 'setLitRoutes' | 'markNeighbors'>,
) {
  return {
    paint(selection: Selection, world: ArchitectureGraph, flows: readonly FlowRef[], tasks: WorkItem[]): void {
      const neighborhood = componentNeighborhood(selection, world)
      map.select(selectedArchitecture(selection))
      map.markNeighbors(neighborhood.selected, neighborhood.neighbors)
      map.mark(new Set(tasks.flatMap(item => touchedElements(item, world))))
      const { routes, focusedRoute } = flowHighlight(flows, world)
      map.setLitRoutes(routes, id => elementOnPath(id, routes, world), focusedRoute)
    },
  }
}
