import type { AnnotatedRelationship, ArchitectureGraph } from '../../../types.ts'
import { heading, paragraph } from '../atoms/text.ts'
import { paintAcceptCommand, paintRemoveCommand } from './commands.ts'
import { editButton, isEditing } from './editable.ts'
import { relationshipCard } from './relationship-card.ts'
import type { RelationWrites } from './writes.ts'

/** A map connection bundles claims; authoring always addresses an exact endpoint pair. */
export function paintRelationship(
  host: HTMLElement,
  relationship: AnnotatedRelationship,
  world: ArchitectureGraph,
  onSelect: (id: string, additive: boolean) => void,
  writesFor: (source: string, target: string) => RelationWrites,
): void {
  if (isEditing(host, relationship.id)) return
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
    if (count) body.append(paragraph('relationship-count', `${byId.get(row.source)!.title} → ${byId.get(row.target)!.title}: ${count} derived file interactions`))
  }
  body.append(relationshipCard({ ...relationship, source: byId.get(relationship.source)!, target: byId.get(relationship.target)! }, onSelect))
  const connection = connections[0]
  if (!connection) return
  const details = document.createElement('div')
  body.append(details)
  host.querySelector('.edit-entry')?.remove()
  const writes = writesFor(connection.source, connection.target)
  details.append(heading(connection.authored ? 'Authored interaction' : 'Derived interaction'))
  details.append(paragraph('description', connection.description), paragraph('technology', connection.technology))
  const editable = connection.authored || !connections.some(row => row.authored
    && row.source === connection.source && row.target === connection.target)
  const { onAccept, onEdit, onRead, onRemove } = writes
  if (!editable || onEdit === undefined || onRead === undefined) return
  const draft = connection.authored && connection.status === 'draft'
  details.append(editButton(host, relationship.id, {
    form: {
      fields: [
        { name: 'description', label: 'Description', value: connection.description, required: true },
        { name: 'technology', label: 'Technology', value: connection.technology, required: true },
      ],
      save: onEdit,
    },
    // A draft relationship is accepted or removed from its Edit view.
    paintCommands: (box, run) => {
      if (draft && onAccept !== undefined) paintAcceptCommand(box, run, onAccept)
      if (draft && onRemove !== undefined) paintRemoveCommand(box, run, connection.description, onRemove)
    },
  }, onRead))
}
