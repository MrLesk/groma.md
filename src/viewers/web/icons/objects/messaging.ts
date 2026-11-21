import type { ICON_KINDS } from '../../../../icons.ts'
import { accent, arc, box, circle, cylinder, line, panel, rectangle, rounded, screen, upright } from '../parts.ts'
import type { IconPart, Spot } from '../parts.ts'
import { C, light } from './shared-outlines.ts'

/** One radio wave seen from the front, as x, z pairs: the band between two circles around (x, z), from one angle to another. */
function wave(x: number, z: number, inner: number, outer: number, from: number, to: number): Spot[] {
  return [...arc(x, z, outer, from, to), ...arc(x, z, inner, to, from)]
}

/** A bell seen from the front, as x, z pairs: a dome that flares out to its rim. */
const BELL: Spot[] = [[0.12, 0.12], [0.88, 0.12], [0.76, 0.24], [0.72, 0.5], ...arc(C, 0.5, 0.22, 0, 180), [0.24, 0.24]]

/** A hook seen from the front, as x, z pairs: a shaft that bends round to the left and up to its tip. */
const HOOK: Spot[] = [
  [0.5, 0.73], [0.6, 0.73], [0.6, 0.36], ...arc(0.38, 0.36, 0.22, 0, -180), [0.16, 0.5], [0.26, 0.5],
  [0.26, 0.36], ...arc(0.38, 0.36, 0.12, -180, 0),
]

/** A speech bubble seen from the front, as x, z pairs: a box with a tail to the lower left. */
const BUBBLE: Spot[] = [[0.1, 0.26], [0.28, 0.26], [0.22, 0.06], [0.46, 0.26], [0.9, 0.26], [0.9, 0.82], [0.1, 0.82]]

/** A letter tray seen from the front, as x, z pairs: its front edge dips in the middle. */
const TRAY: Spot[] = [[0.06, 0], [0.94, 0], [0.94, 0.42], [0.68, 0.42], [0.6, 0.3], [0.4, 0.3], [0.32, 0.42], [0.06, 0.42]]
/** An arrow that points down, seen from the front, as x, z pairs. */
const ARROW_DOWN: Spot[] = [[0.44, 0.92], [0.56, 0.92], [0.56, 0.68], [0.68, 0.68], [0.5, 0.5], [0.32, 0.68], [0.44, 0.68]]

/** A megaphone seen from the front, as x, z pairs: a short tube that opens into a horn towards the east. */
const HORN: Spot[] = [[0.08, 0.36], [0.3, 0.36], [0.74, 0.14], [0.74, 0.84], [0.3, 0.62], [0.08, 0.62]]
/** The megaphone's grip seen from the front, as x, z pairs. */
const HORN_GRIP: Spot[] = [[0.2, 0.36], [0.24, 0.1], [0.34, 0.1], [0.32, 0.36]]

/** Messaging: how parts and people are told about things. */
export const messagingIcons: Record<(typeof ICON_KINDS.messaging)[number], readonly IconPart[]> = {
  mail: [
    panel(rounded(0.06, 0, 0.94, 0.62, 0.05), 0.46, 0.08,
      line('south', 0.08, 0.02, 0.38, 0.3), line('south', 0.92, 0.02, 0.62, 0.3),
      accent(line('south', 0.08, 0.6, C, 0.24, 0.92, 0.6))),
  ],
  queue: [
    upright(rounded(0.02, 0.3, 0.98, 0.7, 0.08), 0, 0.06),
    box(0.1, 0.4, 0.06, 0.2, 0.2, 0.2),
    box(0.4, 0.4, 0.06, 0.2, 0.2, 0.2),
    accent(box(0.7, 0.4, 0.06, 0.2, 0.2, 0.2)),
  ],
  stream: [
    upright(rounded(0.3, 0.36, 0.7, 0.64, 0.06), 0, 0.05),
    panel(rectangle(0.47, 0.05, 0.53, 0.55), 0.47, 0.06),
    accent(panel(circle(C, 0.62, 0.07), 0.47, 0.06)),
    panel(wave(C, 0.62, 0.17, 0.22, -40, 40), 0.48, 0.04),
    panel(wave(C, 0.62, 0.17, 0.22, 140, 220), 0.48, 0.04),
    panel(wave(C, 0.62, 0.31, 0.36, -40, 40), 0.48, 0.04),
    panel(wave(C, 0.62, 0.31, 0.36, 140, 220), 0.48, 0.04),
  ],
  notification: [
    panel(BELL, 0.36, 0.28),
    panel(circle(C, 0.06, 0.06), 0.44, 0.12),
    panel(rectangle(0.46, 0.72, 0.54, 0.8), 0.46, 0.08),
    accent(panel(circle(0.76, 0.66, 0.11), 0.64, 0.04)),
  ],
  webhook: [
    upright(rounded(0.08, 0.28, 0.92, 0.72, 0.08), 0, 0.05),
    panel(HOOK, 0.47, 0.06),
    accent(panel(circle(0.55, 0.82, 0.09), 0.47, 0.06, screen('south', circle(0.55, 0.82, 0.04)))),
  ],
  broker: [
    upright(rounded(0.04, 0.1, 0.96, 0.9, 0.1), 0, 0.05,
      line('top', 0.2, 0.26, 0.8, 0.74), line('top', 0.8, 0.26, 0.2, 0.74)),
    accent(cylinder(C, C, 0.13, 0.05, 0.14)),
    cylinder(0.2, 0.26, 0.07, 0.05, 0.08),
    cylinder(0.8, 0.26, 0.07, 0.05, 0.08),
    cylinder(0.2, 0.74, 0.07, 0.05, 0.08),
    cylinder(0.8, 0.74, 0.07, 0.05, 0.08),
  ],
  chat: [
    panel(BUBBLE, 0.42, 0.14,
      accent(light('south', 0.34, 0.54, 0.04)), accent(light('south', C, 0.54, 0.04)), accent(light('south', 0.66, 0.54, 0.04))),
  ],
  inbox: [
    panel(TRAY, 0.3, 0.4),
    accent(panel(ARROW_DOWN, 0.47, 0.06)),
  ],
  broadcast: [
    panel(HORN_GRIP, 0.47, 0.06),
    panel(HORN, 0.44, 0.12),
    accent(panel(wave(0.74, 0.49, 0.1, 0.14, -45, 45), 0.48, 0.04)),
    accent(panel(wave(0.74, 0.49, 0.2, 0.24, -45, 45), 0.48, 0.04)),
  ],
}
