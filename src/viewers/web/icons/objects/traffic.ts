import type { ICON_KINDS } from '../../../../icons.ts'
import { accent, arc, box, circle, cylinder, line, panel, rectangle, rounded, screen, upright } from '../parts.ts'
import type { IconMark, IconPart, Spot } from '../parts.ts'
import { C, ellipse } from './shared-outlines.ts'

/** A globe's face around (x, z) with radius `r`, as marks on a south wall: the equator, two parallels and one meridian. */
function globeMarks(x: number, z: number, r: number): IconMark[] {
  const chord = (dz: number): number => Math.sqrt(r * r - dz * dz)
  const parallel = (dz: number): IconMark => line('south', x - chord(dz), z + dz, x + chord(dz), z + dz)
  const meridian = ellipse(x, z, r * 0.45, r)
  return [parallel(0), parallel(r * 0.52), parallel(-r * 0.52), line('south', ...meridian.flat(), ...meridian[0]!)]
}

/** The edge of a gate's arched opening seen from the front, as x, z pairs; it is the gate's accent. */
const OPENING: Spot[] = [[0.72, 0], ...arc(C, 0.4, 0.22, 0, 180), [0.28, 0]]
/** A gate seen from the front, as x, z pairs: two legs under a beam, around the opening. */
const GATE: Spot[] = [
  [0.06, 0], [0.06, 0.74], ...arc(0.14, 0.74, 0.08, 180, 90), ...arc(0.86, 0.74, 0.08, 90, 0), [0.94, 0],
  ...OPENING,
]

/** A signpost's board that points east, seen from the front, as x, z pairs. */
const BOARD_EAST: Spot[] = [[0.53, 0.6], [0.82, 0.6], [0.92, 0.7], [0.82, 0.8], [0.53, 0.8]]
/** A signpost's board that points west, seen from the front, as x, z pairs. */
const BOARD_WEST: Spot[] = [[0.47, 0.3], [0.47, 0.5], [0.18, 0.5], [0.08, 0.4], [0.18, 0.3]]

/** A small lightning bolt seen from the front, as x, z pairs. */
const SPARK: Spot[] = [[0.8, 0.72], [0.62, 0.38], [0.73, 0.38], [0.66, 0.06], [0.9, 0.46], [0.78, 0.46]]

/** The shackle of the padlock on a private link, seen from the front, as x, z pairs: an arch on two legs. */
const LINK_SHACKLE: Spot[] = [
  [0.38, 0.36], ...arc(C, 0.48, 0.12, 180, 0), [0.62, 0.36],
  [0.56, 0.36], ...arc(C, 0.48, 0.06, 0, 180), [0.44, 0.36],
]

/** The joints of a brick wall as marks on a south wall: three courses lines and the upright joints between bricks. */
const BRICK_JOINTS: IconMark[] = [
  line('south', 0.08, 0.175, 0.92, 0.175), line('south', 0.08, 0.35, 0.92, 0.35), line('south', 0.08, 0.525, 0.92, 0.525),
  line('south', 0.36, 0, 0.36, 0.175), line('south', 0.64, 0, 0.64, 0.175),
  line('south', 0.22, 0.175, 0.22, 0.35), line('south', 0.5, 0.175, 0.5, 0.35), line('south', 0.78, 0.175, 0.78, 0.35),
  line('south', 0.36, 0.35, 0.36, 0.525), line('south', 0.64, 0.35, 0.64, 0.525),
  line('south', 0.22, 0.525, 0.22, 0.7), line('south', 0.5, 0.525, 0.5, 0.7), line('south', 0.78, 0.525, 0.78, 0.7),
]

/** Traffic: how requests reach a system and travel between its parts. */
export const trafficIcons: Record<(typeof ICON_KINDS.traffic)[number], readonly IconPart[]> = {
  gateway: [
    panel(GATE, 0.36, 0.28, accent(line('south', ...OPENING.flat()))),
  ],
  route: [
    upright(rounded(0.3, 0.36, 0.7, 0.64, 0.06), 0, 0.05),
    panel(rectangle(0.47, 0.05, 0.53, 0.9), 0.47, 0.06),
    accent(panel(BOARD_EAST, 0.47, 0.06)),
    panel(BOARD_WEST, 0.47, 0.06),
  ],
  globe: [
    upright(rounded(0.34, 0.38, 0.66, 0.62, 0.05), 0, 0.06),
    panel(circle(C, 0.5, 0.42), 0.44, 0.12, ...globeMarks(C, 0.5, 0.42).map(accent)),
  ],
  cdn: [
    upright(rounded(0.24, 0.38, 0.56, 0.62, 0.05), 0, 0.06),
    panel(circle(0.4, 0.46, 0.36), 0.42, 0.12, ...globeMarks(0.4, 0.46, 0.36)),
    accent(panel(SPARK, 0.58, 0.04)),
  ],
  network: [
    upright(rounded(0.04, 0.1, 0.96, 0.9, 0.1), 0, 0.05,
      line('top', 0.26, 0.3, 0.74, 0.3, 0.74, 0.7, 0.26, 0.7, 0.26, 0.3), line('top', 0.26, 0.3, 0.74, 0.7)),
    cylinder(0.26, 0.3, 0.09, 0.05, 0.1),
    cylinder(0.74, 0.3, 0.09, 0.05, 0.1),
    cylinder(0.26, 0.7, 0.09, 0.05, 0.1),
    accent(cylinder(0.74, 0.7, 0.09, 0.05, 0.1)),
  ],
  balancer: [
    upright(rounded(0.04, 0.08, 0.96, 0.92, 0.1), 0, 0.05,
      line('top', 0.24, 0.5, 0.5, 0.5), line('top', 0.5, 0.5, 0.72, 0.24), line('top', 0.5, 0.5, 0.72, 0.5),
      line('top', 0.5, 0.5, 0.72, 0.76)),
    accent(cylinder(0.2, 0.5, 0.1, 0.05, 0.12)),
    box(0.72, 0.17, 0.05, 0.14, 0.14, 0.1),
    box(0.72, 0.43, 0.05, 0.14, 0.14, 0.1),
    box(0.72, 0.69, 0.05, 0.14, 0.14, 0.1),
  ],
  firewall: [
    panel(rectangle(0.08, 0, 0.92, 0.7), 0.42, 0.16,
      accent(screen('south', rectangle(0.36, 0.35, 0.64, 0.525))), ...BRICK_JOINTS),
  ],
  dns: [
    upright(rounded(0.22, 0.36, 0.52, 0.6, 0.05), 0, 0.06),
    panel(circle(0.37, 0.5, 0.34), 0.42, 0.12, ...globeMarks(0.37, 0.5, 0.34)),
    accent(panel(rounded(0.42, 0.04, 0.98, 0.3, 0.05), 0.58, 0.04, line('south', 0.5, 0.17, 0.9, 0.17))),
  ],
  vpn: [
    upright(rounded(0.02, 0.28, 0.98, 0.72, 0.1), 0, 0.05, line('top', 0.16, 0.5, 0.84, 0.5)),
    cylinder(0.15, 0.5, 0.09, 0.05, 0.1),
    cylinder(0.85, 0.5, 0.09, 0.05, 0.1),
    accent(panel(rounded(0.33, 0.05, 0.67, 0.36, 0.05), 0.44, 0.12, line('south', C, 0.25, C, 0.15))),
    accent(panel(LINK_SHACKLE, 0.47, 0.06)),
  ],
}
