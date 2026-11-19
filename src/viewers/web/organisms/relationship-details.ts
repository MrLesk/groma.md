import type {
  AnnotatedElement,
  AnnotatedRelationship,
  ArchitectureFlow,
  ArchitectureGraph,
  RelationshipConnection,
} from '../../../types.ts'
import { relationshipRemovalBlocker } from '../../../removable.ts'
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
  // The pane shows and writes the first exact endpoint pair of the selected relationship.
  const connection = relationship.connections?.[0]
  const writes = connection === undefined ? {} : writesFor(connection.source, connection.target)
  // An open Edit view stays across repaints while the pane may write. On another revision it gives way to reading.
  if (writes.onEdit !== undefined && isWriteViewOpen(host, relationship.id)) return
  const related = world.relationships.filter(row => (row.source === relationship.source && row.target === relationship.target)
    || (row.source === relationship.target && row.target === relationship.source))
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
  const ends = { source: byId.get(relationship.source)!, target: byId.get(relationship.target)! }
  body.append(relationshipCard({ ...relationship, ...ends }, onSelect))
  if (!connection) return
  const details = document.createElement('div')
  body.append(details)
  details.append(heading(connection.authored ? 'Authored interaction' : 'Derived interaction'))
  details.append(paragraph('description', connection.description), paragraph('technology', connection.technology))
  // A derived interaction is edited only while no authored row has taken over its endpoint pair.
  const editable = connection.authored || !related.flatMap(row => row.connections ?? []).some(row => row.authored
    && row.source === connection.source && row.target === connection.target)
  if (editable) paintWrites(host, relationship, connection, ends, world.flows, writes)
}

/**
 * The pane's Edit entry: the two fields, Accept for a planned relationship, and Remove where
 * `groma remove relation` would succeed.
 */
function paintWrites(
  host: HTMLElement,
  relationship: AnnotatedRelationship,
  connection: RelationshipConnection,
  ends: { source: AnnotatedElement; target: AnnotatedElement },
  flows: readonly ArchitectureFlow[],
  writes: RelationWrites,
): void {
  const { onAccept, onEdit, onRead, onRemove } = writes
  if (onEdit === undefined || onRead === undefined) return
  const planned = connection.authored && connection.status === 'draft'
  const hasVirtualEnd = ends.source.origin === 'virtual' || ends.target.origin === 'virtual'
  const flowIds = flows.filter(flow => flow.steps.some(step => step.relationshipId === relationship.id)).map(flow => flow.id)
  const removable = relationshipRemovalBlocker(connection, hasVirtualEnd, flowIds) === undefined
  const title = `the relationship from ${ends.source.title} to ${ends.target.title}`
  paintWriteEntries(host, relationship.id, [editEntry(
    [
      { name: 'description', label: 'Description', value: connection.description, required: true },
      { name: 'technology', label: 'Technology', value: connection.technology, required: true },
    ],
    onEdit,
    [
      ...(planned && onAccept !== undefined ? [acceptEntry(title, onAccept)] : []),
      ...(removable && onRemove !== undefined ? [removeEntry(title, onRemove)] : []),
    ],
  )], onRead)
}
