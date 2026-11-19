/**
 * The parts an icon object is built from. An object stands inside a 1 × 1 footprint: x runs along the
 * map's gx (towards the east corner), y along gy (towards the west corner), z is up, all in one unit.
 * In the default view the reader sees every part's top, its wall towards +x (east) and its wall towards +y (south).
 *
 * An object is drawn in quiet lines. Its accent is the one thing that says what the object is, such as a
 * database's top disc or a terminal's prompt: one part, or the few marks that draw that thing. The accent is
 * drawn in ink, or in the color its element was given.
 */
export type IconPart = Prism | Ball

/** The axis a prism's outline is pushed along. */
export type Axis = 'y' | 'z'

/**
 * A flat outline pushed straight along one axis. Pushed along z it stands upright on its ground outline: a box,
 * a cylinder, a rounded plate. Pushed along y it is an upright panel that faces south.
 */
export interface Prism {
  shape: 'prism'
  axis: Axis
  /** The outline across the axis, as pairs: x, y for the z axis; x, z for the y axis. */
  outline: readonly Spot[]
  /** Where the prism starts on its axis and how far it reaches from there. */
  from: number
  length: number
  marks: readonly IconMark[]
  accent: boolean
}

/** A ball around (x, y, z). */
export interface Ball {
  shape: 'ball'
  x: number
  y: number
  z: number
  r: number
  accent: boolean
}

/** A point of an outline, on the plane the outline lies in. */
export type Spot = readonly [a: number, b: number]

/** The face a mark is drawn on: the part's top, its wall towards +y (south) or its wall towards +x (east). */
export type MarkFace = 'top' | 'south' | 'east'

/** A line drawn on one flat face of a part. */
export interface IconMark {
  on: MarkFace
  /**
   * The line as pairs of icon units: x, y on a top; x, z on a south wall; y, z on an east wall. The pairs are
   * positions in the object's footprint, not offsets from the part, so move them together with their part.
   */
  line: readonly number[]
  /** An open `line`, or a closed shape filled with the line color (`solid`) or with paper (`screen`). */
  kind: 'line' | 'solid' | 'screen'
  accent: boolean
}

/** The same part or mark as part of the object's accent. */
export function accent<Item extends IconPart | IconMark>(item: Item): Item {
  return { ...item, accent: true }
}

/** An upright shape with the ground outline `outline`, from height `z` up by `h`. */
export function upright(outline: readonly Spot[], z: number, h: number, ...marks: IconMark[]): Prism {
  return { shape: 'prism', axis: 'z', outline, from: z, length: h, marks, accent: false }
}

export function box(x: number, y: number, z: number, w: number, d: number, h: number, ...marks: IconMark[]): Prism {
  return upright(rectangle(x, y, x + w, y + d), z, h, ...marks)
}

/** An upright cylinder around (x, y). */
export function cylinder(x: number, y: number, r: number, z: number, h: number, ...marks: IconMark[]): Prism {
  return upright(circle(x, y, r), z, h, ...marks)
}

/**
 * An upright panel that faces south: its outline is given as x, z pairs, its back is at `y` and it is `d` thick.
 * A screen, a clock face and a cloud are panels.
 */
export function panel(outline: readonly Spot[], y: number, d: number, ...marks: IconMark[]): Prism {
  return { shape: 'prism', axis: 'y', outline, from: y, length: d, marks, accent: false }
}

export function ball(x: number, y: number, z: number, r: number): Ball {
  return { shape: 'ball', x, y, z, r, accent: false }
}

/** An open line through the given pairs. */
export function line(on: MarkFace, ...pairs: number[]): IconMark {
  return { on, line: pairs, kind: 'line', accent: false }
}

/** A closed outline as a line, such as a picture frame or a ring. */
export function frame(on: MarkFace, outline: readonly Spot[]): IconMark {
  return line(on, ...outline.flat(), ...outline[0]!)
}

/** A small shape filled with the line color, such as a light or a key. */
export function block(on: MarkFace, outline: readonly Spot[]): IconMark {
  return { on, line: outline.flat(), kind: 'solid', accent: false }
}

/** A shape filled with paper, such as a screen or a card; later marks are drawn on it. */
export function screen(on: MarkFace, outline: readonly Spot[]): IconMark {
  return { on, line: outline.flat(), kind: 'screen', accent: false }
}

/** The four corners of a rectangle between two corners. */
export function rectangle(a0: number, b0: number, a1: number, b1: number): Spot[] {
  return [[a0, b0], [a1, b0], [a1, b1], [a0, b1]]
}

/** A rectangle between two corners whose corners are rounded with radius `r`. */
export function rounded(a0: number, b0: number, a1: number, b1: number, r: number): Spot[] {
  return [
    ...arc(a1 - r, b0 + r, r, 270, 360),
    ...arc(a1 - r, b1 - r, r, 0, 90),
    ...arc(a0 + r, b1 - r, r, 90, 180),
    ...arc(a0 + r, b0 + r, r, 180, 270),
  ]
}

export function circle(a: number, b: number, r: number): Spot[] {
  return arc(a, b, r, 0, 360)
}

/** Degrees between two points drawn along a curve. The painter takes a turn of up to twice this for a curve, not an edge. */
export const ARC_STEP = 15

/** Points along a circle around (a, b) from one angle to another, in degrees; 0 points along +a and 90 along +b. */
export function arc(a: number, b: number, r: number, from: number, to: number): Spot[] {
  const steps = Math.max(1, Math.round(Math.abs(to - from) / ARC_STEP))
  const points = Array.from({ length: steps + 1 }, (_, step) => {
    const angle = (from + ((to - from) * step) / steps) * Math.PI / 180
    return [a + r * Math.cos(angle), b + r * Math.sin(angle)] as const
  })
  // A full circle ends where it starts; an outline lists that point once.
  return to - from === 360 ? points.slice(0, steps) : points
}
