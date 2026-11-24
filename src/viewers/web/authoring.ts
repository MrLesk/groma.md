import type { AnnotatedArchitectureModel } from '../../types.ts'
import { createMapEditor } from './editing/gestures.ts'
import type { WebDataSource } from './data.ts'
import type { IsoMap } from './iso/painting/map.ts'
import type { FlowWrites, GroupWrites, PaneWrites, RelationWrites, SelectionWrites } from './organisms/writes.ts'

export interface AuthoringDependencies {
  /** True on the current revision of a live map, the only place writes are offered. */
  live: () => boolean
  world: () => AnnotatedArchitectureModel
  repaint: () => void
  /** Empties the selection. */
  deselect: () => void
  /** Selects an element as a click on the map would: the camera stays where it is. */
  select: (id: string) => void
  /** Shows the stored world, so that a write sees its own result without waiting for the live update. */
  showStoredWorld: () => Promise<void>
}

/** The write hooks for the pane of an element, relationship, group, flow, or selection of elements. */
export function createAuthoring(host: HTMLElement, map: IsoMap, data: WebDataSource, deps: AuthoringDependencies) {
  const gestures = createMapEditor(host, map, data, () => deps.world().elements, deps.live)
  const { accept, add, edit, remove } = data
  /**
   * Several elements share one edit with no opening values to check. Only components can group or combine.
   * The selection names elements by the ids the map shows, which on the current revision are their stored ids.
   */
  function selectionWrites(ids: readonly string[]): SelectionWrites | undefined {
    if (!deps.live() || edit === undefined) return undefined
    const members = deps.world().elements.filter(element => ids.includes(element.id))
    if (members.length !== ids.length) return undefined
    const [id, ...alsoIds] = ids
    const writes: SelectionWrites = {
      onRead: deps.repaint,
      onEdit: changes => edit({ id, alsoIds, ...changes }),
    }
    if (add !== undefined && members.every(member => member.kind === 'component')) {
      writes.components = {
        // The group's id is not used: the pane returns to the selection of several.
        onGroup: async name => { await add({ thing: 'group', name, members: [...ids] }) },
        onCombine: survivor => edit({ id: survivor, combine: ids.filter(id => id !== survivor) }),
      }
    }
    return writes
  }

  /**
   * Returns an element's pane to reading once a write view closes. After Add component it gets the new
   * component's id and selects it. The map does not have that component when another revision was opened
   * while the write ran: the pane then reads what it shows.
   */
  function readPane(created?: string): void {
    const shown = created !== undefined && deps.live()
      && deps.world().elements.some(element => element.representationId === created)
    if (shown) deps.select(created)
    else deps.repaint()
  }

  /** The hooks of one element's pane. A pane that shows no stored element, such as a placement group, gets none. */
  function paneWrites(selectedId: string | undefined): PaneWrites {
    if (!deps.live() || selectedId === undefined) return {}
    return {
      onRead: readPane,
      ...(add === undefined ? {} : {
        // Resolves to the new component's id once the map shows it, so that the pane can select it.
        onAddComponent: async input => {
          const id = await add({ thing: 'component', parent: selectedId, ...input })
          // The component is stored by now. A failed read must not report the write as failed, or a second
          // press of Add would store it twice. The live update brings the world later.
          await deps.showStoredWorld().catch(() => {})
          return id
        },
      }),
      ...(remove === undefined ? {} : { onRemove: () => remove({ id: selectedId }) }),
      ...(accept === undefined ? {} : { onAccept: () => accept({ id: selectedId }) }),
      ...(edit === undefined ? {} : {
        onEdit: (input, original) => edit({ id: selectedId, ...input, original }),
        parents: deps.world().elements.filter(element => element.kind === 'container')
          .map(element => ({ id: element.id, title: element.title }))
          .sort((left, right) => left.title.localeCompare(right.title) || left.id.localeCompare(right.id)),
      }),
    }
  }

  /** A flow's pane saves its changed wording and tags with one edit of the flow's id. */
  function flowWrites(id: string): FlowWrites | undefined {
    if (!deps.live() || edit === undefined) return undefined
    return { onRead: deps.repaint, onEdit: (changes, original) => edit({ id, ...changes, original }) }
  }

  /** A group's pane saves the same way. Remove deletes the group's document; the next world update empties the selection. */
  function groupWrites(id: string): GroupWrites | undefined {
    if (!deps.live() || edit === undefined) return undefined
    return {
      onRead: deps.repaint,
      onEdit: (changes, original) => edit({ id, ...changes, original }),
      ...(remove === undefined ? {} : { onRemove: () => remove({ id }) }),
    }
  }

  function relationWrites(source: string, target: string): RelationWrites {
    if (!deps.live()) return {}
    return {
      onRead: deps.repaint,
      ...(accept === undefined ? {} : { onAccept: () => accept({ id: source, relation: target }) }),
      ...(edit === undefined ? {} : { onEdit: (input, original) => edit({ id: source, relation: target, ...input, original }) }),
      // A relationship's id is its position among the relationships. Once one is removed that id names
      // another relationship, so the selection is emptied instead of following it.
      ...(remove === undefined ? {} : { onRemove: () => remove({ id: source, relation: target }).then(deps.deselect) }),
    }
  }

  return { paneWrites, relationWrites, groupWrites, flowWrites, selectionWrites, ...gestures }
}
