/**
 * The parts an icon object is built from. An object stands inside a 1 × 1 footprint: x runs along the
 * map's gx (towards the east corner), y along gy (towards the west corner), z is up, all in one unit.
 * In the default view the reader sees every part's top, its east wall and its south wall.
 */
export type IconPart =
  | { shape: 'box'; x: number; y: number; z: number; w: number; d: number; h: number; marks: readonly IconMark[] }
  /** An upright shape with any outline; a cylinder is a prism with a circle outline. Only its top takes marks. */
  | { shape: 'prism'; outline: readonly Spot[]; z: number; h: number; marks: readonly TopMark[] }
  | { shape: 'ball'; x: number; y: number; z: number; r: number }

/** A point on the ground of the icon's footprint. */
export type Spot = readonly [x: number, y: number]

/** The face a mark is drawn on: the part's top, its wall towards +y (south) or its wall towards +x (east). */
export type MarkFace = 'top' | 'south' | 'east'

/** A line drawn on one face of a part. */
export interface IconMark<Face extends MarkFace = MarkFace> {
  on: Face
  /**
   * The line as pairs of icon units: x, y on a top; x, z on a south wall; y, z on an east wall. The pairs are
   * positions in the object's footprint, not offsets from the part, so move them together with their part.
   */
  line: readonly number[]
  /** An open `line`, or a closed shape filled with the line colour (`solid`) or with paper (`screen`). */
  kind: 'line' | 'solid' | 'screen'
}

export type TopMark = IconMark<'top'>

export function box(x: number, y: number, z: number, w: number, d: number, h: number, ...marks: IconMark[]): IconPart {
  return { shape: 'box', x, y, z, w, d, h, marks }
}

export function prism(outline: readonly Spot[], z: number, h: number, ...marks: TopMark[]): IconPart {
  return { shape: 'prism', outline, z, h, marks }
}

/** An upright cylinder around (x, y). */
export function cylinder(x: number, y: number, r: number, z: number, h: number, ...marks: TopMark[]): IconPart {
  return prism(arc(x, y, r, 0, 360), z, h, ...marks)
}

export function ball(x: number, y: number, z: number, r: number): IconPart {
  return { shape: 'ball', x, y, z, r }
}

/** An open line through the given pairs. */
export function line<Face extends MarkFace>(on: Face, ...pairs: number[]): IconMark<Face> {
  return { on, line: pairs, kind: 'line' }
}

/** The outline of a rectangle between two corners. */
export function frame<Face extends MarkFace>(on: Face, a0: number, b0: number, a1: number, b1: number): IconMark<Face> {
  return line(on, a0, b0, a1, b0, a1, b1, a0, b1, a0, b0)
}

/** A small solid rectangle between two corners, such as a light or a card. */
export function block<Face extends MarkFace>(on: Face, a0: number, b0: number, a1: number, b1: number): IconMark<Face> {
  return { on, line: [a0, b0, a1, b0, a1, b1, a0, b1], kind: 'solid' }
}

/** A paper rectangle between two corners, such as a screen; later marks are drawn on it. */
export function screen<Face extends MarkFace>(on: Face, a0: number, b0: number, a1: number, b1: number): IconMark<Face> {
  return { on, line: [a0, b0, a1, b0, a1, b1, a0, b1], kind: 'screen' }
}

/** A circle drawn as a closed line. */
export function ring<Face extends MarkFace>(on: Face, a: number, b: number, r: number): IconMark<Face> {
  const points = arc(a, b, r, 0, 360)
  return line(on, ...points.flat(), ...points[0]!)
}

/** Degrees between two points drawn along a curve. */
const ARC_STEP = 15

/** Points along a circle around (x, y) from one angle to another, in degrees; 0 points along +x and 90 along +y. */
export function arc(x: number, y: number, r: number, from: number, to: number): Spot[] {
  const steps = Math.max(1, Math.round(Math.abs(to - from) / ARC_STEP))
  const points = Array.from({ length: steps + 1 }, (_, step) => {
    const angle = (from + ((to - from) * step) / steps) * Math.PI / 180
    return [x + r * Math.cos(angle), y + r * Math.sin(angle)] as const
  })
  // A full circle ends where it starts; an outline lists that point once.
  return to - from === 360 ? points.slice(0, steps) : points
}
