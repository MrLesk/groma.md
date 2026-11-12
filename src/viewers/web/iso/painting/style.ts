import { COLOR_NAMES } from '../../../../colors.ts'
import type { Palette } from '../../../../themes/definition.ts'
import { mixColour, webFontFamily } from '../../atoms/theme.ts'
import { layerCss } from './layer-planes.ts'
import { glowCss } from './glow.ts'
import { DEFAULT_PROJECTION, planeMatrix } from '../projection/project.ts'
import type { Plane, ProjectionView } from '../projection/project.ts'
import { DETAIL_OPACITY_CSS, GLYPH_STROKE_CSS, LANDMARK_ZOOM_CSS, OBJECT_STROKE_CSS, ROOF_ICON_OPACITY_CSS } from './icon-camera.ts'
import { COLOR_EDGE, COLOR_STRENGTH, FACADE_MARK, ICON_INK, SIDE, SURFACE_TILE, depthOf, emphasis, facadeDetailsVisible, strokeAt, surfacePatternsVisible, tintAt } from './scale.ts'
import type { Level } from './scale.ts'
import { mark, node, type SvgNode } from './svg.ts'

const ink = { stroke: 'var(--map-hatch)', 'stroke-width': 0.75 }
const dot = mark('circle', { cx: 4, cy: 4, r: 0.75, fill: 'var(--map-hatch)' })
const cross = mark('path', { d: 'M4 2V6M2 4H6', ...ink })
const line = mark('path', { d: 'M0 3H6', ...ink })

function tile(id: string, plane: Plane, size: number, body: SvgNode[], view: ProjectionView): SvgNode[] {
  if (view.pitch === 90 && plane !== 'ground') return []
  return [node('pattern', {
    id, width: size, height: size, patternUnits: 'userSpaceOnUse', patternTransform: planeMatrix(plane, undefined, view),
  }, '', body)]
}

function hash(value: string): number {
  let result = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index)
    result = Math.imul(result, 16777619)
  }
  return result >>> 0
}

export function facadePatternId(fileType: string, plane: Extract<Plane, 'left' | 'right'>): string {
  return `facade-${hash(fileType).toString(36)}-${plane}`
}

/** A stable window tile derived from the file type itself, so unknown extensions need no registry. */
export function facadePattern(
  fileType: string,
  plane: Extract<Plane, 'left' | 'right'>,
  view: ProjectionView = DEFAULT_PROJECTION,
): SvgNode[] {
  const value = hash(fileType)
  const bits = (value ^ (value >>> 9) ^ (value >>> 18)) & 0x1ff || 1
  const windows = Array.from({ length: 9 }, (_, index) => index).filter(index => (bits & (1 << index)) !== 0)
    .map(index => mark('rect', {
      x: 1 + (index % 3) * 2.5, y: 1 + Math.floor(index / 3) * 2.5, width: FACADE_MARK, height: FACADE_MARK, fill: 'var(--map-hatch)',
    }))
  return tile(facadePatternId(fileType, plane), plane, 8, windows, view)
}

/**
 * One grey pattern per kind, each tile drawn in the pixels of the plane it
 * lies on and mapped by that plane's matrix: dots for actors (their island
 * and the sides of their buildings), crosses for external systems, storey
 * fallback lines for components without source files, a faint grain for container slabs and a
 * diagonal hatch for group zones. Systems have no pattern, and neither does
 * any roof.
 */
export function mapDefs(view: ProjectionView = DEFAULT_PROJECTION): SvgNode[] {
  return [
    ...tile('dots', 'ground', SURFACE_TILE, [dot], view),
    ...tile('dots-left', 'left', 8, [dot], view), ...tile('dots-right', 'right', 8, [dot], view),
    ...tile('cross', 'ground', SURFACE_TILE, [cross], view),
    ...tile('cross-left', 'left', 8, [cross], view), ...tile('cross-right', 'right', 8, [cross], view),
    ...tile('lines-left', 'left', 6, [line], view), ...tile('lines-right', 'right', 6, [line], view),
    ...tile('grain', 'ground', 12, [mark('circle', { cx: 6, cy: 6, r: 0.6, fill: 'var(--map-hatch)' })], view),
    ...tile('hatch-ground', 'ground', SURFACE_TILE, [mark('path', { d: `M0 ${SURFACE_TILE}L${SURFACE_TILE} 0`, ...ink })], view),
  ]
}

