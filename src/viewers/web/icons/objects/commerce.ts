import type { ICON_KINDS } from '../../../../icons.ts'
import { accent, block, box, circle, cylinder, frame, line, prism, rectangle, rounded, screen } from '../parts.ts'
import type { IconMark, IconPart, Spot } from '../parts.ts'
import { C, light } from './shared-outlines.ts'

/** A shop's awning seen from above, as x, y pairs: a strip with a scalloped south edge. */
const AWNING: Spot[] = [[0.06, 0.38], [0.94, 0.38], [0.94, 0.54], [0.8, 0.6], [0.66, 0.54], [0.5, 0.6], [0.34, 0.54], [0.2, 0.6], [0.06, 0.54]]

/** A shopping cart's basket seen from above, as x, y pairs: wider at its north edge. */
const BASKET: Spot[] = [[0.24, 0.72], [0.78, 0.72], [0.9, 0.34], [0.14, 0.34]]
/** The cart's handle seen from above, as x, y pairs. */
const CART_HANDLE: Spot[] = [[0.02, 0.22], [0.06, 0.18], [0.2, 0.32], [0.14, 0.34]]

/** A receipt seen from above, as x, y pairs: a strip with a torn south edge. */
const RECEIPT: Spot[] = [[0.2, 0.14], [0.2, 0.94], [0.3, 1], [0.4, 0.94], [0.5, 1], [0.6, 0.94], [0.7, 1], [0.8, 0.94], [0.8, 0.14]]

/** A truck's cab seen from above, as x, y pairs. */
const CAB: Spot[] = [[0.62, 0.78], [0.94, 0.78], [0.94, 0.58], [0.84, 0.44], [0.62, 0.44]]

/** A barcode on a box's lid, as marks on a top face: thin and thick bars side by side. */
const BARCODE: IconMark[] = [
  accent(line('top', 0.28, 0.38, 0.28, 0.62)), accent(block('top', rectangle(0.33, 0.38, 0.38, 0.62))),
  accent(line('top', 0.43, 0.38, 0.43, 0.62)), accent(line('top', 0.48, 0.38, 0.48, 0.62)),
  accent(block('top', rectangle(0.53, 0.38, 0.6, 0.62))), accent(line('top', 0.66, 0.38, 0.66, 0.62)),
  accent(line('top', 0.72, 0.38, 0.72, 0.62)),
]

/** A bank's pediment seen from above, as x, y pairs. */
const PEDIMENT: Spot[] = [[0.02, 0.36], [0.98, 0.36], [0.5, 0.08]]

