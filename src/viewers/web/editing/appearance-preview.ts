import { isColorName } from '../../../colors.ts'
import type { SheetItem, SheetScene } from '../../../sheet/types.ts'
import { pendingEdit } from '../organisms/editable.ts'

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

/**
 * Shows on the map the color picked in the open Edit form, before Save stores it. What the form holds is
 * what the map shows; a closed form shows the saved color again. Nothing is stored.
 */
export function createAppearancePreview(detailsHost: HTMLElement, repaintMap: () => void) {
  /** The picked appearance the map last painted, as text, so the map repaints only when it changes. */
  let painted = 'null'
  function picked(): PickedAppearance | undefined {
    const edit = pendingEdit(detailsHost)
    if (edit === undefined || edit.values.color === undefined) return undefined
    return { id: edit.key, color: edit.values.color }
  }
  /** Repaints the map when the picked appearance changed: after a pick, and after the form closed. */
  function sync(): void {
    const next = JSON.stringify(picked() ?? null)
    if (next === painted) return
    painted = next
    repaintMap()
  }
  detailsHost.addEventListener('input', sync)
  return {
    sync,
    /** The sheet as the open Edit form would make it look. */
    show(sheet: SheetScene): SheetScene {
      const appearance = picked()
      return appearance === undefined ? sheet : withAppearance(sheet, appearance)
    },
  }
}
