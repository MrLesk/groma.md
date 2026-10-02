import { TextAttributes } from '@opentui/core'
import type { OptimizedBuffer } from '@opentui/core'

import type { LineLook } from '../atoms/lines.ts'
import { centred, text } from '../atoms/text.ts'
import type { ViewerTheme } from '../atoms/theme.ts'
import type { ProjectedMapItem } from '../projection.ts'

/** How lit a shape is: selected or a lit end draws in the accent, off a lit flow it recedes. */
export interface ShapeState {
  accented: boolean
  selected: boolean
  dimmed: boolean
}

/** Which frame owns a cell two frames share: containers over islands over groups; anything lit over all three. */
const RANK = { slab: 12, island: 11, group: 10, card: 20 } as const

/** Islands and zones stay quiet, containers carry the foreground; the selection draws heavy in the accent. */
export function surfaceLook(item: ProjectedMapItem, theme: ViewerTheme, state: ShapeState): LineLook {
  const lit = state.selected || state.accented
  const resting = item.shape === 'slab' ? theme[item.origin] : theme.quiet
  const receding = state.dimmed || item.shape === 'group'
  return {
    color: lit ? theme.selected : resting,
    attributes: lit ? TextAttributes.BOLD : receding ? TextAttributes.DIM : 0,
    heavy: state.selected,
    dashed: item.origin !== 'observed',
    rounded: item.shape !== 'group',
    rank: state.selected ? 30 : lit ? 25 : RANK[item.shape],
  }
}

/** The free stretch of a frame row nearest its middle that no route crosses. */
function freeSpan(y: number, left: number, right: number, width: number, crossings: (x: number, y: number) => boolean): number | undefined {
  const centre = Math.floor((left + right - width) / 2)
  const clear = (start: number) => start >= left && start + width <= right
    && Array.from({ length: width }, (_, offset) => crossings(start + offset, y)).every(crossed => !crossed)
  const starts = Array.from({ length: right - left + 1 }, (_, shift) => [centre - shift, centre + shift]).flat()
  return starts.find(clear)
}

/** An open surface writes its name into its front edge, as the web plan does below its boundary. */
export function drawSurfaceName(
  buffer: OptimizedBuffer,
  item: ProjectedMapItem,
  look: LineLook,
  theme: ViewerTheme,
  crossings: (x: number, y: number) => boolean,
): void {
  if (item.collapsed) {
    drawCollapsed(buffer, item, look, theme)
    return
  }
  const bounds = item.cellBounds
  const name = ` ${item.title} `
  const width = [...name].length
  const y = bounds.y + bounds.height - 1
  // Names always show; one that no free stretch fits covers the crossing instead.
  const start = freeSpan(y, bounds.x + 2, bounds.x + bounds.width - 2, width, crossings)
    ?? bounds.x + Math.floor((bounds.width - width) / 2)
  const attributes = item.shape === 'group' ? look.attributes : look.attributes | TextAttributes.BOLD
  const color = item.shape === 'group' || look.color === theme.selected ? look.color : theme[item.origin]
  text(buffer, name, start, y, width, color, theme.background, attributes)
}

/** A collapsed container or group: its name over its count, like a building that stands for its contents. */
function drawCollapsed(buffer: OptimizedBuffer, item: ProjectedMapItem, look: LineLook, theme: ViewerTheme): void {
  const bounds = item.cellBounds
  if (bounds.height < 4 || bounds.width < 5) return
  const top = bounds.y + Math.floor((bounds.height - 2) / 2)
  const lit = look.color === theme.selected
  const name = lit ? theme.selected : item.shape === 'group' ? theme.foreground : theme[item.origin]
  centred(buffer, item.title, bounds.x + 2, top, bounds.width - 4, name, theme.background, item.shape === 'group' ? 0 : TextAttributes.BOLD)
  centred(buffer, item.note ?? '', bounds.x + 2, top + 1, bounds.width - 4, theme.quiet, theme.background)
}
