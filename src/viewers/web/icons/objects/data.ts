import type { ICON_KINDS } from '../../../../icons.ts'
import { accent, arc, block, box, circle, cylinder, frame, line, panel, rectangle, rounded, screen, upright } from '../parts.ts'
import type { IconPart, Spot } from '../parts.ts'
import { C, light } from './shared-outlines.ts'

/** A sheet of paper seen from the front, as x, z pairs: it stands on the ground from `x` and its top right corner is folded away. */
function page(x: number): Spot[] {
  return [[x, 0], [x + 0.5, 0], [x + 0.5, 0.64], [x + 0.36, 0.8], [x, 0.8]]
}

/** A magnifier's handle seen from above, as x, y pairs: a bar from the rim of the lens towards the east, a little south. */
const GRIP: Spot[] = [[0.592, 0.54], [0.874, 0.642], [0.902, 0.566], [0.62, 0.464]]

/** A lightning bolt seen from above, as x, y pairs. */
const BOLT: Spot[] = [[0.56, 0.26], [0.38, 0.54], [0.49, 0.54], [0.43, 0.76], [0.63, 0.46], [0.52, 0.46]]

/** A bucket seen from the front, as x, z pairs: wider at its rim than at its foot. */
const BUCKET: Spot[] = [[0.22, 0], [0.78, 0], [0.9, 0.58], [0.1, 0.58]]
/** The bucket's handle seen from the front, as x, z pairs: an arch over the rim. */
const BAIL: Spot[] = [...arc(C, 0.58, 0.36, 0, 180), ...arc(C, 0.58, 0.3, 180, 0)]

/** A folder's back seen from the front, as x, z pairs: a sheet with a tab at the top left. */
const FOLDER: Spot[] = [[0.08, 0], [0.92, 0], [0.92, 0.6], [0.5, 0.6], [0.42, 0.7], [0.08, 0.7]]

/** An index card with a tab seen from the front, as x, z pairs; it stands in its box. */
const TABBED_CARD: Spot[] = [[0.18, 0.3], [0.82, 0.3], [0.82, 0.56], [0.6, 0.56], [0.56, 0.64], [0.4, 0.64], [0.36, 0.56], [0.18, 0.56]]

/** The branches of a tree diagram seen from the front, as x, z pairs: a stem from the root down to a bar with three stems. */
const BRANCHES: Spot[] = [
  [0.48, 0.62], [0.52, 0.62], [0.52, 0.47], [0.82, 0.47], [0.82, 0.28], [0.78, 0.28], [0.78, 0.43], [0.52, 0.43],
  [0.52, 0.28], [0.48, 0.28], [0.48, 0.43], [0.22, 0.43], [0.22, 0.28], [0.18, 0.28], [0.18, 0.47], [0.48, 0.47],
]

/** The head of the arrow that runs back around a clock face, as x, z pairs: it points down and to the west. */
const BACK_ARROW: Spot[] = [[0.2, 0.57], [0.22, 0.7], [0.32, 0.61]]

