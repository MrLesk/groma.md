import path from 'node:path'
import { isPluginId, readGromaConfig, updateGromaConfig, type ConfiguredTheme } from '../config.ts'
import { GromaFileSystem } from '../groma-filesystem.ts'
import { bundledTheme } from './bundled.ts'
import { loadTheme, themeEntries } from './configured.ts'
import { AUTO_THEME } from './definition.ts'

/** The theme entries a project has in effect. */
export async function enabledThemes(root: string): Promise<readonly ConfiguredTheme[]> {
  return themeEntries(await readGromaConfig(root))
}

/**
 * The theme `groma plugin add` was given, if it names one: a bundled theme id, or a theme file whose name gives the
 * id (`./groma/midnight.theme.json` is `midnight`). Anything else is not a theme.
 */
export function themeEntry(input: string): ConfiguredTheme | undefined {
  if (bundledTheme(input) !== undefined) return { id: input }
  if (!input.endsWith('.json')) return undefined
  return { id: path.basename(input, '.json').replace(/\.theme$/, ''), source: input }
}

/** Adds a theme to the picker. A theme file is read and checked in full before config.json names it. */
export async function enableTheme(root: string, entry: ConfiguredTheme): Promise<ConfiguredTheme> {
  await loadTheme(root, entry)
  await updateGromaConfig(root, current => {
    const themes = themeEntries(current)
    if (themes.some(theme => theme.id === entry.id)) throw new Error(`theme is already enabled: ${entry.id}`)
    return { ...current, themes: [...themes, entry] }
  })
  return entry
}

/** Takes a theme out of the picker; config.json refuses to end up without any theme. A theme file stays on disk. */
export async function disableTheme(root: string, id: string): Promise<void> {
  await updateGromaConfig(root, current => ({ ...current, themes: themeEntries(current).filter(theme => theme.id !== id) }))
}

/**
 * Copies an enabled or bundled theme into `<groma-root>/<id>.theme.json` and enables the copy. The file holds every
 * colour of the theme, so editing it is how a project makes its own.
 */
export async function cloneTheme(root: string, from: string, id: string): Promise<ConfiguredTheme> {
  if (!isPluginId(id) || id === AUTO_THEME) throw new Error(`a theme id is lowercase kebab-case, such as midnight, and not ${AUTO_THEME}`)
  const config = await readGromaConfig(root)
  const themes = themeEntries(config)
  if ([...config.scanners, ...config.workSources, ...themes].some(plugin => plugin.id === id)) {
    throw new Error(`config.json already uses the id ${id}`)
  }
  const original = themes.find(theme => theme.id === from) ?? (bundledTheme(from) === undefined ? undefined : { id: from })
  if (original === undefined) throw new Error(`unknown theme: ${from}`)
  const source = await loadTheme(root, original)
  const filesystem = GromaFileSystem.open(root)
  const filename = `${id}.theme.json`
  const title = `${id[0]!.toUpperCase()}${id.slice(1).replaceAll('-', ' ')}`
  const definition = { title, scheme: source.scheme, chromeOpacity: source.chromeOpacity, palette: source.palette }
  await filesystem.withAccess(async () => {
    // A theme taken out of the picker keeps its file, so an existing file may hold someone's palette.
    if (filesystem.exists(filename)) throw new Error(`${filesystem.sourceFilename(filename)} already exists; enable it with groma plugin add, or choose another id`)
    await filesystem.write(filename, `${JSON.stringify(definition, null, 2)}\n`)
  })
  return enableTheme(root, { id, source: `./${filesystem.sourceFilename(filename)}` })
}
