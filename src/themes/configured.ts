import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { readGromaConfig, type ConfiguredTheme, type GromaConfig } from '../config.ts'
import { bundledTheme, bundledThemes } from './bundled.ts'
import { themeDefinition, type ThemeDefinition } from './definition.ts'

/** What a project enables while config.json has no themes list: every bundled theme. */
const defaultThemes: readonly ConfiguredTheme[] = bundledThemes.map(theme => ({ id: theme.id }))

/** The theme entries a configuration has in effect: its themes list, or the default. The one place that rule lives. */
export function themeEntries(config: GromaConfig): readonly ConfiguredTheme[] {
  return config.themes ?? defaultThemes
}

/** One enabled theme: the bundled one of that id, or the definition in the entry's file. */
export async function loadTheme(repositoryRoot: string, entry: ConfiguredTheme): Promise<ThemeDefinition> {
  if (entry.source === undefined) {
    const bundled = bundledTheme(entry.id)
    if (bundled === undefined) throw new Error(`config.json lists the theme ${entry.id} without a source, and groma.md bundles no theme of that id`)
    return bundled
  }
  let text: string
  try {
    text = await readFile(path.resolve(repositoryRoot, entry.source), 'utf8')
  } catch {
    throw new Error(`theme file is missing: ${entry.source}`)
  }
  return themeDefinition(entry.id, parsedThemeFile(text, entry.source), entry.source)
}

/** The value a theme file holds. A slip in its JSON names the file, because a project can have several theme files. */
function parsedThemeFile(text: string, source: string): unknown {
  try {
    return JSON.parse(text)
  } catch (error) {
    throw new Error(`${source}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/** The themes a project enables, in config.json order. Bundled and custom themes come through the same path. */
export async function loadThemes(repositoryRoot: string): Promise<ThemeDefinition[]> {
  return Promise.all(themeEntries(await readGromaConfig(repositoryRoot)).map(entry => loadTheme(repositoryRoot, entry)))
}
