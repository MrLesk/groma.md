import type { ICON_KINDS } from '../../../../icons.ts'
import { accent, arc, block, box, circle, cylinder, frame, line, panel, rectangle, rounded, screen, upright } from '../parts.ts'
import type { IconPart, Spot } from '../parts.ts'
import { C, light, ellipse } from './shared-outlines.ts'

/** A puzzle piece seen from above, as x, y pairs: a square with a notch in its north side and a tab on its east side. */
const PIECE: Spot[] = [
  [0.14, 0.24], ...arc(0.42, 0.24, 0.1, 180, 0), [0.7, 0.24], [0.7, 0.44], ...arc(0.72, 0.54, 0.1, -90, 90), [0.7, 0.64],
  [0.7, 0.84], [0.14, 0.84],
]

/** A toolbox's handle seen from the front, as x, z pairs: a bar on two short posts. */
const GRIP_BAR: Spot[] = [[0.3, 0.36], [0.3, 0.54], [0.7, 0.54], [0.7, 0.36], [0.63, 0.36], [0.63, 0.47], [0.37, 0.47], [0.37, 0.36]]

/** A pencil seen from the front, as x, z pairs: it leans to the right and stands on its point. */
const PENCIL: Spot[] = [[0.26, 0.08], [0.304, 0.222], [0.76, 0.83], [0.84, 0.77], [0.384, 0.162]]

/** A rocket's body seen from the front, as x, z pairs. */
const ROCKET: Spot[] = [[0.38, 0.14], [0.62, 0.14], [0.62, 0.58], [0.5, 0.88], [0.38, 0.58]]
/** The rocket's west fin, seen from the front, as x, z pairs. */
const FIN_WEST: Spot[] = [[0.22, 0.06], [0.38, 0.14], [0.38, 0.38]]
/** The rocket's east fin, seen from the front, as x, z pairs. */
const FIN_EAST: Spot[] = [[0.62, 0.14], [0.78, 0.06], [0.62, 0.38]]
/** The rocket's flame, seen from the front, as x, z pairs. */
const FLAME: Spot[] = [[0.44, 0.14], [0.5, 0], [0.56, 0.14]]

/** An arrow that points down, seen from the front, as x, z pairs. */
const ARROW_DOWN: Spot[] = [[0.42, 0.74], [0.58, 0.74], [0.58, 0.42], [0.72, 0.42], [0.5, 0.1], [0.28, 0.42], [0.42, 0.42]]

/** A broom's head seen from the front, as x, z pairs: wider at the floor. */
const BRISTLES: Spot[] = [[0.24, 0], [0.76, 0], [0.66, 0.36], [0.34, 0.36]]

/** An hourglass seen from the front, as x, z pairs. */
const HOURGLASS: Spot[] = [
  [0.2, 0.04], [0.8, 0.04], [0.8, 0.1], [0.56, 0.46], [0.8, 0.82], [0.8, 0.88], [0.2, 0.88], [0.2, 0.82], [0.44, 0.46], [0.2, 0.1],
]

/** A wand seen from the front, as x, z pairs: a thin stick that leans to the right. */
const WAND: Spot[] = [[0.173, 0.082], [0.593, 0.592], [0.647, 0.548], [0.227, 0.038]]
/** The star at the wand's tip, seen from the front, as x, z pairs. */
const WAND_STAR: Spot[] = [[0.72, 0.92], [0.76, 0.74], [0.92, 0.7], [0.76, 0.66], [0.72, 0.5], [0.68, 0.66], [0.52, 0.7], [0.68, 0.74]]

/** A ticket seen from the front, as x, z pairs: a strip with a round notch in each short side. */
const TICKET: Spot[] = [
  [0.08, 0.12], [0.92, 0.12], ...arc(0.92, 0.4, 0.08, 270, 90), [0.92, 0.68], [0.08, 0.68], ...arc(0.08, 0.4, 0.08, 90, -90),
]

/** An arrow that points up, seen from the front, as x, z pairs. */
const ARROW_UP: Spot[] = [[0.42, 0.1], [0.58, 0.1], [0.58, 0.42], [0.72, 0.42], [0.5, 0.74], [0.28, 0.42], [0.42, 0.42]]

