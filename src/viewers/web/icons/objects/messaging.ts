import type { ICON_KINDS } from '../../../../icons.ts'
import { accent, arc, box, circle, cylinder, line, prism, rectangle, rounded, screen } from '../parts.ts'
import type { IconPart, Spot } from '../parts.ts'
import { C, light } from './shared-outlines.ts'

/** One radio wave seen from above, as x, y pairs: the band between two circles around (x, y), from one angle to another. */
function wave(x: number, y: number, inner: number, outer: number, from: number, to: number): Spot[] {
  return [...arc(x, y, outer, from, to), ...arc(x, y, inner, to, from)]
}

/** A bell seen from above, as x, y pairs: a dome that flares out to its rim. */
const BELL: Spot[] = [[0.12, 0.88], [0.88, 0.88], [0.76, 0.76], [0.72, 0.5], ...arc(C, 0.5, 0.22, 0, -180), [0.24, 0.76]]

/** A hook seen from above, as x, y pairs: a shaft that runs south, bends round to the west and comes north to its tip. */
const HOOK: Spot[] = [
  [0.5, 0.27], [0.6, 0.27], [0.6, 0.64], ...arc(0.38, 0.64, 0.22, 0, 180), [0.16, 0.5], [0.26, 0.5],
  [0.26, 0.64], ...arc(0.38, 0.64, 0.12, 180, 0),
]

/** A speech bubble seen from above, as x, y pairs: a box with a tail to the south-west. */
const BUBBLE: Spot[] = [[0.1, 0.74], [0.28, 0.74], [0.22, 0.94], [0.46, 0.74], [0.9, 0.74], [0.9, 0.18], [0.1, 0.18]]

/** A letter tray seen from above, as x, y pairs: its north edge dips in the middle. */
const TRAY: Spot[] = [[0.06, 1], [0.94, 1], [0.94, 0.58], [0.68, 0.58], [0.6, 0.7], [0.4, 0.7], [0.32, 0.58], [0.06, 0.58]]
/** An arrow that points south, seen from above, as x, y pairs. */
const ARROW_DOWN: Spot[] = [[0.44, 0.08], [0.56, 0.08], [0.56, 0.32], [0.68, 0.32], [0.5, 0.5], [0.32, 0.32], [0.44, 0.32]]

/** A megaphone seen from above, as x, y pairs: a short tube that opens into a horn towards the east. */
const HORN: Spot[] = [[0.08, 0.64], [0.3, 0.64], [0.74, 0.86], [0.74, 0.16], [0.3, 0.38], [0.08, 0.38]]
/** The megaphone's grip seen from above, as x, y pairs. */
const HORN_GRIP: Spot[] = [[0.2, 0.64], [0.24, 0.9], [0.34, 0.9], [0.32, 0.64]]

/** Messaging: how parts and people are told about things. */
export const messagingIcons: Record<(typeof ICON_KINDS.messaging)[number], readonly IconPart[]> = {
  mail: [
    prism(rounded(0.06, 0.38, 0.94, 1, 0.05), 0, 0.08,
      line('top', 0.08, 0.98, 0.38, 0.7), line('top', 0.92, 0.98, 0.62, 0.7),
      accent(line('top', 0.08, 0.4, C, 0.76, 0.92, 0.4))),
  ],
  queue: [
    prism(rounded(0.02, 0.3, 0.98, 0.7, 0.08), 0, 0.06),
    box(0.1, 0.4, 0.06, 0.2, 0.2, 0.2),
    box(0.4, 0.4, 0.06, 0.2, 0.2, 0.2),
    accent(box(0.7, 0.4, 0.06, 0.2, 0.2, 0.2)),
  ],
  stream: [
    prism(rectangle(0.47, 0.45, 0.53, 0.95), 0, 0.05),
    prism(wave(C, 0.38, 0.31, 0.36, -40, 40), 0, 0.05),
    prism(wave(C, 0.38, 0.31, 0.36, 140, 220), 0, 0.05),
    prism(wave(C, 0.38, 0.17, 0.22, -40, 40), 0, 0.05),
    prism(wave(C, 0.38, 0.17, 0.22, 140, 220), 0, 0.05),
    accent(prism(circle(C, 0.38, 0.07), 0, 0.1)),
  ],
  notification: [
    prism(circle(C, 0.94, 0.06), 0, 0.05),
    prism(rectangle(0.46, 0.2, 0.54, 0.28), 0, 0.05),
    prism(BELL, 0, 0.12),
    accent(prism(circle(0.76, 0.34, 0.11), 0, 0.17)),
  ],
  webhook: [
    prism(rounded(0.08, 0.255, 0.92, 0.695, 0.08), 0, 0.05),
    prism(HOOK, 0, 0.1),
    accent(prism(circle(0.55, 0.18, 0.09), 0, 0.1, screen('top', circle(0.55, 0.18, 0.04)))),
  ],
  broker: [
    prism(rounded(0.04, 0.1, 0.96, 0.9, 0.1), 0, 0.05,
      line('top', 0.2, 0.26, 0.8, 0.74), line('top', 0.8, 0.26, 0.2, 0.74)),
    accent(cylinder(C, C, 0.13, 0.05, 0.14)),
    cylinder(0.2, 0.26, 0.07, 0.05, 0.08),
    cylinder(0.8, 0.26, 0.07, 0.05, 0.08),
    cylinder(0.2, 0.74, 0.07, 0.05, 0.08),
    cylinder(0.8, 0.74, 0.07, 0.05, 0.08),
  ],
  chat: [
    prism(BUBBLE, 0, 0.12,
      accent(light('top', 0.34, 0.46, 0.04)), accent(light('top', C, 0.46, 0.04)), accent(light('top', 0.66, 0.46, 0.04))),
  ],
  inbox: [
    prism(TRAY, 0, 0.12),
    accent(prism(ARROW_DOWN, 0, 0.08)),
  ],
  broadcast: [
    prism(HORN_GRIP, 0, 0.05),
    prism(HORN, 0, 0.12),
    accent(prism(wave(0.74, 0.51, 0.1, 0.14, -45, 45), 0, 0.05)),
    accent(prism(wave(0.74, 0.51, 0.2, 0.24, -45, 45), 0, 0.05)),
  ],
}
