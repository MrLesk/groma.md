import type { AnnotatedRelationship, ArchitectureGraph } from '../../../types.ts'
import { heading, paragraph } from '../atoms/text.ts'
import { acceptEntry, editEntry, removeEntry } from './commands.ts'
import { isWriteViewOpen, paintWriteEntries } from './write-view.ts'
import { relationshipCard } from './relationship-card.ts'
import type { RelationWrites } from './writes.ts'

/** How many file interactions the scanners derived between two elements, as the pane says it. */
function derivedInteractions(count: number): string {
  return `${count} derived file ${count === 1 ? 'interaction' : 'interactions'}`
}

/** A map connection bundles claims; authoring always addresses an exact endpoint pair. */
export function paintRelationship(
  host: HTMLElement,
  relationship: AnnotatedRelationship,
  world: ArchitectureGraph,
  onSelect: (id: string, additive: boolean) => void,
  writesFor: (source: string, target: string) => RelationWrites,
): void {
  if (isWriteViewOpen(host, relationship.id)) return
  const related = world.relationships.filter(row => (row.source === relationship.source && row.target === relationship.target)
    || (row.source === relationship.target && row.target === relationship.source))
  const connections = related.flatMap(row => row.connections ?? [])
  const byId = new Map(world.elements.map(item => [item.representationId, item]))
  const body = host.querySelector('.body')!
  body.replaceChildren()
  host.querySelector('h1')!.textContent = 'Relationship'
  host.querySelector('.meta')!.textContent = ''
  host.querySelector('.tabs')!.replaceChildren()
  for (const row of related) {
    const count = new Set((row.connections ?? []).filter(connection => !connection.authored)
      .map(connection => `${connection.source}\0${connection.target}`)).size
    if (count) body.append(paragraph('relationship-count', `${byId.get(row.source)!.title} → ${byId.get(row.target)!.title}: ${derivedInteractions(count)}`))
  }
  body.append(relationshipCard({ ...relationship, source: byId.get(relationship.source)!, target: byId.get(relationship.target)! }, onSelect))
  const connection = connections[0]
  if (!connection) return
  const details = document.createElement('div')
  body.append(details)
  const writes = writesFor(connection.source, connection.target)
  details.append(heading(connection.authored ? 'Authored interaction' : 'Derived interaction'))
  details.append(paragraph('description', connection.description), paragraph('technology', connection.technology))
  const editable = connection.authored || !connections.some(row => row.authored
    && row.source === connection.source && row.target === connection.target)
  const { onAccept, onEdit, onRead, onRemove } = writes
  if (!editable || onEdit === undefined || onRead === undefined) return
  // A draft relationship is accepted or removed from its Edit view.
  const draft = connection.authored && connection.status === 'draft'
  const title = `the relationship from ${byId.get(relationship.source)!.title} to ${byId.get(relationship.target)!.title}`
  paintWriteEntries(host, relationship.id, [editEntry(
    [
      { name: 'description', label: 'Description', value: connection.description, required: true },
      { name: 'technology', label: 'Technology', value: connection.technology, required: true },
    ],
    onEdit,
    [
      ...(draft && onAccept !== undefined ? [acceptEntry(title, onAccept)] : []),
      ...(draft && onRemove !== undefined ? [removeEntry(title, onRemove)] : []),
    ],
  )], onRead)
}
