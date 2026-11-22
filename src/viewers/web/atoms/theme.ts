import { GROMA_ACCENT } from '../../../brand.ts'
import { COLOR_NAMES } from '../../../colors.ts'
import type { ThemeDefinition } from '../../../themes/definition.ts'

/** Shared typography for the interactive map and its published cover. */
export const webFontFamily = "'DejaVu Sans Mono', monospace"

/** Shared sRGB mixing for explicit SVG colours and the web theme's graph paper. */
export function mixColour(paper: string, ink: string, share: number): string {
  const channel = (colour: string, index: number) => Number.parseInt(colour.slice(index, index + 2), 16)
  const channels = [1, 3, 5].map(index => Math.round(channel(paper, index) * (1 - share) + channel(ink, index) * share)
    .toString(16).padStart(2, '0')).join('')
  return `#${channels}`
}

/** Brand signals shared by every theme. */
export const accent = GROMA_ACCENT
/** Dark foreground for saturated accent and work-marker surfaces. */
export const onColour = '#020B12'

/** One theme as the CSS variables the page and the map read. */
export function cssBlock({ palette, chromeOpacity }: ThemeDefinition): string {
  return `
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
  --chrome-surface: color-mix(in srgb, var(--paper) ${Math.round(chromeOpacity * 100)}%, transparent);
${COLOR_NAMES.map(name => `  --color-${name}: ${palette.colors[name]};`).join('\n')}
`
}
