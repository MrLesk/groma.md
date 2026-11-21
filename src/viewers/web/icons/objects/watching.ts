import type { ICON_KINDS } from '../../../../icons.ts'
import { accent, arc, circle, cylinder, frame, line, prism, rectangle, rounded, screen } from '../parts.ts'
import type { IconPart, Spot } from '../parts.ts'
import { C, light, ellipse } from './shared-outlines.ts'

/** A chart's line seen from above, as x, y pairs: a band that runs north as it goes from the west to the east. */
const CLIMB: Spot[] = [
  [0.14, 0.8], [0.34, 0.6], [0.5, 0.68], [0.7, 0.42], [0.86, 0.24],
  [0.86, 0.16], [0.7, 0.34], [0.5, 0.6], [0.34, 0.52], [0.14, 0.72],
]

/** The south edge of a heartbeat line seen from above, as x, y pairs: flat, one sharp beat, flat again. */
const BEAT_LINE: Spot[] = [[0.08, 0.7], [0.3, 0.7], [0.38, 0.5], [0.5, 0.86], [0.6, 0.38], [0.68, 0.7], [0.92, 0.7]]
/** The heartbeat line as a band: its south edge and the same edge moved north. */
const BEAT: Spot[] = [...BEAT_LINE, ...BEAT_LINE.map(([x, y]): Spot => [x, y - 0.09]).reverse()]

/** A funnel seen from above, as x, y pairs: wide to the north, a spout to the south. */
const FUNNEL: Spot[] = [[0.08, 0.14], [0.92, 0.14], [0.58, 0.56], [0.58, 0.94], [0.42, 0.84], [0.42, 0.56]]

/** A warning sign seen from above, as x, y pairs: a triangle with its base to the south. */
const WARNING: Spot[] = [[0.06, 0.94], [0.94, 0.94], [0.5, 0.1]]

/** Watching: how a system is measured and observed. */
export const watchingIcons: Record<(typeof ICON_KINDS.watching)[number], readonly IconPart[]> = {
  chart: [
    prism(rounded(0.04, 0.125, 0.96, 0.805, 0.1), 0, 0.08),
    accent(prism(CLIMB, 0.08, 0.05)),
  ],
  gauge: [
    prism(arc(C, 0.9, 0.44, 0, -180), 0, 0.12,
      line('top', ...arc(C, 0.9, 0.33, -20, -160).flat()),
      line('top', 0.12, 0.86, 0.2, 0.84), line('top', 0.88, 0.86, 0.8, 0.84), line('top', C, 0.5, C, 0.57),
      accent(line('top', C, 0.86, 0.7, 0.6)),
      accent(light('top', C, 0.86, 0.045))),
  ],
  pulse: [
    prism(rounded(0.04, 0.22, 0.96, 0.9, 0.1), 0, 0.08),
    accent(prism(BEAT, 0.08, 0.05)),
  ],
  dashboard: [
    prism(rounded(0.06, 0.3, 0.94, 1, 0.06), 0, 0.08,
      screen('top', rectangle(0.14, 0.38, 0.5, 0.64)), accent(screen('top', rectangle(0.56, 0.38, 0.86, 0.64))),
      screen('top', rectangle(0.14, 0.7, 0.4, 0.92)), screen('top', rectangle(0.46, 0.7, 0.86, 0.92))),
  ],
  bug: [
    prism(rounded(0.06, 0.08, 0.94, 0.92, 0.1), 0, 0.05,
      line('top', 0.36, 0.44, 0.18, 0.34), line('top', 0.33, 0.56, 0.14, 0.56), line('top', 0.36, 0.68, 0.18, 0.8),
      line('top', 0.64, 0.44, 0.82, 0.34), line('top', 0.67, 0.56, 0.86, 0.56), line('top', 0.64, 0.68, 0.82, 0.8),
      line('top', 0.45, 0.18, 0.38, 0.1), line('top', 0.55, 0.18, 0.62, 0.1)),
    prism(circle(C, 0.25, 0.09), 0.05, 0.1),
    accent(prism(ellipse(C, 0.56, 0.17, 0.22), 0.05, 0.13, line('top', C, 0.34, C, 0.78))),
  ],
  eye: [
    prism(ellipse(C, 0.64, 0.44, 0.28), 0, 0.12,
      accent(screen('top', circle(C, 0.64, 0.16))), accent(light('top', C, 0.64, 0.07))),
  ],
  radar: [
    cylinder(C, C, 0.44, 0, 0.08),
    cylinder(C, C, 0.4, 0.08, 0.16,
      frame('top', circle(C, C, 0.28)), frame('top', circle(C, C, 0.14)),
      accent(line('top', C, C, 0.8, 0.26)), accent(light('top', 0.66, 0.62, 0.04))),
  ],
  funnel: [
    prism(FUNNEL, 0, 0.16,
      accent(line('top', 0.2, 0.28, 0.8, 0.28)), accent(line('top', 0.32, 0.42, 0.68, 0.42))),
  ],
  trace: [
    prism(rounded(0.04, 0.1, 0.96, 0.9, 0.1), 0, 0.05, line('top', 0.18, 0.72, 0.4, 0.46, 0.6, 0.62, 0.82, 0.28)),
    cylinder(0.18, 0.72, 0.07, 0.05, 0.08),
    cylinder(0.4, 0.46, 0.05, 0.05, 0.06),
    cylinder(0.6, 0.62, 0.05, 0.05, 0.06),
    accent(cylinder(0.82, 0.28, 0.08, 0.05, 0.12)),
  ],
  alert: [
    prism(WARNING, 0, 0.12, accent(line('top', C, 0.38, C, 0.66)), accent(light('top', C, 0.8, 0.04))),
  ],
  target: [
    cylinder(C, C, 0.46, 0, 0.05,
      line('top', C, 0.05, C, 0.16), line('top', C, 0.84, C, 0.95), line('top', 0.05, C, 0.16, C), line('top', 0.84, C, 0.95, C)),
    cylinder(C, C, 0.29, 0.05, 0.05),
    accent(cylinder(C, C, 0.12, 0.1, 0.07)),
  ],
}
