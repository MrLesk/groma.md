import { isColorName } from '../../../colors.ts'
import { isIconName } from '../../../icons.ts'
import type { SheetItem, SheetScene } from '../../../sheet/types.ts'
import { WRITE_STORED, pendingValues } from '../organisms/write-view.ts'

/** Color and icon picks for the selected representation ids. An empty name clears that choice. */
export interface PickedAppearance {
  ids: readonly string[]
  color?: string
  icon?: string
}

/** Show each pick on every edited element. Fields without a pick keep each element's saved value. */
export function withAppearance(sheet: SheetScene, picked: PickedAppearance): SheetScene {
  const selected = new Set(picked.ids)
  function shown<Item extends SheetItem>(item: Item): Item {
    if (!selected.has(item.representationId)) return item
    const preview = { ...item }
    if (picked.color !== undefined) preview.color = isColorName(picked.color) ? picked.color : undefined
    if (picked.icon !== undefined) preview.icon = isIconName(picked.icon) ? picked.icon : undefined
    return preview
  }
  return {
    ...sheet,
    islands: sheet.islands.map(island => island.element === null ? island : { ...island, element: shown(island.element) }),
    slabs: sheet.slabs.map(shown),
    buildings: sheet.buildings.map(shown),
  }
}

/** The saved map has caught up when every edited element it shows carries each pick. */
function carries(sheet: SheetScene, appearance: PickedAppearance): boolean {
  const selected = new Set(appearance.ids)
  const items: SheetItem[] = [...sheet.islands.flatMap(island => island.element ?? []), ...sheet.slabs, ...sheet.buildings]
  return items.every(item => {
    if (!selected.has(item.representationId)) return true
    if (appearance.color !== undefined && (item.color ?? '') !== appearance.color) return false
    return appearance.icon === undefined || (item.icon ?? '') === appearance.icon
  })
}

/**
 * Shows on the map the color and icon picked in the open Edit form, before Save stores them. What the form
 * holds is what the map shows; a closed form shows the saved ones again. Nothing is stored. The map lays
 * itself out for an icon only once it is saved, so a previewed icon stands in the room the element has now.
 * The form names no elements: a form of the details pane with a Color or Icon field edits the selected
 * elements, and a change of the selection closes it, so `selectedIds` says which elements to paint.
 */
export function createAppearancePreview(detailsHost: HTMLElement, selectedIds: () => readonly string[], repaintMap: () => void) {
  /** The appearance the map last painted, as text, so the map repaints only when it changes. */
  let painted = 'null'
  /** What Save just stored. It stays on the map until the saved map arrives, so the element does not flash back. */
  let saved: PickedAppearance | undefined
  function picked(): PickedAppearance | undefined {
    const values = pendingValues(detailsHost)
    if (values === undefined) return undefined
    const { color, icon } = values
    if (color === undefined && icon === undefined) return undefined
    return { ids: selectedIds(), color, icon }
  }
  /** Repaints the map when the shown appearance changed: after a pick, and after the form closed. */
  function sync(): void {
    const next = JSON.stringify(picked() ?? saved ?? null)
    if (next === painted) return
    painted = next
    repaintMap()
  }
  detailsHost.addEventListener('input', sync)
  detailsHost.addEventListener(WRITE_STORED, () => { saved = picked() })
  return {
    sync,
    /** The sheet as the open Edit form would make it look, or as the Save that just ran left it. */
    show(sheet: SheetScene): SheetScene {
      if (saved !== undefined && carries(sheet, saved)) saved = undefined
      const appearance = picked() ?? saved
      return appearance === undefined ? sheet : withAppearance(sheet, appearance)
    },
  }
}
