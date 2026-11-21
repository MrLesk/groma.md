import type { ICON_KINDS } from '../../../../icons.ts'
import { accent, arc, box, circle, cylinder, line, prism, rectangle, rounded, screen } from '../parts.ts'
import type { IconMark, IconPart, Spot } from '../parts.ts'
import { C, ellipse } from './shared-outlines.ts'

/** A globe's face around (x, y) with radius `r`, as marks on a top: the equator, two parallels and one meridian. */
function globeMarks(x: number, y: number, r: number): IconMark[] {
  const chord = (dy: number): number => Math.sqrt(r * r - dy * dy)
  const parallel = (dy: number): IconMark => line('top', x - chord(dy), y + dy, x + chord(dy), y + dy)
  const meridian = ellipse(x, y, r * 0.45, r)
  return [parallel(0), parallel(-r * 0.52), parallel(r * 0.52), line('top', ...meridian.flat(), ...meridian[0]!)]
}

/** The edge of a gate's arched opening seen from above, as x, y pairs; it is the gate's accent. */
const OPENING: Spot[] = [[0.72, 1], ...arc(C, 0.6, 0.22, 0, -180), [0.28, 1]]
/** A gate seen from above, as x, y pairs: two legs south of a beam, around the opening. */
const GATE: Spot[] = [
  [0.06, 1], [0.06, 0.26], ...arc(0.14, 0.26, 0.08, -180, -90), ...arc(0.86, 0.26, 0.08, -90, 0), [0.94, 1],
  ...OPENING,
]

/** A signpost's board that points east, seen from above, as x, y pairs. */
const BOARD_EAST: Spot[] = [[0.53, 0.4], [0.82, 0.4], [0.92, 0.3], [0.82, 0.2], [0.53, 0.2]]
/** A signpost's board that points west, seen from above, as x, y pairs. */
const BOARD_WEST: Spot[] = [[0.47, 0.7], [0.47, 0.5], [0.18, 0.5], [0.08, 0.6], [0.18, 0.7]]

/** A small lightning bolt seen from above, as x, y pairs. */
const SPARK: Spot[] = [[0.8, 0.28], [0.62, 0.62], [0.73, 0.62], [0.66, 0.94], [0.9, 0.54], [0.78, 0.54]]

/** The shackle of the padlock on a private link, seen from above, as x, y pairs: an arch on two legs. */
const LINK_SHACKLE: Spot[] = [
  [0.38, 0.64], ...arc(C, 0.52, 0.12, -180, 0), [0.62, 0.64],
  [0.56, 0.64], ...arc(C, 0.52, 0.06, 0, -180), [0.44, 0.64],
]

/** The joints of a brick wall as marks on a top: three course lines and the joints between the bricks of each course. */
const BRICK_JOINTS: IconMark[] = [
  line('top', 0.08, 0.825, 0.92, 0.825), line('top', 0.08, 0.65, 0.92, 0.65), line('top', 0.08, 0.475, 0.92, 0.475),
  line('top', 0.36, 1, 0.36, 0.825), line('top', 0.64, 1, 0.64, 0.825),
  line('top', 0.22, 0.825, 0.22, 0.65), line('top', 0.5, 0.825, 0.5, 0.65), line('top', 0.78, 0.825, 0.78, 0.65),
  line('top', 0.36, 0.65, 0.36, 0.475), line('top', 0.64, 0.65, 0.64, 0.475),
  line('top', 0.22, 0.475, 0.22, 0.3), line('top', 0.5, 0.475, 0.5, 0.3), line('top', 0.78, 0.475, 0.78, 0.3),
]

/** Traffic: how requests reach a system and travel between its parts. */
export const trafficIcons: Record<(typeof ICON_KINDS.traffic)[number], readonly IconPart[]> = {
  gateway: [
    prism(GATE, 0, 0.16, accent(line('top', ...OPENING.flat()))),
  ],
  route: [
    prism(rectangle(0.47, 0.1, 0.53, 0.95), 0, 0.05),
    accent(prism(BOARD_EAST, 0, 0.08)),
    prism(BOARD_WEST, 0, 0.08),
  ],
  globe: [
    prism(circle(C, 0.5, 0.42), 0, 0.12, ...globeMarks(C, 0.5, 0.42).map(accent)),
  ],
  cdn: [
    prism(circle(0.4, 0.54, 0.36), 0, 0.12, ...globeMarks(0.4, 0.54, 0.36)),
    accent(prism(SPARK, 0, 0.17)),
  ],
  network: [
    prism(rounded(0.04, 0.1, 0.96, 0.9, 0.1), 0, 0.05,
      line('top', 0.26, 0.3, 0.74, 0.3, 0.74, 0.7, 0.26, 0.7, 0.26, 0.3), line('top', 0.26, 0.3, 0.74, 0.7)),
    cylinder(0.26, 0.3, 0.09, 0.05, 0.1),
    cylinder(0.74, 0.3, 0.09, 0.05, 0.1),
    cylinder(0.26, 0.7, 0.09, 0.05, 0.1),
    accent(cylinder(0.74, 0.7, 0.09, 0.05, 0.1)),
  ],
  balancer: [
    prism(rounded(0.04, 0.08, 0.96, 0.92, 0.1), 0, 0.05,
      line('top', 0.24, 0.5, 0.5, 0.5), line('top', 0.5, 0.5, 0.72, 0.24), line('top', 0.5, 0.5, 0.72, 0.5),
      line('top', 0.5, 0.5, 0.72, 0.76)),
    accent(cylinder(0.2, 0.5, 0.1, 0.05, 0.12)),
    box(0.72, 0.17, 0.05, 0.14, 0.14, 0.1),
    box(0.72, 0.43, 0.05, 0.14, 0.14, 0.1),
    box(0.72, 0.69, 0.05, 0.14, 0.14, 0.1),
  ],
  firewall: [
    prism(rectangle(0.08, 0.3, 0.92, 1), 0, 0.16,
      accent(screen('top', rectangle(0.36, 0.475, 0.64, 0.65))), ...BRICK_JOINTS),
  ],
  dns: [
    prism(circle(0.37, 0.5, 0.34), 0, 0.12, ...globeMarks(0.37, 0.5, 0.34)),
    accent(prism(rounded(0.42, 0.7, 0.98, 0.96, 0.05), 0, 0.17, line('top', 0.5, 0.83, 0.9, 0.83))),
  ],
  vpn: [
    prism(rounded(0.02, 0.455, 0.98, 0.895, 0.1), 0, 0.05, line('top', 0.16, 0.675, 0.84, 0.675)),
    cylinder(0.15, 0.675, 0.09, 0.05, 0.1),
    cylinder(0.85, 0.675, 0.09, 0.05, 0.1),
    accent(prism(LINK_SHACKLE, 0, 0.1)),
    accent(prism(rounded(0.33, 0.64, 0.67, 0.95, 0.05), 0, 0.15, line('top', C, 0.75, C, 0.85))),
  ],
}
