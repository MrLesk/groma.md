import type { ICON_KINDS } from '../../../../icons.ts'
import { accent, arc, circle, frame, line, prism, rectangle, rounded, screen } from '../parts.ts'
import type { IconPart, Spot } from '../parts.ts'
import { C, light, gear, ellipse } from './shared-outlines.ts'

/** A headset's band seen from above, as x, y pairs: an arch from ear to ear. */
const HEADBAND: Spot[] = [...arc(C, 0.58, 0.38, 0, -180), ...arc(C, 0.58, 0.32, -180, 0)]
/** The headset's microphone arm seen from above, as x, y pairs: south from the east ear cup and in to the mouth. */
const MIC_ARM: Spot[] = [[0.82, 0.84], [0.86, 0.84], [0.86, 0.96], [0.58, 0.96], [0.58, 0.92], [0.82, 0.92]]

/** People and agents: who uses or operates a system. */
export const peopleIcons: Record<(typeof ICON_KINDS.people)[number], readonly IconPart[]> = {
  person: [
    prism(rounded(0.1, 0.2, 0.9, 0.8, 0.1), 0, 0.06),
    prism(arc(C, 0.8, 0.28, 0, -180), 0.06, 0.05),
    accent(prism(circle(C, 0.35, 0.15), 0.06, 0.05)),
  ],
  admin: [
    prism(rounded(0.1, 0.2, 0.9, 0.8, 0.1), 0, 0.06),
    prism(arc(C, 0.8, 0.28, 0, -180), 0.06, 0.05),
    prism(circle(C, 0.35, 0.15), 0.06, 0.05),
    accent(prism(gear(0.76, 0.66, 0.16, 0.11, 6), 0, 0.16, frame('top', circle(0.76, 0.66, 0.045)))),
  ],
  developer: [
    prism(rounded(0.1, 0.2, 0.9, 0.8, 0.1), 0, 0.06),
    prism(arc(C, 0.8, 0.28, 0, -180), 0.06, 0.05),
    prism(circle(C, 0.35, 0.15), 0.06, 0.05),
    accent(prism(rounded(0.54, 0.515, 0.96, 0.815, 0.04), 0, 0.16,
      line('top', 0.67, 0.605, 0.61, 0.665, 0.67, 0.725),
      line('top', 0.83, 0.605, 0.89, 0.665, 0.83, 0.725),
      line('top', 0.78, 0.585, 0.72, 0.745))),
  ],
  agent: [
    prism(rectangle(0.485, 0.24, 0.515, 0.4), 0, 0.05),
    prism(circle(C, 0.18, 0.06), 0, 0.08),
    prism(rounded(0.16, 0.4, 0.84, 0.92, 0.1), 0, 0.16,
      accent(screen('top', rounded(0.26, 0.52, 0.74, 0.8, 0.05))),
      accent(light('top', 0.39, 0.66, 0.035)), accent(light('top', 0.61, 0.66, 0.035))),
  ],
  team: [
    prism(rounded(0.04, 0.2, 0.96, 0.8, 0.1), 0, 0.06),
    prism(arc(0.34, 0.71, 0.2, 0, -180), 0.06, 0.05),
    prism(circle(0.34, 0.37, 0.11), 0.06, 0.05),
    prism(arc(0.66, 0.71, 0.2, 0, -180), 0.06, 0.1),
    accent(prism(circle(0.66, 0.37, 0.11), 0.06, 0.05)),
  ],
  guest: [
    prism(rounded(0.1, 0.2, 0.9, 0.8, 0.1), 0, 0.06),
    prism(arc(C, 0.8, 0.28, 0, -180), 0.06, 0.05),
    prism(circle(C, 0.35, 0.15), 0.06, 0.05),
    accent(prism(circle(0.76, 0.64, 0.16), 0, 0.16,
      line('top', ...arc(0.76, 0.59, 0.06, -180, 60).flat(), 0.76, 0.68), light('top', 0.76, 0.74, 0.02))),
  ],
  support: [
    prism(HEADBAND, 0, 0.06),
    accent(prism(rounded(0.06, 0.54, 0.24, 0.84, 0.05), 0, 0.12)),
    accent(prism(rounded(0.76, 0.54, 0.94, 0.84, 0.05), 0, 0.12)),
    prism(MIC_ARM, 0, 0.05),
    prism(circle(0.54, 0.94, 0.05), 0, 0.08),
  ],
  organization: [
    prism(rectangle(0.2, 0.14, 0.8, 1), 0, 0.16,
      accent(screen('top', rectangle(0.44, 0.86, 0.56, 1))),
      ...[0.68, 0.5, 0.32].flatMap(y => [0.28, 0.45, 0.62].map(x => frame('top', rectangle(x, y, x + 0.1, y + 0.1))))),
  ],
  face: [
    prism(ellipse(C, 0.55, 0.36, 0.43), 0, 0.08,
      accent(light('top', 0.36, 0.46, 0.05)), accent(light('top', 0.64, 0.46, 0.05)),
      accent(line('top', ...arc(C, 0.58, 0.2, -205, -335).flat()))),
  ],
}
