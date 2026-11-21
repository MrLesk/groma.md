import type { ICON_KINDS } from '../../../../icons.ts'
import { accent, arc, circle, cylinder, frame, line, panel, rectangle, rounded, screen, upright } from '../parts.ts'
import type { IconPart, Spot } from '../parts.ts'
import { C, light, ellipse } from './shared-outlines.ts'

/** A chart's line seen from the front, as x, z pairs: a band that climbs from the left to the right. */
const CLIMB: Spot[] = [
  [0.14, 0.2], [0.34, 0.4], [0.5, 0.32], [0.7, 0.58], [0.86, 0.76],
  [0.86, 0.84], [0.7, 0.66], [0.5, 0.4], [0.34, 0.48], [0.14, 0.28],
]

/** The lower edge of a heartbeat line seen from the front, as x, z pairs: flat, one sharp beat, flat again. */
const BEAT_LINE: Spot[] = [[0.08, 0.3], [0.3, 0.3], [0.38, 0.5], [0.5, 0.14], [0.6, 0.62], [0.68, 0.3], [0.92, 0.3]]
/** The heartbeat line as a band: its lower edge and the same edge lifted. */
const BEAT: Spot[] = [...BEAT_LINE, ...BEAT_LINE.map(([x, z]): Spot => [x, z + 0.09]).reverse()]

/** A funnel seen from the front, as x, z pairs: wide at the top, a spout below. */
const FUNNEL: Spot[] = [[0.08, 0.86], [0.92, 0.86], [0.58, 0.44], [0.58, 0.06], [0.42, 0.16], [0.42, 0.44]]

/** A warning sign seen from the front, as x, z pairs: a triangle on its base. */
const WARNING: Spot[] = [[0.06, 0.06], [0.94, 0.06], [0.5, 0.9]]

/** Watching: how a system is measured and observed. */
export const watchingIcons: Record<(typeof ICON_KINDS.watching)[number], readonly IconPart[]> = {
  chart: [
    upright(rounded(0.04, 0.16, 0.96, 0.84, 0.1), 0, 0.08),
    accent(panel(CLIMB, 0.5, 0.03)),
  ],
  gauge: [
    upright(rounded(0.22, 0.36, 0.78, 0.64, 0.06), 0, 0.1),
    panel(arc(C, 0.1, 0.44, 0, 180), 0.44, 0.12,
      line('south', ...arc(C, 0.1, 0.33, 20, 160).flat()),
      line('south', 0.12, 0.14, 0.2, 0.16), line('south', 0.88, 0.14, 0.8, 0.16), line('south', C, 0.5, C, 0.43),
      accent(line('south', C, 0.14, 0.7, 0.4)),
      accent(light('south', C, 0.14, 0.045))),
  ],
  pulse: [
    upright(rounded(0.04, 0.16, 0.96, 0.84, 0.1), 0, 0.08),
    accent(panel(BEAT, 0.5, 0.03)),
  ],
  dashboard: [
    panel(rounded(0.06, 0, 0.94, 0.7, 0.06), 0.45, 0.08,
      screen('south', rectangle(0.14, 0.36, 0.5, 0.62)), accent(screen('south', rectangle(0.56, 0.36, 0.86, 0.62))),
      screen('south', rectangle(0.14, 0.08, 0.4, 0.3)), screen('south', rectangle(0.46, 0.08, 0.86, 0.3))),
  ],
  bug: [
    upright(rounded(0.06, 0.08, 0.94, 0.92, 0.1), 0, 0.05,
      line('top', 0.36, 0.44, 0.18, 0.34), line('top', 0.33, 0.56, 0.14, 0.56), line('top', 0.36, 0.68, 0.18, 0.8),
      line('top', 0.64, 0.44, 0.82, 0.34), line('top', 0.67, 0.56, 0.86, 0.56), line('top', 0.64, 0.68, 0.82, 0.8),
      line('top', 0.45, 0.18, 0.38, 0.1), line('top', 0.55, 0.18, 0.62, 0.1)),
    upright(circle(C, 0.25, 0.09), 0.05, 0.1),
    accent(upright(ellipse(C, 0.56, 0.17, 0.22), 0.05, 0.13, line('top', C, 0.34, C, 0.78))),
  ],
  eye: [
    upright(rounded(0.36, 0.4, 0.64, 0.6, 0.05), 0, 0.06),
    panel(ellipse(C, 0.36, 0.44, 0.28), 0.44, 0.1,
      accent(screen('south', circle(C, 0.36, 0.16))), accent(light('south', C, 0.36, 0.07))),
  ],
  radar: [
    cylinder(C, C, 0.44, 0, 0.08),
    cylinder(C, C, 0.4, 0.08, 0.16,
      frame('top', circle(C, C, 0.28)), frame('top', circle(C, C, 0.14)),
      accent(line('top', C, C, 0.8, 0.26)), accent(light('top', 0.66, 0.62, 0.04))),
  ],
  funnel: [
    panel(FUNNEL, 0.35, 0.3,
      accent(line('south', 0.2, 0.72, 0.8, 0.72)), accent(line('south', 0.32, 0.58, 0.68, 0.58))),
  ],
  trace: [
    upright(rounded(0.04, 0.1, 0.96, 0.9, 0.1), 0, 0.05, line('top', 0.18, 0.72, 0.4, 0.46, 0.6, 0.62, 0.82, 0.28)),
    cylinder(0.18, 0.72, 0.07, 0.05, 0.08),
    cylinder(0.4, 0.46, 0.05, 0.05, 0.06),
    cylinder(0.6, 0.62, 0.05, 0.05, 0.06),
    accent(cylinder(0.82, 0.28, 0.08, 0.05, 0.12)),
  ],
  alert: [
    panel(WARNING, 0.44, 0.12, accent(line('south', C, 0.62, C, 0.34)), accent(light('south', C, 0.2, 0.04))),
  ],
}
