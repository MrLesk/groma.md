import type { TagSelection } from '../../../tag-selection.ts'
import type { ArchitectureGraph } from '../../../types.ts'
import type { FlowRef } from '../../flows.ts'
import { replaceTreeChildren, sidebarBranches, sidebarRow } from '../organisms/sidebar-row.ts'
import { sectionHeading } from '../organisms/sidebar-section.ts'
import { flowRow, type FlowRowData } from './row.ts'

interface FlowListOptions {
  title: string
  contextId?: string
  visibleFlows?: readonly FlowRowData[]
  selectedIds?: readonly string[]
  onSelectActor?: (id: string, additive: boolean) => void
}

function groupedTitle(title: string, actorTitle: string): string {
  const separator = title.indexOf(': ')
  if (separator < 0) return title
  const prefix = title.slice(0, separator).toLowerCase()
  const actor = actorTitle.toLowerCase()
  return actor === prefix || actor.endsWith(` ${prefix}`) ? title.slice(separator + 2) : title
}

/** Each list keeps its open branches and the flows selected by a tag focus across repaints. */
export function createFlowList() {
  let unfolded = true
  const expandedActors = new Set<string>()
  const rows = new Map<string, HTMLButtonElement>()
  let tagSelection: TagSelection | undefined

  /** Flows that a tag focus does not match recede, as rows do in the hierarchy; undefined ends it. */
  function recede(selection: TagSelection | undefined): void {
    tagSelection = selection
    for (const [id, row] of rows) row.classList.toggle('receded', selection !== undefined && !selection.matchingFlows.has(id))
  }

  function paintFlows(
    host: HTMLElement,
    world: ArchitectureGraph,
    active: readonly FlowRef[],
    onToggle: (flow: FlowRef) => void,
    options: FlowListOptions,
  ): void {
    rows.clear()
    host.classList.add('flow-tree')
    const { title, visibleFlows } = options
    const visibleIds = visibleFlows && new Set(visibleFlows.map(row => row.flow.id))
    const flows = world.flows.filter(flow => visibleIds === undefined || visibleIds.has(flow.id))
    const contextActor = world.elements.find(element => element.kind === 'actor' && element.id === options.contextId)
    const actors = world.elements.filter(element => element.kind === 'actor'
      && element.id !== contextActor?.id
      && (visibleIds === undefined || flows.some(flow => flow.steps[0]?.source === element.id)))
    if (flows.length === 0 && actors.length === 0) {
      host.replaceChildren()
      return
    }
    const heading = sectionHeading(title, unfolded, () => {
      unfolded = !unfolded
      paintFlows(host, world, active, onToggle, options)
    })
    const list = document.createElement('div')
    list.hidden = !unfolded
    const actorIds = new Set(actors.map(actor => actor.id))
    const ungrouped = flows.filter(flow => !actorIds.has(flow.steps[0]!.source))
    function listedFlowRow(id: string, title: string): HTMLButtonElement {
      const row = flowRow({ flow: { id }, title }, active, onToggle)
      row.classList.add('row')
      rows.set(id, row)
      return row
    }
    const actorRows = (
      actor: typeof actors[number],
      actorFlows: typeof flows,
      followingActor: boolean,
      expanded: boolean,
      toggle: () => void,
    ) => {
      const heading = sidebarRow(actor.title, 'actor', { expanded, count: actorFlows.length, toggle }, actor.icon)
      heading.dataset.id = actor.id
      heading.classList.toggle('selected', options.selectedIds?.includes(actor.id) === true)
      heading.prepend(...sidebarBranches([followingActor]))
      const selectActor = options.onSelectActor
      heading.addEventListener('click', selectActor === undefined ? toggle : event => selectActor(actor.id, event.shiftKey))
      const children = document.createElement('div')
      children.hidden = !expanded
      for (const [flowIndex, flow] of actorFlows.entries()) {
        const row = listedFlowRow(flow.id, groupedTitle(flow.title, actor.title))
        row.prepend(...sidebarBranches([followingActor, flowIndex < actorFlows.length - 1]))
        children.append(row)
      }
      return [heading, children]
    }
    for (const [actorIndex, actor] of actors.entries()) {
      const followingActor = actorIndex < actors.length - 1 || ungrouped.length > 0
      const expanded = expandedActors.has(actor.id)
      const actorFlows = flows.filter(flow => flow.steps[0]?.source === actor.id)
      const toggle = () => {
        if (expanded) expandedActors.delete(actor.id)
        else expandedActors.add(actor.id)
        paintFlows(host, world, active, onToggle, options)
      }
      list.append(...actorRows(actor, actorFlows, followingActor, expanded, toggle))
    }
    for (const [index, flow] of ungrouped.entries()) {
      const title = contextActor?.id === flow.steps[0]!.source ? groupedTitle(flow.title, contextActor.title) : flow.title
      const row = listedFlowRow(flow.id, title)
      row.prepend(...sidebarBranches([index < ungrouped.length - 1]))
      list.append(row)
    }
    replaceTreeChildren(host, heading, list)
    recede(tagSelection)
  }
  return { paint: paintFlows, recede }
}
