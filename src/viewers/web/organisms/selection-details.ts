import { knownTags } from '../../../tags.ts'
import type { ArchitectureGraph } from '../../../types.ts'
import { kindLabel } from '../../atoms/kind.ts'
import { combineEntry, editEntry, groupEntry } from './commands.ts'
import { elementLinks, sharedElementFields } from './details.ts'
import { isWriteViewOpen, paintWriteEntries } from './write-view.ts'
import type { SelectionWrites } from './writes.ts'

export const selectionDetailsCss = `
  #details .link .note { margin-left: 10px; color: var(--muted); font-size: 11px; }
`

/** What the selected elements are called together: their kind when they share one. */
function nounOf(kinds: readonly string[]): string {
  return new Set(kinds).size === 1 ? `${kinds[0]!.toLowerCase()}s` : 'elements'
}

/**
 * Paints the pane of several selected elements and says whether it did. The pane lists what is selected,
 * each component with the group it is in; a click on one selects it alone and a shift-click drops it from
 * the selection. A live selection offers Edit, followed by Group and Combine for a selection of components.
 */
export function paintSelection(
  host: HTMLElement,
  ids: readonly string[],
  world: ArchitectureGraph,
  onSelect: (id: string, additive: boolean) => void,
  writes: SelectionWrites | undefined,
): boolean {
  const members = ids.flatMap(id => world.elements.filter(element => element.representationId === id))
  if (ids.length < 2 || members.length !== ids.length) return false
  const key = ids.join(' ')
  if (isWriteViewOpen(host, key)) return true
  host.querySelector('.meta')!.textContent = 'Selection'
  host.querySelector('h1')!.textContent = `${members.length} ${nounOf(members.map(member => kindLabel(member.kind, member.external)))}`
  host.querySelector('.tabs')!.replaceChildren()
  const body = host.querySelector('.body')!
  const groupTitle = new Map(world.groups.map(group => [group.id, group.title]))
  body.replaceChildren(elementLinks(members.map(member => ({
    id: member.representationId, title: member.title, kind: member.kind, external: member.external,
    note: groupTitle.get(member.group ?? ''),
  })), onSelect))
  if (writes === undefined) return true
  const fields = sharedElementFields(members, knownTags(world.elements))
  const entries = [editEntry(fields, writes.onEdit)]
  const components = writes.components
  if (components !== undefined) entries.push(groupEntry(components.onGroup), combineEntry(members, components.onCombine))
  paintWriteEntries(host, key, entries, writes.onRead)
  return true
}
