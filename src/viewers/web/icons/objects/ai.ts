import type { ICON_KINDS } from '../../../../icons.ts'
import { accent, cylinder, line, prism, rounded } from '../parts.ts'
import type { IconMark, IconPart, Spot } from '../parts.ts'

/** A large four-pointed sparkle seen from above, as x, y pairs. */
const SPARKLE: Spot[] = [[0.44, 0.14], [0.52, 0.46], [0.84, 0.54], [0.52, 0.62], [0.44, 0.94], [0.36, 0.62], [0.04, 0.54], [0.36, 0.46]]
/** A small sparkle beside it, seen from above, as x, y pairs. */
const SPARKLE_SMALL: Spot[] = [[0.8, 0.04], [0.83, 0.17], [0.96, 0.2], [0.83, 0.23], [0.8, 0.36], [0.77, 0.23], [0.64, 0.2], [0.77, 0.17]]

/** The places of a small neural net's nodes seen from above, layer by layer, as x, y pairs. */
const NET: Spot[][] = [[[0.22, 0.36], [0.22, 0.64]], [[0.5, 0.24], [0.5, 0.5], [0.5, 0.76]], [[0.78, 0.36], [0.78, 0.64]]]
/** The net's connections as lines on the plate: every node to every node of the next layer. */
const NET_LINES: IconMark[] = NET.slice(1).flatMap((layer, index) =>
  layer.flatMap(([x, y]) => NET[index]!.map(([px, py]) => line('top', px, py, x, y))))

/** AI: models and what they add to a product. */
export const aiIcons: Record<(typeof ICON_KINDS.ai)[number], readonly IconPart[]> = {
  model: [
    prism(rounded(0.04, 0.1, 0.96, 0.9, 0.1), 0, 0.05, ...NET_LINES),
    cylinder(0.22, 0.36, 0.06, 0.05, 0.08),
    cylinder(0.22, 0.64, 0.06, 0.05, 0.08),
    cylinder(0.5, 0.24, 0.06, 0.05, 0.08),
    accent(cylinder(0.5, 0.5, 0.07, 0.05, 0.12)),
    cylinder(0.5, 0.76, 0.06, 0.05, 0.08),
    cylinder(0.78, 0.36, 0.06, 0.05, 0.08),
    cylinder(0.78, 0.64, 0.06, 0.05, 0.08),
  ],
  ai: [
    accent(prism(SPARKLE, 0, 0.08)),
    prism(SPARKLE_SMALL, 0, 0.08),
  ],
}
