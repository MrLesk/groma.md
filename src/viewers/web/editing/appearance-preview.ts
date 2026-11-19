import { isColorName } from '../../../colors.ts'
import type { SheetItem, SheetScene } from '../../../sheet/types.ts'
import { EDIT_SAVED, pendingEdit } from '../organisms/editable.ts'

/** The color one element is shown with before it is saved. An empty name shows none. */
export interface PickedAppearance {
  id: string
  color: string
}

/** The sheet with one element's color replaced by the picked one. Every other item stays as saved. */
export function withAppearance(sheet: SheetScene, picked: PickedAppearance): SheetScene {
  function shown<Item extends SheetItem>(item: Item): Item {
    if (item.id !== picked.id) return item
    const { color: _savedColor, ...rest } = item
    return { ...rest, ...(isColorName(picked.color) ? { color: picked.color } : {}) } as Item
  }
  return {
    ...sheet,
    islands: sheet.islands.map(island => island.element === null ? island : { ...island, element: shown(island.element) }),
    slabs: sheet.slabs.map(shown),
    buildings: sheet.buildings.map(shown),
  }
}

/** True when the sheet already shows that element with that color, or does not show it at all. */
function carries(sheet: SheetScene, appearance: PickedAppearance): boolean {
  const items: SheetItem[] = [...sheet.islands.flatMap(island => island.element ?? []), ...sheet.slabs, ...sheet.buildings]
  const item = items.find(candidate => candidate.id === appearance.id)
  return item === undefined || (item.color ?? '') === appearance.color
}

/**
 * Shows on the map the color picked in the open Edit form, before Save stores it. What the form holds is
 * what the map shows; a closed form shows the saved color again. Nothing is stored.
 */
export function createAppearancePreview(detailsHost: HTMLElement, repaintMap: () => void) {
  /** The appearance the map last painted, as text, so the map repaints only when it changes. */
  let painted = 'null'
  /** What Save just stored. It stays on the map until the saved map arrives, so the element does not flash back. */
  let saved: PickedAppearance | undefined
  function picked(): PickedAppearance | undefined {
    const edit = pendingEdit(detailsHost)
    if (edit === undefined || edit.values.color === undefined) return undefined
    return { id: edit.key, color: edit.values.color }
  }
  /** Repaints the map when the shown appearance changed: after a pick, and after the form closed. */
  function sync(): void {
    const next = JSON.stringify(picked() ?? saved ?? null)
    if (next === painted) return
    painted = next
    repaintMap()
  }
  detailsHost.addEventListener('input', sync)
  detailsHost.addEventListener(EDIT_SAVED, () => { saved = picked() })
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
