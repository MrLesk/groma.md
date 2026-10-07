import { GROMA_ACCENT, GROMA_ACCENT_ON_LIGHT } from '../../../brand.ts'

/** Every colour the page and the map use, as CSS variable values; the map's level tints mix paper and ink in its stylesheet. */
export interface Palette {
  colourScheme: 'light' | 'dark'
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
  /** Sidebar row hover wash. */
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
}

export type WebTheme = 'light' | 'dark' | 'blueprint' | 'teslatlas' | 'solar' | 'ocean' | 'forest' | 'plum' | 'sand'
export type WebThemeMode = 'auto' | WebTheme

/** Shared typography for the interactive map and its published cover. */
export const webFontFamily = "'DejaVu Sans Mono', monospace"

/** Shared sRGB mixing for explicit SVG colours and the web theme's graph paper. */
export function mixColour(paper: string, ink: string, share: number): string {
  const channel = (colour: string, index: number) => Number.parseInt(colour.slice(index, index + 2), 16)
  const channels = [1, 3, 5].map(index => Math.round(channel(paper, index) * (1 - share) + channel(ink, index) * share)
    .toString(16).padStart(2, '0')).join('')
  return `#${channels}`
}

export const themeModes: readonly WebThemeMode[] = ['auto', 'light', 'dark', 'blueprint', 'teslatlas', 'solar', 'ocean', 'forest', 'plum', 'sand']

export const palettes: Record<WebTheme, Palette> = {
  light: {
    colourScheme: 'light',
    paper: '#FFFFFF',
    ink: '#22262E',
    muted: '#585B62',
    accentText: GROMA_ACCENT_ON_LIGHT,
    highlight: '#1D9E75',
    highlightText: '#147A59',
    hairline: '#E4E6EA',
    hover: 'rgba(34, 38, 46, 0.05)',
    line: '#A2A6AE',
    hatch: '#C4C8CF',
    syntaxComment: '#7A8190',
    syntaxFunction: '#087F8C',
    syntaxKeyword: '#7C3AED',
    syntaxNumber: '#C2410C',
    syntaxString: '#0E7C55',
    syntaxType: '#2563EB',
    diffAdded: '#2563EB',
    diffModified: '#9A6700',
    diffRemoved: '#B42318',
  },
  dark: {
    colourScheme: 'dark',
    paper: '#111315',
    ink: '#E6E8EB',
    muted: '#9AA0A8',
    accentText: GROMA_ACCENT,
    highlight: GROMA_ACCENT,
    highlightText: GROMA_ACCENT,
    hairline: '#2A2E33',
    hover: 'rgba(230, 232, 235, 0.08)',
    line: '#6B717A',
    hatch: '#4A5058',
    syntaxComment: '#7D8590',
    syntaxFunction: '#FFD866',
    syntaxKeyword: '#FF6BCB',
    syntaxNumber: '#FFA657',
    syntaxString: '#7EE787',
    syntaxType: '#79C0FF',
    diffAdded: '#79C0FF',
    diffModified: '#E3B341',
    diffRemoved: '#FF7B72',
  },
  blueprint: {
    colourScheme: 'dark',
    paper: '#07152B',
    ink: '#D8F3FF',
    muted: '#79A9BD',
    accentText: GROMA_ACCENT,
    highlight: GROMA_ACCENT,
    highlightText: GROMA_ACCENT,
    hairline: '#164764',
    hover: 'rgba(89, 203, 244, 0.09)',
    line: '#527CB0',
    hatch: '#2C496C',
    syntaxComment: '#6E9CB0',
    syntaxFunction: '#FFFFFF',
    syntaxKeyword: '#FFE066',
    syntaxNumber: '#FF8FAB',
    syntaxString: '#70E1F5',
    syntaxType: '#D9B8FF',
    diffAdded: '#B8F26B',
    diffModified: '#FFE066',
    diffRemoved: '#FF8FAB',
  },
  // Electric blue, cyan and near-black from the Teslatlas app icon.
  teslatlas: {
    colourScheme: 'dark',
    paper: '#030813',
    ink: '#E6F4FF',
    muted: '#91ABC9',
    accentText: GROMA_ACCENT,
    highlight: '#21D4DC',
    highlightText: '#21D4DC',
    hairline: '#193151',
    hover: 'rgba(33, 212, 220, 0.10)',
    line: '#386ED6',
    hatch: '#21417D',
    syntaxComment: '#8096B5',
    syntaxFunction: '#21D4DC',
    syntaxKeyword: '#9DADFF',
    syntaxNumber: '#FFC08A',
    syntaxString: '#83E6CA',
    syntaxType: '#68B5FF',
    diffAdded: '#68B5FF',
    diffModified: '#FFD477',
    diffRemoved: '#FF929C',
  },
  solar: {
    colourScheme: 'dark',
    paper: '#1D1410',
    ink: '#FFF1DE',
    muted: '#C2A38C',
    accentText: GROMA_ACCENT,
    highlight: '#FFB35C',
    highlightText: '#FFB35C',
    hairline: '#483127',
    hover: 'rgba(255, 179, 92, 0.10)',
    line: '#AB7854',
    hatch: '#69462F',
    syntaxComment: '#B59A86',
    syntaxFunction: '#FFD48C',
    syntaxKeyword: '#F9A3B7',
    syntaxNumber: '#FFBC80',
    syntaxString: '#B4D99C',
    syntaxType: '#9DCFE6',
    diffAdded: '#9DCFE6',
    diffModified: '#FFD48C',
    diffRemoved: '#FF9292',
  },
  ocean: {
    colourScheme: 'dark',
    paper: '#071E26',
    ink: '#E1F6F7',
    muted: '#90B8BF',
    accentText: GROMA_ACCENT,
    highlight: '#5BD6CE',
    highlightText: '#5BD6CE',
    hairline: '#204650',
    hover: 'rgba(91, 214, 206, 0.10)',
    line: '#558E9F',
    hatch: '#2D5968',
    syntaxComment: '#82A7B1',
    syntaxFunction: '#89E2DC',
    syntaxKeyword: '#C9B4FF',
    syntaxNumber: '#FFCA8A',
    syntaxString: '#B4E3A2',
    syntaxType: '#8FCFFF',
    diffAdded: '#8FCFFF',
    diffModified: '#FFCA8A',
    diffRemoved: '#FF9A9A',
  },
  forest: {
    colourScheme: 'dark',
    paper: '#101C15',
    ink: '#EAF3E6',
    muted: '#A0B59A',
    accentText: GROMA_ACCENT,
    highlight: '#B6DA75',
    highlightText: '#B6DA75',
    hairline: '#2E4332',
    hover: 'rgba(182, 218, 117, 0.10)',
    line: '#6E9567',
    hatch: '#425E3F',
    syntaxComment: '#92AB8A',
    syntaxFunction: '#E2D68B',
    syntaxKeyword: '#D9B1E6',
    syntaxNumber: '#F4BA89',
    syntaxString: '#B6DA75',
    syntaxType: '#99CDDC',
    diffAdded: '#99CDDC',
    diffModified: '#E2D68B',
    diffRemoved: '#F69B98',
  },
  plum: {
    colourScheme: 'dark',
    paper: '#201426',
    ink: '#F6E9FC',
    muted: '#BDA2C8',
    accentText: GROMA_ACCENT,
    highlight: '#E3A4FA',
    highlightText: '#E3A4FA',
    hairline: '#493052',
    hover: 'rgba(227, 164, 250, 0.10)',
    line: '#9F78B0',
    hatch: '#64476F',
    syntaxComment: '#AC91B7',
    syntaxFunction: '#F2C58D',
    syntaxKeyword: '#E3A4FA',
    syntaxNumber: '#F8B29A',
    syntaxString: '#A8DEBF',
    syntaxType: '#9ACFF5',
    diffAdded: '#9ACFF5',
    diffModified: '#F2C58D',
    diffRemoved: '#FF99AD',
  },
  sand: {
    colourScheme: 'light',
    paper: '#F7F0E3',
    ink: '#352D25',
    muted: '#706253',
    accentText: GROMA_ACCENT_ON_LIGHT,
    highlight: '#A34A24',
    highlightText: '#963D1A',
    hairline: '#DED2BD',
    hover: 'rgba(53, 45, 37, 0.06)',
    line: '#A3947D',
    hatch: '#C5B89F',
    syntaxComment: '#786D5E',
    syntaxFunction: '#226C76',
    syntaxKeyword: '#7C3E91',
    syntaxNumber: '#A34A24',
    syntaxString: '#3B6D38',
    syntaxType: '#315CA0',
    diffAdded: '#315CA0',
    diffModified: '#89600B',
    diffRemoved: '#AC302D',
  },
}

