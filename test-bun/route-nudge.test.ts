import { expect, test } from 'bun:test'
import { visibleObstacle, type Endpoint, type FlatRoute, type Point } from '../src/sheet/route/geometry.ts'
import type { Box } from '../src/sheet/route/graph.ts'
import { nudgeRoutes } from '../src/sheet/route/nudge.ts'
import { BUNDLE_SPACING, ROUTE_CLEARANCE, ROUTE_UNIT } from '../src/sheet/route/space.ts'
import { crossingRouteIdsFor, sharedPathMeasure } from '../src/sheet/route/checks.ts'

// Two routes share the line y = 100 between their ports; the inner one leaves it first.
function sharedLine(): Point[][] {
  return [
    [{ x: 0, y: 0 }, { x: 0, y: 100 }, { x: 400, y: 100 }, { x: 400, y: 0 }],
    [{ x: 10, y: 0 }, { x: 10, y: 100 }, { x: 390, y: 100 }, { x: 390, y: 0 }],
  ]
}

const ends = [0, 10].map(x => ({
  source: { key: `source-${x}`, span: [x - 20, x + 20] as [number, number] },
  target: { key: `target-${x}`, span: [400 - x - 20, 400 - x + 20] as [number, number] },
}))

test.concurrent('routes sharing a roomy channel line spread to the bundle spacing around it', () => {
  const routes = sharedLine()
  nudgeRoutes(routes, [], ends)
  const [outer, inner] = routes.map(points => points[1]!.y)
  expect(outer! - inner!).toBeCloseTo(BUNDLE_SPACING, 6)
  expect((outer! + inner!) / 2).toBeCloseTo(100, 6)
})

test.concurrent('a narrow channel shrinks the spacing only as far as its walls require', () => {
  const walls: Box[] = [{ x0: 100, x1: 300, y0: 40, y1: 97 }, { x0: 100, x1: 300, y0: 103, y1: 160 }]
  const routes = sharedLine()
  nudgeRoutes(routes, walls, ends)
  const [outer, inner] = routes.map(points => points[1]!.y)
  expect(inner).toBeCloseTo(97, 6)
  expect(outer).toBeCloseTo(103, 6)
})

test.concurrent('neighbouring tight route bundles settle without entering buildings', () => {
  // Compressing one bundle changes the available gaps along another shared chain.
  const paths = [
    [[288.625, 313.625], [287.125, 313.625], [287.125, 59.875], [101.875, 59.875], [101.875, 34.125], [109.875, 34.125], [109.875, 35.875]],
    [[309.625, 314.625], [308.375, 314.625], [308.375, 60.25], [53.75, 60.25], [53.75, 53.5]],
    [[270.625, 324.125], [270.625, 325.375], [108.5, 325.375], [108.5, 59.875], [66.625, 59.875], [66.625, 43.375]],
    [[325.625, 327.625], [324.875, 327.625], [324.875, 59.9375], [62.25, 59.9375], [62.25, 52.5], [60.5, 52.5]],
    [[311.625, 340.625], [310.375, 340.625], [310.375, 65], [59.625, 65], [59.625, 60.25], [47.5, 60.25], [47.5, 39.5], [75.875, 39.5], [75.875, 40.875]],
    [[228.625, 356.625], [228.625, 65.125], [88.625, 65.125], [88.625, 59.875], [86.875, 59.875], [86.875, 36.875], [116.875, 36.875]],
    [[335.625, 367.625], [59.625, 367.625], [59.625, 60.25], [34.25, 60.25], [34.25, 51.875], [35.875, 51.875]],
    [[366.125, 376.125], [366.125, 59.9375], [58.25, 59.9375], [58.25, 53.5]],
    [[362.625, 373.625], [361.375, 373.625], [361.375, 361.375], [59.625, 361.375], [59.625, 60.25], [47.5, 60.25], [47.5, 57.625], [46.375, 57.625]],
    [[407.625, 374.625], [108.5, 374.625], [108.5, 59.875], [75.25, 59.875], [75.25, 58.25], [73.5, 58.25]],
    [[285.625, 391.625], [273.125, 391.625], [273.125, 59.9375], [81.125, 59.9375], [81.125, 58.625]],
    [[320.625, 413.625], [88.625, 413.625], [88.625, 59.9375], [94.625, 59.9375], [94.625, 58.625]],
    [[319.625, 445.625], [75.25, 445.625], [75.25, 60.0625], [69, 60.0625], [69, 58.75]],
  ]
  const spans = [
    [[312.625, 314.625], [107.875, 111.875]],
    [[313.625, 315.625], [53.75, 58.25]],
    [[268.875, 272.375], [61.125, 66.625]],
    [[326.625, 328.625], [52, 53]],
    [[339.625, 341.625], [73.875, 77.875]],
    [[228.625, 232.625], [36.375, 37.375]],
    [[366.625, 368.625], [51.375, 52.375]],
    [[364.625, 367.625], [53.75, 58.25]],
    [[372.625, 374.625], [57.125, 58.125]],
    [[374.625, 376.625], [57.25, 58.25]],
    [[390.625, 392.625], [78.875, 83.375]],
    [[412.625, 414.625], [91.625, 97.625]],
    [[444.625, 446.625], [66.75, 71.25]],
  ]
  const buildings = [
    [103.625, 56.625, 13, 2, 1],
    [36.375, 61.875, 9, 2, 1.5],
    [48.375, 61.875, 10, 2, 1],
    [90.375, 61.875, 17, 2, 1],
  ]
  const endpoints = new Map<string, Endpoint>(buildings.map(([gx, gy, w, d, roof], index) => {
    const key = `obstacle-${index}`
    return [key, { key, kind: 'building', rect: { gx: gx!, gy: gy!, w: w!, d: d! }, roof }]
  }))
  const boxes: Box[] = [...endpoints.values()].map(endpoint => {
    const polygon = visibleObstacle(endpoint, ROUTE_CLEARANCE)
    return { key: endpoint.key, x0: Math.min(...polygon.map(point => point.x)),
      x1: Math.max(...polygon.map(point => point.x)), y0: Math.min(...polygon.map(point => point.y)),
      y1: Math.max(...polygon.map(point => point.y)) }
  })
  const routes = paths.map(points => points.map(([x, y]) => ({ x: x! * ROUTE_UNIT, y: y! * ROUTE_UNIT })))
  const ports = spans.map(([source, target], index) => ({
    source: { key: `source-${index}`, span: source!.map(value => value * ROUTE_UNIT) as [number, number] },
    target: { key: `target-${index}`, span: target!.map(value => value * ROUTE_UNIT) as [number, number] },
  }))
  nudgeRoutes(routes, boxes, ports)
  const flat: FlatRoute[] = routes.map((points, index) => ({
    id: String(index), source: ports[index]!.source.key, target: ports[index]!.target.key,
    points, description: '', origin: 'observed',
  }))
  expect(crossingRouteIdsFor(endpoints)(flat)).toEqual([])
  expect(sharedPathMeasure(flat, new Set(flat.map(route => route.id)))(flat)).toBe(0)
})
