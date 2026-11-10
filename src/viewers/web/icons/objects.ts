import type { IconName } from '../../../icons.ts'
import { arc, ball, block, box, frame, line, prism, ring, round, screen } from './parts.ts'
import type { IconPart, Spot } from './parts.ts'

/** The middle of the footprint. */
const C = 0.5

/** A gear seen from above: each tooth is a trapezoid on the root circle. */
function gear(outer: number, root: number, teeth: number): Spot[] {
  const spot = (degrees: number, radius: number): Spot => {
    const angle = degrees * Math.PI / 180
    return [C + radius * Math.cos(angle), C + radius * Math.sin(angle)]
  }
  return Array.from({ length: teeth }, (_, tooth) => {
    const at = (tooth * 360) / teeth
    return [spot(at - 13, root), spot(at - 8, outer), spot(at + 8, outer), spot(at + 13, root)]
  }).flat()
}

/** A magnifying glass lying down, its handle towards the reader. */
function magnifier(): Spot[] {
  const [x, y, r, reach, half] = [0.38, 0.38, 0.3, 0.8, 0.06]
  const along = Math.SQRT1_2
  return [
    ...arc(x, y, r, 56.5, 393.5),
    [x + (reach + half) * along, y + (reach - half) * along],
    [x + (reach - half) * along, y + (reach + half) * along],
  ]
}

/** A cloud lying down: three bumps over a flat base, drawn like lettering on the plane. */
const CLOUD: Spot[] = [
  ...arc(0.27, 0.57, 0.17, 90, 270.6),
  ...arc(0.5, 0.43, 0.23, 187.5, 357.8),
  ...arc(0.75, 0.58, 0.16, 262.8, 450),
]

/** A pin of the cache chip. */
function pin(x: number, y: number): IconPart {
  return box(x, y, 0, 0.1, 0.1, 0.1)
}

/**
 * One object per icon name. Parts are drawn lowest first, then back to front, so list a part
 * that stands on another with a higher z. Keep every object inside the 1 × 1 footprint.
 */