/** Whether a stored or shared value names a supported user choice. */
export function isThemeMode(value: string | null | undefined): value is WebThemeMode {
  return themeModes.includes(value as WebThemeMode)
}

/** Resolves Auto without making browser preferences part of the palette model. */
export function resolveTheme(mode: WebThemeMode, prefersDark: boolean): WebTheme {
  return mode === 'auto' ? prefersDark ? 'dark' : 'light' : mode
}

/** The short control label for a theme choice. */
export function themeLabel(mode: WebThemeMode): string {
  return mode[0]!.toUpperCase() + mode.slice(1)
}

/** Brand signals shared by every theme. */
export const accent = GROMA_ACCENT
/** Dark foreground for saturated accent and work-marker surfaces. */
export const onColour = '#020B12'

export function cssBlock(palette: Palette): string {
  return `
  color-scheme: ${palette.colourScheme};
  --paper: ${palette.paper};
  --ink: ${palette.ink};
  --muted: ${palette.muted};
  --hairline: ${palette.hairline};
  --hover: ${palette.hover};
  --accent: ${accent};
  --accent-text: ${palette.accentText};
  --highlight: ${palette.highlight};
  --highlight-text: ${palette.highlightText};
  --on-colour: ${onColour};
  --map-line: ${palette.line};
  --map-hatch: ${palette.hatch};
  --syntax-comment: ${palette.syntaxComment};
  --syntax-function: ${palette.syntaxFunction};
  --syntax-keyword: ${palette.syntaxKeyword};
  --syntax-number: ${palette.syntaxNumber};
  --syntax-string: ${palette.syntaxString};
  --syntax-type: ${palette.syntaxType};
  --diff-added: ${palette.diffAdded};
  --diff-modified: ${palette.diffModified};
  --diff-removed: ${palette.diffRemoved};
  --map-grid: ${mixColour(palette.paper, palette.line, 0.12)};
  --map-grid-major: ${mixColour(palette.paper, palette.line, 0.2)};
`
}

/** The viewer and startup screen install the same palettes. */
export function themeCss(): string {
  return Object.entries(palettes)
    .map(([theme, palette]) => `[data-theme="${theme}"] { ${cssBlock(palette)} }`)
    .join('\n')
}
