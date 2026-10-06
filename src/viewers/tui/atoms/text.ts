import type { OptimizedBuffer, RGBA } from '@opentui/core'

export function text(
  buffer: OptimizedBuffer,
  value: string,
  x: number,
  y: number,
  maxWidth: number,
  foreground: RGBA,
  background: RGBA,
  attributes = 0,
): void {
  if (maxWidth <= 0 || y < 0 || y >= buffer.height) return
  const start = Math.max(0, x)
  const skipped = start - x
  const available = Math.min(maxWidth - skipped, buffer.width - start)
  if (available <= 0) return
  buffer.drawText(
    [...value].slice(skipped, skipped + available).join(''),
    start,
    y,
    foreground,
    background,
    attributes,
  )
}

/** The text whole when it fits the width, else cut with an ellipsis. */
export function fitted(value: string, width: number): string {
  const characters = [...value]
  return characters.length <= width ? value : `${characters.slice(0, Math.max(0, width - 1)).join('')}…`
}

/** Writes the text centred across a span that starts at `x` and is `width` cells wide. */
export function centred(
  buffer: OptimizedBuffer,
  value: string,
  x: number,
  y: number,
  width: number,
  foreground: RGBA,
  background: RGBA,
  attributes = 0,
): void {
  const line = fitted(value, width)
  text(buffer, line, x + Math.floor((width - [...line].length) / 2), y, width, foreground, background, attributes)
}
