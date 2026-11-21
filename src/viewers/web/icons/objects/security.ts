import type { ICON_KINDS } from '../../../../icons.ts'
import { accent, arc, box, circle, frame, line, panel, rectangle, rounded, screen, upright } from '../parts.ts'
import type { IconPart, Spot } from '../parts.ts'
import { C, light } from './shared-outlines.ts'

/** A padlock's shackle seen from the front, as x, z pairs: an arch on two legs. */
const SHACKLE: Spot[] = [
  [0.28, 0.46], ...arc(C, 0.66, 0.22, 180, 0), [0.72, 0.46],
  [0.61, 0.46], ...arc(C, 0.66, 0.11, 0, 180), [0.39, 0.46],
]

/** A key's shaft seen from the front, as x, z pairs: it stands on its tip and has two teeth to the right. */
const SHAFT: Spot[] = [
  [0.46, 0], [0.54, 0], [0.54, 0.06], [0.68, 0.06], [0.68, 0.13], [0.54, 0.13], [0.54, 0.2], [0.64, 0.2], [0.64, 0.27],
  [0.54, 0.27], [0.54, 0.5], [0.46, 0.5],
]

/** A shield seen from the front, as x, z pairs: flat on top, drawn in to a point below. */
const SHIELD: Spot[] = [[0.14, 0.86], [0.14, 0.46], [0.18, 0.28], [0.32, 0.12], [0.5, 0.02], [0.68, 0.12], [0.82, 0.28], [0.86, 0.46], [0.86, 0.86]]

/** One ridge of a fingerprint seen from above, as x, y pairs for a line: an arch of radius `r` on two legs. */
function ridge(r: number): number[] {
  return [C - r, 0.76, ...arc(C, 0.52, r, 180, 360).flat(), C + r, 0.76]
}

/** Security and identity. */
export const securityIcons: Record<(typeof ICON_KINDS.security)[number], readonly IconPart[]> = {
  lock: [
    panel(rounded(0.2, 0, 0.8, 0.46, 0.08), 0.36, 0.28,
      light('south', C, 0.27, 0.05), line('south', C, 0.22, C, 0.12)),
    accent(panel(SHACKLE, 0.45, 0.1)),
  ],
  key: [
    panel(SHAFT, 0.47, 0.06),
    accent(panel(circle(C, 0.7, 0.2), 0.47, 0.06, screen('south', circle(C, 0.74, 0.08)))),
  ],
  identity: [
    panel(rounded(0.12, 0, 0.88, 0.74, 0.07), 0.46, 0.07,
      line('south', 0.42, 0.66, 0.58, 0.66),
      accent(screen('south', circle(0.34, 0.44, 0.1))),
      accent(line('south', ...arc(0.34, 0.16, 0.15, 0, 180).flat())),
      line('south', 0.56, 0.5, 0.78, 0.5), line('south', 0.56, 0.38, 0.78, 0.38), line('south', 0.56, 0.26, 0.7, 0.26)),
  ],
  certificate: [
    panel(rounded(0.14, 0, 0.86, 0.8, 0.05), 0.45, 0.04,
      line('south', 0.26, 0.64, 0.74, 0.64), line('south', 0.26, 0.52, 0.74, 0.52), line('south', 0.26, 0.4, 0.5, 0.4)),
    accent(panel(circle(0.62, 0.22, 0.14), 0.49, 0.05, frame('south', circle(0.62, 0.22, 0.07)))),
  ],
  shield: [
    panel(SHIELD, 0.44, 0.12, accent(line('south', 0.32, 0.5, 0.45, 0.36, 0.7, 0.66))),
  ],
  fingerprint: [
    upright(rounded(0.14, 0.08, 0.86, 0.92, 0.2), 0, 0.08,
      accent(line('top', ...ridge(0.08))), accent(line('top', ...ridge(0.17))), accent(line('top', ...ridge(0.26)))),
  ],
  vault: [
    box(0.16, 0.34, 0, 0.12, 0.32, 0.06),
    box(0.72, 0.34, 0, 0.12, 0.32, 0.06),
    panel(rounded(0.1, 0.06, 0.9, 0.86, 0.06), 0.3, 0.4,
      frame('south', rounded(0.18, 0.14, 0.82, 0.78, 0.04)),
      accent(screen('south', circle(C, 0.46, 0.16))), accent(line('south', C, 0.3, C, 0.62)),
      accent(line('south', 0.34, 0.46, 0.66, 0.46)),
      line('south', 0.24, 0.68, 0.24, 0.58), line('south', 0.24, 0.34, 0.24, 0.24)),
  ],
  policy: [
    upright(rounded(0.3, 0.38, 0.7, 0.62, 0.05), 0, 0.05),
    panel(rectangle(0.47, 0.05, 0.53, 0.72), 0.47, 0.06),
    panel(rectangle(0.14, 0.72, 0.86, 0.78), 0.47, 0.06),
    panel(rectangle(0.2, 0.4, 0.24, 0.72), 0.48, 0.04),
    panel(rectangle(0.76, 0.4, 0.8, 0.72), 0.48, 0.04),
    panel(arc(0.22, 0.4, 0.15, 180, 360), 0.46, 0.08),
    accent(panel(arc(0.78, 0.4, 0.15, 180, 360), 0.46, 0.08)),
  ],
}
