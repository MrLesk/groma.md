import type { ICON_KINDS } from '../../../../icons.ts'
import { accent, arc, block, circle, cylinder, frame, line, panel, rectangle, rounded, screen, upright } from '../parts.ts'
import type { IconPart, Spot } from '../parts.ts'
import { C, light, ellipse } from './shared-outlines.ts'

/** A map pin seen from the front, as x, z pairs: a round head that narrows to a point. */
const PIN: Spot[] = [...arc(C, 0.6, 0.26, -30, 210), [0.5, 0.04]]

/** A microphone's cradle seen from the front, as x, z pairs: the lower half of a ring around the capsule. */
const CRADLE: Spot[] = [...arc(C, 0.5, 0.25, 180, 360), ...arc(C, 0.5, 0.2, 360, 180)]

/** A folded map seen from above, as x, y pairs: three leaves in a zigzag. */
const MAP_SHEET: Spot[] = [[0.06, 0.24], [0.35, 0.16], [0.65, 0.24], [0.94, 0.16], [0.94, 0.76], [0.65, 0.84], [0.35, 0.76], [0.06, 0.84]]

/** A house seen from the front, as x, z pairs: walls under a pitched roof with eaves. */
const HOUSE: Spot[] = [[0.14, 0], [0.86, 0], [0.86, 0.46], [0.96, 0.46], [0.5, 0.88], [0.04, 0.46], [0.14, 0.46]]

/** A capital T with serifs seen from the front, as x, z pairs. */
const LETTER_T: Spot[] = [
  [0.14, 0.82], [0.86, 0.82], [0.86, 0.62], [0.78, 0.62], [0.78, 0.7], [0.58, 0.7], [0.58, 0.12], [0.68, 0.12],
  [0.68, 0.02], [0.32, 0.02], [0.32, 0.12], [0.42, 0.12], [0.42, 0.7], [0.22, 0.7], [0.22, 0.62], [0.14, 0.62],
]

/** Media and places: pictures, video, sound, maps. */
export const mediaIcons: Record<(typeof ICON_KINDS.media)[number], readonly IconPart[]> = {
  image: [
    panel(rounded(0.08, 0, 0.92, 0.72, 0.05), 0.45, 0.07,
      frame('south', rectangle(0.16, 0.08, 0.84, 0.64)),
      accent(line('south', 0.16, 0.2, 0.4, 0.46, 0.54, 0.32, 0.66, 0.44, 0.84, 0.22)),
      accent(light('south', 0.7, 0.53, 0.05))),
  ],
  video: [
    panel(rectangle(0.1, 0, 0.9, 0.56), 0.45, 0.08, accent(block('south', [[0.42, 0.14], [0.42, 0.42], [0.64, 0.28]]))),
    panel(rectangle(0.1, 0.6, 0.9, 0.74), 0.45, 0.08,
      line('south', 0.24, 0.6, 0.32, 0.74), line('south', 0.42, 0.6, 0.5, 0.74), line('south', 0.6, 0.6, 0.68, 0.74),
      line('south', 0.78, 0.6, 0.86, 0.74)),
  ],
  play: [
    cylinder(C, C, 0.44, 0, 0.08),
    cylinder(C, C, 0.38, 0.08, 0.16, accent(block('top', [[0.42, 0.34], [0.42, 0.66], [0.68, 0.5]]))),
  ],
  location: [
    upright(ellipse(C, C, 0.22, 0.11), 0, 0.03),
    panel(PIN, 0.45, 0.1, accent(screen('south', circle(C, 0.6, 0.1)))),
  ],
  audio: [
    upright(rounded(0.3, 0.38, 0.7, 0.62, 0.05), 0, 0.05),
    panel(rectangle(0.47, 0.05, 0.53, 0.25), 0.47, 0.06),
    panel(CRADLE, 0.47, 0.06),
    accent(panel(rounded(0.38, 0.4, 0.62, 0.9, 0.12), 0.44, 0.12, line('south', 0.42, 0.72, 0.58, 0.72), line('south', 0.42, 0.62, 0.58, 0.62))),
  ],
  translate: [
    panel(rounded(0.06, 0.3, 0.6, 0.86, 0.06), 0.42, 0.05,
      line('south', 0.22, 0.42, 0.33, 0.72, 0.44, 0.42), line('south', 0.26, 0.52, 0.4, 0.52)),
    accent(panel(rounded(0.4, 0.02, 0.94, 0.56, 0.06), 0.52, 0.05,
      line('south', 0.52, 0.44, 0.82, 0.44), line('south', 0.67, 0.5, 0.67, 0.44), line('south', 0.56, 0.36, 0.78, 0.14),
      line('south', 0.78, 0.36, 0.56, 0.14))),
  ],
  map: [
    upright(MAP_SHEET, 0, 0.08,
      line('top', 0.35, 0.16, 0.35, 0.76), line('top', 0.65, 0.24, 0.65, 0.84),
      accent(line('top', 0.16, 0.66, 0.3, 0.46, 0.5, 0.56, 0.78, 0.34)), accent(light('top', 0.78, 0.34, 0.045))),
  ],
  home: [
    panel(HOUSE, 0.34, 0.32,
      accent(screen('south', rectangle(0.42, 0, 0.58, 0.3))), frame('south', rectangle(0.64, 0.2, 0.78, 0.34))),
  ],
  text: [
    accent(panel(LETTER_T, 0.46, 0.08)),
  ],
  motion: [
    panel(rectangle(0.06, 0.64, 0.38, 0.7), 0.47, 0.04),
    panel(rectangle(0.02, 0.43, 0.4, 0.49), 0.47, 0.04),
    panel(rectangle(0.1, 0.22, 0.38, 0.28), 0.47, 0.04),
    accent(panel(circle(0.7, 0.46, 0.25), 0.44, 0.1)),
  ],
}
