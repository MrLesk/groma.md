import type { EditArchitectureInput } from '../../../authoring.ts'
import type { EditValues } from '../../../authoring-conflict.ts'
import type { GroupMeaning } from '../../../group.ts'
import type { ReadPane } from './write-view.ts'

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
  /** After Add component it gets the new component's id and selects it. */
  onRead?: ReadPane
  /** Adds a virtual component to the element and resolves to its id. The pane offers it for a container only. */
  onAddComponent?: (input: { name: string; description?: string; overview: string }) => Promise<string>
  onRemove?: () => Promise<void>
  onAccept?: () => Promise<void>
  onEdit?: (input: MeaningEdit, original: EditValues) => Promise<void>
  parents?: readonly ParentOption[]
}

/** The wording and tags that Edit changes on a flow. */
export type WordingEdit = Pick<MeaningEdit, 'title' | 'description' | 'overview' | 'addTags' | 'removeTags'>

/**
 * The write hooks a group pane gets on the current revision of a live map: Edit, and Remove of the group record.
 * Edit takes the core's own list of what a group can change (`groupFields` in src/group.ts), so the pane cannot
 * offer a field the core would refuse.
 */
export interface GroupWrites {
  onRead: () => void
  onEdit: (input: GroupMeaning, original: EditValues) => Promise<void>
  onRemove?: () => Promise<void>
}

/** The write hooks a flow pane gets on the current revision of a live map: Edit. Its Steps table is edited on the command line. */
export interface FlowWrites {
  onRead: () => void
  onEdit: (input: WordingEdit, original: EditValues) => Promise<void>
}

/** The write hooks a relationship pane gets on the current revision of a live map. */
export interface RelationWrites {
  onRead?: () => void
  onAccept?: () => Promise<void>
  onEdit?: (input: { description?: string; technology?: string }, original: EditValues) => Promise<void>
  onRemove?: () => Promise<void>
}
