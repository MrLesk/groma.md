import type { AnnotatedGroup, ArchitectureGraph } from '../../../types.ts'
import { heading, paragraph } from '../atoms/text.ts'
import { tagRow } from '../tags/tag-row.ts'
import { groupEditEntry } from './commands.ts'
import { elementLinks } from './details.ts'
import { isWriteViewOpen, paintWriteEntries } from './write-view.ts'
import type { GroupWrites } from './writes.ts'

/**
 * Paints the pane of a selected group: its wording, its tags as a row whose tags toggle the map's focus,
 * and its members, each of which selects that component. With `writes`, the pane's write entry is Edit;
 * an open Edit view stays across repaints.
 */
export function paintGroup(
  host: HTMLElement, group: AnnotatedGroup, world: ArchitectureGraph,
  onSelect: (id: string, additive: boolean) => void,
  focusTags: readonly string[], onToggleTag: (tag: string) => void,
  writes: GroupWrites | undefined,
): void {
  // An open Edit view stays across repaints while the pane may write. On another revision it gives way to reading.
  if (writes !== undefined && isWriteViewOpen(host, group.id)) return
  host.querySelector('.meta')!.textContent = 'Group'
  host.querySelector('h1')!.textContent = group.title
  host.querySelector('.tabs')!.replaceChildren()
  const body = host.querySelector('.body')!
  body.replaceChildren()
  if (group.description) body.append(paragraph('description', group.description))
  if (group.overview) {
    for (const prose of group.overview.split('\n\n')) body.append(paragraph('overview', prose))
  }
  if (group.tags?.length) body.append(tagRow(group.tags, focusTags, onToggleTag))
  const members = world.elements.filter(element => element.group === group.id)
  if (members.length > 0) {
    const links = members.map(member => ({
      id: member.representationId, title: member.title, kind: member.kind, external: member.external,
    }))
    body.append(heading('Members'), elementLinks(links, onSelect))
  }
  if (writes !== undefined) paintWriteEntries(host, group.id, [groupEditEntry(group, world, writes)], writes.onRead)
}