/** The same colour and level rules serve browser CSS and explicit static SVG values. */
function paintTint(share: number, palette?: Palette): string {
  return palette === undefined
    ? `color-mix(in srgb, var(--ink) ${(share * 100).toFixed(1)}%, var(--paper))`
    : mixColour(palette.paper, palette.ink, share)
}

function stroke(level: Level, palette: Palette | undefined, zoom: number): string {
  const width = strokeAt(depthOf(level)).toFixed(2)
  return palette === undefined ? `--stroke: ${width}px;` : `stroke-width: ${Number(width) / zoom};`
}

/** The ink share of each tinted level's top; `kind` is the class of the element whose faces take the tint. */
const SURFACE_DEPTH = {
  island: depthOf('island'),
  system: depthOf('island') - 0.5,
  slab: depthOf('slab'),
  building: depthOf('building'),
}

/** In the browser a surface takes its element's authored color when one is set (the --tint-* variables below), else the level's ink tint. */
function surfaceColours(kind: keyof typeof SURFACE_DEPTH, palette?: Palette): string {
  const depth = SURFACE_DEPTH[kind]
  const fill = (side: 'top' | 'right' | 'left', share: number) => palette === undefined
    ? `var(--tint-${side}, ${paintTint(share)})` : paintTint(share, palette)
  return `#map .${kind} .ground, #map .${kind} .top { fill: ${fill('top', tintAt(depth))}; }
    #map .${kind} .right { fill: ${fill('right', tintAt(depth + SIDE.right))}; }
    #map .${kind} .left { fill: ${fill('left', tintAt(depth + SIDE.left))}; }`
}

/**
 * The elements an authored color paints. `own` reaches the element's own faces and none of the surfaces drawn inside
 * it: a slab holds its group zones, so its faces are its direct children. `top` is the class of its top surface.
 */
const COLORED_LEVELS = [
  { kind: 'system', own: ' > ', top: 'ground' },
  { kind: 'slab', own: ' > ', top: 'top' },
  { kind: 'building', own: ' ', top: 'top' },
] as const

/**
 * An authored color replaces the ink in its element's surface tints, at a stronger share, and tints its outline.
 * The browser sets four --tint-* variables on the element that the surface and stroke rules read, so selection, lit,
 * draft and comparison rules keep working unchanged; group zones reset them, because a color belongs to its element
 * alone. A cover has no variables and no states, so it gets the same values as plain rules.
 */
function authoredColours(palette?: Palette): string {
  return COLOR_NAMES.flatMap(name => COLORED_LEVELS.map(({ kind, own, top }) => {
    const element = `#map .${kind}[data-color="${name}"]`
    const depth = SURFACE_DEPTH[kind]
    const share = (side: number) => tintAt(depth + side) * COLOR_STRENGTH
    if (palette === undefined) {
      const mix = (amount: number, base: string) => `color-mix(in srgb, var(--color-${name}) ${(amount * 100).toFixed(1)}%, ${base})`
      return `${element} { --tint-top: ${mix(share(0), 'var(--paper)')}; --tint-right: ${mix(share(SIDE.right), 'var(--paper)')}; `
        + `--tint-left: ${mix(share(SIDE.left), 'var(--paper)')}; --tint-edge: ${mix(COLOR_EDGE, 'var(--map-line)')}; }`
    }
    const color = palette.colors[name]
    const face = `${element}${own}`
    return `${face}.${top} { fill: ${mixColour(palette.paper, color, share(0))}; }
    ${face}.right { fill: ${mixColour(palette.paper, color, share(SIDE.right))}; }
    ${face}.left { fill: ${mixColour(palette.paper, color, share(SIDE.left))}; }
    ${face}.${top}, ${face}.face { stroke: ${mixColour(palette.line, color, COLOR_EDGE)}; }
    ${iconColour(element, palette, mixColour(palette.paper, color, share(0)), mixColour(palette.paper, color, share(SIDE.right)), mixColour(palette.line, color, COLOR_EDGE))}
    ${element}.ghost${own}.${top}, ${element}.ghost${own}.face { fill: none; }`
  })).join('\n  ')
}

