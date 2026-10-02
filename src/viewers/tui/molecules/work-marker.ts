import { TextAttributes } from '@opentui/core'
import type { OptimizedBuffer } from '@opentui/core'

import { text } from '../atoms/text.ts'
import type { ViewerTheme } from '../atoms/theme.ts'
import type { ProjectedMapItem } from '../projection.ts'
import type { WorkCorner } from '../work/model.ts'

/**
 * The corner of a touched shape: its current task and +N for the other shown tasks, future drafts marked with a
 * diamond in quiet text, in-progress work in the accent, done work dim, and the selected task bold. The marker sits
 * at the right of the top border, which no name uses; a box too narrow for it shows none.
 */
export function drawWorkCorner(buffer: OptimizedBuffer, item: ProjectedMapItem, corner: WorkCorner, theme: ViewerTheme): void {
  const label = corner.others > 0 ? `${corner.taskId} +${corner.others}` : corner.taskId
  const display = corner.stage === 'todo' ? `◇ ${label}` : label
  const bounds = item.cellBounds
  const color = corner.stage === 'progress' ? theme.selected : corner.stage === 'todo' ? theme.quiet : theme.foreground
  const attributes = (corner.selected ? TextAttributes.BOLD : 0)
    | (corner.stage === 'done' || corner.stage === 'todo' ? TextAttributes.DIM : 0)
  const width = display.length + 2
  const x = bounds.x + bounds.width - 1 - width
  if (x < bounds.x + 1) return
  text(buffer, ` ${display} `, x, bounds.y, width, color, theme.background, attributes)
}
