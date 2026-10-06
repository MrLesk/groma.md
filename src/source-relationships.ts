import type { ArchitectureElement, ArchitectureRelationship, RelationshipConnection } from './types.ts'
import { sourceIndex } from './source-index.ts'

function pairKey(source: string, target: string): string {
  return `${source}\0${target}`
}

function relationshipText(connections: RelationshipConnection[]): Pick<ArchitectureRelationship, 'description' | 'technology' | 'status'> {
  const stable = connections.filter(connection => connection.status === 'stable')
  const active = stable.length ? stable : connections
  return {
    status: stable.length ? 'stable' : 'draft',
    description: [...new Set(active.map(connection => connection.description))].join('; '),
    technology: [...new Set(active.map(connection => connection.technology))].join(', '),
  }
}

/** Project exact file connections through their current owners, with one edge per component pair. */
export function sourceRelationships(
  elements: readonly ArchitectureElement[],
  connections: readonly RelationshipConnection[],
): ArchitectureRelationship[] {
  const index = sourceIndex(elements)
  const authored = new Set(connections.filter(connection => connection.authored && connection.status === 'stable')
    .map(connection => pairKey(connection.source, connection.target)))
  const relationships = new Map<string, ArchitectureRelationship>()
  for (const connection of connections) {
    if (!connection.authored && authored.has(pairKey(connection.source, connection.target))) continue
    const source = index.owner(connection.source) ?? index.resolve(connection.source)
    const target = index.owner(connection.target) ?? index.resolve(connection.target)
    // A row naming a file without an owner, for example after a detach, stays stored and returns to the map once a scan owns the file.
    if (!source || !target) continue
    if (source.id === target.id) continue
    const key = pairKey(source.id, target.id)
    let relationship = relationships.get(key)
    if (!relationship) {
      relationship = {
        connections: [],
        status: connection.status,
        sourceId: source.id,
        targetId: target.id,
        description: '',
        technology: '',
        sourceFilename: source.sourceFilename,
        targetSourceFilename: target.sourceFilename,
      }
      relationships.set(key, relationship)
    }
    relationship.connections.push(connection)
  }
  return [...relationships.values()].map(relationship => ({
    ...relationship,
    ...relationshipText(relationship.connections),
  })).sort((left, right) => pairKey(left.sourceId, left.targetId).localeCompare(pairKey(right.sourceId, right.targetId)))
}
