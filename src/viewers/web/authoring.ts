import type { AnnotatedArchitectureModel } from '../../types.ts'
import { createMapEditor } from './editing/gestures.ts'
import type { WebDataSource } from './data.ts'
import type { IsoMap } from './iso/painting/map.ts'
import type { PaneWrites, RelationWrites, SelectionWrites } from './organisms/writes.ts'

export interface AuthoringDependencies {
  /** True on the current revision of a live map, the only place writes are offered. */
  live: () => boolean
  world: () => AnnotatedArchitectureModel
  repaint: () => void
}

/** The write hooks of the three architecture panes: an element, a relationship, several selected components. */
export function createAuthoring(host: HTMLElement, map: IsoMap, data: WebDataSource, deps: AuthoringDependencies) {
  const gestures = createMapEditor(host, map, data, () => deps.world().elements, deps.live)
  const { accept, add, edit, remove } = data
  /** Group and Combine, while every selected element is a component on the current revision of a live map. */
  function selectionWrites(ids: readonly string[]): SelectionWrites | undefined {
    if (!deps.live() || add === undefined || edit === undefined) return undefined
    const members = ids.flatMap(id => deps.world().elements.filter(element => element.id === id && element.kind === 'component'))
    if (members.length !== ids.length) return undefined
    return {
      onRead: deps.repaint,
      members: members.map(({ id, title }) => ({ id, title })),
      onGroup: name => add({ thing: 'group', name, members: [...ids] }),
      onCombine: survivor => edit({ id: survivor, combine: ids.filter(id => id !== survivor) }),
    }
  }

  /** The hooks of one element's pane. A pane that shows no stored element, such as a placement group, gets none. */
  function paneWrites(selectedId: string | undefined): PaneWrites {
    if (!deps.live() || selectedId === undefined) return {}
    return {
      onRead: deps.repaint,
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

  function relationWrites(source: string, target: string): RelationWrites {
    if (!deps.live()) return {}
    return {
      onRead: deps.repaint,
      ...(accept === undefined ? {} : { onAccept: () => accept({ id: source, relation: target }) }),
      ...(edit === undefined ? {} : { onEdit: (input, original) => edit({ id: source, relation: target, ...input, original }) }),
      ...(remove === undefined ? {} : { onRemove: () => remove({ id: source, relation: target }) }),
    }
  }

  return { paneWrites, relationWrites, selectionWrites, ...gestures }
}
