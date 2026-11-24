import type { ArchitectureElement, ElementStatus, Origin, RelationshipOrigin } from './types.ts'

/**
 * A virtual component is a stable component that owns no source file. A person adds one to explain what no
 * scan can see, and a component whose files all went away is one too. Nothing stored marks it: every rule
 * that treats a virtual component differently asks here or reads the origin derived below.
 */
export function isVirtualComponent(element: ArchitectureElement): boolean {
  return element.kind === 'component' && element.status === 'stable' && element.code.length === 0
}

/** How the maps present an element: planned, virtual, or observed. */
export function elementOrigin(element: ArchitectureElement): Origin {
  if (element.status === 'draft') return 'draft'
  return isVirtualComponent(element) ? 'virtual' : 'observed'
}

/** A relationship is planned or observed. It is never virtual, also when one of its ends is. */
export function relationshipOrigin(status: ElementStatus): RelationshipOrigin {
  return status === 'draft' ? 'draft' : 'observed'
}