/** Data: where things are kept and found. */
export const dataIcons: Record<(typeof ICON_KINDS.data)[number], readonly IconPart[]> = {
  database: [
    cylinder(C, C, 0.38, 0, 0.18),
    cylinder(C, C, 0.38, 0.24, 0.18),
    accent(cylinder(C, C, 0.38, 0.48, 0.18, frame('top', circle(C, C, 0.24)))),
  ],
  cache: [
    upright(rounded(0.06, 0.14, 0.94, 0.86, 0.1), 0, 0.06),
    upright(rounded(0.16, 0.22, 0.84, 0.78, 0.07), 0.12, 0.08, accent(block('top', BOLT))),
  ],
  storage: [
    panel(BUCKET, 0.28, 0.44, line('south', 0.13, 0.46, 0.87, 0.46), line('south', 0.19, 0.14, 0.81, 0.14)),
    accent(panel(BAIL, 0.47, 0.06)),
  ],
  backup: [
    panel(rounded(0.14, 0, 0.86, 0.7, 0.06), 0.3, 0.4,
      line('south', 0.14, 0.56, 0.86, 0.56),
      accent(screen('south', rectangle(0.32, 0.26, 0.68, 0.44))),
      line('south', 0.44, 0.14, 0.56, 0.14)),
  ],
  document: [
    panel(page(0.14), 0.42, 0.03),
    panel(page(0.32), 0.52, 0.03,
      line('south', 0.68, 0.8, 0.68, 0.64, 0.82, 0.64),
      accent(line('south', 0.4, 0.56, 0.62, 0.56)),
      line('south', 0.4, 0.42, 0.74, 0.42), line('south', 0.4, 0.28, 0.74, 0.28), line('south', 0.4, 0.14, 0.62, 0.14)),
  ],
  search: [
    upright(rounded(0.1, 0.08, 0.9, 0.92, 0.08), 0, 0.06,
      line('top', 0.22, 0.26, 0.6, 0.26), line('top', 0.22, 0.42, 0.78, 0.42),
      line('top', 0.22, 0.58, 0.78, 0.58), line('top', 0.22, 0.74, 0.5, 0.74)),
    accent(cylinder(0.38, 0.42, 0.24, 0.16, 0.05, screen('top', circle(0.38, 0.42, 0.17)))),
    upright(GRIP, 0.16, 0.05),
  ],
  migration: [
    box(0.06, 0.3, 0, 0.26, 0.4, 0.16, line('top', 0.15, 0.42, 0.23, 0.5, 0.15, 0.58)),
    box(0.37, 0.3, 0, 0.26, 0.4, 0.36, line('top', 0.46, 0.42, 0.54, 0.5, 0.46, 0.58)),
    accent(box(0.68, 0.3, 0, 0.26, 0.4, 0.56, line('top', 0.77, 0.42, 0.85, 0.5, 0.77, 0.58))),
  ],
  disk: [
    upright(rounded(0.1, 0.14, 0.9, 0.86, 0.08), 0, 0.14,
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
    upright(rounded(0.06, 0.14, 0.94, 0.86, 0.06), 0, 0.1,
      accent(screen('top', rectangle(0.1, 0.18, 0.9, 0.34))),
      line('top', 0.06, 0.34, 0.94, 0.34), line('top', 0.06, 0.52, 0.94, 0.52), line('top', 0.06, 0.7, 0.94, 0.7),
      line('top', 0.36, 0.14, 0.36, 0.86), line('top', 0.65, 0.14, 0.65, 0.86)),
  ],
  directory: [
    panel(rounded(0.14, 0, 0.8, 0.8, 0.05), 0.42, 0.14,
      line('south', 0.24, 0, 0.24, 0.8),
      accent(screen('south', circle(0.52, 0.5, 0.1))),
      accent(line('south', ...arc(0.52, 0.22, 0.16, 0, 180).flat()))),
    panel(rectangle(0.8, 0.56, 0.9, 0.7), 0.46, 0.06),
    panel(rectangle(0.8, 0.36, 0.9, 0.5), 0.46, 0.06),
    panel(rectangle(0.8, 0.16, 0.9, 0.3), 0.46, 0.06),
  ],
  registry: [
    panel(rectangle(0.08, 0, 0.92, 0.84), 0.38, 0.24,
      line('south', 0.08, 0.28, 0.92, 0.28), line('south', 0.08, 0.56, 0.92, 0.56),
      screen('south', rectangle(0.18, 0.02, 0.38, 0.2)), screen('south', rectangle(0.58, 0.02, 0.78, 0.2)),
      screen('south', rectangle(0.16, 0.3, 0.36, 0.48)), screen('south', rectangle(0.44, 0.3, 0.64, 0.48)),
      accent(screen('south', rectangle(0.3, 0.58, 0.5, 0.76)))),
  ],
  log: [
    panel(rounded(0.14, 0, 0.86, 0.82, 0.05), 0.44, 0.08,
      accent(light('south', 0.26, 0.66)), accent(line('south', 0.34, 0.66, 0.74, 0.66)),
      light('south', 0.26, 0.5), line('south', 0.34, 0.5, 0.64, 0.5),
      light('south', 0.26, 0.34), line('south', 0.34, 0.34, 0.74, 0.34),
      light('south', 0.26, 0.18), line('south', 0.34, 0.18, 0.56, 0.18)),
  ],
  feed: [
    panel(rounded(0.12, 0, 0.88, 0.86, 0.06), 0.45, 0.06,
      screen('south', rounded(0.2, 0.6, 0.8, 0.78, 0.03)),
      accent(screen('south', rounded(0.2, 0.34, 0.8, 0.52, 0.03))),
      screen('south', rounded(0.2, 0.08, 0.8, 0.26, 0.03))),
  ],
  folder: [
    panel(FOLDER, 0.4, 0.18),
    accent(panel(rectangle(0.08, 0, 0.92, 0.52), 0.58, 0.04)),
  ],
  index: [
    box(0.1, 0.3, 0, 0.8, 0.4, 0.3),
    panel(rectangle(0.18, 0.3, 0.82, 0.5), 0.36, 0.03),
    panel(rectangle(0.18, 0.3, 0.82, 0.54), 0.47, 0.03),
    accent(panel(TABBED_CARD, 0.58, 0.03)),
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
    panel(rounded(0.12, 0, 0.88, 0.78, 0.06), 0.45, 0.07,
      accent(screen('south', rectangle(0.16, 0.58, 0.84, 0.72))),
      ...[0.44, 0.3, 0.16].flatMap(z => [0.28, 0.43, 0.57, 0.72].map(x => light('south', x, z, 0.025)))),
    panel(rectangle(0.3, 0.74, 0.34, 0.88), 0.53, 0.03),
    panel(rectangle(0.66, 0.74, 0.7, 0.88), 0.53, 0.03),
  ],
  tree: [
    panel(BRANCHES, 0.48, 0.04),
    accent(panel(rounded(0.36, 0.62, 0.64, 0.86, 0.04), 0.47, 0.06)),
    panel(rounded(0.06, 0.04, 0.34, 0.28, 0.04), 0.47, 0.06),
    panel(rounded(0.36, 0.04, 0.64, 0.28, 0.04), 0.47, 0.06),
    panel(rounded(0.66, 0.04, 0.94, 0.28, 0.04), 0.47, 0.06),
  ],
  history: [
    panel(circle(C, 0.46, 0.43), 0.44, 0.1,
      line('south', ...arc(C, 0.46, 0.3, 200, 500).flat()), block('south', BACK_ARROW),
      accent(line('south', C, 0.64, C, 0.46, 0.62, 0.38))),
  ],
  copy: [
    panel(rounded(0.34, 0.26, 0.92, 0.84, 0.08), 0.4, 0.05),
    accent(panel(rounded(0.08, 0.02, 0.66, 0.6, 0.08), 0.5, 0.05)),
  ],
}
