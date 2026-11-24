// Outlines and marks that the icons of several kinds share. A shape only one kind draws stays in that kind's file.
import { ARC_STEP, block, circle } from '../parts.ts'
import type { IconMark, MarkFace, Spot } from '../parts.ts'

/** The middle of the footprint. */
export const C = 0.5

/** A small round light or key at (a, b). */
export function light(on: MarkFace, a: number, b: number, r = 0.03): IconMark {
  return block(on, circle(a, b, r))
}

/** A gear around (a, b), as pairs on the plane it lies in: each tooth is a trapezoid on the root circle. */
export function gear(a: number, b: number, outer: number, root: number, teeth: number): Spot[] {
  const spot = (degrees: number, radius: number): Spot => {
    const angle = degrees * Math.PI / 180
    return [a + radius * Math.cos(angle), b + radius * Math.sin(angle)]
  }
  return Array.from({ length: teeth }, (_, tooth) => {
    const at = (tooth * 360) / teeth
    return [spot(at - 14, root), spot(at - 8, outer), spot(at + 8, outer), spot(at + 14, root)]
  }).flat()
}

/**
 * An ellipse around (a, b) with the half-widths `ra` and `rb`, as pairs on the plane it lies in. As the outline
 * of a part, keep the shorter half-width at least half the longer one: a flatter ellipse turns so sharply at its
 * two tips that the painter draws an edge there (CREASE in iso/painting/icon-faces.ts).
 */
export function ellipse(a: number, b: number, ra: number, rb: number): Spot[] {
  return Array.from({ length: 360 / ARC_STEP }, (_, step): Spot => {
    const angle = step * ARC_STEP * Math.PI / 180
    return [a + ra * Math.cos(angle), b + rb * Math.sin(angle)]
  })
}
