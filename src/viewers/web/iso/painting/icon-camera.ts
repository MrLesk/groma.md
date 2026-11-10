/**
 * How an icon follows the camera scale. Each rule is written twice, side by side, and the two must stay equal:
 * as a function, which a still image such as a cover applies once at its fixed scale, and as the stylesheet
 * expression the live map evaluates from --camera-scale while the camera moves. The painter writes
 * `--icon-side`, the slot's side in plane pixels, on every live icon.
 *
 * There are two kinds of icon. A landmark, the icon before a system's or container's title, is enlarged so it
 * stays readable when the map is zoomed out. Every other icon stands on a roof, shrinks with the map and fades
 * out when it would be a smudge.
 */
const LIVE_SCALE = 'var(--camera-scale, 1)'

/** A drawing made once at a fixed camera scale, with no live stylesheet: a cover. */
export interface Still {
  zoom: number
}

/** Screen pixels a landmark's slot never gets narrower than; its diamond is twice as wide. */
const LANDMARK_MIN_SIDE = 34

/** How much a landmark is enlarged at camera scale `k`, so its slot of `side` plane pixels stays readable. */
export function landmarkZoom(k: number, side: number): number {
  return Math.max(1, LANDMARK_MIN_SIDE / (side * k))
}
export const LANDMARK_ZOOM_CSS = `max(1, calc(${LANDMARK_MIN_SIDE} / (var(--icon-side) * ${LIVE_SCALE})))`

/** The slot's side on screen. The live map keeps a landmark's enlargement in --icon-zoom, 1 for every other icon. */
export function screenSide(k: number, side: number, zoom: number): number {
  return side * k * zoom
}
const SCREEN_SIDE_CSS = `var(--icon-side) * ${LIVE_SCALE} * var(--icon-zoom)`

/** A value that rises from 0 to 1 while the slot's screen side grows from `from` to `to` pixels. */
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

/** A roof icon fades out below these sizes instead of staying on the map as a smudge. */
const ROOF_ICON: Ramp = { from: 7, to: 10 }

/** Opacity of a roof icon whose slot is `side` screen pixels wide. */
export function roofIconOpacity(side: number): number {
  return rampAt(ROOF_ICON, side)
}
export const ROOF_ICON_OPACITY_CSS = rampCss(ROOF_ICON)

/** An object's inner lines fade in between these sizes: a smaller object shows its outline alone. */
const DETAIL: Ramp = { from: 16, to: 34 }

/** Opacity of an object's inner lines, for a slot `side` screen pixels wide. */
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

/** An object is a small drawing: its lines follow its own size, not the map's weight. */
const OBJECT_STROKE: StrokeRule = { min: 0.35, max: 1.25, perPixel: 1 / 45 }
/** A glyph is drawn like the title beside it, so its lines are heavier. Only the live map shows glyphs: a cover is tilted. */
const GLYPH_STROKE: StrokeRule = { min: 0.6, max: 3, perPixel: 1 / 18 }

function strokeCss(rule: StrokeRule): string {
  return `calc(1px * clamp(${rule.min}, ${SCREEN_SIDE_CSS} * ${rule.perPixel.toFixed(4)}, ${rule.max}))`
}

/** Width of an object's lines in screen pixels, for a slot `side` screen pixels wide. */
export function objectStroke(side: number): number {
  return Math.min(OBJECT_STROKE.max, Math.max(OBJECT_STROKE.min, side * OBJECT_STROKE.perPixel))
}
export const OBJECT_STROKE_CSS = strokeCss(OBJECT_STROKE)
export const GLYPH_STROKE_CSS = strokeCss(GLYPH_STROKE)