/** Commerce: selling, paying and delivering. */
export const commerceIcons: Record<(typeof ICON_KINDS.commerce)[number], readonly IconPart[]> = {
  payment: [
    prism(rounded(0.1, 0.1, 0.9, 0.62, 0.06), 0, 0.04),
    prism(rounded(0.04, 0.32, 0.96, 0.9, 0.06), 0.14, 0.05,
      block('top', rectangle(0.04, 0.42, 0.96, 0.52)),
      accent(screen('top', rounded(0.14, 0.62, 0.34, 0.78, 0.03))), line('top', 0.5, 0.74, 0.84, 0.74)),
  ],
  store: [
    prism(rectangle(0.1, 0.38, 0.9, 1), 0, 0.12,
      frame('top', rectangle(0.56, 0.66, 0.76, 1)), screen('top', rectangle(0.2, 0.66, 0.46, 0.88))),
    prism(rectangle(0.06, 0.3, 0.94, 0.38), 0, 0.12),
    accent(prism(AWNING, 0, 0.16)),
  ],
  cart: [
    prism(circle(0.32, 0.9, 0.08), 0, 0.08),
    accent(prism(circle(0.72, 0.9, 0.08), 0, 0.08)),
    prism(rectangle(0.24, 0.72, 0.8, 0.82), 0, 0.05),
    prism(CART_HANDLE, 0, 0.05),
    prism(BASKET, 0, 0.12,
      line('top', 0.2, 0.46, 0.86, 0.46), line('top', 0.22, 0.6, 0.82, 0.6), line('top', 0.4, 0.72, 0.38, 0.34),
      line('top', 0.62, 0.72, 0.66, 0.34)),
  ],
  order: [
    prism(RECEIPT, 0, 0.08,
      line('top', 0.3, 0.28, 0.7, 0.28), line('top', 0.3, 0.4, 0.7, 0.4), line('top', 0.3, 0.52, 0.56, 0.52),
      accent(screen('top', rectangle(0.3, 0.66, 0.7, 0.8)))),
  ],
  money: [
    cylinder(0.36, 0.58, 0.26, 0, 0.1),
    cylinder(0.36, 0.58, 0.26, 0.12, 0.1),
    accent(cylinder(0.36, 0.58, 0.26, 0.24, 0.1, frame('top', circle(0.36, 0.58, 0.16)), line('top', 0.36, 0.48, 0.36, 0.68))),
    cylinder(0.72, 0.32, 0.2, 0, 0.1, frame('top', circle(0.72, 0.32, 0.12))),
  ],
  discount: [
    prism(circle(C, 0.54, 0.42), 0, 0.08,
      accent(line('top', 0.34, 0.74, 0.66, 0.34)), accent(frame('top', circle(0.36, 0.4, 0.07))),
      accent(frame('top', circle(0.64, 0.68, 0.07)))),
  ],
  delivery: [
    prism(circle(0.24, 0.88, 0.1), 0, 0.08),
    prism(circle(0.76, 0.88, 0.1), 0, 0.08),
    prism(rectangle(0.04, 0.32, 0.62, 0.78), 0, 0.12, line('top', 0.04, 0.66, 0.62, 0.66)),
    accent(prism(CAB, 0, 0.12, screen('top', [[0.68, 0.6], [0.86, 0.6], [0.8, 0.5], [0.68, 0.5]]))),
  ],
  pos: [
    prism(rectangle(0.36, 0.08, 0.64, 0.22), 0, 0.05),
    prism(rounded(0.24, 0.22, 0.76, 1, 0.06), 0, 0.12,
      accent(screen('top', rounded(0.32, 0.3, 0.68, 0.5, 0.02))),
      ...[0.6, 0.72, 0.84].flatMap(y => [0.38, 0.5, 0.62].map(x => light('top', x, y, 0.025)))),
  ],
  inventory: [
    box(0.1, 0.16, 0, 0.8, 0.68, 0.4,
      accent(screen('top', rounded(0.2, 0.3, 0.8, 0.7, 0.03))), ...BARCODE, line('south', 0.1, 0.3, 0.9, 0.3)),
  ],
  bank: [
    prism(rectangle(0.14, 0.44, 0.22, 0.9), 0, 0.08),
    prism(rectangle(0.34, 0.44, 0.42, 0.9), 0, 0.08),
    prism(rectangle(0.58, 0.44, 0.66, 0.9), 0, 0.08),
    prism(rectangle(0.78, 0.44, 0.86, 0.9), 0, 0.08),
    prism(rectangle(0.06, 0.9, 0.94, 1), 0, 0.12),
    prism(rectangle(0.06, 0.36, 0.94, 0.44), 0, 0.12),
    accent(prism(PEDIMENT, 0, 0.12)),
  ],
  contract: [
    prism(rounded(0.16, 0.14, 0.84, 1, 0.05), 0, 0.08,
      line('top', 0.28, 0.28, 0.72, 0.28), line('top', 0.28, 0.4, 0.72, 0.4), line('top', 0.28, 0.52, 0.6, 0.52),
      accent(line('top', 0.28, 0.8, 0.36, 0.68, 0.42, 0.82, 0.5, 0.7, 0.56, 0.8, 0.7, 0.76)),
      line('top', 0.28, 0.88, 0.72, 0.88)),
  ],
}
