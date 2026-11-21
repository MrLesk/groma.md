import type { ICON_KINDS } from '../../../../icons.ts'
import { accent, arc, block, box, circle, cylinder, frame, line, prism, rectangle, rounded, screen } from '../parts.ts'
import type { IconPart, Spot } from '../parts.ts'
import { C, light, ellipse } from './shared-outlines.ts'

/** A puzzle piece seen from above, as x, y pairs: a square with a notch in its north side and a tab on its east side. */
const PIECE: Spot[] = [
  [0.14, 0.24], ...arc(0.42, 0.24, 0.1, 180, 0), [0.7, 0.24], [0.7, 0.44], ...arc(0.72, 0.54, 0.1, -90, 90), [0.7, 0.64],
  [0.7, 0.84], [0.14, 0.84],
]

/** A toolbox's handle seen from above, as x, y pairs: a bar on two short posts. */
const GRIP_BAR: Spot[] = [[0.3, 0.64], [0.3, 0.46], [0.7, 0.46], [0.7, 0.64], [0.63, 0.64], [0.63, 0.53], [0.37, 0.53], [0.37, 0.64]]

/** A pencil seen from above, as x, y pairs: its point is to the south-west and its end to the north-east. */
const PENCIL: Spot[] = [[0.26, 0.92], [0.304, 0.778], [0.76, 0.17], [0.84, 0.23], [0.384, 0.838]]

/** A rocket's body seen from above, as x, y pairs. */
const ROCKET: Spot[] = [[0.38, 0.86], [0.62, 0.86], [0.62, 0.42], [0.5, 0.12], [0.38, 0.42]]
/** The rocket's west fin, seen from above, as x, y pairs. */
const FIN_WEST: Spot[] = [[0.22, 0.94], [0.38, 0.86], [0.38, 0.62]]
/** The rocket's east fin, seen from above, as x, y pairs. */
const FIN_EAST: Spot[] = [[0.62, 0.86], [0.78, 0.94], [0.62, 0.62]]
/** The rocket's flame, seen from above, as x, y pairs. */
const FLAME: Spot[] = [[0.44, 0.86], [0.5, 1], [0.56, 0.86]]

/** An arrow that points south, seen from above, as x, y pairs. */
const ARROW_DOWN: Spot[] = [[0.42, 0.14], [0.58, 0.14], [0.58, 0.46], [0.72, 0.46], [0.5, 0.78], [0.28, 0.46], [0.42, 0.46]]

/** A broom's head seen from above, as x, y pairs: wider at its south end. */
const BRISTLES: Spot[] = [[0.24, 1], [0.76, 1], [0.66, 0.64], [0.34, 0.64]]

/** An hourglass seen from above, as x, y pairs. */
const HOURGLASS: Spot[] = [
  [0.2, 0.96], [0.8, 0.96], [0.8, 0.9], [0.56, 0.54], [0.8, 0.18], [0.8, 0.12], [0.2, 0.12], [0.2, 0.18], [0.44, 0.54], [0.2, 0.9],
]

/** A wand seen from above, as x, y pairs: a thin stick from the south-west to the north-east. */
const WAND: Spot[] = [[0.173, 0.918], [0.593, 0.408], [0.647, 0.452], [0.227, 0.962]]
/** The star at the wand's tip, seen from above, as x, y pairs. */
const WAND_STAR: Spot[] = [[0.72, 0.08], [0.76, 0.26], [0.92, 0.3], [0.76, 0.34], [0.72, 0.5], [0.68, 0.34], [0.52, 0.3], [0.68, 0.26]]

/** A ticket seen from above, as x, y pairs: a strip with a round notch in each short side. */
const TICKET: Spot[] = [
  [0.08, 0.88], [0.92, 0.88], ...arc(0.92, 0.6, 0.08, -270, -90), [0.92, 0.32], [0.08, 0.32], ...arc(0.08, 0.6, 0.08, -90, 90),
]

/** An arrow that points north, seen from above, as x, y pairs. */
const ARROW_UP: Spot[] = [[0.42, 0.78], [0.58, 0.78], [0.58, 0.46], [0.72, 0.46], [0.5, 0.14], [0.28, 0.46], [0.42, 0.46]]

/** A tag seen from above, as x, y pairs: a label that narrows to the point its string goes through. */
const TAG: Spot[] = [[0.22, 0.98], [0.78, 0.98], [0.78, 0.42], [0.5, 0.14], [0.22, 0.42]]

