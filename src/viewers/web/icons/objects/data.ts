import type { ICON_KINDS } from '../../../../icons.ts'
import { accent, arc, block, box, circle, cylinder, frame, line, prism, rectangle, rounded, screen } from '../parts.ts'
import type { IconPart, Spot } from '../parts.ts'
import { C, light } from './shared-outlines.ts'

/** A sheet of paper seen from above, as x, y pairs: its west edge is at `x` and its north-east corner is folded away. */
function page(x: number): Spot[] {
  return [[x, 1], [x + 0.5, 1], [x + 0.5, 0.36], [x + 0.36, 0.2], [x, 0.2]]
}

/** A magnifier's handle seen from above, as x, y pairs: a bar from the rim of the lens towards the east, a little south. */
const GRIP: Spot[] = [[0.592, 0.54], [0.874, 0.642], [0.902, 0.566], [0.62, 0.464]]

/** A lightning bolt seen from above, as x, y pairs. */
const BOLT: Spot[] = [[0.56, 0.26], [0.38, 0.54], [0.49, 0.54], [0.43, 0.76], [0.63, 0.46], [0.52, 0.46]]

/** A bucket seen from above, as x, y pairs: wider at its rim than at its foot. */
const BUCKET: Spot[] = [[0.22, 1], [0.78, 1], [0.9, 0.42], [0.1, 0.42]]
/** The bucket's handle seen from above, as x, y pairs: an arch north of the rim. */
const BAIL: Spot[] = [...arc(C, 0.42, 0.36, 0, -180), ...arc(C, 0.42, 0.3, -180, 0)]

/** A folder's back seen from above, as x, y pairs: a sheet with a tab at the north-west. */
const FOLDER: Spot[] = [[0.08, 1], [0.92, 1], [0.92, 0.4], [0.5, 0.4], [0.42, 0.3], [0.08, 0.3]]

/** An index card with a tab on its north edge, seen from above, as x, y pairs; it lies on its box. */
const TABBED_CARD: Spot[] = [[0.18, 0.7], [0.82, 0.7], [0.82, 0.44], [0.6, 0.44], [0.56, 0.36], [0.4, 0.36], [0.36, 0.44], [0.18, 0.44]]

/** The branches of a tree diagram seen from above, as x, y pairs: a stem from the root south to a bar with three stems. */
const BRANCHES: Spot[] = [
  [0.48, 0.38], [0.52, 0.38], [0.52, 0.53], [0.82, 0.53], [0.82, 0.72], [0.78, 0.72], [0.78, 0.57], [0.52, 0.57],
  [0.52, 0.72], [0.48, 0.72], [0.48, 0.57], [0.22, 0.57], [0.22, 0.72], [0.18, 0.72], [0.18, 0.53], [0.48, 0.53],
]

/** The head of the arrow that runs back around a clock face, seen from above, as x, y pairs: it points south and to the west. */
const BACK_ARROW: Spot[] = [[0.2, 0.43], [0.22, 0.3], [0.32, 0.39]]

