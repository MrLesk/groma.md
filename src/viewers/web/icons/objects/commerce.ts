import type { ICON_KINDS } from '../../../../icons.ts'
import { accent, block, box, circle, cylinder, frame, line, panel, rectangle, rounded, screen, upright } from '../parts.ts'
import type { IconMark, IconPart, Spot } from '../parts.ts'
import { C, light } from './shared-outlines.ts'

/** A shop's awning seen from the front, as x, z pairs: a strip with a scalloped lower edge. */
const AWNING: Spot[] = [[0.06, 0.62], [0.94, 0.62], [0.94, 0.46], [0.8, 0.4], [0.66, 0.46], [0.5, 0.4], [0.34, 0.46], [0.2, 0.4], [0.06, 0.46]]

/** A shopping cart's basket seen from the front, as x, z pairs: wider at the top. */
const BASKET: Spot[] = [[0.24, 0.28], [0.78, 0.28], [0.9, 0.66], [0.14, 0.66]]
/** The cart's handle seen from the front, as x, z pairs. */
const CART_HANDLE: Spot[] = [[0.02, 0.78], [0.06, 0.82], [0.2, 0.68], [0.14, 0.66]]

/** A receipt seen from the front, as x, z pairs: a strip with a torn lower edge. */
const RECEIPT: Spot[] = [[0.2, 0.86], [0.2, 0.06], [0.3, 0], [0.4, 0.06], [0.5, 0], [0.6, 0.06], [0.7, 0], [0.8, 0.06], [0.8, 0.86]]

/** A truck's cab seen from the front, as x, z pairs. */
const CAB: Spot[] = [[0.62, 0.22], [0.94, 0.22], [0.94, 0.42], [0.84, 0.56], [0.62, 0.56]]

/** A barcode on a box's lid, as marks on a top face: thin and thick bars side by side. */
const BARCODE: IconMark[] = [
  accent(line('top', 0.28, 0.38, 0.28, 0.62)), accent(block('top', rectangle(0.33, 0.38, 0.38, 0.62))),
  accent(line('top', 0.43, 0.38, 0.43, 0.62)), accent(line('top', 0.48, 0.38, 0.48, 0.62)),
  accent(block('top', rectangle(0.53, 0.38, 0.6, 0.62))), accent(line('top', 0.66, 0.38, 0.66, 0.62)),
  accent(line('top', 0.72, 0.38, 0.72, 0.62)),
]

/** A bank's pediment seen from the front, as x, z pairs. */
const PEDIMENT: Spot[] = [[0.02, 0.64], [0.98, 0.64], [0.5, 0.92]]