/** Icon lines are darker than outlines, so a small object reads as a drawing: this much ink over the outline colour. */
function iconLine(palette: Palette, outline: string): string {
  return mixColour(outline, palette.ink, ICON_INK)
}

/** A cover's rules for the icon of one colored element: its two walls and its lines take the element's color. */
function iconColour(element: string, palette: Palette, lightWall: string, darkWall: string, outline: string): string {
  const line = iconLine(palette, outline)
  return `${element} > .icon .icon-right { fill: ${lightWall}; }
    ${element} > .icon .icon-left { fill: ${darkWall}; }
    ${element} > .icon .icon-part { stroke: ${line}; }
    ${element} > .icon .icon-solid { fill: ${line}; }`
}

/**
 * An icon's parts have their own classes, so no rule for a building, slab or island reaches them. The object is
 * one step lighter than a building: a paper top and screen, a lighter wall with a building's roof tint and a
 * darker wall with a building's lighter wall tint. In the browser the walls and lines read the same --tint-*
 * variables as the surfaces, so the object takes its element's authored color. The glyph is ink lines.
 */
function iconCss(palette?: Palette): string {
  const depth = SURFACE_DEPTH.building
  const paper = palette?.paper ?? 'var(--paper)'
  const wall = (side: 'top' | 'right', share: number) => palette === undefined
    ? `var(--tint-${side}, ${paintTint(share)})` : paintTint(share, palette)
  const line = palette === undefined
    ? `color-mix(in srgb, var(--ink) ${ICON_INK * 100}%, var(--tint-edge, var(--map-line)))`
    : iconLine(palette, palette.line)
  return `#map .icon-part, #map .icon-glyph path {
    stroke: ${line}; stroke-linejoin: round; stroke-linecap: round;
    ${palette === undefined ? 'stroke-width: var(--icon-stroke);' : ''}
  }
  #map .icon-top, #map .icon-screen { fill: ${paper}; }
  #map .icon-right { fill: ${wall('top', tintAt(depth))}; }
  #map .icon-left { fill: ${wall('right', tintAt(depth + SIDE.right))}; }
  #map .icon-line { fill: none; }
  #map .icon-solid { fill: ${line}; }
  #map .icon-glyph path { fill: none; stroke: ${palette?.ink ?? 'var(--ink)'}; }`
}

/**
 * How live icons follow the camera; icon-camera.ts holds each rule beside the function a still image uses.
 * --icon-zoom is a landmark's enlargement and 1 for every other icon.
 */
const iconCameraCss = `
  #map .icon { --icon-zoom: 1; --icon-stroke: ${OBJECT_STROKE_CSS}; opacity: ${ROOF_ICON_OPACITY_CSS}; }
  #map .icon.landmark { --icon-zoom: ${LANDMARK_ZOOM_CSS}; opacity: 1; }
  #map .icon.landmark > g { transform: scale(var(--icon-zoom)); }
  #map .icon-glyph { --icon-stroke: ${GLYPH_STROKE_CSS}; }
  #map .icon-line, #map .icon-solid { opacity: ${DETAIL_OPACITY_CSS}; }
`

/** The camera attributes that stop facade and surface patterns below readable size at zoom `k`; the map and its covers set the same ones. */
export function patternAttributes(k: number): Record<string, boolean> {
  return { 'data-facades-hidden': !facadeDetailsVisible(k), 'data-surface-patterns-hidden': !surfacePatternsVisible(k) }
}

