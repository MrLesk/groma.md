/**
 * How an icon follows the camera scale. Each rule is written twice, side by side, and the two must stay equal:
 * as a function, which a still image such as a cover applies once at its fixed scale, and as the stylesheet
 * expression the live map evaluates from --camera-scale while the camera moves. The painter writes
 * `--icon-side`, the side of the icon's box in plane pixels, on every live icon.
 *
 * An icon is as large as its box, and the box follows the letters of its name. So it is never drawn larger, and
 * like its name it gets small when the map is zoomed out, until it fades away.
 */
const SCREEN_SIDE_CSS = 'var(--icon-side) * var(--camera-scale, 1)'

/** A drawing made once at a fixed camera scale, with no live stylesheet: a cover. */
export interface Still {
  zoom: number
}

/** A value that rises from 0 to 1 while a box's screen side grows from `from` to `to` pixels. */
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

/** An icon fades out below these sizes instead of staying on the map as a smudge. */
const ICON: Ramp = { from: 5, to: 8 }

/** Opacity of an icon whose box is `side` screen pixels wide. */
export function iconOpacity(side: number): number {
  return rampAt(ICON, side)
}
export const ICON_OPACITY_CSS = rampCss(ICON)

/** An object's quiet inner lines fade in between these sizes: a smaller object shows its outline and its accent alone. */
const DETAIL: Ramp = { from: 14, to: 26 }

/** Opacity of an object's quiet inner lines, for a box `side` screen pixels wide. */
export function detailOpacity(side: number): number {
  return rampAt(DETAIL, side)
}
export const DETAIL_OPACITY_CSS = rampCss(DETAIL)

/** A line width that is `perPixel` of the box's screen side, kept between `min` and `max` screen pixels. */
interface StrokeRule {
  min: number
  max: number
  perPixel: number
}

/** An object is a fine line drawing: its lines stay hairlines however large it is drawn. */
const OBJECT_STROKE: StrokeRule = { min: 0.6, max: 1, perPixel: 1 / 34 }
/** A glyph is drawn like the name beside it, so its lines are heavier. Only the live map shows glyphs: a cover is tilted. */
const GLYPH_STROKE: StrokeRule = { min: 0.6, max: 3, perPixel: 1 / 18 }

function strokeCss(rule: StrokeRule): string {
  return `calc(1px * clamp(${rule.min}, ${SCREEN_SIDE_CSS} * ${rule.perPixel.toFixed(4)}, ${rule.max}))`
}

/** Width of an object's lines in screen pixels, for a box `side` screen pixels wide. */
export function objectStroke(side: number): number {
  return Math.min(OBJECT_STROKE.max, Math.max(OBJECT_STROKE.min, side * OBJECT_STROKE.perPixel))
}
export const OBJECT_STROKE_CSS = strokeCss(OBJECT_STROKE)
export const GLYPH_STROKE_CSS = strokeCss(GLYPH_STROKE)
