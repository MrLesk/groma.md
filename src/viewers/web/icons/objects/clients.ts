import type { ICON_KINDS } from '../../../../icons.ts'
import { accent, box, circle, frame, line, prism, rectangle, rounded, screen } from '../parts.ts'
import type { IconPart, Spot } from '../parts.ts'
import { C, light } from './shared-outlines.ts'

/** A pin of the chip: a small cube on the ground beside the chip's body. */
function pin(x: number, y: number): IconPart {
  return box(x, y, 0, 0.08, 0.08, 0.08)
}

/** A camera body lying on its back, seen from above, as x, y pairs: a box with a raised viewfinder to the north. */
const CAMERA: Spot[] = [[0.08, 1], [0.92, 1], [0.92, 0.5], [0.7, 0.5], [0.64, 0.4], [0.36, 0.4], [0.3, 0.5], [0.08, 0.5]]

/** A pointer arrow seen from above, as x, y pairs: its tip is to the north-west, its tail to the south-east. */
const POINTER: Spot[] = [[0.2, 0.1], [0.78, 0.6], [0.53, 0.6], [0.67, 0.9], [0.55, 0.96], [0.41, 0.66], [0.2, 0.82]]

/** A car lying on its side, seen from above, as x, y pairs: a low body with its cabin to the north. */
const CAR: Spot[] = [[0.04, 0.8], [0.96, 0.8], [0.96, 0.6], [0.82, 0.56], [0.68, 0.34], [0.3, 0.34], [0.18, 0.56], [0.04, 0.6]]

/** Clients and devices: what people hold or look at, and hardware. */
export const clientsIcons: Record<(typeof ICON_KINDS.clients)[number], readonly IconPart[]> = {
  browser: [
    prism(rounded(0.04, 0.3, 0.96, 1, 0.07), 0, 0.08,
      line('top', 0.04, 0.48, 0.96, 0.48),
      light('top', 0.12, 0.39, 0.022), light('top', 0.2, 0.39, 0.022), light('top', 0.28, 0.39, 0.022),
      accent(screen('top', rounded(0.38, 0.355, 0.9, 0.425, 0.03))),
      frame('top', rounded(0.12, 0.58, 0.46, 0.9, 0.03)),
      line('top', 0.56, 0.62, 0.88, 0.62), line('top', 0.56, 0.74, 0.88, 0.74), line('top', 0.56, 0.86, 0.76, 0.86)),
  ],
  mobile: [
    prism(rounded(0.24, 0.04, 0.76, 0.96, 0.1), 0, 0.08, line('top', 0.45, 0.9, 0.55, 0.9)),
    accent(prism(rounded(0.3, 0.12, 0.7, 0.82, 0.05), 0.2, 0.02,
      line('top', 0.38, 0.26, 0.62, 0.26), line('top', 0.38, 0.38, 0.54, 0.38))),
  ],
  desktop: [
    prism(rounded(0.04, 0.14, 0.96, 0.78, 0.06), 0, 0.08,
      accent(screen('top', rounded(0.1, 0.2, 0.9, 0.72, 0.03))),
      accent(line('top', 0.2, 0.56, 0.36, 0.4, 0.52, 0.5, 0.8, 0.3))),
  ],
  terminal: [
    prism(rounded(0.06, 0.32, 0.94, 1, 0.07), 0, 0.12,
      line('top', 0.06, 0.46, 0.94, 0.46),
      accent(line('top', 0.2, 0.6, 0.32, 0.69, 0.2, 0.78)),
      accent(line('top', 0.4, 0.78, 0.6, 0.78))),
  ],
  chip: [
    pin(0.3, 0.1), pin(0.62, 0.1), pin(0.3, 0.82), pin(0.62, 0.82),
    pin(0.1, 0.3), pin(0.1, 0.62), pin(0.82, 0.3), pin(0.82, 0.62),
    prism(rounded(0.18, 0.18, 0.82, 0.82, 0.06), 0.04, 0.14),
    accent(prism(rounded(0.36, 0.36, 0.64, 0.64, 0.04), 0.18, 0.06)),
  ],
  camera: [
    prism(CAMERA, 0, 0.16, light('top', 0.8, 0.6)),
    accent(prism(circle(C, 0.75, 0.17), 0.16, 0.06, frame('top', circle(C, 0.75, 0.09)))),
  ],
  laptop: [
    prism(rounded(0.06, 0.405, 0.94, 0.885, 0.05), 0, 0.05,
      line('top', 0.14, 0.525, 0.86, 0.525), line('top', 0.14, 0.625, 0.86, 0.625), frame('top', rectangle(0.4, 0.705, 0.6, 0.825))),
    prism(rounded(0.1, 0.11, 0.9, 0.66, 0.04), 0, 0.08, accent(screen('top', rounded(0.16, 0.17, 0.84, 0.6, 0.02)))),
  ],
  display: [
    prism(rounded(0.02, 0.28, 0.98, 0.86, 0.04), 0, 0.08, accent(screen('top', rounded(0.07, 0.33, 0.93, 0.81, 0.02)))),
  ],
  device: [
    prism(rectangle(0.7, 0.19, 0.74, 0.45), 0, 0.05),
    prism(circle(0.72, 0.145, 0.045), 0, 0.05),
    box(0.2, 0.45, 0, 0.6, 0.4, 0.24,
      accent(light('top', 0.36, 0.65, 0.05)), line('top', 0.5, 0.57, 0.7, 0.57), line('top', 0.5, 0.73, 0.7, 0.73),
      accent(light('south', 0.3, 0.12))),
  ],
  router: [
    prism(rectangle(0.16, 0.2, 0.2, 0.52), 0, 0.05),
    prism(rectangle(0.8, 0.2, 0.84, 0.52), 0, 0.05),
    box(0.08, 0.52, 0, 0.84, 0.34, 0.14,
      accent(light('south', 0.24, 0.07)), light('south', 0.36, 0.07), light('south', 0.48, 0.07),
      accent(light('top', 0.24, 0.69, 0.04)), light('top', 0.4, 0.69), light('top', 0.56, 0.69)),
  ],
  pointer: [
    accent(prism(POINTER, 0, 0.08)),
  ],
  vehicle: [
    prism(circle(0.26, 0.88, 0.1), 0, 0.08),
    prism(circle(0.74, 0.88, 0.1), 0, 0.08),
    prism(CAR, 0, 0.12, accent(screen('top', [[0.3, 0.54], [0.7, 0.54], [0.64, 0.4], [0.36, 0.4]]))),
  ],
}