/** Supplying a palette resolves theme values and compensates strokes for a fixed SVG camera. Covers render these rules with resvg, which ignores :is(), so selectors stay plain. */
export function mapDrawingCss(palette?: Palette, zoom = 1): string {
  const paper = palette?.paper ?? 'var(--paper)'
  const ink = palette?.ink ?? 'var(--ink)'
  const muted = palette?.muted ?? 'var(--muted)'
  const line = palette?.line ?? 'var(--map-line)'
  const grid = palette === undefined ? 'var(--map-grid)' : mixColour(palette.paper, palette.line, 0.12)
  const gridMajor = palette === undefined ? 'var(--map-grid-major)' : mixColour(palette.paper, palette.line, 0.2)
  const width = palette === undefined ? 'stroke-width: calc(var(--stroke) * var(--emphasis, 1) * var(--weight, 1));' : ''
  return `
  #map .sheet { pointer-events: none; ${stroke('island', palette, zoom)} }
  #map .calibration-tick, #map .compass, #map .project-plate { ${stroke('building', palette, zoom)} }
  /* zones lie inside slab groups: they keep their own weight while the slab is hovered or selected, and never take its authored color */
  #map .zone { ${stroke('building', palette, zoom)} --emphasis: 1; ${palette === undefined ? '--tint-top: initial; --tint-right: initial; --tint-left: initial; --tint-edge: initial;' : ''} }
  #map .island { ${stroke('island', palette, zoom)} }
  #map .slab { ${stroke('slab', palette, zoom)} }
  #map .building { ${stroke('building', palette, zoom)} }
  #map .route { ${stroke('route', palette, zoom)} }
  #map .frame, #map .calibration-tick,
  #map .compass .ring, #map .compass .star, #map .compass .north,
  #map .project-plate .plate, #map .project-plate .edit-frame,
  #map .project-plate .pencil path, #map .project-plate .pencil polygon,
  #map .ground, #map .face, #map .route-base, #map .route .line {
    stroke: ${line}; stroke-linejoin: round;
    ${width}
  }
  ${palette === undefined ? '#map .ground, #map .face { stroke: var(--tint-edge, var(--map-line)); }' : ''}
  #map .frame, #map .calibration-tick,
  #map .compass .ring, #map .compass .star,
  #map .project-plate .edit-frame, #map .project-plate .pencil path { fill: none; }
  #map .frame { ${palette === undefined ? '--emphasis: 1.6;' : `stroke-width: ${strokeAt(0) * 1.6 / zoom};`} }
  #map .calibration-tick { stroke-linecap: square; }
  #map .compass { ${palette === undefined ? '--emphasis: 1.25;' : `stroke-width: ${strokeAt(2) * 1.25 / zoom};`} }
  #map .compass .north { fill: ${line}; }
  #map .compass .text { fill: ${ink}; font-weight: 600; }
  #map .project-plate .plate { fill: ${paper}; fill-opacity: 0.72; }
  #map .project-plate .project-title .text { font-weight: 650; letter-spacing: 0.06em; }
  #map .project-plate .project-overview .text { fill: ${muted}; }
  #map .project-plate .project-overview .md-strong { font-weight: 700; fill: ${ink}; }
  #map .project-plate .project-overview .md-emphasis { font-style: italic; }
  #map .project-plate .project-overview .md-code { font-family: ${webFontFamily}; fill: ${ink}; }
  #map .project-plate .project-overview .md-link { text-decoration: underline; text-underline-offset: 2px; }
  #map .project-plate .project-meta .text { fill: ${muted}; letter-spacing: 0.14em; }
  #map .project-edit { pointer-events: all; cursor: pointer; outline: none; }
  #map .project-edit .edit-frame { fill: transparent; pointer-events: all; }
  #map .project-edit .pencil path { stroke-linecap: square; }
  #map .project-edit .pencil .body { fill: ${paintTint(0.1, palette)}; }
  #map .project-edit .pencil .facet { fill: ${paintTint(0.18, palette)}; }
  #map .project-edit .pencil .eraser { fill: ${paintTint(0.28, palette)}; }
  #map .project-edit .pencil .ferrule { fill: ${paintTint(0.18, palette)}; }
  #map .project-edit .pencil .tip { fill: ${paintTint(0.12, palette)}; }
  #map .project-edit .pencil .lead { fill: ${ink}; }
  #map .project-edit .pencil .facet, #map .project-edit .pencil .eraser, #map .project-edit .pencil .ferrule,
  #map .project-edit .pencil .tip, #map .project-edit .pencil .lead { stroke: none; }
  #map .grid { fill: none; stroke: ${grid}; }
  #map .grid.major { stroke: ${gridMajor}; }
  ${surfaceColours('island', palette)}
  ${surfaceColours('system', palette)}
  ${surfaceColours('slab', palette)}
  ${surfaceColours('building', palette)}
  ${palette === undefined
    ? `#map .actor .top { fill: var(--tint-top, ${paper}); } #map .actor .right { fill: var(--tint-right, ${paper}); } #map .actor .left { fill: var(--tint-left, ${paper}); }`
    : `#map .actor .face { fill: ${paper}; }`}
  ${authoredColours(palette)}
  ${iconCss(palette)}
  #map .zone .ground { fill: url(#hatch-ground); }
  #map .pattern { stroke: none; pointer-events: none; }
  #map .island.actors .pattern { fill: url(#dots); }
  #map .island.external .pattern { fill: url(#cross); }
  #map .slab .pattern { fill: url(#grain); }
  #map .building.component .pattern.left { fill: url(#lines-left); }
  #map .building.component .pattern.right { fill: url(#lines-right); }
  #map .building.actor .pattern.left { fill: url(#dots-left); }
  #map .building.actor .pattern.right { fill: url(#dots-right); }
  #map .building.external .pattern.left { fill: url(#cross-left); }
  #map .building.external .pattern.right { fill: url(#cross-right); }
  #map .camera[data-facades-hidden] .building .pattern { display: none; }
  #map .camera[data-surface-patterns-hidden] .island > .pattern,
  #map .camera[data-surface-patterns-hidden] .slab > .pattern { display: none; }
  #map .camera[data-surface-patterns-hidden] .zone > .ground { fill: transparent; }
  #map .label-hit { fill: transparent; stroke: none; pointer-events: all; }
  #map .label-leader {
    stroke: ${line}; ${width}
    vector-effect: non-scaling-stroke; pointer-events: none;
  }
  #map .ghost { opacity: 0.8; }
  #map .ghost .face, #map .ghost .ground { fill: none; pointer-events: all; }
  #map .ghost .pattern { display: none; }
  #map .ghost.draft .face, #map .ghost.draft .ground,
  #map .route-base.ghost.draft, #map .route.ghost.draft:not(.touched):not(.lit) .line { stroke-dasharray: ${4 / zoom} ${3 / zoom}; }
  #map .text { fill: ${ink}; pointer-events: none; }
  #map .island > .label .text, #map .slab > .label .text, #map .zone > .label .text { font-weight: 600; }
  #map .route-base, #map .route .line { fill: none; stroke-linecap: round; opacity: 0.9; }
  #map .route-base { pointer-events: none; }
  #map .route .line { opacity: 0; }
  #map .route .arrow { fill: ${line}; opacity: 0.9; }
  #map .route .hit { fill: none; stroke: transparent; stroke-width: 12; }
