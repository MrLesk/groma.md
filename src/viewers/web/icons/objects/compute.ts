import type { ICON_KINDS } from '../../../../icons.ts'
import { accent, arc, box, circle, cylinder, frame, line, prism, rectangle, rounded, screen } from '../parts.ts'
import type { IconPart, Spot } from '../parts.ts'
import { C, light, gear } from './shared-outlines.ts'

/**
 * A cloud seen from above, as x, y pairs: three bumps north of a flat base. The angles -95.1 and -171 are where
 * the left and the middle circle meet, so move them together with those circles.
 */
const CLOUD: Spot[] = [
  ...arc(0.27, 0.67, 0.19, -270, -95.1),
  ...arc(0.5, 0.52, 0.25, -171, 0),
  ...arc(0.75, 0.69, 0.17, -90, 90),
]

/** Compute: the things that run code. */
export const computeIcons: Record<(typeof ICON_KINDS.compute)[number], readonly IconPart[]> = {
  service: [
    prism(rounded(0.14, 0.2, 0.86, 0.8, 0.1), 0, 0.3,
      line('south', 0.24, 0.15, 0.56, 0.15), accent(light('south', 0.72, 0.15)),
      frame('top', rounded(0.26, 0.36, 0.56, 0.64, 0.04)),
      line('top', 0.36, 0.44, 0.36, 0.56), line('top', 0.46, 0.44, 0.46, 0.56),
      accent(light('top', 0.7, 0.5, 0.05))),
  ],
  server: [
    prism(rounded(0.14, 0.18, 0.86, 0.82, 0.08), 0, 0.18,
      line('south', 0.24, 0.09, 0.5, 0.09), accent(light('south', 0.72, 0.09))),
    prism(rounded(0.14, 0.18, 0.86, 0.82, 0.08), 0.24, 0.18,
      line('south', 0.24, 0.33, 0.5, 0.33), accent(light('south', 0.72, 0.33)),
      line('top', 0.26, 0.36, 0.58, 0.36), line('top', 0.26, 0.5, 0.74, 0.5), line('top', 0.26, 0.64, 0.58, 0.64),
      accent(light('top', 0.72, 0.36, 0.035))),
  ],
  worker: [
    prism(gear(C, C, 0.46, 0.34, 8), 0, 0.2),
    accent(cylinder(C, C, 0.16, 0.2, 0.08, frame('top', circle(C, C, 0.07)))),
  ],
  scheduler: [
    prism(circle(C, 0.5, 0.43), 0, 0.12,
      frame('top', circle(C, 0.5, 0.35)),
      line('top', C, 0.2, C, 0.26), line('top', 0.8, 0.5, 0.74, 0.5), line('top', C, 0.8, C, 0.74), line('top', 0.2, 0.5, 0.26, 0.5),
      accent(line('top', C, 0.28, C, 0.5, 0.66, 0.6))),
  ],
  cloud: [
    accent(prism(CLOUD, 0, 0.16)),
  ],
  function: [
    prism(rounded(0.16, 0.34, 0.84, 1, 0.1), 0, 0.16,
      accent(line('top', 0.38, 0.46, 0.62, 0.88)), accent(line('top', 0.5, 0.67, 0.38, 0.88))),
  ],
  pipeline: [
    box(0.14, 0.44, 0, 0.08, 0.12, 0.08),
    box(0.78, 0.44, 0, 0.08, 0.12, 0.08),
    prism(rounded(0.02, 0.34, 0.98, 0.66, 0.15), 0.08, 0.1, line('top', 0.44, 0.44, 0.5, 0.5, 0.44, 0.56)),
    box(0.16, 0.4, 0.18, 0.18, 0.2, 0.16),
    accent(box(0.64, 0.4, 0.18, 0.18, 0.2, 0.16)),
  ],
  workflow: [
    prism(rounded(0.04, 0.1, 0.96, 0.9, 0.1), 0, 0.05,
      line('top', 0.34, 0.5, 0.5, 0.5), line('top', 0.62, 0.28, 0.5, 0.28, 0.5, 0.72, 0.62, 0.72)),
    prism(rounded(0.12, 0.4, 0.34, 0.6, 0.04), 0.05, 0.1),
    prism(rounded(0.62, 0.18, 0.86, 0.38, 0.04), 0.05, 0.1),
    accent(prism(rounded(0.62, 0.62, 0.86, 0.82, 0.04), 0.05, 0.1)),
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
    prism(rounded(0.08, 0.14, 0.92, 0.86, 0.06), 0, 0.05),
    box(0.08, 0.14, 0.05, 0.84, 0.06, 0.24),
    box(0.08, 0.8, 0.05, 0.84, 0.06, 0.24),
    box(0.08, 0.2, 0.05, 0.06, 0.6, 0.24),
    box(0.86, 0.2, 0.05, 0.06, 0.6, 0.24),
    accent(box(0.36, 0.38, 0.05, 0.28, 0.24, 0.14)),
  ],
  cluster: [
    prism(rounded(0.04, 0.04, 0.96, 0.96, 0.1), 0, 0.05),
    box(0.14, 0.14, 0.05, 0.3, 0.3, 0.18, line('top', 0.2, 0.29, 0.38, 0.29)),
    box(0.56, 0.14, 0.05, 0.3, 0.3, 0.18, line('top', 0.62, 0.29, 0.8, 0.29)),
    box(0.14, 0.56, 0.05, 0.3, 0.3, 0.18, line('top', 0.2, 0.71, 0.38, 0.71)),
    accent(box(0.56, 0.56, 0.05, 0.3, 0.3, 0.18, line('top', 0.62, 0.71, 0.8, 0.71))),
  ],
  datacenter: [
    prism(rounded(0.02, 0.06, 0.98, 0.94, 0.06), 0, 0.04),
    box(0.12, 0.14, 0.04, 0.2, 0.72, 0.36, line('top', 0.12, 0.38, 0.32, 0.38), line('top', 0.12, 0.62, 0.32, 0.62), light('south', 0.22, 0.3)),
    box(0.4, 0.14, 0.04, 0.2, 0.72, 0.36, line('top', 0.4, 0.38, 0.6, 0.38), line('top', 0.4, 0.62, 0.6, 0.62), light('south', 0.5, 0.3)),
    accent(box(0.68, 0.14, 0.04, 0.2, 0.72, 0.36, line('top', 0.68, 0.38, 0.88, 0.38), line('top', 0.68, 0.62, 0.88, 0.62), light('south', 0.78, 0.3))),
  ],
}
