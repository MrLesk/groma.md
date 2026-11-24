import type { ICON_KINDS } from '../../../../icons.ts'
import { accent, arc, block, circle, cylinder, frame, line, prism, rectangle, rounded, screen } from '../parts.ts'
import type { IconPart, Spot } from '../parts.ts'
import { C, light } from './shared-outlines.ts'

/** A map pin seen from above, as x, y pairs: a round head that narrows to a point to the south. */
const PIN: Spot[] = [...arc(C, 0.4, 0.26, 30, -210), [0.5, 0.96]]

/** A microphone's cradle seen from above, as x, y pairs: the south half of a ring around the capsule. */
const CRADLE: Spot[] = [...arc(C, 0.5, 0.25, -180, -360), ...arc(C, 0.5, 0.2, -360, -180)]

/** A folded map seen from above, as x, y pairs: three leaves in a zigzag. */
const MAP_SHEET: Spot[] = [[0.06, 0.24], [0.35, 0.16], [0.65, 0.24], [0.94, 0.16], [0.94, 0.76], [0.65, 0.84], [0.35, 0.76], [0.06, 0.84]]

/** A house seen from above, as x, y pairs: walls south of a pitched roof with eaves. */
const HOUSE: Spot[] = [[0.14, 1], [0.86, 1], [0.86, 0.54], [0.96, 0.54], [0.5, 0.12], [0.04, 0.54], [0.14, 0.54]]

/** A capital T with serifs seen from above, as x, y pairs. */
const LETTER_T: Spot[] = [
  [0.14, 0.18], [0.86, 0.18], [0.86, 0.38], [0.78, 0.38], [0.78, 0.3], [0.58, 0.3], [0.58, 0.88], [0.68, 0.88],
  [0.68, 0.98], [0.32, 0.98], [0.32, 0.88], [0.42, 0.88], [0.42, 0.3], [0.22, 0.3], [0.22, 0.38], [0.14, 0.38],
]

/** Media and places: pictures, video, sound, maps. */
export const mediaIcons: Record<(typeof ICON_KINDS.media)[number], readonly IconPart[]> = {
  image: [
    prism(rounded(0.08, 0.28, 0.92, 1, 0.05), 0, 0.08,
      frame('top', rectangle(0.16, 0.36, 0.84, 0.92)),
      accent(line('top', 0.16, 0.8, 0.4, 0.54, 0.54, 0.68, 0.66, 0.56, 0.84, 0.78)),
      accent(light('top', 0.7, 0.47, 0.05))),
  ],
  video: [
    prism(rectangle(0.1, 0.44, 0.9, 1), 0, 0.08, accent(block('top', [[0.42, 0.86], [0.42, 0.58], [0.64, 0.72]]))),
    prism(rectangle(0.1, 0.26, 0.9, 0.4), 0, 0.08,
      line('top', 0.24, 0.4, 0.32, 0.26), line('top', 0.42, 0.4, 0.5, 0.26), line('top', 0.6, 0.4, 0.68, 0.26),
      line('top', 0.78, 0.4, 0.86, 0.26)),
  ],
  play: [
    cylinder(C, C, 0.44, 0, 0.08),
    cylinder(C, C, 0.38, 0.08, 0.16, accent(block('top', [[0.42, 0.34], [0.42, 0.66], [0.68, 0.5]]))),
  ],
  location: [
    prism(PIN, 0, 0.1, accent(screen('top', circle(C, 0.4, 0.1)))),
  ],
  audio: [
    prism(rounded(0.36, 0.9, 0.64, 0.98, 0.03), 0, 0.05),
    prism(rectangle(0.47, 0.75, 0.53, 0.92), 0, 0.05),
    prism(CRADLE, 0, 0.05),
    accent(prism(rounded(0.38, 0.1, 0.62, 0.6, 0.12), 0, 0.12, line('top', 0.42, 0.28, 0.58, 0.28), line('top', 0.42, 0.38, 0.58, 0.38))),
  ],
  translate: [
    prism(rounded(0.06, 0.14, 0.6, 0.7, 0.06), 0, 0.05,
      line('top', 0.22, 0.58, 0.33, 0.28, 0.44, 0.58), line('top', 0.26, 0.48, 0.4, 0.48)),
    accent(prism(rounded(0.4, 0.44, 0.94, 0.98, 0.06), 0, 0.08,
      line('top', 0.52, 0.56, 0.82, 0.56), line('top', 0.67, 0.5, 0.67, 0.56), line('top', 0.56, 0.64, 0.78, 0.86),
      line('top', 0.78, 0.64, 0.56, 0.86))),
  ],
  map: [
    prism(MAP_SHEET, 0, 0.08,
      line('top', 0.35, 0.16, 0.35, 0.76), line('top', 0.65, 0.24, 0.65, 0.84),
      accent(line('top', 0.16, 0.66, 0.3, 0.46, 0.5, 0.56, 0.78, 0.34)), accent(light('top', 0.78, 0.34, 0.045))),
  ],
  home: [
    prism(HOUSE, 0, 0.16,
      accent(screen('top', rectangle(0.42, 0.7, 0.58, 1))), frame('top', rectangle(0.64, 0.66, 0.78, 0.8))),
  ],
  text: [
    accent(prism(LETTER_T, 0, 0.08)),
  ],
  motion: [
    prism(rectangle(0.06, 0.3, 0.38, 0.36), 0, 0.08),
    prism(rectangle(0.02, 0.51, 0.4, 0.57), 0, 0.08),
    prism(rectangle(0.1, 0.72, 0.38, 0.78), 0, 0.08),
    accent(prism(circle(0.7, 0.54, 0.25), 0, 0.08)),
  ],
}
