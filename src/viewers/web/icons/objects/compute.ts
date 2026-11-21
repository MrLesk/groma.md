import type { ICON_KINDS } from '../../../../icons.ts'
import { accent, arc, box, circle, cylinder, frame, line, panel, rectangle, rounded, screen, upright } from '../parts.ts'
import type { IconPart, Spot } from '../parts.ts'
import { C, light, gear } from './shared-outlines.ts'

/**
 * A cloud seen from the front, as x, z pairs: three bumps over a flat base. The angles 95.1 and 171 are where
 * the left and the middle circle meet, so move them together with those circles.
 */
const CLOUD: Spot[] = [
  ...arc(0.27, 0.33, 0.19, 270, 95.1),
  ...arc(0.5, 0.48, 0.25, 171, 0),
  ...arc(0.75, 0.31, 0.17, 90, -90),
]

/** Compute: the things that run code. */
export const computeIcons: Record<(typeof ICON_KINDS.compute)[number], readonly IconPart[]> = {
  service: [
    upright(rounded(0.14, 0.2, 0.86, 0.8, 0.1), 0, 0.3,
      line('south', 0.24, 0.15, 0.56, 0.15), accent(light('south', 0.72, 0.15)),
      frame('top', rounded(0.26, 0.36, 0.56, 0.64, 0.04)),
      line('top', 0.36, 0.44, 0.36, 0.56), line('top', 0.46, 0.44, 0.46, 0.56),
      accent(light('top', 0.7, 0.5, 0.05))),
  ],
  server: [
    upright(rounded(0.14, 0.18, 0.86, 0.82, 0.08), 0, 0.18,
      line('south', 0.24, 0.09, 0.5, 0.09), accent(light('south', 0.72, 0.09))),
    upright(rounded(0.14, 0.18, 0.86, 0.82, 0.08), 0.24, 0.18,
      line('south', 0.24, 0.33, 0.5, 0.33), accent(light('south', 0.72, 0.33)),
      line('top', 0.26, 0.36, 0.58, 0.36), line('top', 0.26, 0.5, 0.74, 0.5), line('top', 0.26, 0.64, 0.58, 0.64),
      accent(light('top', 0.72, 0.36, 0.035))),
  ],
  worker: [
    upright(gear(C, C, 0.46, 0.34, 8), 0, 0.2),
    accent(cylinder(C, C, 0.16, 0.2, 0.08, frame('top', circle(C, C, 0.07)))),
  ],
  scheduler: [
    upright(rounded(0.28, 0.36, 0.72, 0.68, 0.06), 0, 0.06),
    panel(circle(C, 0.5, 0.43), 0.45, 0.12,
      frame('south', circle(C, 0.5, 0.35)),
      line('south', C, 0.8, C, 0.74), line('south', 0.8, 0.5, 0.74, 0.5), line('south', C, 0.2, C, 0.26), line('south', 0.2, 0.5, 0.26, 0.5),
      accent(line('south', C, 0.72, C, 0.5, 0.66, 0.4))),
  ],
  cloud: [
    accent(panel(CLOUD, 0.42, 0.16)),
  ],
  function: [
    panel(rounded(0.16, 0, 0.84, 0.66, 0.1), 0.34, 0.32,
      accent(line('south', 0.38, 0.54, 0.62, 0.12)), accent(line('south', 0.5, 0.33, 0.38, 0.12))),
  ],
  pipeline: [
    box(0.14, 0.44, 0, 0.08, 0.12, 0.08),
    box(0.78, 0.44, 0, 0.08, 0.12, 0.08),
    upright(rounded(0.02, 0.34, 0.98, 0.66, 0.15), 0.08, 0.1, line('top', 0.44, 0.44, 0.5, 0.5, 0.44, 0.56)),
    box(0.16, 0.4, 0.18, 0.18, 0.2, 0.16),
    accent(box(0.64, 0.4, 0.18, 0.18, 0.2, 0.16)),
  ],
  workflow: [
    upright(rounded(0.04, 0.1, 0.96, 0.9, 0.1), 0, 0.05,
      line('top', 0.34, 0.5, 0.5, 0.5), line('top', 0.62, 0.28, 0.5, 0.28, 0.5, 0.72, 0.62, 0.72)),
    upright(rounded(0.12, 0.4, 0.34, 0.6, 0.04), 0.05, 0.1),
    upright(rounded(0.62, 0.18, 0.86, 0.38, 0.04), 0.05, 0.1),
    accent(upright(rounded(0.62, 0.62, 0.86, 0.82, 0.04), 0.05, 0.1)),
  ],
  crate: [
    box(0.04, 0.3, 0, 0.92, 0.4, 0.42,
      line('south', 0.2, 0.04, 0.2, 0.38), line('south', 0.36, 0.04, 0.36, 0.38), line('south', 0.52, 0.04, 0.52, 0.38),
      line('south', 0.68, 0.04, 0.68, 0.38),
      line('top', 0.2, 0.3, 0.2, 0.7), line('top', 0.36, 0.3, 0.36, 0.7), line('top', 0.52, 0.3, 0.52, 0.7),
      line('top', 0.68, 0.3, 0.68, 0.7),
      accent(screen('top', rectangle(0.8, 0.34, 0.92, 0.66))), accent(line('east', 0.5, 0.04, 0.5, 0.38))),
  ],
  sandbox: [
    upright(rounded(0.08, 0.14, 0.92, 0.86, 0.06), 0, 0.05),
    box(0.08, 0.14, 0.05, 0.84, 0.06, 0.24),
    box(0.08, 0.8, 0.05, 0.84, 0.06, 0.24),
    box(0.08, 0.2, 0.05, 0.06, 0.6, 0.24),
    box(0.86, 0.2, 0.05, 0.06, 0.6, 0.24),
    accent(box(0.36, 0.38, 0.05, 0.28, 0.24, 0.14)),
  ],
  cluster: [
    upright(rounded(0.04, 0.04, 0.96, 0.96, 0.1), 0, 0.05),
    box(0.14, 0.14, 0.05, 0.3, 0.3, 0.18, line('top', 0.2, 0.29, 0.38, 0.29)),
    box(0.56, 0.14, 0.05, 0.3, 0.3, 0.18, line('top', 0.62, 0.29, 0.8, 0.29)),
    box(0.14, 0.56, 0.05, 0.3, 0.3, 0.18, line('top', 0.2, 0.71, 0.38, 0.71)),
    accent(box(0.56, 0.56, 0.05, 0.3, 0.3, 0.18, line('top', 0.62, 0.71, 0.8, 0.71))),
  ],
  datacenter: [
    upright(rounded(0.02, 0.06, 0.98, 0.94, 0.06), 0, 0.04),
    box(0.12, 0.14, 0.04, 0.2, 0.72, 0.36, line('top', 0.12, 0.38, 0.32, 0.38), line('top', 0.12, 0.62, 0.32, 0.62), light('south', 0.22, 0.3)),
    box(0.4, 0.14, 0.04, 0.2, 0.72, 0.36, line('top', 0.4, 0.38, 0.6, 0.38), line('top', 0.4, 0.62, 0.6, 0.62), light('south', 0.5, 0.3)),
    accent(box(0.68, 0.14, 0.04, 0.2, 0.72, 0.36, line('top', 0.68, 0.38, 0.88, 0.38), line('top', 0.68, 0.62, 0.88, 0.62), light('south', 0.78, 0.3))),
  ],
}
