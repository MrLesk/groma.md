import type { ICON_KINDS } from '../../../../icons.ts'
import { accent, box, circle, frame, line, panel, rectangle, rounded, screen, upright } from '../parts.ts'
import type { IconPart, Spot } from '../parts.ts'
import { C, light } from './shared-outlines.ts'

/** A pin of the chip: a small cube on the ground beside the chip's body. */
function pin(x: number, y: number): IconPart {
  return box(x, y, 0, 0.08, 0.08, 0.08)
}

/** A camera body seen from the front, as x, z pairs: a box with a raised viewfinder. */
const CAMERA: Spot[] = [[0.08, 0], [0.92, 0], [0.92, 0.5], [0.7, 0.5], [0.64, 0.6], [0.36, 0.6], [0.3, 0.5], [0.08, 0.5]]

/** A pointer arrow seen from the front, as x, z pairs: its tip is up and to the west, its tail down and to the east. */
const POINTER: Spot[] = [[0.2, 0.9], [0.78, 0.4], [0.53, 0.4], [0.67, 0.1], [0.55, 0.04], [0.41, 0.34], [0.2, 0.18]]

/** A car seen from the side, as x, z pairs: a low body under a cabin. */
const CAR: Spot[] = [[0.04, 0.2], [0.96, 0.2], [0.96, 0.4], [0.82, 0.44], [0.68, 0.66], [0.3, 0.66], [0.18, 0.44], [0.04, 0.4]]

/** Clients and devices: what people hold or look at, and hardware. */
export const clientsIcons: Record<(typeof ICON_KINDS.clients)[number], readonly IconPart[]> = {
  browser: [
    panel(rounded(0.04, 0, 0.96, 0.7, 0.07), 0.47, 0.06,
      line('south', 0.04, 0.52, 0.96, 0.52),
      light('south', 0.12, 0.61, 0.022), light('south', 0.2, 0.61, 0.022), light('south', 0.28, 0.61, 0.022),
      accent(screen('south', rounded(0.38, 0.575, 0.9, 0.645, 0.03))),
      frame('south', rounded(0.12, 0.1, 0.46, 0.42, 0.03)),
      line('south', 0.56, 0.38, 0.88, 0.38), line('south', 0.56, 0.26, 0.88, 0.26), line('south', 0.56, 0.14, 0.76, 0.14)),
  ],
  mobile: [
    upright(rounded(0.24, 0.04, 0.76, 0.96, 0.1), 0, 0.08, line('top', 0.45, 0.9, 0.55, 0.9)),
    accent(upright(rounded(0.3, 0.12, 0.7, 0.82, 0.05), 0.2, 0.02,
      line('top', 0.38, 0.26, 0.62, 0.26), line('top', 0.38, 0.38, 0.54, 0.38))),
  ],
  desktop: [
    upright(rounded(0.3, 0.34, 0.7, 0.66, 0.06), 0, 0.04),
    box(0.46, 0.47, 0.04, 0.08, 0.06, 0.2),
    panel(rounded(0.04, 0.22, 0.96, 0.86, 0.06), 0.45, 0.07,
      accent(screen('south', rounded(0.1, 0.28, 0.9, 0.8, 0.03))),
      accent(line('south', 0.2, 0.44, 0.36, 0.6, 0.52, 0.5, 0.8, 0.7))),
  ],
  terminal: [
    panel(rounded(0.06, 0, 0.94, 0.68, 0.07), 0.44, 0.12,
      line('south', 0.06, 0.54, 0.94, 0.54),
      accent(line('south', 0.2, 0.4, 0.32, 0.31, 0.2, 0.22)),
      accent(line('south', 0.4, 0.22, 0.6, 0.22))),
  ],
  chip: [
    pin(0.3, 0.1), pin(0.62, 0.1), pin(0.3, 0.82), pin(0.62, 0.82),
    pin(0.1, 0.3), pin(0.1, 0.62), pin(0.82, 0.3), pin(0.82, 0.62),
    upright(rounded(0.18, 0.18, 0.82, 0.82, 0.06), 0.04, 0.14),
    accent(upright(rounded(0.36, 0.36, 0.64, 0.64, 0.04), 0.18, 0.06)),
  ],
  camera: [
    panel(CAMERA, 0.34, 0.3, light('south', 0.8, 0.4)),
    accent(panel(circle(C, 0.25, 0.17), 0.64, 0.08, frame('south', circle(C, 0.25, 0.09)))),
  ],
  laptop: [
    upright(rounded(0.06, 0.44, 0.94, 0.92, 0.05), 0, 0.05,
      line('top', 0.14, 0.56, 0.86, 0.56), line('top', 0.14, 0.66, 0.86, 0.66), frame('top', rectangle(0.4, 0.74, 0.6, 0.86))),
    panel(rounded(0.1, 0.05, 0.9, 0.6, 0.04), 0.4, 0.04, accent(screen('south', rounded(0.16, 0.11, 0.84, 0.54, 0.02)))),
  ],
  display: [
    box(0.2, 0.42, 0, 0.06, 0.16, 0.14),
    box(0.74, 0.42, 0, 0.06, 0.16, 0.14),
    panel(rounded(0.02, 0.14, 0.98, 0.72, 0.04), 0.46, 0.06, accent(screen('south', rounded(0.07, 0.19, 0.93, 0.67, 0.02)))),
  ],
  device: [
    box(0.2, 0.34, 0, 0.6, 0.4, 0.24,
      accent(light('top', 0.36, 0.54, 0.05)), line('top', 0.5, 0.46, 0.7, 0.46), line('top', 0.5, 0.62, 0.7, 0.62),
      accent(light('south', 0.3, 0.12))),
    panel(rectangle(0.7, 0.24, 0.74, 0.68), 0.36, 0.04),
    panel(circle(0.72, 0.73, 0.045), 0.35, 0.06),
  ],
  router: [
    box(0.08, 0.4, 0, 0.84, 0.34, 0.14,
      accent(light('south', 0.24, 0.07)), light('south', 0.36, 0.07), light('south', 0.48, 0.07),
      accent(light('top', 0.24, 0.57, 0.04)), light('top', 0.4, 0.57), light('top', 0.56, 0.57)),
    panel(rectangle(0.16, 0.14, 0.2, 0.64), 0.42, 0.04),
    panel(rectangle(0.8, 0.14, 0.84, 0.64), 0.42, 0.04),
  ],
  pointer: [
    accent(panel(POINTER, 0.46, 0.08)),
  ],
  vehicle: [
    panel(circle(0.26, 0.12, 0.1), 0.4, 0.2),
    panel(circle(0.74, 0.12, 0.1), 0.4, 0.2),
    panel(CAR, 0.35, 0.3, accent(screen('south', [[0.3, 0.46], [0.7, 0.46], [0.64, 0.6], [0.36, 0.6]]))),
  ],
}
