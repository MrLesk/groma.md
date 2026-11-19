import type { IconName } from '../../../icons.ts'
import { accent, arc, ball, box, circle, cylinder, frame, line, panel, prism, rectangle, rounded, screen, solid } from './parts.ts'
import type { IconMark, IconPart, MarkFace, Spot } from './parts.ts'

/** The middle of the footprint. */
const C = 0.5

/** A small round light or key at (a, b). */
function light(on: MarkFace, a: number, b: number, r = 0.03): IconMark {
  return solid(on, circle(a, b, r))
}

/** A gear seen from above: each tooth is a trapezoid on the root circle. */
function gear(outer: number, root: number, teeth: number): Spot[] {
  const spot = (degrees: number, radius: number): Spot => {
    const angle = degrees * Math.PI / 180
    return [C + radius * Math.cos(angle), C + radius * Math.sin(angle)]
  }
  return Array.from({ length: teeth }, (_, tooth) => {
    const at = (tooth * 360) / teeth
    return [spot(at - 14, root), spot(at - 8, outer), spot(at + 8, outer), spot(at + 14, root)]
  }).flat()
}

/** A cloud seen from the front, as x, z pairs: three bumps over a flat base. */
const CLOUD: Spot[] = [
  ...arc(0.27, 0.33, 0.19, 270, 95.1),
  ...arc(0.5, 0.48, 0.25, 171, 0),
  ...arc(0.75, 0.31, 0.17, 90, -90),
]

/** A padlock's shackle seen from the front, as x, z pairs: an arch on two legs. */
const SHACKLE: Spot[] = [
  [0.28, 0.46], ...arc(C, 0.66, 0.22, 180, 0), [0.72, 0.46],
  [0.61, 0.46], ...arc(C, 0.66, 0.11, 0, 180), [0.39, 0.46],
]

/** A sheet of paper lying down with its north corner at (x, y) and its east corner folded away. */
function sheet(x: number, y: number): Spot[] {
  return [[x, y], [x + 0.42, y], [x + 0.58, y + 0.16], [x + 0.58, y + 0.8], [x, y + 0.8]]
}

/** A pin of the cache chip. */
function pin(x: number, y: number): IconPart {
  return box(x, y, 0, 0.08, 0.08, 0.08)
}

/** A gate seen from the front, as x, z pairs: two legs under a beam, with an arched opening. */
const GATE: Spot[] = [
  [0.06, 0], [0.06, 0.74], ...arc(0.14, 0.74, 0.08, 180, 90), ...arc(0.86, 0.74, 0.08, 90, 0), [0.94, 0],
  [0.72, 0], ...arc(C, 0.4, 0.22, 0, 180), [0.28, 0],
]
/** The edge of the gate's opening, which is its accent. */
const OPENING: number[] = [[0.72, 0], ...arc(C, 0.4, 0.22, 0, 180), [0.28, 0]].flat()

/**
 * One object per icon name, with one part or mark as its accent. The painter draws parts back to front and a
 * part over whatever it stands on, so their order here does not matter. Keep every object inside the 1 × 1
 * footprint, and no taller than it is wide.
 */