/** Data: where things are kept and found. */
export const dataIcons: Record<(typeof ICON_KINDS.data)[number], readonly IconPart[]> = {
  database: [
    cylinder(C, C, 0.38, 0, 0.18),
    cylinder(C, C, 0.38, 0.24, 0.18),
    accent(cylinder(C, C, 0.38, 0.48, 0.18, frame('top', circle(C, C, 0.24)))),
  ],
  cache: [
    prism(rounded(0.06, 0.14, 0.94, 0.86, 0.1), 0, 0.06),
    prism(rounded(0.16, 0.22, 0.84, 0.78, 0.07), 0.12, 0.08, accent(block('top', BOLT))),
  ],
  storage: [
    accent(prism(BAIL, 0, 0.05)),
    prism(BUCKET, 0, 0.12, line('top', 0.13, 0.54, 0.87, 0.54), line('top', 0.19, 0.86, 0.81, 0.86)),
  ],
  backup: [
    prism(rounded(0.14, 0.3, 0.86, 1, 0.06), 0, 0.16,
      line('top', 0.14, 0.44, 0.86, 0.44),
      accent(screen('top', rectangle(0.32, 0.56, 0.68, 0.74))),
      line('top', 0.44, 0.86, 0.56, 0.86)),
  ],
  document: [
    prism(page(0.14), 0, 0.05),
    prism(page(0.32), 0, 0.08,
      line('top', 0.68, 0.2, 0.68, 0.36, 0.82, 0.36),
      accent(line('top', 0.4, 0.44, 0.62, 0.44)),
      line('top', 0.4, 0.58, 0.74, 0.58), line('top', 0.4, 0.72, 0.74, 0.72), line('top', 0.4, 0.86, 0.62, 0.86)),
  ],
  search: [
    prism(rounded(0.1, 0.08, 0.9, 0.92, 0.08), 0, 0.06,
      line('top', 0.22, 0.26, 0.6, 0.26), line('top', 0.22, 0.42, 0.78, 0.42),
      line('top', 0.22, 0.58, 0.78, 0.58), line('top', 0.22, 0.74, 0.5, 0.74)),
    accent(cylinder(0.38, 0.42, 0.24, 0.16, 0.05, screen('top', circle(0.38, 0.42, 0.17)))),
    prism(GRIP, 0.16, 0.05),
  ],
  migration: [
    box(0.06, 0.3, 0, 0.26, 0.4, 0.16, line('top', 0.15, 0.42, 0.23, 0.5, 0.15, 0.58)),
    box(0.37, 0.3, 0, 0.26, 0.4, 0.36, line('top', 0.46, 0.42, 0.54, 0.5, 0.46, 0.58)),
    accent(box(0.68, 0.3, 0, 0.26, 0.4, 0.56, line('top', 0.77, 0.42, 0.85, 0.5, 0.77, 0.58))),
  ],
  disk: [
    prism(rounded(0.1, 0.14, 0.9, 0.86, 0.08), 0, 0.14,
      frame('top', circle(0.46, 0.46, 0.26)), accent(light('top', 0.46, 0.46, 0.06)),
      line('top', 0.5, 0.5, 0.74, 0.72), light('top', 0.76, 0.74, 0.035),
      line('south', 0.2, 0.07, 0.5, 0.07)),
  ],
  warehouse: [
    cylinder(C, C, 0.4, 0, 0.2),
    cylinder(C, C, 0.4, 0.26, 0.2,
      block('top', rectangle(0.3, 0.56, 0.4, 0.68)), block('top', rectangle(0.45, 0.44, 0.55, 0.68)),
      accent(block('top', rectangle(0.6, 0.3, 0.7, 0.68)))),
  ],
  table: [
    prism(rounded(0.06, 0.14, 0.94, 0.86, 0.06), 0, 0.1,
      accent(screen('top', rectangle(0.1, 0.18, 0.9, 0.34))),
      line('top', 0.06, 0.34, 0.94, 0.34), line('top', 0.06, 0.52, 0.94, 0.52), line('top', 0.06, 0.7, 0.94, 0.7),
      line('top', 0.36, 0.14, 0.36, 0.86), line('top', 0.65, 0.14, 0.65, 0.86)),
  ],
  directory: [
    prism(rounded(0.14, 0.2, 0.8, 1, 0.05), 0, 0.12,
      line('top', 0.24, 1, 0.24, 0.2),
      accent(screen('top', circle(0.52, 0.5, 0.1))),
      accent(line('top', ...arc(0.52, 0.78, 0.16, 0, -180).flat()))),
    prism(rectangle(0.8, 0.3, 0.9, 0.44), 0, 0.08),
    prism(rectangle(0.8, 0.5, 0.9, 0.64), 0, 0.08),
    prism(rectangle(0.8, 0.7, 0.9, 0.84), 0, 0.08),
  ],
  registry: [
    prism(rectangle(0.08, 0.16, 0.92, 1), 0, 0.16,
      line('top', 0.08, 0.72, 0.92, 0.72), line('top', 0.08, 0.44, 0.92, 0.44),
      screen('top', rectangle(0.18, 0.8, 0.38, 0.98)), screen('top', rectangle(0.58, 0.8, 0.78, 0.98)),
      screen('top', rectangle(0.16, 0.52, 0.36, 0.7)), screen('top', rectangle(0.44, 0.52, 0.64, 0.7)),
      accent(screen('top', rectangle(0.3, 0.24, 0.5, 0.42)))),
  ],
  log: [
    prism(rounded(0.14, 0.18, 0.86, 1, 0.05), 0, 0.08,
      accent(light('top', 0.26, 0.34)), accent(line('top', 0.34, 0.34, 0.74, 0.34)),
      light('top', 0.26, 0.5), line('top', 0.34, 0.5, 0.64, 0.5),
      light('top', 0.26, 0.66), line('top', 0.34, 0.66, 0.74, 0.66),
      light('top', 0.26, 0.82), line('top', 0.34, 0.82, 0.56, 0.82)),
  ],
  feed: [
    prism(rounded(0.12, 0.14, 0.88, 1, 0.06), 0, 0.08,
      screen('top', rounded(0.2, 0.22, 0.8, 0.4, 0.03)),
      accent(screen('top', rounded(0.2, 0.48, 0.8, 0.66, 0.03))),
      screen('top', rounded(0.2, 0.74, 0.8, 0.92, 0.03))),
  ],
  folder: [
    prism(FOLDER, 0, 0.16),
    accent(prism(rectangle(0.08, 0.48, 0.92, 1), 0.16, 0.05)),
  ],
  index: [
    box(0.1, 0.345, 0, 0.8, 0.4, 0.16),
    prism(rectangle(0.18, 0.5, 0.82, 0.7), 0.16, 0.03),
    prism(rectangle(0.18, 0.46, 0.82, 0.7), 0.19, 0.03),
    accent(prism(TABBED_CARD, 0.22, 0.03)),
  ],
  vector: [
    cylinder(C, C, 0.4, 0, 0.2),
    cylinder(C, C, 0.4, 0.26, 0.2,
      accent(line('top', C, C, 0.72, 0.3)), accent(light('top', 0.72, 0.3, 0.045)),
      accent(line('top', C, C, 0.28, 0.38)), accent(light('top', 0.28, 0.38, 0.045)),
      accent(line('top', C, C, 0.56, 0.76)), accent(light('top', 0.56, 0.76, 0.045)),
      light('top', C, C)),
  ],
  calendar: [
    prism(rounded(0.12, 0.22, 0.88, 1, 0.06), 0, 0.08,
      accent(screen('top', rectangle(0.16, 0.28, 0.84, 0.42))),
      ...[0.56, 0.7, 0.84].flatMap(y => [0.28, 0.43, 0.57, 0.72].map(x => light('top', x, y, 0.025)))),
    prism(rectangle(0.3, 0.12, 0.34, 0.26), 0, 0.12),
    prism(rectangle(0.66, 0.12, 0.7, 0.26), 0, 0.12),
  ],
  tree: [
    prism(BRANCHES, 0, 0.05),
    accent(prism(rounded(0.36, 0.14, 0.64, 0.38, 0.04), 0, 0.08)),
    prism(rounded(0.06, 0.72, 0.34, 0.96, 0.04), 0, 0.08),
    prism(rounded(0.36, 0.72, 0.64, 0.96, 0.04), 0, 0.08),
    prism(rounded(0.66, 0.72, 0.94, 0.96, 0.04), 0, 0.08),
  ],
  history: [
    prism(circle(C, 0.54, 0.43), 0, 0.08,
      line('top', ...arc(C, 0.54, 0.3, -200, -500).flat()), block('top', BACK_ARROW),
      accent(line('top', C, 0.36, C, 0.54, 0.62, 0.62))),
  ],
  copy: [
    prism(rounded(0.34, 0.16, 0.92, 0.74, 0.08), 0, 0.05),
    accent(prism(rounded(0.08, 0.4, 0.66, 0.98, 0.08), 0, 0.08)),
  ],
}