/** A tag seen from the front, as x, z pairs: a label that narrows to the point its string goes through. */
const TAG: Spot[] = [[0.22, 0.02], [0.78, 0.02], [0.78, 0.58], [0.5, 0.86], [0.22, 0.58]]

/** A laboratory flask seen from the front, as x, z pairs: a narrow neck on a wide foot. */
const FLASK: Spot[] = [[0.4, 0.9], [0.4, 0.56], [0.14, 0.1], [0.2, 0.02], [0.8, 0.02], [0.86, 0.1], [0.6, 0.56], [0.6, 0.9]]

/** Tooling: configuration, extension points, code and its delivery. */
export const toolingIcons: Record<(typeof ICON_KINDS.tooling)[number], readonly IconPart[]> = {
  settings: [
    upright(rounded(0.08, 0.12, 0.92, 0.88, 0.1), 0, 0.08,
      line('top', 0.2, 0.3, 0.8, 0.3), line('top', 0.2, 0.5, 0.8, 0.5), line('top', 0.2, 0.7, 0.8, 0.7)),
    cylinder(0.36, 0.3, 0.07, 0.08, 0.07),
    accent(cylinder(0.62, 0.5, 0.07, 0.08, 0.07)),
    cylinder(0.44, 0.7, 0.07, 0.08, 0.07),
  ],
  plugin: [
    upright(rounded(0.04, 0.14, 0.96, 0.94, 0.1), 0, 0.05),
    accent(upright(PIECE, 0.05, 0.14)),
  ],
  integration: [
    upright(rounded(0.02, 0.2, 0.98, 0.8, 0.08), 0, 0.04),
    box(0.02, 0.47, 0.04, 0.1, 0.06, 0.06),
    upright(rounded(0.12, 0.36, 0.42, 0.64, 0.06), 0.04, 0.14),
    accent(box(0.42, 0.42, 0.08, 0.13, 0.04, 0.05)),
    accent(box(0.42, 0.54, 0.08, 0.13, 0.04, 0.05)),
    upright(rounded(0.66, 0.3, 0.94, 0.7, 0.06), 0.04, 0.18,
      block('top', rectangle(0.72, 0.41, 0.8, 0.46)), block('top', rectangle(0.72, 0.54, 0.8, 0.59))),
  ],
  api: [
    panel(rounded(0.08, 0, 0.92, 0.66, 0.07), 0.45, 0.1,
      accent(line('south', 0.36, 0.56, 0.3, 0.56, 0.3, 0.38, 0.24, 0.33, 0.3, 0.28, 0.3, 0.1, 0.36, 0.1)),
      accent(line('south', 0.64, 0.56, 0.7, 0.56, 0.7, 0.38, 0.76, 0.33, 0.7, 0.28, 0.7, 0.1, 0.64, 0.1)),
      light('south', 0.42, 0.33, 0.025), light('south', C, 0.33, 0.025), light('south', 0.58, 0.33, 0.025)),
  ],
  tools: [
    box(0.08, 0.28, 0, 0.84, 0.44, 0.36,
      line('south', 0.08, 0.25, 0.92, 0.25), screen('south', rectangle(0.44, 0.19, 0.56, 0.31)),
      line('top', 0.08, 0.5, 0.92, 0.5)),
    accent(panel(GRIP_BAR, 0.47, 0.06)),
  ],
  blocks: [
    box(0.06, 0.54, 0, 0.4, 0.4, 0.3, frame('top', circle(0.26, 0.74, 0.08))),
    box(0.54, 0.54, 0, 0.4, 0.4, 0.3, frame('top', circle(0.74, 0.74, 0.08))),
    accent(box(0.3, 0.08, 0, 0.4, 0.4, 0.54, frame('top', circle(C, 0.28, 0.08)))),
  ],
  repository: [
    panel(rounded(0.1, 0, 0.9, 0.84, 0.1), 0.45, 0.05,
      line('south', 0.32, 0.2, 0.32, 0.64),
      accent(line('south', 0.32, 0.34, 0.5, 0.34, 0.68, 0.5, 0.68, 0.62))),
    panel(circle(0.32, 0.2, 0.085), 0.5, 0.05),
    panel(circle(0.32, 0.64, 0.085), 0.5, 0.05),
    accent(panel(circle(0.68, 0.62, 0.085), 0.5, 0.05)),
  ],
  package: [
    box(0.16, 0.16, 0, 0.68, 0.68, 0.58,
      accent(screen('top', rectangle(0.43, 0.16, 0.57, 0.84))),
      accent(screen('south', rectangle(0.43, 0.58, 0.57, 0.34)))),
  ],
  board: [
    panel(rounded(0.04, 0, 0.96, 0.72, 0.07), 0.47, 0.06,
      line('south', 0.35, 0, 0.35, 0.72), line('south', 0.65, 0, 0.65, 0.72),
      screen('south', rectangle(0.1, 0.5, 0.29, 0.64)), screen('south', rectangle(0.1, 0.3, 0.29, 0.44)),
      accent(screen('south', rectangle(0.41, 0.5, 0.59, 0.64))),
      screen('south', rectangle(0.71, 0.5, 0.9, 0.64)), screen('south', rectangle(0.71, 0.3, 0.9, 0.44)), screen('south', rectangle(0.71, 0.1, 0.9, 0.24))),
  ],
  code: [
    panel(rounded(0.08, 0, 0.92, 0.66, 0.07), 0.45, 0.1,
      accent(line('south', 0.34, 0.48, 0.18, 0.33, 0.34, 0.18)),
      accent(line('south', 0.66, 0.48, 0.82, 0.33, 0.66, 0.18)),
      accent(line('south', 0.56, 0.54, 0.44, 0.12))),
  ],
  checklist: [
    panel(rounded(0.16, 0, 0.84, 0.84, 0.05), 0.45, 0.06,
      accent(line('south', 0.26, 0.6, 0.31, 0.55, 0.4, 0.66)), line('south', 0.48, 0.6, 0.74, 0.6),
      accent(line('south', 0.26, 0.4, 0.31, 0.35, 0.4, 0.46)), line('south', 0.48, 0.4, 0.74, 0.4),
      frame('south', rectangle(0.26, 0.14, 0.38, 0.26)), line('south', 0.48, 0.2, 0.66, 0.2)),
    panel(rounded(0.38, 0.78, 0.62, 0.92, 0.03), 0.51, 0.04),
  ],
  palette: [
    upright(ellipse(C, C, 0.44, 0.36), 0, 0.08,
      screen('top', circle(0.68, 0.62, 0.07)),
      accent(light('top', 0.3, 0.42, 0.06)), light('top', 0.46, 0.3, 0.05), light('top', 0.66, 0.36, 0.05),
      light('top', 0.3, 0.62, 0.05)),
  ],
  form: [
    panel(rounded(0.14, 0, 0.86, 0.84, 0.05), 0.45, 0.06,
      line('south', 0.24, 0.72, 0.5, 0.72), frame('south', rounded(0.24, 0.52, 0.76, 0.66, 0.02)),
      line('south', 0.24, 0.44, 0.44, 0.44), frame('south', rounded(0.24, 0.24, 0.76, 0.38, 0.02)),
      accent(screen('south', rounded(0.5, 0.06, 0.76, 0.18, 0.03)))),
  ],
  edit: [
    upright(rounded(0.1, 0.16, 0.9, 0.84, 0.05), 0, 0.04, line('top', 0.2, 0.7, 0.5, 0.7), line('top', 0.2, 0.58, 0.38, 0.58)),
    accent(panel(PENCIL, 0.48, 0.05)),
  ],
  power: [
    cylinder(C, C, 0.44, 0, 0.08),
    cylinder(C, C, 0.38, 0.08, 0.16,
      accent(line('top', ...arc(C, C, 0.22, -60, 240).flat())), accent(line('top', C, 0.2, C, 0.46))),
  ],
  release: [
    panel(FIN_WEST, 0.47, 0.06),
    panel(FIN_EAST, 0.47, 0.06),
    panel(ROCKET, 0.44, 0.12, screen('south', circle(C, 0.52, 0.07))),
    accent(panel(FLAME, 0.47, 0.06)),
  ],
  sync: [
    cylinder(C, C, 0.44, 0, 0.08),
    cylinder(C, C, 0.38, 0.08, 0.16,
      accent(line('top', ...arc(C, C, 0.24, 200, 330).flat())), accent(block('top', [[0.78, 0.36], [0.72, 0.5], [0.64, 0.38]])),
      accent(line('top', ...arc(C, C, 0.24, 20, 150).flat())), accent(block('top', [[0.22, 0.64], [0.28, 0.5], [0.36, 0.62]]))),
  ],
  download: [
    upright(rounded(0.14, 0.78, 0.86, 0.94, 0.05), 0, 0.06),
    accent(panel(ARROW_DOWN, 0.4, 0.06)),
  ],
  cleanup: [
    panel(rectangle(0.47, 0.36, 0.53, 0.92), 0.47, 0.06),
    accent(panel(BRISTLES, 0.42, 0.16,
      line('south', 0.38, 0.02, 0.4, 0.3), line('south', C, 0.02, C, 0.3), line('south', 0.62, 0.02, 0.6, 0.3))),
  ],
  timer: [
    panel(HOURGLASS, 0.42, 0.16,
      accent(block('south', [[0.3, 0.1], [0.7, 0.1], [0.5, 0.32]])), line('south', C, 0.42, C, 0.34)),
  ],
  wand: [
    panel(WAND, 0.47, 0.05),
    accent(panel(WAND_STAR, 0.47, 0.05)),
  ],
  check: [
    cylinder(C, C, 0.44, 0, 0.08),
    cylinder(C, C, 0.38, 0.08, 0.16, accent(line('top', 0.3, 0.52, 0.44, 0.66, 0.72, 0.34))),
  ],
  ticket: [
    panel(TICKET, 0.44, 0.06,
      line('south', 0.68, 0.12, 0.68, 0.68), accent(line('south', 0.24, 0.5, 0.56, 0.5)), line('south', 0.24, 0.34, 0.46, 0.34)),
  ],
  blueprint: [
    upright(rounded(0.06, 0.16, 0.8, 0.84, 0.03), 0, 0.04,
      accent(frame('top', rectangle(0.18, 0.3, 0.6, 0.7))), accent(line('top', 0.4, 0.3, 0.4, 0.52, 0.6, 0.52)),
      line('top', 0.18, 0.76, 0.6, 0.76), line('top', 0.12, 0.3, 0.12, 0.7)),
    upright(rounded(0.78, 0.14, 0.94, 0.86, 0.07), 0, 0.14),
  ],
  upload: [
    upright(rounded(0.14, 0.78, 0.86, 0.94, 0.05), 0, 0.06),
    accent(panel(ARROW_UP, 0.4, 0.06)),
  ],
  link: [
    panel(rounded(0.06, 0.12, 0.56, 0.46, 0.16), 0.44, 0.05, screen('south', rounded(0.16, 0.21, 0.46, 0.37, 0.07))),
    accent(panel(rounded(0.44, 0.12, 0.94, 0.46, 0.16), 0.51, 0.05, screen('south', rounded(0.54, 0.21, 0.84, 0.37, 0.07)))),
  ],
  tag: [
    panel(TAG, 0.45, 0.06,
      accent(screen('south', circle(C, 0.64, 0.06))), line('south', 0.34, 0.34, 0.66, 0.34), line('south', 0.34, 0.2, 0.56, 0.2)),
  ],
  book: [
    upright(rounded(0.02, 0.17, 0.98, 0.83, 0.04), 0, 0.03),
    upright(rounded(0.05, 0.2, 0.49, 0.8, 0.03), 0.03, 0.08,
      line('top', 0.13, 0.34, 0.41, 0.34), line('top', 0.13, 0.46, 0.41, 0.46), line('top', 0.13, 0.58, 0.33, 0.58)),
    upright(rounded(0.51, 0.2, 0.95, 0.8, 0.03), 0.03, 0.08,
      line('top', 0.59, 0.34, 0.74, 0.34), line('top', 0.59, 0.46, 0.87, 0.46), line('top', 0.59, 0.58, 0.87, 0.58),
      accent(block('top', rectangle(0.79, 0.2, 0.87, 0.4)))),
  ],
  test: [
    panel(FLASK, 0.44, 0.12,
      accent(block('south', [[0.22, 0.08], [0.78, 0.08], [0.7, 0.28], [0.3, 0.28]])), light('south', 0.46, 0.4),
      line('south', 0.36, 0.9, 0.64, 0.9)),
  ],
}
