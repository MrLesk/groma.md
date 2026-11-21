import type { ICON_KINDS } from '../../../../icons.ts'
import { accent, arc, circle, frame, line, prism, rectangle, rounded, screen } from '../parts.ts'
import type { IconPart, Spot } from '../parts.ts'
import { C, light } from './shared-outlines.ts'

/** A padlock's shackle seen from above, as x, y pairs: an arch on two legs. */
const SHACKLE: Spot[] = [
  [0.28, 0.54], ...arc(C, 0.34, 0.22, -180, 0), [0.72, 0.54],
  [0.61, 0.54], ...arc(C, 0.34, 0.11, 0, -180), [0.39, 0.54],
]

/** A key's shaft seen from above, as x, y pairs: its tip is to the south and its two teeth to the east. */
const SHAFT: Spot[] = [
  [0.46, 1], [0.54, 1], [0.54, 0.94], [0.68, 0.94], [0.68, 0.87], [0.54, 0.87], [0.54, 0.8], [0.64, 0.8], [0.64, 0.73],
  [0.54, 0.73], [0.54, 0.5], [0.46, 0.5],
]

/** A shield seen from above, as x, y pairs: flat to the north, drawn in to a point to the south. */
const SHIELD: Spot[] = [[0.14, 0.14], [0.14, 0.54], [0.18, 0.72], [0.32, 0.88], [0.5, 0.98], [0.68, 0.88], [0.82, 0.72], [0.86, 0.54], [0.86, 0.14]]

/** One ridge of a fingerprint seen from above, as x, y pairs for a line: an arch of radius `r` on two legs. */
function ridge(r: number): number[] {
  return [C - r, 0.76, ...arc(C, 0.52, r, 180, 360).flat(), C + r, 0.76]
}

/** Security and identity. */
export const securityIcons: Record<(typeof ICON_KINDS.security)[number], readonly IconPart[]> = {
  lock: [
    accent(prism(SHACKLE, 0, 0.06)),
    prism(rounded(0.2, 0.54, 0.8, 1, 0.08), 0, 0.12,
      light('top', C, 0.73, 0.05), line('top', C, 0.78, C, 0.88)),
  ],
  key: [
    prism(SHAFT, 0, 0.05),
    accent(prism(circle(C, 0.3, 0.2), 0, 0.08, screen('top', circle(C, 0.26, 0.08)))),
  ],
  identity: [
    prism(rounded(0.12, 0.26, 0.88, 1, 0.07), 0, 0.08,
      line('top', 0.42, 0.34, 0.58, 0.34),
      accent(screen('top', circle(0.34, 0.56, 0.1))),
      accent(line('top', ...arc(0.34, 0.84, 0.15, 0, -180).flat())),
      line('top', 0.56, 0.5, 0.78, 0.5), line('top', 0.56, 0.62, 0.78, 0.62), line('top', 0.56, 0.74, 0.7, 0.74)),
  ],
  certificate: [
    prism(rounded(0.14, 0.2, 0.86, 1, 0.05), 0, 0.08,
      line('top', 0.26, 0.36, 0.74, 0.36), line('top', 0.26, 0.48, 0.74, 0.48), line('top', 0.26, 0.6, 0.5, 0.6)),
    accent(prism(circle(0.62, 0.78, 0.14), 0.08, 0.05, frame('top', circle(0.62, 0.78, 0.07)))),
  ],
  shield: [
    prism(SHIELD, 0, 0.12, accent(line('top', 0.32, 0.5, 0.45, 0.64, 0.7, 0.34))),
  ],
  fingerprint: [
    prism(rounded(0.14, 0.08, 0.86, 0.92, 0.2), 0, 0.08,
      accent(line('top', ...ridge(0.08))), accent(line('top', ...ridge(0.17))), accent(line('top', ...ridge(0.26)))),
  ],
  vault: [
    prism(rounded(0.1, 0.14, 0.9, 0.94, 0.06), 0, 0.12,
      frame('top', rounded(0.18, 0.22, 0.82, 0.86, 0.04)),
      accent(screen('top', circle(C, 0.54, 0.16))), accent(line('top', C, 0.7, C, 0.38)),
      accent(line('top', 0.34, 0.54, 0.66, 0.54)),
      line('top', 0.24, 0.32, 0.24, 0.42), line('top', 0.24, 0.66, 0.24, 0.76)),
  ],
  policy: [
    prism(rounded(0.32, 0.9, 0.68, 0.98, 0.03), 0, 0.05),
    prism(rectangle(0.47, 0.28, 0.53, 0.92), 0, 0.05),
    prism(rectangle(0.2, 0.28, 0.24, 0.6), 0, 0.05),
    prism(rectangle(0.76, 0.28, 0.8, 0.6), 0, 0.05),
    prism(rectangle(0.14, 0.22, 0.86, 0.28), 0, 0.08),
    prism(arc(0.22, 0.6, 0.15, -180, -360), 0, 0.08),
    accent(prism(arc(0.78, 0.6, 0.15, -180, -360), 0, 0.08)),
  ],
}
