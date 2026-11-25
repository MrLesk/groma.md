/**
 * How an icon follows the camera scale: only the width of its lines does. An icon is one drawing at every size, so
 * no line of it appears or disappears with the zoom. The rule is written twice, side by side, and the two must stay equal:
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
