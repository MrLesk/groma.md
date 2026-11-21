import type { ICON_KINDS } from '../../../../icons.ts'
import { accent, arc, box, circle, frame, line, panel, rectangle, rounded, screen, upright } from '../parts.ts'
import type { IconPart, Spot } from '../parts.ts'
import { C, light, gear, ellipse } from './shared-outlines.ts'

/** A headset's band seen from the front, as x, z pairs: an arch from ear to ear. */
const HEADBAND: Spot[] = [...arc(C, 0.42, 0.38, 0, 180), ...arc(C, 0.42, 0.32, 180, 0)]
/** The headset's microphone arm seen from the front, as x, z pairs: down from the east ear cup and in to the mouth. */
const MIC_ARM: Spot[] = [[0.82, 0.16], [0.86, 0.16], [0.86, 0.04], [0.58, 0.04], [0.58, 0.08], [0.82, 0.08]]

/** People and agents: who uses or operates a system. */
export const peopleIcons: Record<(typeof ICON_KINDS.people)[number], readonly IconPart[]> = {
  person: [
    upright(rounded(0.1, 0.2, 0.9, 0.8, 0.1), 0, 0.06),
    panel(arc(C, 0.06, 0.28, 0, 180), 0.47, 0.06),
    accent(panel(circle(C, 0.52, 0.15), 0.47, 0.06)),
  ],
  admin: [
    upright(rounded(0.1, 0.2, 0.9, 0.8, 0.1), 0, 0.06),
    panel(arc(C, 0.06, 0.28, 0, 180), 0.45, 0.06),
    panel(circle(C, 0.52, 0.15), 0.45, 0.06),
    accent(panel(gear(0.76, 0.22, 0.16, 0.11, 6), 0.53, 0.05, frame('south', circle(0.76, 0.22, 0.045)))),
  ],
  developer: [
    upright(rounded(0.1, 0.2, 0.9, 0.8, 0.1), 0, 0.06),
    panel(arc(C, 0.06, 0.28, 0, 180), 0.45, 0.06),
    panel(circle(C, 0.52, 0.15), 0.45, 0.06),
    accent(panel(rounded(0.54, 0.06, 0.96, 0.36, 0.04), 0.53, 0.04,
      line('south', 0.67, 0.27, 0.61, 0.21, 0.67, 0.15),
      line('south', 0.83, 0.27, 0.89, 0.21, 0.83, 0.15),
      line('south', 0.78, 0.29, 0.72, 0.13))),
  ],
  agent: [
    box(0.42, 0.44, 0, 0.16, 0.12, 0.08),
    panel(rounded(0.16, 0.08, 0.84, 0.6, 0.1), 0.36, 0.28,
      accent(screen('south', rounded(0.26, 0.2, 0.74, 0.48, 0.05))),
      accent(light('south', 0.39, 0.34, 0.035)), accent(light('south', 0.61, 0.34, 0.035))),
    panel(rectangle(0.485, 0.6, 0.515, 0.76), 0.48, 0.04),
    panel(circle(C, 0.82, 0.06), 0.47, 0.06),
  ],
  team: [
    upright(rounded(0.04, 0.2, 0.96, 0.8, 0.1), 0, 0.06),
    panel(arc(0.34, 0.06, 0.2, 0, 180), 0.38, 0.05),
    panel(circle(0.34, 0.4, 0.11), 0.38, 0.05),
    panel(arc(0.66, 0.06, 0.2, 0, 180), 0.54, 0.05),
    accent(panel(circle(0.66, 0.4, 0.11), 0.54, 0.05)),
  ],
  guest: [
    upright(rounded(0.1, 0.2, 0.9, 0.8, 0.1), 0, 0.06),
    panel(arc(C, 0.06, 0.28, 0, 180), 0.45, 0.06),
    panel(circle(C, 0.52, 0.15), 0.45, 0.06),
    accent(panel(circle(0.76, 0.24, 0.16), 0.53, 0.05,
      line('south', ...arc(0.76, 0.29, 0.06, 180, -60).flat(), 0.76, 0.2), light('south', 0.76, 0.14, 0.02))),
  ],
  support: [
    panel(HEADBAND, 0.47, 0.06),
    accent(panel(rounded(0.06, 0.16, 0.24, 0.46, 0.05), 0.42, 0.16)),
    accent(panel(rounded(0.76, 0.16, 0.94, 0.46, 0.05), 0.42, 0.16)),
    panel(MIC_ARM, 0.48, 0.04),
    panel(circle(0.54, 0.06, 0.05), 0.46, 0.08),
  ],
  organization: [
    panel(rectangle(0.2, 0, 0.8, 0.86), 0.3, 0.4,
      accent(screen('south', rectangle(0.44, 0, 0.56, 0.14))),
      ...[0.22, 0.4, 0.58].flatMap(z => [0.28, 0.45, 0.62].map(x => frame('south', rectangle(x, z, x + 0.1, z + 0.1))))),
  ],
  face: [
    panel(ellipse(C, 0.45, 0.36, 0.43), 0.45, 0.06,
      accent(light('south', 0.36, 0.54, 0.05)), accent(light('south', 0.64, 0.54, 0.05)),
      accent(line('south', ...arc(C, 0.42, 0.2, 205, 335).flat()))),
  ],
}