export const iconObjects: Record<IconName, readonly IconPart[]> = {
  person: [
    round(C, C, 0.3, 0, 0.07),
    round(C, C, 0.21, 0.07, 0.25),
    round(C, C, 0.14, 0.32, 0.2),
    ball(C, C, 0.72, 0.17),
  ],
  agent: [
    round(C, C, 0.13, 0, 0.12),
    box(0.16, 0.24, 0.12, 0.68, 0.52, 0.5,
      screen('south', 0.23, 0.2, 0.77, 0.54),
      block('south', 0.32, 0.36, 0.42, 0.46), block('south', 0.58, 0.36, 0.68, 0.46),
      line('south', 0.43, 0.27, 0.57, 0.27)),
    round(C, C, 0.02, 0.62, 0.2),
    ball(C, C, 0.87, 0.06),
  ],
  browser: [
    box(0.04, 0.43, 0, 0.92, 0.14, 0.78,
      screen('south', 0.09, 0.06, 0.91, 0.72),
      line('south', 0.09, 0.58, 0.91, 0.58),
      block('south', 0.14, 0.62, 0.19, 0.68), block('south', 0.24, 0.62, 0.29, 0.68),
      frame('south', 0.16, 0.14, 0.46, 0.48),
      line('south', 0.55, 0.44, 0.84, 0.44), line('south', 0.55, 0.31, 0.84, 0.31), line('south', 0.55, 0.18, 0.74, 0.18)),
  ],
  mobile: [
    box(0.27, 0.44, 0, 0.46, 0.12, 0.94,
      screen('south', 0.33, 0.14, 0.67, 0.84),
      line('south', 0.44, 0.07, 0.56, 0.07)),
  ],
  desktop: [
    box(0.3, 0.36, 0, 0.4, 0.28, 0.05),
    box(0.46, 0.47, 0.05, 0.08, 0.06, 0.2),
    box(0.04, 0.44, 0.25, 0.92, 0.12, 0.62,
      screen('south', 0.1, 0.31, 0.9, 0.81),
      line('south', 0.2, 0.45, 0.38, 0.6, 0.54, 0.5, 0.8, 0.7)),
  ],
  terminal: [
    box(0.04, 0.43, 0, 0.92, 0.14, 0.72,
      screen('south', 0.09, 0.06, 0.91, 0.66),
      line('south', 0.09, 0.53, 0.91, 0.53),
      line('south', 0.18, 0.41, 0.31, 0.31, 0.18, 0.21),
      line('south', 0.39, 0.21, 0.58, 0.21)),
  ],
  service: [
    box(0.2, 0.2, 0, 0.6, 0.6, 1,
      line('south', 0.2, 0.25, 0.8, 0.25), line('south', 0.2, 0.5, 0.8, 0.5), line('south', 0.2, 0.75, 0.8, 0.75),
      block('south', 0.66, 0.1, 0.72, 0.16), block('south', 0.66, 0.35, 0.72, 0.41),
      block('south', 0.66, 0.6, 0.72, 0.66), block('south', 0.66, 0.85, 0.72, 0.91),
      line('east', 0.2, 0.25, 0.8, 0.25), line('east', 0.2, 0.5, 0.8, 0.5), line('east', 0.2, 0.75, 0.8, 0.75)),
  ],
  worker: [
    prism(gear(0.47, 0.35, 8), 0, 0.16),
    round(C, C, 0.17, 0.16, 0.08, ring('top', C, C, 0.08)),
  ],
  gateway: [
    box(0.04, 0.36, 0, 0.2, 0.28, 0.78),
    box(0.76, 0.36, 0, 0.2, 0.28, 0.78),
    box(0, 0.32, 0.78, 1, 0.36, 0.16),
  ],
  scheduler: [
    round(C, C, 0.46, 0, 0.12,
      line('top', C, C, C, 0.2), line('top', C, C, 0.7, C),
      line('top', C, 0.1, C, 0.14), line('top', 0.9, C, 0.86, C), line('top', C, 0.9, C, 0.86), line('top', 0.1, C, 0.14, C)),
    round(C, C, 0.04, 0.12, 0.05),
  ],
  database: [
    round(C, C, 0.4, 0, 0.24),
    round(C, C, 0.4, 0.32, 0.24),
    round(C, C, 0.4, 0.64, 0.24),
  ],
  cache: [
    pin(0.3, 0.08), pin(0.6, 0.08), pin(0.3, 0.82), pin(0.6, 0.82),
    pin(0.08, 0.3), pin(0.08, 0.6), pin(0.82, 0.3), pin(0.82, 0.6),
    box(0.18, 0.18, 0.04, 0.64, 0.64, 0.16),
    box(0.34, 0.34, 0.2, 0.32, 0.32, 0.07),
  ],
  queue: [
    box(0, 0.26, 0, 1, 0.48, 0.07),
    box(0.06, 0.36, 0.07, 0.24, 0.28, 0.26),
    box(0.38, 0.36, 0.07, 0.24, 0.28, 0.26),
    box(0.7, 0.36, 0.07, 0.24, 0.28, 0.26),
  ],
  storage: [
    box(0.2, 0.22, 0, 0.6, 0.56, 0.96,
      line('south', 0.2, 0.32, 0.8, 0.32), line('south', 0.2, 0.64, 0.8, 0.64),
      line('south', 0.42, 0.16, 0.58, 0.16), line('south', 0.42, 0.48, 0.58, 0.48), line('south', 0.42, 0.8, 0.58, 0.8)),
  ],
  document: [
    box(0.1, 0.16, 0, 0.62, 0.78, 0.04),
    box(0.2, 0.09, 0.04, 0.62, 0.78, 0.04),
    box(0.3, 0.02, 0.08, 0.62, 0.78, 0.04,
      line('top', 0.4, 0.2, 0.82, 0.2), line('top', 0.4, 0.36, 0.82, 0.36),
      line('top', 0.4, 0.52, 0.82, 0.52), line('top', 0.4, 0.68, 0.66, 0.68)),
  ],
  search: [
    prism(magnifier(), 0, 0.1, ring('top', 0.38, 0.38, 0.21)),
  ],
  repository: [
    box(0.06, 0.06, 0, 0.88, 0.88, 0.07,
      line('top', 0.3, 0.74, 0.3, 0.26),
      line('top', 0.3, 0.6, 0.5, 0.6, 0.7, 0.42, 0.7, 0.26)),
    round(0.3, 0.74, 0.09, 0.07, 0.1),
    round(0.3, 0.26, 0.09, 0.07, 0.1),
    round(0.7, 0.26, 0.09, 0.07, 0.1),
  ],
  package: [
    box(0.14, 0.14, 0, 0.72, 0.72, 0.6,
      line('top', 0.44, 0.14, 0.44, 0.86), line('top', 0.56, 0.14, 0.56, 0.86),
      line('south', 0.44, 0.6, 0.44, 0.36), line('south', 0.56, 0.6, 0.56, 0.36)),
  ],
  cloud: [
    prism(CLOUD, 0, 0.24),
  ],
  lock: [
    box(0.2, 0.32, 0, 0.6, 0.36, 0.5,
      ring('south', 0.5, 0.3, 0.06), line('south', 0.5, 0.24, 0.5, 0.12)),
    round(0.34, 0.5, 0.05, 0.5, 0.3),
    round(0.66, 0.5, 0.05, 0.5, 0.3),
    box(0.29, 0.44, 0.8, 0.42, 0.12, 0.1),
  ],
  mail: [
    box(0.06, 0.2, 0, 0.88, 0.6, 0.1, line('top', 0.06, 0.2, 0.5, 0.56, 0.94, 0.2)),
  ],
  chart: [
    box(0.04, 0.24, 0, 0.92, 0.52, 0.06),
    box(0.12, 0.38, 0.06, 0.2, 0.24, 0.3),
    box(0.4, 0.38, 0.06, 0.2, 0.24, 0.58),
    box(0.68, 0.38, 0.06, 0.2, 0.24, 0.9),
  ],
  board: [
    box(0.04, 0.44, 0, 0.92, 0.12, 0.74,
      screen('south', 0.07, 0.05, 0.93, 0.69),
      line('south', 0.35, 0.05, 0.35, 0.69), line('south', 0.65, 0.05, 0.65, 0.69),
      block('south', 0.1, 0.5, 0.29, 0.62), block('south', 0.1, 0.32, 0.29, 0.44),
      block('south', 0.41, 0.5, 0.59, 0.62),
      block('south', 0.71, 0.5, 0.9, 0.62), block('south', 0.71, 0.32, 0.9, 0.44), block('south', 0.71, 0.14, 0.9, 0.26)),
  ],
}
