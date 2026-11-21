import type { ICON_KINDS } from '../../../../icons.ts'
import { accent, ball, box, circle, cylinder, frame, prism, rectangle, rounded, screen } from '../parts.ts'
import type { IconPart, Spot } from '../parts.ts'
import { C } from './shared-outlines.ts'

/** A flag seen from above, as x, y pairs: a banner with a notch in its fly. */
const BANNER: Spot[] = [[0.25, 0.44], [0.86, 0.44], [0.72, 0.27], [0.86, 0.1], [0.25, 0.1]]

/** A lightning bolt seen from above, as x, y pairs. */
const BOLT_UP: Spot[] = [[0.6, 0.08], [0.26, 0.56], [0.46, 0.56], [0.36, 0.96], [0.76, 0.44], [0.54, 0.44]]

/** A star with five points seen from above, as x, y pairs: its points alternate between an outer and an inner circle, the first one to the north. */
const STAR: Spot[] = Array.from({ length: 10 }, (_, step): Spot => {
  const angle = (90 + step * 36) * Math.PI / 180
  const radius = step % 2 === 0 ? 0.44 : 0.18
  return [C + radius * Math.cos(angle), 0.5 - radius * Math.sin(angle)]
})

/** The side of one tile of the grid and the places where a row or a column of tiles starts. */
const TILE = 0.24
const TILE_STARTS = [0.08, 0.38, 0.68]

/** Shapes: for parts that are an idea more than a thing. */
export const shapesIcons: Record<(typeof ICON_KINDS.shapes)[number], readonly IconPart[]> = {
  layers: [
    prism(rounded(0.16, 0.2, 0.96, 0.94, 0.1), 0, 0.06),
    prism(rounded(0.1, 0.13, 0.9, 0.87, 0.1), 0.15, 0.06),
    accent(prism(rounded(0.04, 0.06, 0.84, 0.8, 0.1), 0.3, 0.06)),
  ],
  grid: [
    prism(rounded(0.02, 0.02, 0.98, 0.98, 0.08), 0, 0.04),
    ...TILE_STARTS.flatMap(y => TILE_STARTS.map(x =>
      x === 0.38 && y === 0.38 ? accent(box(x, y, 0.04, TILE, TILE, 0.16)) : box(x, y, 0.04, TILE, TILE, 0.08))),
  ],
  cube: [
    prism(rounded(0.06, 0.06, 0.94, 0.94, 0.1), 0, 0.04),
    accent(box(0.22, 0.22, 0.04, 0.56, 0.56, 0.56, frame('top', rectangle(0.36, 0.36, 0.64, 0.64)))),
  ],
  star: [
    accent(prism(STAR, 0, 0.08)),
  ],
  flag: [
    prism(rectangle(0.2, 0.08, 0.25, 1), 0, 0.08),
    accent(prism(BANNER, 0, 0.08)),
  ],
  trigger: [
    accent(prism(BOLT_UP, 0, 0.08)),
  ],
  core: [
    cylinder(C, C, 0.44, 0, 0.08, screen('top', circle(C, C, 0.3))),
    accent(ball(C, C, 0.34, 0.2)),
  ],
}