`
}

/**
 * What shows a hover look. Map hover looks key off the .hovered class that map.ts puts on the closest of these
 * under a resting mouse, never :hover: a :hover rule would make Safari redraw the whole map when a pan starts.
 */
export const HOVERABLE = '.building, .slab, .island.system, .route, .project-edit'

/** Browser layout, interaction states and motion surround the shared drawing rules. */
export const mapCss = `
  #map > .map-surface {
    position: absolute; inset: 0; cursor: grab;
    user-select: none; -webkit-user-select: none; touch-action: none; outline: none;
  }
  #map .field-surface, #map .camera { position: absolute; inset: 0; width: 100%; height: 100%; }
  #map .field-surface { pointer-events: none; }
  #map .paint-surface { position: absolute; inset: 0; pointer-events: none; }
  #map .scene { display: block; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
  #map .world { pointer-events: auto; }
  /* Chrome can drop animated routes after zooming beneath the forced camera cache. Keep only their own layer promoted during a flow. */
  #map .camera[data-tracing] { will-change: auto !important; }
  #map .camera[data-tracing] .route-surface { will-change: transform; }
  #map > .map-surface [data-id] { cursor: pointer; }
  #map > .map-surface:active, #map .drag-cover { cursor: grabbing; }
  #map .drag-cover { position: absolute; inset: 0; }
  ${mapDrawingCss()}
  ${iconCameraCss}
  #map .route.hovered, #map .route.endpoint, #map .route.touched { --emphasis: ${emphasis(1)}; }
  #map .route.hovered .line { stroke: var(--map-line); opacity: 1; }
  #map .route.hovered .arrow { fill: var(--map-line); opacity: 1; }
  #map .route.endpoint .line, #map .route.selected .line, #map .route.touched .line { stroke: var(--highlight); opacity: 1; }
  #map .route.endpoint .arrow, #map .route.selected .arrow, #map .route.touched .arrow { fill: var(--highlight); opacity: 1; }
  #map .route.touched .line { stroke-dasharray: none; }
  #map .route.lit { --emphasis: ${emphasis(2)}; }
  #map .route.lit .line { stroke: var(--highlight); opacity: 1; stroke-dasharray: 8 5; animation: map-flow 900ms linear infinite; }
  #map .route.lit .arrow { fill: var(--highlight); opacity: 1; }
  #map :is(.route, .building, .slab, .island).focused { --emphasis: ${emphasis(3)}; }
  @keyframes map-flow { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -13; } }
  @media (prefers-reduced-motion: reduce) {
    #map .route.lit .line { animation: none; }
  }
  ${glowCss}
  #map .camera[data-tracing] .route-base,
  #map .camera[data-tracing] .route:not(.lit) { display: none; }
  #map .camera[data-tracing] .building:not(.onpath):not(.selected):not(.touched):not(.neighbor),
  #map .camera[data-tracing] .slab:not(.onpath):not(.selected):not(.touched) { opacity: 0.3; }
  #map .project-edit.hovered .edit-frame, #map .project-edit:focus .edit-frame { fill: var(--ink); fill-opacity: 0.05; }
  #map .project-edit.hovered .pencil path, #map .project-edit:focus .pencil path,
  #map .project-edit.hovered .pencil .body, #map .project-edit:focus .pencil .body { stroke: var(--ink); }
  #map .building.hovered:not(.selected), #map .slab.hovered:not(.selected):not(.context),
  #map .island.system.hovered:not(.selected):not(.context), #map .context { --emphasis: ${emphasis(0.5)}; }
  #map .building.hovered:not(.selected) .face, #map .slab.hovered:not(.selected):not(.context) .face,
  #map .island.system.hovered:not(.selected):not(.context) > .ground { stroke: var(--tint-edge, var(--map-line)); }
  #map .selected, #map .touched,
  #map .building.lit, #map .slab.lit, #map .island.lit { --emphasis: ${emphasis(1)}; }
  #map .context .face, #map .island.context > .ground, #map .selected .face, #map :is(.island, .zone).selected > .ground,
  #map .touched .face, #map .island.touched > .ground,
  #map .building.lit .face, #map .slab.lit > .face, #map .island.lit > .ground { stroke: var(--highlight); }
  #map .selected > .label .text, #map .touched > .label .text,
  #map .building.lit > .label .text, #map .slab.lit > .label .text, #map .island.lit > .label .text {
    fill: var(--ink); font-weight: 600;
  }
  #map :is(.island, .slab, .zone):is(.selected, .touched, .lit, .context) > .surface-label .text { fill: var(--highlight); }
  #map :is(.island, .slab, .zone):is(.selected, .touched, .lit, .context) > .surface-label .label-leader { stroke: var(--highlight); }
  #map :is(.island, .slab, .building):is(.selected, .touched, .lit, .context) > .icon :is(.icon-part, .icon-glyph path) { stroke: var(--highlight); }
  #map :is(.island, .slab, .building):is(.selected, .touched, .lit, .context) > .icon .icon-solid { fill: var(--highlight); }
  #map .building.neighbor:not(.selected):not(.touched):not(.lit) { --emphasis: ${emphasis(0.5)}; }
  #map .building.neighbor:not(.selected):not(.touched):not(.lit) .face { stroke: color-mix(in srgb, var(--highlight) 45%, var(--map-line)); }
  body:not([data-comparison]) #map .camera:has(.component-focus) .building.component:not(.component-focus):not(.neighbor) { opacity: 0.3; }
  /* Color means change while comparing, so authored colors step aside. */
  body[data-comparison] #map [data-color] { --tint-top: initial; --tint-right: initial; --tint-left: initial; --tint-edge: initial; }
  body[data-comparison] #map .building:not([data-change]):not(.selected):not(.component-focus):not(.neighbor),
  body[data-comparison] #map .route:not([data-change]):not(.route-base):not(.selected):not(.endpoint):not(.lit) { opacity: .4; }
  body[data-comparison] #map .route-base { opacity: .4; }
  /*
   * Tag focus: what the focused tags do not match recedes. Selected, lit and task-marked bodies stay readable.
   * A zone is drawn inside its slab or beside its island, and recedes on its own only where that surface stays.
   * Neutral routes share one batched stroke, so that stroke recedes and a matching route draws its own line.
   */
  #map .camera[data-tag-focus] :is(.building, .slab, .island.system):not(.tag-match):not(.selected):not(.touched):not(.lit):not(.neighbor),
  #map .camera[data-tag-focus] :is(.islands, .slab.tag-match) > .zone:not(.tag-match) { opacity: 0.3; }
  #map .camera[data-tag-focus] .route-base { opacity: 0.2; }
  #map .camera[data-tag-focus] .route:not(.tag-match):not(.selected):not(.endpoint):not(.lit):not(.touched):not(.hovered):not([data-change]) .arrow { opacity: 0.2; }
  #map .camera[data-tag-focus] .route.tag-match:not(.selected):not(.endpoint):not(.lit):not(.touched) .line { opacity: 0.9; }
  #map .building, #map .route { transition: opacity var(--chrome-motion) var(--chrome-ease); }
  @media (prefers-reduced-motion: reduce) { #map .building, #map .route { transition: none; } }
  #map [data-change="added"] { --change: var(--diff-added); }
  #map [data-change="modified"] { --change: var(--diff-modified); }
  #map [data-change="removed"] { --change: var(--diff-removed); }
  #map .building.component[data-change] .face.top { fill: color-mix(in srgb, var(--change) 25%, var(--paper)); }
  #map .building.component[data-change] .face.left { fill: color-mix(in srgb, var(--change) 18%, var(--paper)); }
  #map .building.component[data-change] .face.right { fill: color-mix(in srgb, var(--change) 11%, var(--paper)); }
  #map .building.component[data-change]:not(.selected):not(.lit):not(.component-focus) .face { stroke: var(--change); }
  #map .building.component[data-change] > .label .text { fill: var(--change); }
  #map .building.component:is(.selected, .lit) > .label .text { fill: var(--highlight-text); }
  #map .route[data-change]:not(.lit):not(.selected):not(.endpoint) .line { stroke: var(--change); opacity: 1; }
  #map .route[data-change]:not(.lit):not(.selected):not(.endpoint) .arrow { fill: var(--change); opacity: 1; }
  ${layerCss}
`