export const iconObjects: Record<IconName, readonly IconPart[]> = {
  person: [
    cylinder(C, C, 0.3, 0, 0.05),
    cylinder(C, C, 0.23, 0.05, 0.09),
    cylinder(C, C, 0.16, 0.14, 0.25),
    cylinder(C, C, 0.22, 0.39, 0.04),
    accent(ball(C, C, 0.63, 0.19)),
  ],
  agent: [
    cylinder(C, C, 0.16, 0, 0.1),
    prism(rounded(0.16, 0.24, 0.84, 0.76, 0.1), 0.1, 0.48,
      accent(screen('south', rounded(0.26, 0.22, 0.74, 0.46, 0.05))),
      accent(light('south', 0.39, 0.34, 0.035)), accent(light('south', 0.61, 0.34, 0.035))),
    cylinder(C, C, 0.02, 0.58, 0.2),
    ball(C, C, 0.82, 0.05),
  ],
  browser: [
    panel(rounded(0.04, 0, 0.96, 0.7, 0.07), 0.47, 0.06,
      line('south', 0.04, 0.52, 0.96, 0.52),
      light('south', 0.12, 0.61, 0.022), light('south', 0.2, 0.61, 0.022), light('south', 0.28, 0.61, 0.022),
      accent(screen('south', rounded(0.38, 0.575, 0.9, 0.645, 0.03))),
      frame('south', rounded(0.12, 0.1, 0.46, 0.42, 0.03)),
      line('south', 0.56, 0.38, 0.88, 0.38), line('south', 0.56, 0.26, 0.88, 0.26), line('south', 0.56, 0.14, 0.76, 0.14)),
  ],
  mobile: [
    panel(rounded(0.28, 0, 0.72, 0.92, 0.09), 0.46, 0.08,
      accent(screen('south', rounded(0.33, 0.12, 0.67, 0.84, 0.05))),
      line('south', 0.45, 0.06, 0.55, 0.06)),
  ],
  desktop: [
    prism(rounded(0.3, 0.34, 0.7, 0.66, 0.06), 0, 0.04),
    box(0.46, 0.47, 0.04, 0.08, 0.06, 0.2),
    panel(rounded(0.04, 0.22, 0.96, 0.86, 0.06), 0.45, 0.07,
      accent(screen('south', rounded(0.1, 0.28, 0.9, 0.8, 0.03))),
      accent(line('south', 0.2, 0.44, 0.36, 0.6, 0.52, 0.5, 0.8, 0.7))),
  ],
  terminal: [
    prism(rounded(0.14, 0.1, 0.86, 0.6, 0.07), 0, 0.62,
      accent(screen('south', rounded(0.23, 0.14, 0.77, 0.52, 0.05))),
      accent(line('south', 0.31, 0.41, 0.4, 0.34, 0.31, 0.27)),
      accent(line('south', 0.46, 0.27, 0.6, 0.27))),
    prism(rounded(0.14, 0.7, 0.86, 0.94, 0.05), 0, 0.05,
      line('top', 0.22, 0.78, 0.78, 0.78), line('top', 0.22, 0.86, 0.78, 0.86)),
  ],
  service: [
    box(0.2, 0.2, 0, 0.6, 0.6, 0.92,
      line('south', 0.2, 0.23, 0.8, 0.23), line('south', 0.2, 0.46, 0.8, 0.46), line('south', 0.2, 0.69, 0.8, 0.69),
      accent(light('south', 0.7, 0.115)), accent(light('south', 0.7, 0.345)),
      accent(light('south', 0.7, 0.575)), accent(light('south', 0.7, 0.805)),
      line('south', 0.28, 0.115, 0.48, 0.115), line('south', 0.28, 0.345, 0.48, 0.345),
      line('south', 0.28, 0.575, 0.48, 0.575), line('south', 0.28, 0.805, 0.48, 0.805),
      line('east', 0.2, 0.23, 0.8, 0.23), line('east', 0.2, 0.46, 0.8, 0.46), line('east', 0.2, 0.69, 0.8, 0.69)),
  ],
  worker: [
    prism(gear(0.47, 0.35, 8), 0, 0.16),
    accent(cylinder(C, C, 0.17, 0.16, 0.08, frame('top', circle(C, C, 0.08)))),
  ],
  gateway: [
    panel(GATE, 0.36, 0.28, accent(line('south', ...OPENING))),
  ],
  scheduler: [
    prism(rounded(0.28, 0.36, 0.72, 0.68, 0.06), 0, 0.06),
    panel(circle(C, 0.5, 0.43), 0.45, 0.12,
      frame('south', circle(C, 0.5, 0.35)),
      line('south', C, 0.8, C, 0.74), line('south', 0.8, 0.5, 0.74, 0.5), line('south', C, 0.2, C, 0.26), line('south', 0.2, 0.5, 0.26, 0.5),
      accent(line('south', C, 0.72, C, 0.5, 0.66, 0.4))),
  ],
  database: [
    cylinder(C, C, 0.38, 0, 0.22),
    cylinder(C, C, 0.38, 0.3, 0.22),
    accent(cylinder(C, C, 0.38, 0.6, 0.22)),
  ],
  cache: [
    pin(0.3, 0.1), pin(0.62, 0.1), pin(0.3, 0.82), pin(0.62, 0.82),
    pin(0.1, 0.3), pin(0.1, 0.62), pin(0.82, 0.3), pin(0.82, 0.62),
    prism(rounded(0.18, 0.18, 0.82, 0.82, 0.06), 0.04, 0.14),
    accent(prism(rounded(0.36, 0.36, 0.64, 0.64, 0.04), 0.18, 0.06)),
  ],
  queue: [
    prism(rounded(0.02, 0.3, 0.98, 0.7, 0.08), 0, 0.06),
    box(0.1, 0.4, 0.06, 0.2, 0.2, 0.2),
    box(0.4, 0.4, 0.06, 0.2, 0.2, 0.2),
    accent(box(0.7, 0.4, 0.06, 0.2, 0.2, 0.2)),
  ],
  storage: [
    box(0.22, 0.24, 0, 0.56, 0.52, 0.92,
      line('south', 0.22, 0.31, 0.78, 0.31), line('south', 0.22, 0.62, 0.78, 0.62),
      accent(line('south', 0.42, 0.16, 0.58, 0.16)), accent(line('south', 0.42, 0.47, 0.58, 0.47)), accent(line('south', 0.42, 0.78, 0.58, 0.78))),
  ],
  document: [
    prism(sheet(0.1, 0.14), 0, 0.03),
    prism(sheet(0.3, 0.06), 0.03, 0.03,
      line('top', 0.72, 0.06, 0.72, 0.22, 0.88, 0.22),
      accent(line('top', 0.38, 0.3, 0.62, 0.3)),
      line('top', 0.38, 0.44, 0.8, 0.44), line('top', 0.38, 0.58, 0.8, 0.58), line('top', 0.38, 0.72, 0.66, 0.72)),
  ],
  search: [
    box(0.64, 0.44, 0, 0.34, 0.12, 0.08),
    cylinder(0.36, C, 0.3, 0, 0.1, accent(screen('top', circle(0.36, C, 0.21)))),
  ],
  repository: [
    prism(rounded(0.08, 0.08, 0.92, 0.92, 0.1), 0, 0.05,
      line('top', 0.32, 0.74, 0.32, 0.26),
      accent(line('top', 0.32, 0.6, 0.5, 0.6, 0.68, 0.44, 0.68, 0.3))),
    cylinder(0.32, 0.74, 0.085, 0.05, 0.09),
    cylinder(0.32, 0.26, 0.085, 0.05, 0.09),
    accent(cylinder(0.68, 0.3, 0.085, 0.05, 0.09)),
  ],
  package: [
    box(0.16, 0.16, 0, 0.68, 0.68, 0.58,
      accent(screen('top', rectangle(0.43, 0.16, 0.57, 0.84))),
      accent(screen('south', rectangle(0.43, 0.58, 0.57, 0.34)))),
  ],
  cloud: [
    accent(panel(CLOUD, 0.42, 0.16)),
  ],
  lock: [
    prism(rounded(0.2, 0.3, 0.8, 0.7, 0.08), 0, 0.46,
      light('south', C, 0.27, 0.05), line('south', C, 0.22, C, 0.12)),
    accent(panel(SHACKLE, 0.45, 0.1)),
  ],
  mail: [
    prism(rounded(0.06, 0.2, 0.94, 0.8, 0.05), 0, 0.07,
      line('top', 0.08, 0.78, 0.38, 0.5), line('top', 0.92, 0.78, 0.62, 0.5),
      accent(line('top', 0.08, 0.22, C, 0.58, 0.92, 0.22))),
  ],
  chart: [
    prism(rounded(0.04, 0.26, 0.96, 0.74, 0.07), 0, 0.05),
    box(0.14, 0.4, 0.05, 0.18, 0.2, 0.26),
    box(0.41, 0.4, 0.05, 0.18, 0.2, 0.5),
    accent(box(0.68, 0.4, 0.05, 0.18, 0.2, 0.82)),
  ],
  board: [
    prism(rounded(0.04, 0.14, 0.96, 0.86, 0.07), 0, 0.05,
      line('top', 0.35, 0.14, 0.35, 0.86), line('top', 0.65, 0.14, 0.65, 0.86),
      screen('top', rectangle(0.1, 0.22, 0.29, 0.36)), screen('top', rectangle(0.1, 0.42, 0.29, 0.56)),
      accent(screen('top', rectangle(0.41, 0.22, 0.59, 0.36))),
      screen('top', rectangle(0.71, 0.22, 0.9, 0.36)), screen('top', rectangle(0.71, 0.42, 0.9, 0.56)), screen('top', rectangle(0.71, 0.62, 0.9, 0.76))),
  ],
}
