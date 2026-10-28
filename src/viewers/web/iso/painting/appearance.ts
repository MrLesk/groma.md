import { mixColour, palettes, type Palette } from '../../atoms/theme.ts'
import type { ProjectedScene } from '../projection/project.ts'
import { SIDE, depthOf, tintAt } from './scale.ts'

type AppearanceKind = 'system' | 'slab' | 'building' | 'zone'
interface Appearance { kind: AppearanceKind; color: string }

/** WCAG relative luminance in linear sRGB, used for small symbols and boundaries. */
function luminance(color: string): number {
  const channels = [1, 3, 5].map(index => {
    const channel = Number.parseInt(color.slice(index, index + 2), 16) / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722
}

export function contrastRatio(first: string, second: string): number {
  const a = luminance(first)
  const b = luminance(second)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

/** Retain the authored hue, moving only as far toward theme ink as its small symbols need. */
function readableAccent(color: string, surfaces: string[], palette: Palette): string {
  let accent = color
  for (let step = 1; step <= 20 && surfaces.some(surface => contrastRatio(accent, surface) < 3); step += 1) {
    accent = mixColour(color, palette.ink, step / 20)
  }
  return accent
}

/** Live maps and static SVG use these same explicit paints; themes never change the authored color. */
export function appearancePaint(color: string, depth: number, palette: Palette) {
  const top = mixColour(palette.paper, color, tintAt(depth))
  const right = mixColour(palette.paper, color, tintAt(depth + SIDE.right))
  const left = mixColour(palette.paper, color, tintAt(depth + SIDE.left))
  return { top, right, left, accent: readableAccent(color, [palette.paper, top, right, left], palette) }
}

function appearanceDepth(kind: AppearanceKind): number {
  if (kind === 'system') return depthOf('island') - 0.5
  return kind === 'zone' ? depthOf('slab') : depthOf(kind)
}

function appearances(scene: ProjectedScene): Appearance[] {
  const entries: { kind: AppearanceKind; color?: string }[] = [
    ...scene.islands.map(({ island }) => ({ kind: 'system' as const, color: island.element?.color })),
    ...scene.slabs.map(({ slab }) => ({ kind: 'slab' as const, color: slab.color })),
    ...scene.buildings.map(({ building }) => ({ kind: 'building' as const, color: building.color })),
    ...scene.zones.map(({ zone }) => ({ kind: 'zone' as const, color: zone.color })),
  ]
  const unique = new Map<string, Appearance>()
  for (const entry of entries) {
    if (entry.color !== undefined) unique.set(`${entry.kind}:${entry.color}`, { kind: entry.kind, color: entry.color })
  }
  return [...unique.values()]
}

function selectorOf({ kind, color }: Appearance): string {
  return `#map .${kind}[data-color="${color}"]`
}

function browserRules(entry: Appearance): string {
  const selector = selectorOf(entry)
  return Object.entries(palettes).map(([theme, palette]) => {
    const paint = appearancePaint(entry.color, appearanceDepth(entry.kind), palette)
    const scope = theme === 'light' ? selector : `[data-theme="${theme}"] ${selector}`
    return `${scope} { --item-top: ${paint.top}; --item-right: ${paint.right}; --item-left: ${paint.left}; --item-accent: ${paint.accent}; }`
  }).join('\n')
}

/** Covers have no interaction state and resvg cannot resolve custom properties. Keep these direct rules owner-scoped. */
function staticRules(entry: Appearance, palette: Palette): string {
  const selector = selectorOf(entry)
  const paint = appearancePaint(entry.color, appearanceDepth(entry.kind), palette)
  const surface = entry.kind === 'building' ? '.face' : entry.kind === 'slab' ? '> .face' : '> .ground'
  const faceRules = entry.kind === 'building' || entry.kind === 'slab'
    ? `${selector} ${surface}.top { fill: ${paint.top}; }\n${selector} ${surface}.right { fill: ${paint.right}; }\n${selector} ${surface}.left { fill: ${paint.left}; }`
    : `${selector} ${surface} { fill: ${paint.top}; }`
  const hollow = entry.kind === 'zone'
    ? `#map .slab.ghost .zone[data-color="${entry.color}"] > .ground`
    : `${selector}.ghost ${surface}`
  return `${faceRules}
${selector} ${surface} { stroke: ${paint.accent}; }
${selector} > .label .architecture-icon { color: ${paint.accent}; }
${hollow} { fill: none; }`
}

/** Palette-free browser CSS switches with the existing theme attribute; covers ask for one resolved palette. */
export function appearanceCss(scene: ProjectedScene, palette?: Palette): string {
  return appearances(scene).map(entry => palette === undefined ? browserRules(entry) : staticRules(entry, palette)).join('\n')
}
