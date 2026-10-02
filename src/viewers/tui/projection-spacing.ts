import type { CellRect } from '../../sheet/types.ts'

/** A shape to space: its sheet body, the shape it stands in, and the terminal cells its text needs. */
export interface SpacedShape {
  item: { key: string; parent?: string }
  body: CellRect
  columns: number
  rows: number
}

/** A coordinate pair on one sheet axis that must land at least `cells` terminal cells apart. */
interface AxisSpan {
  low: number
  high: number
  cells: number
}

/** Terminal cells per sheet cell where nothing needs more room; a character is about twice as tall as wide. */
const SCALE = [0.08, 0.03] as const
/** A surface keeps blank cells inside its frame; siblings keep ground between them for routes to pass. */
const INSET = [3, 2] as const
const GAP = [4, 2] as const
/** Rows are scarcer than columns: diagonal neighbours separate by rows only when far more sheet lies between them that way. */
const ROW_PREFERENCE = 2

type Axis = 0 | 1

function low(rect: CellRect, axis: Axis): number {
  return axis === 0 ? rect.gx : rect.gy
}

function high(rect: CellRect, axis: Axis): number {
  return axis === 0 ? rect.gx + rect.w : rect.gy + rect.d
}

function overlapping(a: CellRect, b: CellRect, axis: Axis): boolean {
  return low(a, axis) < high(b, axis) && low(b, axis) < high(a, axis)
}

function gapBetween(a: CellRect, b: CellRect, axis: Axis): number {
  return Math.max(low(b, axis) - high(a, axis), low(a, axis) - high(b, axis))
}

/** `before` must end at least `cells` before `after` on the axis; equal coordinates stay together. */
function keep(spans: AxisSpan[], before: number, after: number, cells: number): void {
  if (before < after && cells > 0) spans.push({ low: before, high: after, cells })
}

/**
 * Neighbours stay apart, in their sheet order, on the axis that separates them. Diagonal ones use columns, which
 * terminals have more of, unless far more sheet lies between them by rows; their other axis is free to shift.
 */
function separate(spans: [AxisSpan[], AxisSpan[]], a: CellRect, b: CellRect): void {
  if (overlapping(a, b, 0) && overlapping(a, b, 1)) return
  let axis: Axis
  if (overlapping(a, b, 1)) axis = 0
  else if (overlapping(a, b, 0)) axis = 1
  else axis = gapBetween(a, b, 1) > ROW_PREFERENCE * gapBetween(a, b, 0) ? 1 : 0
  const [first, second] = high(a, axis) <= low(b, axis) ? [a, b] : [b, a]
  keep(spans[axis], high(first, axis), low(second, axis), GAP[axis])
}

/** Sheet coordinates are multiples of small cell fractions; this keys equal ones together. */
function keyOf(value: number): number {
  return Math.round(value * 1024)
}

/**
 * Places every sheet coordinate of one axis in terminal cells. A coordinate stays at its proportional position,
 * `scale` cells per sheet cell, unless a span pushes it further along; spans always point along the axis, so one
 * pass in sheet order settles them. Equal coordinates share a cell, so aligned edges stay aligned.
 */
function warpAxis(values: readonly number[], spans: readonly AxisSpan[], scale: number): (value: number) => number {
  const keys = [...new Set([...values, ...spans.flatMap(span => [span.low, span.high])].map(keyOf))].sort((a, b) => a - b)
  const index = new Map(keys.map((key, at) => [key, at]))
  const incoming = keys.map((): AxisSpan[] => [])
  for (const span of spans) incoming[index.get(keyOf(span.high))!]!.push(span)
  const cells: number[] = []
  for (const [at, key] of keys.entries()) {
    let cell = scale * key / 1024
    for (const span of incoming[at]!) cell = Math.max(cell, cells[index.get(keyOf(span.low))!]! + span.cells)
    cells.push(cell)
  }
  return value => Math.round(cells[index.get(keyOf(value))!]!)
}

/**
 * The terminal cell of every shape edge on both axes. Every shape is as large as its text, nests inside its parent's
 * frame and stands clear of its siblings; elsewhere edges keep their proportional sheet positions.
 */
export function spacedAxes(shapes: readonly SpacedShape[]): [(value: number) => number, (value: number) => number] {
  const spans: [AxisSpan[], AxisSpan[]] = [[], []]
  const byKey = new Map(shapes.map(shape => [shape.item.key, shape]))
  const siblings = new Map<string | undefined, SpacedShape[]>()
  for (const shape of shapes) {
    keep(spans[0], low(shape.body, 0), high(shape.body, 0), shape.columns - 1)
    keep(spans[1], low(shape.body, 1), high(shape.body, 1), shape.rows - 1)
    const parent = shape.item.parent === undefined ? undefined : byKey.get(shape.item.parent)
    if (parent !== undefined) {
      for (const axis of [0, 1] as const) {
        keep(spans[axis], low(parent.body, axis), low(shape.body, axis), INSET[axis])
        keep(spans[axis], high(shape.body, axis), high(parent.body, axis), INSET[axis])
      }
    }
    siblings.set(parent?.item.key, [...siblings.get(parent?.item.key) ?? [], shape])
  }
  for (const group of siblings.values()) {
    for (const [index, a] of group.entries()) {
      for (const b of group.slice(index + 1)) separate(spans, a.body, b.body)
    }
  }
  const values = (axis: Axis) => shapes.flatMap(shape => [low(shape.body, axis), high(shape.body, axis)])
  return [warpAxis(values(0), spans[0], SCALE[0]), warpAxis(values(1), spans[1], SCALE[1])]
}
