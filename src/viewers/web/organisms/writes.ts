import type { EditArchitectureInput } from '../../../authoring.ts'
import type { EditValues } from '../../../authoring-conflict.ts'

/** The fields Edit can change from an element's pane. */
export type MeaningEdit = Pick<EditArchitectureInput, 'title' | 'description' | 'overview' | 'technology' | 'parent' | 'addTags' | 'removeTags' | 'color' | 'icon'>

export interface ParentOption {
  id: string
  title: string
}

/** Group and Combine take a selection made entirely of components. */
export interface ComponentWrites {
  onGroup: (name: string) => Promise<void>
  onCombine: (survivor: string) => Promise<void>
}

/** Any selection of elements can edit tags and appearance on the current revision of a live map. */
export interface SelectionWrites {
  onRead: () => void
  onEdit: (changes: Pick<MeaningEdit, 'addTags' | 'removeTags' | 'color' | 'icon'>) => Promise<void>
  components?: ComponentWrites
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
