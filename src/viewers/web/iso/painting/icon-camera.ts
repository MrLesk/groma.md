/**
 * How an icon follows the camera scale. Each rule is written twice, side by side, and the two must stay equal:
 * as a function, which a still image such as a cover applies once at its fixed scale, and as the stylesheet
 * expression the live map evaluates from --camera-scale while the camera moves. The painter writes
 * `--icon-side`, the side of the icon's box in plane pixels, on every live icon.
 *
 * An icon is as large as its box, and the box follows the letters of its name. So it is never drawn larger, and
 * it is drawn whenever its name is: like its name it only gets small when the map is zoomed out.
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

/** An object's quiet inner lines fade in between these sizes: a smaller object shows its outline and its accent alone. */
const DETAIL: Ramp = { from: 14, to: 26 }

/** Opacity of an object's quiet inner lines, for a box `side` screen pixels wide. */
export function detailOpacity(side: number): number {
  return rampAt(DETAIL, side)
}
export const DETAIL_OPACITY_CSS = rampCss(DETAIL)

/**
 * An icon is a fine line drawing: its lines are this share of the box's screen side, kept between `min` and `max`
 * screen pixels, so they stay hairlines however large it is drawn.
 */
const STROKE = { min: 0.6, max: 1, perPixel: 1 / 34 }

/** Width of an icon's lines in screen pixels, for a box `side` screen pixels wide. */
export function iconStroke(side: number): number {
  return Math.min(STROKE.max, Math.max(STROKE.min, side * STROKE.perPixel))
}
export const ICON_STROKE_CSS = `calc(1px * clamp(${STROKE.min}, ${SCREEN_SIDE_CSS} * ${STROKE.perPixel.toFixed(4)}, ${STROKE.max}))`