/** A laboratory flask seen from above, as x, y pairs: a narrow neck to the north of a wide foot. */
const FLASK: Spot[] = [[0.4, 0.1], [0.4, 0.44], [0.14, 0.9], [0.2, 0.98], [0.8, 0.98], [0.86, 0.9], [0.6, 0.44], [0.6, 0.1]]

/** Tooling: configuration, extension points, code and its delivery. */
export const toolingIcons: Record<(typeof ICON_KINDS.tooling)[number], readonly IconPart[]> = {
  settings: [
    prism(rounded(0.08, 0.12, 0.92, 0.88, 0.1), 0, 0.08,
      line('top', 0.2, 0.3, 0.8, 0.3), line('top', 0.2, 0.5, 0.8, 0.5), line('top', 0.2, 0.7, 0.8, 0.7)),
    cylinder(0.36, 0.3, 0.07, 0.08, 0.07),
    accent(cylinder(0.62, 0.5, 0.07, 0.08, 0.07)),
    cylinder(0.44, 0.7, 0.07, 0.08, 0.07),
  ],
  plugin: [
    prism(rounded(0.04, 0.14, 0.96, 0.94, 0.1), 0, 0.05),
    accent(prism(PIECE, 0.05, 0.14)),
  ],
  integration: [
    prism(rounded(0.02, 0.2, 0.98, 0.8, 0.08), 0, 0.04),
    box(0.02, 0.47, 0.04, 0.1, 0.06, 0.06),
    prism(rounded(0.12, 0.36, 0.42, 0.64, 0.06), 0.04, 0.14),
    accent(box(0.42, 0.42, 0.08, 0.13, 0.04, 0.05)),
    accent(box(0.42, 0.54, 0.08, 0.13, 0.04, 0.05)),
    prism(rounded(0.66, 0.3, 0.94, 0.7, 0.06), 0.04, 0.18,
      block('top', rectangle(0.72, 0.41, 0.8, 0.46)), block('top', rectangle(0.72, 0.54, 0.8, 0.59))),
  ],
  api: [
    prism(rounded(0.08, 0.34, 0.92, 1, 0.07), 0, 0.08,
      accent(line('top', 0.36, 0.44, 0.3, 0.44, 0.3, 0.62, 0.24, 0.67, 0.3, 0.72, 0.3, 0.9, 0.36, 0.9)),
      accent(line('top', 0.64, 0.44, 0.7, 0.44, 0.7, 0.62, 0.76, 0.67, 0.7, 0.72, 0.7, 0.9, 0.64, 0.9)),
      light('top', 0.42, 0.67, 0.025), light('top', C, 0.67, 0.025), light('top', 0.58, 0.67, 0.025)),
  ],
  tools: [
    box(0.08, 0.33, 0, 0.84, 0.44, 0.36,
      line('south', 0.08, 0.25, 0.92, 0.25), screen('south', rectangle(0.44, 0.19, 0.56, 0.31)),
      line('top', 0.08, 0.55, 0.92, 0.55)),
    accent(prism(GRIP_BAR, 0.36, 0.05)),
  ],
  blocks: [
    box(0.06, 0.54, 0, 0.4, 0.4, 0.3, frame('top', circle(0.26, 0.74, 0.08))),
    box(0.54, 0.54, 0, 0.4, 0.4, 0.3, frame('top', circle(0.74, 0.74, 0.08))),
    accent(box(0.3, 0.08, 0, 0.4, 0.4, 0.54, frame('top', circle(C, 0.28, 0.08)))),
  ],
  repository: [
    prism(rounded(0.1, 0.16, 0.9, 1, 0.1), 0, 0.08,
      line('top', 0.32, 0.8, 0.32, 0.36),
      accent(line('top', 0.32, 0.66, 0.5, 0.66, 0.68, 0.5, 0.68, 0.38))),
    prism(circle(0.32, 0.8, 0.085), 0.08, 0.05),
    prism(circle(0.32, 0.36, 0.085), 0.08, 0.05),
    accent(prism(circle(0.68, 0.38, 0.085), 0.08, 0.05)),
  ],
  package: [
    box(0.16, 0.16, 0, 0.68, 0.68, 0.58,
      accent(screen('top', rectangle(0.43, 0.16, 0.57, 0.84))),
      accent(screen('south', rectangle(0.43, 0.58, 0.57, 0.34)))),
  ],
  board: [
    prism(rounded(0.04, 0.28, 0.96, 1, 0.07), 0, 0.08,
      line('top', 0.35, 1, 0.35, 0.28), line('top', 0.65, 1, 0.65, 0.28),
      screen('top', rectangle(0.1, 0.36, 0.29, 0.5)), screen('top', rectangle(0.1, 0.56, 0.29, 0.7)),
      accent(screen('top', rectangle(0.41, 0.36, 0.59, 0.5))),
      screen('top', rectangle(0.71, 0.36, 0.9, 0.5)), screen('top', rectangle(0.71, 0.56, 0.9, 0.7)), screen('top', rectangle(0.71, 0.76, 0.9, 0.9))),
  ],
  code: [
    prism(rounded(0.08, 0.34, 0.92, 1, 0.07), 0, 0.08,
      accent(line('top', 0.34, 0.52, 0.18, 0.67, 0.34, 0.82)),
      accent(line('top', 0.66, 0.52, 0.82, 0.67, 0.66, 0.82)),
      accent(line('top', 0.56, 0.46, 0.44, 0.88))),
  ],
  checklist: [
    prism(rounded(0.16, 0.16, 0.84, 1, 0.05), 0, 0.08,
      accent(line('top', 0.26, 0.4, 0.31, 0.45, 0.4, 0.34)), line('top', 0.48, 0.4, 0.74, 0.4),
      accent(line('top', 0.26, 0.6, 0.31, 0.65, 0.4, 0.54)), line('top', 0.48, 0.6, 0.74, 0.6),
      frame('top', rectangle(0.26, 0.74, 0.38, 0.86)), line('top', 0.48, 0.8, 0.66, 0.8)),
    prism(rounded(0.38, 0.08, 0.62, 0.22, 0.03), 0, 0.12),
  ],
  palette: [
    prism(ellipse(C, C, 0.44, 0.36), 0, 0.08,
      screen('top', circle(0.68, 0.62, 0.07)),
      accent(light('top', 0.3, 0.42, 0.06)), light('top', 0.46, 0.3, 0.05), light('top', 0.66, 0.36, 0.05),
      light('top', 0.3, 0.62, 0.05)),
  ],
  form: [
    prism(rounded(0.14, 0.16, 0.86, 1, 0.05), 0, 0.08,
      line('top', 0.24, 0.28, 0.5, 0.28), frame('top', rounded(0.24, 0.34, 0.76, 0.48, 0.02)),
      line('top', 0.24, 0.56, 0.44, 0.56), frame('top', rounded(0.24, 0.62, 0.76, 0.76, 0.02)),
      accent(screen('top', rounded(0.5, 0.82, 0.76, 0.94, 0.03)))),
  ],
  edit: [
    prism(rounded(0.1, 0.2, 0.9, 0.88, 0.05), 0, 0.08, line('top', 0.2, 0.74, 0.5, 0.74), line('top', 0.2, 0.62, 0.38, 0.62)),
    accent(prism(PENCIL, 0, 0.12)),
  ],
  power: [
    cylinder(C, C, 0.44, 0, 0.08),
    cylinder(C, C, 0.38, 0.08, 0.16,
      accent(line('top', ...arc(C, C, 0.22, -60, 240).flat())), accent(line('top', C, 0.2, C, 0.46))),
  ],
  release: [
    prism(FIN_WEST, 0, 0.08),
    prism(FIN_EAST, 0, 0.08),
    accent(prism(FLAME, 0, 0.05)),
    prism(ROCKET, 0, 0.12, screen('top', circle(C, 0.48, 0.07))),
  ],
  sync: [
    cylinder(C, C, 0.44, 0, 0.08),
    cylinder(C, C, 0.38, 0.08, 0.16,
      accent(line('top', ...arc(C, C, 0.24, 200, 330).flat())), accent(block('top', [[0.78, 0.36], [0.72, 0.5], [0.64, 0.38]])),
      accent(line('top', ...arc(C, C, 0.24, 20, 150).flat())), accent(block('top', [[0.22, 0.64], [0.28, 0.5], [0.36, 0.62]]))),
  ],
  download: [
    prism(rounded(0.14, 0.81, 0.86, 0.97, 0.05), 0, 0.05),
    accent(prism(ARROW_DOWN, 0, 0.08)),
  ],
  cleanup: [
    prism(rectangle(0.47, 0.08, 0.53, 0.64), 0, 0.05),
    accent(prism(BRISTLES, 0, 0.1,
      line('top', 0.38, 0.98, 0.4, 0.7), line('top', C, 0.98, C, 0.7), line('top', 0.62, 0.98, 0.6, 0.7))),
  ],
  timer: [
    prism(HOURGLASS, 0, 0.16,
      accent(block('top', [[0.3, 0.9], [0.7, 0.9], [0.5, 0.68]])), line('top', C, 0.58, C, 0.66)),
  ],
  wand: [
    prism(WAND, 0, 0.08),
    accent(prism(WAND_STAR, 0, 0.08)),
  ],
  check: [
    cylinder(C, C, 0.44, 0, 0.08),
    cylinder(C, C, 0.38, 0.08, 0.16, accent(line('top', 0.3, 0.52, 0.44, 0.66, 0.72, 0.34))),
  ],
  ticket: [
    prism(TICKET, 0, 0.08,
      line('top', 0.68, 0.88, 0.68, 0.32), accent(line('top', 0.24, 0.5, 0.56, 0.5)), line('top', 0.24, 0.66, 0.46, 0.66)),
  ],
  blueprint: [
    prism(rounded(0.06, 0.16, 0.8, 0.84, 0.03), 0, 0.04,
      accent(frame('top', rectangle(0.18, 0.3, 0.6, 0.7))), accent(line('top', 0.4, 0.3, 0.4, 0.52, 0.6, 0.52)),
      line('top', 0.18, 0.76, 0.6, 0.76), line('top', 0.12, 0.3, 0.12, 0.7)),
    prism(rounded(0.78, 0.14, 0.94, 0.86, 0.07), 0, 0.14),
  ],
  upload: [
    prism(rounded(0.14, 0.81, 0.86, 0.97, 0.05), 0, 0.05),
    accent(prism(ARROW_UP, 0, 0.08)),
  ],
  link: [
    prism(rounded(0.06, 0.54, 0.56, 0.88, 0.16), 0, 0.05, screen('top', rounded(0.16, 0.63, 0.46, 0.79, 0.07))),
    accent(prism(rounded(0.44, 0.54, 0.94, 0.88, 0.16), 0, 0.08, screen('top', rounded(0.54, 0.63, 0.84, 0.79, 0.07)))),
  ],
  tag: [
    prism(TAG, 0, 0.08,
      accent(screen('top', circle(C, 0.36, 0.06))), line('top', 0.34, 0.66, 0.66, 0.66), line('top', 0.34, 0.8, 0.56, 0.8)),
  ],
  book: [
    prism(rounded(0.02, 0.17, 0.98, 0.83, 0.04), 0, 0.03),
    prism(rounded(0.05, 0.2, 0.49, 0.8, 0.03), 0.03, 0.08,
      line('top', 0.13, 0.34, 0.41, 0.34), line('top', 0.13, 0.46, 0.41, 0.46), line('top', 0.13, 0.58, 0.33, 0.58)),
    prism(rounded(0.51, 0.2, 0.95, 0.8, 0.03), 0.03, 0.08,
      line('top', 0.59, 0.34, 0.74, 0.34), line('top', 0.59, 0.46, 0.87, 0.46), line('top', 0.59, 0.58, 0.87, 0.58),
      accent(block('top', rectangle(0.79, 0.2, 0.87, 0.4)))),
  ],
  test: [
    prism(FLASK, 0, 0.12,
      accent(block('top', [[0.22, 0.92], [0.78, 0.92], [0.7, 0.72], [0.3, 0.72]])), light('top', 0.46, 0.6),
      line('top', 0.36, 0.1, 0.64, 0.1)),
  ],
  diff: [
    prism(rounded(0.16, 0.12, 0.84, 1, 0.05), 0, 0.08,
      line('top', 0.26, 0.32, 0.36, 0.32), line('top', 0.44, 0.32, 0.72, 0.32),
      line('top', 0.44, 0.5, 0.64, 0.5),
      accent(screen('top', rounded(0.2, 0.62, 0.8, 0.84, 0.02))),
      accent(line('top', 0.26, 0.73, 0.36, 0.73)), accent(line('top', 0.31, 0.78, 0.31, 0.68)),
      accent(line('top', 0.44, 0.73, 0.72, 0.73))),
  ],
}
