import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { readGromaConfig, type ConfiguredTheme } from '../config.ts'
import { bundledTheme, bundledThemes } from './bundled.ts'
import { themeDefinition, type ThemeDefinition } from './definition.ts'

/** What a project enables while config.json has no themes list: every bundled theme. */
export const defaultThemes: readonly ConfiguredTheme[] = bundledThemes.map(theme => ({ id: theme.id }))

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
  return themeDefinition(entry.id, JSON.parse(text), entry.source)
}

/** The themes a project enables, in config.json order. Bundled and custom themes come through the same path. */
export async function loadThemes(repositoryRoot: string): Promise<ThemeDefinition[]> {
  const listed = (await readGromaConfig(repositoryRoot)).themes ?? defaultThemes
  return Promise.all(listed.map(entry => loadTheme(repositoryRoot, entry)))
}
