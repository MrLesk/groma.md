import { TextAttributes } from '@opentui/core'
import type { OptimizedBuffer } from '@opentui/core'

import type { LineLook } from '../atoms/lines.ts'
import { centred } from '../atoms/text.ts'
import type { ViewerTheme } from '../atoms/theme.ts'
import type { ProjectedMapItem } from '../projection.ts'
import type { ShapeState } from './surface.ts'

/** Components stand square; actors and external systems are rounded like their round and pill buildings. */
export function buildingLook(item: ProjectedMapItem, theme: ViewerTheme, state: ShapeState): LineLook {
  const lit = state.selected || state.accented
  return {
    color: lit ? theme.selected : theme[item.origin],
    attributes: lit ? TextAttributes.BOLD : state.dimmed ? TextAttributes.DIM : 0,
    heavy: state.selected,
    dashed: item.origin !== 'observed',
    rounded: item.kind !== 'component',
    rank: state.selected ? 40 : lit ? 35 : 20,
  }
}

/** The roof name, one or two lines centred in the footprint; evidence belongs in the How pane. */
export function drawBuildingName(buffer: OptimizedBuffer, item: ProjectedMapItem, look: LineLook, theme: ViewerTheme): void {
  const bounds = item.cellBounds
  const lines = item.lines.length > 0 ? item.lines : [item.title]
  const top = bounds.y + 1 + Math.max(0, Math.floor((bounds.height - 2 - lines.length) / 2))
  for (const [index, line] of lines.entries()) {
    centred(buffer, line, bounds.x + 1, top + index, Math.max(0, bounds.width - 2), look.color, theme.background, look.attributes | TextAttributes.BOLD)
  }
}
