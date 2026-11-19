/**
 * How an icon follows the camera scale. Each rule is written twice, side by side, and the two must stay equal:
 * as a function, which a still image such as a cover applies once at its fixed scale, and as the stylesheet
 * expression the live map evaluates from --camera-scale while the camera moves. The painter writes
 * `--icon-side`, a slot's side in plane pixels, on every live icon and on a flat mark of its own size.
 *
 * No icon is drawn larger than its slot. Zoomed out, an icon on a roof fades away with its roof's name. A title's
 * icon stays: when its object would be too small to read it lies flat beside the title as its glyph, at the
 * title's size, and it stands up again when the map is zoomed in.
 */
const SCREEN_SIDE_CSS = 'var(--icon-side) * var(--camera-scale, 1)'

/** A drawing made once at a fixed camera scale, with no live stylesheet: a cover. */
export interface Still {
  zoom: number
}

/** A value that rises from 0 to 1 while a slot's screen side grows from `from` to `to` pixels. */
interface Ramp {
  from: number
  to: number
}

function rampAt(ramp: Ramp, side: number): number {
  return Math.min(1, Math.max(0, (side - ramp.from) / (ramp.to - ramp.from)))
}

function rampCss(ramp: Ramp): string {
  return `clamp(0, calc((${SCREEN_SIDE_CSS} - ${ramp.from}) / ${ramp.to - ramp.from}), 1)`
}

/** An icon on a roof fades out below these sizes instead of staying on the map as a smudge. */
const ROOF_ICON: Ramp = { from: 6, to: 9 }

/** Opacity of a roof's icon whose slot is `side` screen pixels wide. */
export function roofIconOpacity(side: number): number {
  return rampAt(ROOF_ICON, side)
}
export const ROOF_ICON_OPACITY_CSS = rampCss(ROOF_ICON)

/** A title's object stands above these sizes; between them it gives way to the flat glyph beside the title. */
const STANDING: Ramp = { from: 14, to: 20 }

/** How far a title's object stands, from 0 (the glyph lies flat) to 1, for a slot `side` screen pixels wide. */
export function standing(side: number): number {
  return rampAt(STANDING, side)
}
export const STANDING_CSS = rampCss(STANDING)

/** An object's quiet inner lines fade in between these sizes: a smaller object shows its outline and its accent alone. */
const DETAIL: Ramp = { from: 14, to: 26 }

/** Opacity of an object's quiet inner lines, for a slot `side` screen pixels wide. */
export function detailOpacity(side: number): number {
  return rampAt(DETAIL, side)
}
export const DETAIL_OPACITY_CSS = rampCss(DETAIL)

/** A line width that is `perPixel` of the slot's screen side, kept between `min` and `max` screen pixels. */
interface StrokeRule {
  min: number
  max: number
  perPixel: number
}

/** An object is a fine line drawing: its lines stay hairlines however large it is drawn. */
const OBJECT_STROKE: StrokeRule = { min: 0.6, max: 1, perPixel: 1 / 34 }
/** A glyph is drawn like the title beside it, so its lines are heavier. */
const GLYPH_STROKE: StrokeRule = { min: 0.6, max: 3, perPixel: 1 / 18 }

function strokeAt(rule: StrokeRule, side: number): number {
  return Math.min(rule.max, Math.max(rule.min, side * rule.perPixel))
}

function strokeCss(rule: StrokeRule): string {
  return `calc(1px * clamp(${rule.min}, ${SCREEN_SIDE_CSS} * ${rule.perPixel.toFixed(4)}, ${rule.max}))`
}

/** Width of an object's lines in screen pixels, for a slot `side` screen pixels wide. */
export function objectStroke(side: number): number {
  return strokeAt(OBJECT_STROKE, side)
}
export const OBJECT_STROKE_CSS = strokeCss(OBJECT_STROKE)

/** Width of a glyph's lines in screen pixels, for a mark `side` screen pixels wide. */
export function glyphStroke(side: number): number {
  return strokeAt(GLYPH_STROKE, side)
}
export const GLYPH_STROKE_CSS = strokeCss(GLYPH_STROKE)
