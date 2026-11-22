/**
 * The parts an icon object is built from. An object lies on a 1 × 1 footprint like a small relief: x runs along
 * the map's gx (to the right when north is up), y along gy (to the south, down the page), and z is up, all in one
 * unit. A part is a flat shape on the footprint with a height: a sheet, a card on that sheet, a box, a cylinder.
 * The one other part is a ball.
 *
 * Nothing stands upright as a thin sheet. A picture that has a top, such as a window or a document, lies face up
 * with its top to the north (small y), the way the 2D view reads it, and is thick enough to show a wall on a
 * tilted map. The 2D view and the panes see an object from straight above; a tilted map sees the same object from
 * the map's angle. In the default view the reader sees every part's top, its wall towards +x (east) and its wall
 * towards +y (south).
 *
 * An object is drawn in quiet lines. Its accent is the one thing that says what the object is, such as a
 * database's top disc or a terminal's prompt: one part, or the few marks that draw that thing. The accent is
 * drawn in ink, or in the color its element was given.
 */
export type IconPart = Prism | Ball

/** A flat outline on the footprint, raised straight up: a sheet, a plate, a box, a cylinder. */
export interface Prism {
  shape: 'prism'
  /** The outline seen from above, as x, y pairs. */
  outline: readonly Spot[]
  /** The height its underside lies at: 0 on the ground, or the top of the part it lies on. */
  z: number
  /** How far it rises from there. */
  h: number
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

/** A point of an outline, as x, y on the footprint. */
export type Spot = readonly [a: number, b: number]

/**
 * The face a mark is drawn on: the part's top, its wall towards +y (south) or its wall towards +x (east). A mark
 * on a wall shows on a tilted map only, so what says what the object is belongs on a top.
 */
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

/**
 * A shape with the ground outline `outline`, from height `z` up by `h`. The objects use few heights, so they
 * look like one set: on the ground a sheet is 0.08 high, a thick plate 0.12 and a thing with a body 0.16; a
 * detail that lies on a part is 0.05 high, or 0.1 when it is the thing the object is about.
 */
export function prism(outline: readonly Spot[], z: number, h: number, ...marks: IconMark[]): Prism {
  return { shape: 'prism', outline, z, h, marks, accent: false }
}

export function box(x: number, y: number, z: number, w: number, d: number, h: number, ...marks: IconMark[]): Prism {
  return prism(rectangle(x, y, x + w, y + d), z, h, ...marks)
}

/** A cylinder that stands on the circle around (x, y). */
export function cylinder(x: number, y: number, r: number, z: number, h: number, ...marks: IconMark[]): Prism {
  return prism(circle(x, y, r), z, h, ...marks)
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
