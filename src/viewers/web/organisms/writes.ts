import type { EditArchitectureInput } from '../../../authoring.ts'
import type { EditValues } from '../../../authoring-conflict.ts'

/** What the edit verb changes from the pane; the id is the selected element's. */
export type MeaningEdit = Pick<EditArchitectureInput, 'title' | 'description' | 'overview' | 'technology' | 'parent' | 'tags' | 'color' | 'icon'>

export interface ParentOption {
  id: string
  title: string
}

/** The write hooks the pane of several selected components gets on the current revision of a live map. */
export interface SelectionWrites {
  onRead: () => void
  members: { id: string; title: string }[]
  onGroup: (name: string) => Promise<void>
  onCombine: (survivor: string) => Promise<void>
}

/**
 * The write hooks an element pane gets on the current revision of a live map. Only the pane's Edit entry
 * receives them: the sections a person reads are painted without any, so reading cannot write.
 */
export interface PaneWrites {
  onRead?: () => void
  onRemove?: () => Promise<void>
  onAccept?: () => Promise<void>
  onEdit?: (input: MeaningEdit, original: EditValues) => Promise<void>
  parents?: readonly ParentOption[]
}

/** The write hooks a relationship pane gets on the current revision of a live map. */
export interface RelationWrites {
  onRead?: () => void
  onAccept?: () => Promise<void>
  onEdit?: (input: { description?: string; technology?: string }, original: EditValues) => Promise<void>
  onRemove?: () => Promise<void>
}
