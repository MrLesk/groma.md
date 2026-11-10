/**
 * The map's levels from the outside in, like heading levels: each step down
 * is thinner and darker, so at any zoom the eye sorts the big outlined
 * boundaries from the small solid things and the hairline connections.
 * Kind (patterns, shapes) is the other axis and never changes a weight.
 */
export const LEVELS = ['island', 'slab', 'building', 'route'] as const
export type Level = (typeof LEVELS)[number]

/** Each level down is this much thinner. */
const STROKE_RATIO = 1.4
/** Each level down mixes this much more ink into the paper. */
const TINT_RATIO = 1.8
/** Buildings stroke one screen pixel at fit; islands and slabs are wider, routes thinner. */
const BUILDING_STROKE = 1
/** Ink share of an island's surface. */
const ISLAND_TINT = 0.04
/** A thing's sides lie one level deeper than its top, the left face half a level more, for the 3D read. */
export const SIDE = { right: 1, left: 1.5 } as const
/** The smallest facade mark must reach one screen pixel before its pattern is useful. */
export const FACADE_MARK = 1.1

export function depthOf(level: Level): number {
  return LEVELS.indexOf(level)
}

/** Stroke width in screen pixels at fit. */
export function strokeAt(depth: number): number {
  return BUILDING_STROKE * STROKE_RATIO ** (depthOf('building') - depth)
}

/** An authored color takes this many times the ink share of its surface, so its hue reads at fit zoom. */
export const COLOR_STRENGTH = 2
/** Share of the authored color in the outline of its element; the rest is the neutral line. */
export const COLOR_EDGE = 0.7

/** Share of ink mixed into the paper, 0 to 1. */
export function tintAt(depth: number): number {
  return ISLAND_TINT * TINT_RATIO ** depth
}

/** Hover, selection and lit routes climb the stroke ladder by this many levels. */
export function emphasis(steps: number): number {
  return STROKE_RATIO ** steps
}

/** Every stroke scales with the square root of the zoom relative to fit, so boundaries get bolder zooming in without routes turning to rope. */
export function weightAt(zoomRatio: number): number {
  return Math.min(2, Math.max(0.75, Math.sqrt(zoomRatio)))
}

export function facadeDetailsVisible(k: number): boolean {
  return k * FACADE_MARK >= 1
}

/** Share of ink in an icon's lines; the rest is the outline colour of what it stands on. */
export const ICON_INK = 0.6
/**
 * An icon is a small drawing, so its lines follow its own size on screen, not the map's weight: `perPixel` of the
 * slot's screen side, kept between `min` and `max` screen pixels.
 */
export const ICON_STROKE = { min: 0.35, max: 1.25, perPixel: 1 / 45 } as const
/** A flat glyph's lines are this share of its slot's screen side, between `min` and `max` screen pixels, like the title beside it. */
export const GLYPH_STROKE = { min: 0.6, max: 3, perPixel: 1 / 18 } as const
/** Screen pixels a landmark icon's slot never gets narrower than; its diamond is twice as wide. */
export const LANDMARK_MIN_SIDE = 34
/** An icon's inner lines fade in between these screen pixels of slot side: a smaller object shows its outline alone. */
export const ICON_DETAIL = { from: 16, to: 34 } as const

/**
 * How much a landmark icon is enlarged at camera scale `k`: enough to keep its slot LANDMARK_MIN_SIDE screen
 * pixels wide, and never more than `room` times its slot. The live stylesheet computes the same from --camera-scale.
 */
export function landmarkZoom(k: number, side: number, room: number): number {
  return Math.min(room, Math.max(1, LANDMARK_MIN_SIDE / (side * k)))
}

/** Width of an icon's lines in screen pixels, for a slot of `side` plane pixels at camera scale `k`. */
export function iconStrokeAt(k: number, side: number): number {
  return Math.min(ICON_STROKE.max, Math.max(ICON_STROKE.min, k * side * ICON_STROKE.perPixel))
}
/** A roof icon narrower than this many screen pixels is a smudge, so the map leaves it out. */
const ROOF_ICON_MIN_WIDTH = 14

/** `side` is a component's icon slot in plane pixels; its diamond is twice as wide on screen. */
export function roofIconsVisible(k: number, side: number): boolean {
  return k * 2 * side >= ROOF_ICON_MIN_WIDTH
}

/** Island dots and crosses and the group hatching repeat this many world pixels apart; slab grain is coarser. */
export const SURFACE_TILE = 8

/** A repeat shorter than two screen pixels cannot be drawn: it reads as flat grey or moiré and only costs Safari paint time. */
export function surfacePatternsVisible(k: number): boolean {
  return k * SURFACE_TILE >= 2
}