/** Commerce: selling, paying and delivering. */
export const commerceIcons: Record<(typeof ICON_KINDS.commerce)[number], readonly IconPart[]> = {
  payment: [
    upright(rounded(0.1, 0.1, 0.9, 0.62, 0.06), 0, 0.04),
    upright(rounded(0.04, 0.32, 0.96, 0.9, 0.06), 0.14, 0.05,
      block('top', rectangle(0.04, 0.42, 0.96, 0.52)),
      accent(screen('top', rounded(0.14, 0.62, 0.34, 0.78, 0.03))), line('top', 0.5, 0.74, 0.84, 0.74)),
  ],
  store: [
    panel(rectangle(0.1, 0, 0.9, 0.62), 0.4, 0.2,
      frame('south', rectangle(0.56, 0, 0.76, 0.34)), screen('south', rectangle(0.2, 0.12, 0.46, 0.34))),
    panel(rectangle(0.06, 0.62, 0.94, 0.7), 0.38, 0.24),
    accent(panel(AWNING, 0.6, 0.06)),
  ],
  cart: [
    panel(circle(0.32, 0.1, 0.08), 0.42, 0.16),
    accent(panel(circle(0.72, 0.1, 0.08), 0.42, 0.16)),
    panel(rectangle(0.24, 0.18, 0.8, 0.28), 0.44, 0.12),
    panel(BASKET, 0.38, 0.24,
      line('south', 0.2, 0.54, 0.86, 0.54), line('south', 0.22, 0.4, 0.82, 0.4), line('south', 0.4, 0.28, 0.38, 0.66),
      line('south', 0.62, 0.28, 0.66, 0.66)),
    panel(CART_HANDLE, 0.48, 0.04),
  ],
  order: [
    panel(RECEIPT, 0.46, 0.05,
      line('south', 0.3, 0.72, 0.7, 0.72), line('south', 0.3, 0.6, 0.7, 0.6), line('south', 0.3, 0.48, 0.56, 0.48),
      accent(screen('south', rectangle(0.3, 0.2, 0.7, 0.34)))),
  ],
  money: [
    cylinder(0.36, 0.58, 0.26, 0, 0.1),
    cylinder(0.36, 0.58, 0.26, 0.12, 0.1),
    accent(cylinder(0.36, 0.58, 0.26, 0.24, 0.1, frame('top', circle(0.36, 0.58, 0.16)), line('top', 0.36, 0.48, 0.36, 0.68))),
    cylinder(0.72, 0.32, 0.2, 0, 0.1, frame('top', circle(0.72, 0.32, 0.12))),
  ],
  discount: [
    panel(circle(C, 0.46, 0.42), 0.44, 0.1,
      accent(line('south', 0.34, 0.26, 0.66, 0.66)), accent(frame('south', circle(0.36, 0.6, 0.07))),
      accent(frame('south', circle(0.64, 0.32, 0.07)))),
  ],
  delivery: [
    panel(circle(0.24, 0.12, 0.1), 0.4, 0.2),
    panel(circle(0.76, 0.12, 0.1), 0.4, 0.2),
    panel(rectangle(0.04, 0.22, 0.62, 0.68), 0.35, 0.3, line('south', 0.04, 0.34, 0.62, 0.34)),
    accent(panel(CAB, 0.35, 0.3, screen('south', [[0.68, 0.4], [0.86, 0.4], [0.8, 0.5], [0.68, 0.5]]))),
  ],
  pos: [
    panel(rounded(0.24, 0, 0.76, 0.78, 0.06), 0.4, 0.2,
      accent(screen('south', rounded(0.32, 0.5, 0.68, 0.7, 0.02))),
      ...[0.4, 0.28, 0.16].flatMap(z => [0.38, 0.5, 0.62].map(x => light('south', x, z, 0.025)))),
    panel(rectangle(0.36, 0.78, 0.64, 0.92), 0.48, 0.03),
  ],
  inventory: [
    box(0.1, 0.16, 0, 0.8, 0.68, 0.4,
      accent(screen('top', rounded(0.2, 0.3, 0.8, 0.7, 0.03))), ...BARCODE, line('south', 0.1, 0.3, 0.9, 0.3)),
  ],
  bank: [
    panel(rectangle(0.06, 0, 0.94, 0.1), 0.4, 0.2),
    panel(rectangle(0.14, 0.1, 0.22, 0.56), 0.44, 0.12),
    panel(rectangle(0.34, 0.1, 0.42, 0.56), 0.44, 0.12),
    panel(rectangle(0.58, 0.1, 0.66, 0.56), 0.44, 0.12),
    panel(rectangle(0.78, 0.1, 0.86, 0.56), 0.44, 0.12),
    panel(rectangle(0.06, 0.56, 0.94, 0.64), 0.4, 0.2),
    accent(panel(PEDIMENT, 0.4, 0.2)),
  ],
  contract: [
    panel(rounded(0.16, 0, 0.84, 0.86, 0.05), 0.45, 0.05,
      line('south', 0.28, 0.72, 0.72, 0.72), line('south', 0.28, 0.6, 0.72, 0.6), line('south', 0.28, 0.48, 0.6, 0.48),
      accent(line('south', 0.28, 0.2, 0.36, 0.32, 0.42, 0.18, 0.5, 0.3, 0.56, 0.2, 0.7, 0.24)),
      line('south', 0.28, 0.12, 0.72, 0.12)),
  ],
}
