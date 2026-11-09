import type { ProjectProfile } from '../../../project-profile.ts'
import { escaped } from '../atoms/escape.ts'
import { AUTO_THEME, shownTheme, themeMode, type ThemeDefinition } from '../../../themes/definition.ts'
import { readTheme } from '../url.ts'
import { COVER_SIZE } from './cover.ts'

/** The cover image of one theme, by its id. */
export function coverFile(themeId: string): string {
  return `cover-${themeId}.png`
}

/** The theme whose cover a link shows. A crawler has no system appearance, so Auto means the light one. */
export function coverTheme(url: URL | undefined, themes: readonly ThemeDefinition[]): ThemeDefinition {
  const mode = url === undefined ? AUTO_THEME : themeMode(readTheme(url), themes)
  return shownTheme(mode, themes, false)
}

/** Emitted in the initial HTML, before any browser script or saved preference. */
export function sharingMetadata(project: ProjectProfile | null, themes: readonly ThemeDefinition[], url?: URL): string {
  const title = project?.title ?? 'Groma'
  const file = coverFile(coverTheme(url, themes).id)
  const fields: [string, string][] = [
    ['og:title', title],
    ['og:type', 'website'],
    ['og:image', url === undefined ? `./${file}` : new URL(file, url).href],
    ['og:image:type', 'image/png'],
    ['og:image:width', String(COVER_SIZE.width)],
    ['og:image:height', String(COVER_SIZE.height)],
    ['og:image:alt', `${title} architecture map`],
  ]
  if (url !== undefined) fields.push(['og:url', url.href])
  if (project?.description) fields.push(['og:description', project.description])
  return fields.map(([property, content]) => `<meta property="${property}" content="${escaped(content)}">`).join('')
    + '<meta name="twitter:card" content="summary_large_image">'
}
