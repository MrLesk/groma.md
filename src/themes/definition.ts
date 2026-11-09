import { COLOR_NAMES, type ColorName } from '../colors.ts'

/** Every colour the page and the map use; the map's level tints mix paper and ink in its stylesheet. */
export interface Palette {
  paper: string
  ink: string
  muted: string
  /** Brand or positive-status green used as text on paper; light paper needs the darker green. */
  accentText: string
  /** Durable interaction emphasis: selection, focus and active flows. */
  highlight: string
  /** Interaction emphasis used as text on paper. */
  highlightText: string
  hairline: string
  /** Sidebar row hover wash; the one value that may be any CSS colour, such as an rgba(). */
  hover: string
  /** Geometry strokes at rest: faces, grounds, routes and glyphs. */
  line: string
  /** The kind patterns: dots, crosses, storey lines, grain and the zone hatch. */
  hatch: string
  syntaxComment: string
  syntaxFunction: string
  syntaxKeyword: string
  syntaxNumber: string
  syntaxString: string
  syntaxType: string
  diffAdded: string
  diffModified: string
  diffRemoved: string
  /** What each authored color name looks like in this theme; the map mixes it into the paper. */
  colors: Record<ColorName, string>
}

/** The system appearance a theme suits. */
export type ThemeScheme = 'light' | 'dark'

/** One UI theme. Bundled themes and a project's own theme files have this one shape. */
export interface ThemeDefinition {
  /** Lowercase kebab-case; the name config.json, the picker and a shared link use. */
  id: string
  /** The name the picker shows. */
  title: string
  /** Auto shows the first enabled theme whose scheme matches the system appearance. */
  scheme: ThemeScheme
  /** Share of paper in the translucent chrome panels, from 0 to 1. */
  chromeOpacity: number
  palette: Palette
}

/** The choice that follows the system appearance instead of naming a theme. */
export const AUTO_THEME = 'auto'

/** Every palette field except colors; `satisfies` fails the build when the list and the Palette interface differ. */
const paletteFields = {
  paper: true, ink: true, muted: true, accentText: true, highlight: true, highlightText: true, hairline: true, hover: true,
  line: true, hatch: true, syntaxComment: true, syntaxFunction: true, syntaxKeyword: true, syntaxNumber: true,
  syntaxString: true, syntaxType: true, diffAdded: true, diffModified: true, diffRemoved: true,
} satisfies Record<Exclude<keyof Palette, 'colors'>, true>

const hex = /^#[0-9a-fA-F]{6}$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/** Covers mix these values by channel, so each is a six-digit hex colour; hover alone is free CSS. */
function colour(value: unknown, field: string, source: string): string {
  const valid = typeof value === 'string' && (field === 'palette.hover' ? value.trim() !== '' : hex.test(value))
  if (!valid) throw new Error(`${source} ${field} must be ${field === 'palette.hover' ? 'a CSS colour' : 'a colour such as #1D9E75'}`)
  return value as string
}

/**
 * A theme definition read from data, with every field checked: the id comes from config.json, the rest from a theme
 * file. Both the bundled themes and a project's files pass through here, so a theme that loads is complete.
 */
export function themeDefinition(id: string, value: unknown, source: string): ThemeDefinition {
  if (!isRecord(value) || !isRecord(value.palette) || !isRecord(value.palette.colors)) {
    throw new Error(`${source} must be an object with title, scheme, chromeOpacity and a palette with colors`)
  }
  const { title, scheme, chromeOpacity, palette } = value
  if (typeof title !== 'string' || title.trim() === '') throw new Error(`${source} title must be non-empty text`)
  if (scheme !== 'light' && scheme !== 'dark') throw new Error(`${source} scheme must be light or dark`)
  if (typeof chromeOpacity !== 'number' || chromeOpacity < 0 || chromeOpacity > 1) {
    throw new Error(`${source} chromeOpacity must be a number from 0 to 1`)
  }
  const fields = Object.keys(paletteFields) as (keyof typeof paletteFields)[]
  const colors = palette.colors as Record<string, unknown>
  return {
    id, title, scheme, chromeOpacity,
    palette: {
      ...Object.fromEntries(fields.map(field => [field, colour((palette as Record<string, unknown>)[field], `palette.${field}`, source)])),
      colors: Object.fromEntries(COLOR_NAMES.map(name => [name, colour(colors[name], `palette.colors.${name}`, source)])),
    } as Palette,
  }
}

/** Whether a saved or shared value is a choice the picker offers: Auto or an enabled theme. */
export function isThemeMode(value: string | null | undefined, themes: readonly ThemeDefinition[]): value is string {
  return value === AUTO_THEME || themes.some(theme => theme.id === value)
}

/** The theme a mode shows. Auto takes the first enabled theme of the system appearance, or the first theme when none suits it. */
export function shownTheme(mode: string, themes: readonly ThemeDefinition[], prefersDark: boolean): ThemeDefinition {
  const named = themes.find(theme => theme.id === mode)
  if (named !== undefined) return named
  return themes.find(theme => theme.scheme === (prefersDark ? 'dark' : 'light')) ?? themes[0]!
}
