import type { OptimizedBuffer, RGBA } from '@opentui/core'

import type { Bounds, Point } from '../../../types.ts'

const NORTH = 1
const EAST = 2
const SOUTH = 4
const WEST = 8

/** How one frame or route draws its cells; the look with the higher rank owns a shared cell. */
export interface LineLook {
  color: RGBA
  attributes: number
  heavy: boolean
  dashed: boolean
  rounded: boolean
  rank: number
}

const LIGHT: Record<number, string> = {
  [NORTH | SOUTH]: '│', [EAST | WEST]: '─', [NORTH]: '│', [SOUTH]: '│', [EAST]: '─', [WEST]: '─',
  [EAST | SOUTH]: '┌', [WEST | SOUTH]: '┐', [NORTH | EAST]: '└', [NORTH | WEST]: '┘',
  [NORTH | SOUTH | EAST]: '├', [NORTH | SOUTH | WEST]: '┤', [EAST | WEST | SOUTH]: '┬', [EAST | WEST | NORTH]: '┴',
  [NORTH | EAST | SOUTH | WEST]: '┼',
}

const HEAVY: Record<number, string> = {
  [NORTH | SOUTH]: '┃', [EAST | WEST]: '━', [NORTH]: '┃', [SOUTH]: '┃', [EAST]: '━', [WEST]: '━',
  [EAST | SOUTH]: '┏', [WEST | SOUTH]: '┓', [NORTH | EAST]: '┗', [NORTH | WEST]: '┛',
  [NORTH | SOUTH | EAST]: '┣', [NORTH | SOUTH | WEST]: '┫', [EAST | WEST | SOUTH]: '┳', [EAST | WEST | NORTH]: '┻',
  [NORTH | EAST | SOUTH | WEST]: '╋',
}

const ROUNDED: Record<number, string> = {
  [EAST | SOUTH]: '╭', [WEST | SOUTH]: '╮', [NORTH | EAST]: '╰', [NORTH | WEST]: '╯',
}

const DASHED: Record<number, [string, string]> = {
  [NORTH | SOUTH]: ['┆', '┇'], [NORTH]: ['┆', '┇'], [SOUTH]: ['┆', '┇'],
  [EAST | WEST]: ['╌', '┅'], [EAST]: ['╌', '┅'], [WEST]: ['╌', '┅'],
}

function glyph(mask: number, look: LineLook): string {
  if (look.dashed && DASHED[mask] !== undefined) return DASHED[mask]![look.heavy ? 1 : 0]
  if (look.heavy) return HEAVY[mask] ?? '╋'
  if (look.rounded && ROUNDED[mask] !== undefined) return ROUNDED[mask]!
  return LIGHT[mask] ?? '┼'
}

function direction(from: Point, to: Point): number {
  if (to.x > from.x) return EAST
  if (to.x < from.x) return WEST
  return to.y > from.y ? SOUTH : NORTH
}

const OPPOSITE: Record<number, number> = { [NORTH]: SOUTH, [SOUTH]: NORTH, [EAST]: WEST, [WEST]: EAST }

/**
 * Frames and routes draw into one canvas of line directions. Where lines meet, the cell becomes the matching
 * box-drawing junction, so a route joins a frame with a tee and crosses another route with a cross.
 */
export class LineCanvas {
  private readonly cells = new Map<number, { mask: number; look: LineLook }>()
  private readonly clip: Bounds

  constructor(clip: Bounds) {
    this.clip = clip
  }

  private key(x: number, y: number): number {
    return y * 65536 + x
  }

  mark(x: number, y: number, mask: number, look: LineLook): void {
    if (x < this.clip.x || y < this.clip.y || x >= this.clip.x + this.clip.width || y >= this.clip.y + this.clip.height) return
    const key = this.key(x, y)
    const known = this.cells.get(key)
    if (known === undefined) this.cells.set(key, { mask, look })
    else this.cells.set(key, { mask: known.mask | mask, look: look.rank >= known.look.rank ? look : known.look })
  }

  /** An orthogonal polyline; consecutive runs share their corner cells. */
  path(points: readonly Point[], look: LineLook): void {
    for (let index = 1; index < points.length; index += 1) {
      const from = points[index - 1]!
      const to = points[index]!
      const forward = direction(from, to)
      const length = Math.abs(to.x - from.x) + Math.abs(to.y - from.y)
      const stepX = Math.sign(to.x - from.x)
      const stepY = Math.sign(to.y - from.y)
      for (let step = 0; step <= length; step += 1) {
        const mask = (step < length ? forward : 0) | (step > 0 ? OPPOSITE[forward]! : 0)
        if (mask !== 0) this.mark(from.x + stepX * step, from.y + stepY * step, mask, look)
      }
    }
  }

  frame(bounds: Bounds, look: LineLook): void {
    const { x, y, width, height } = bounds
    if (width < 2 || height < 2) return
    const right = x + width - 1
    const bottom = y + height - 1
    this.path([{ x, y }, { x: right, y }, { x: right, y: bottom }, { x, y: bottom }, { x, y }], look)
  }

  /** Whether any frame or route line passes through the cell. */
  drawn(x: number, y: number): boolean {
    return this.cells.has(this.key(x, y))
  }

  /** Whether a line runs up or down through the cell, so a name on a horizontal frame can step around it. */
  crossedVertically(x: number, y: number): boolean {
    return ((this.cells.get(this.key(x, y))?.mask ?? 0) & (NORTH | SOUTH)) !== 0
  }

  paint(buffer: OptimizedBuffer, background: RGBA): void {
    for (const [key, { mask, look }] of this.cells) {
      buffer.setCell(key % 65536, Math.floor(key / 65536), glyph(mask, look), look.color, background, look.attributes)
    }
  }
}
