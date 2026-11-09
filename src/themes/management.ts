import path from 'node:path'
import { isPluginId, readGromaConfig, updateGromaConfig, type ConfiguredTheme } from '../config.ts'
import { GromaFileSystem } from '../groma-filesystem.ts'
import { bundledTheme } from './bundled.ts'
import { defaultThemes, loadTheme } from './configured.ts'
import { AUTO_THEME } from './definition.ts'

/** The theme entries in effect: config.json's list, or every bundled theme while it has none. */
export async function enabledThemes(root: string): Promise<ConfiguredTheme[]> {
  return [...(await readGromaConfig(root)).themes ?? defaultThemes]
}

/** Whether `groma plugin add` was given a theme: a bundled theme id, or a theme file. */
export function namesTheme(input: string): boolean {
  return bundledTheme(input) !== undefined || input.endsWith('.json')
}

/** Enables a bundled theme by its id, or a theme file by its repository-relative path; the file name gives the id. */
export async function enableTheme(root: string, input: string): Promise<ConfiguredTheme> {
  const entry: ConfiguredTheme = bundledTheme(input) !== undefined
    ? { id: input }
    : { id: path.basename(input, '.json').replace(/\.theme$/, ''), source: input }
  // A theme file is read and checked in full before config.json names it.
  await loadTheme(root, entry)
  await updateGromaConfig(root, current => {
    const themes = current.themes ?? [...defaultThemes]
    if (themes.some(theme => theme.id === entry.id)) throw new Error(`theme is already enabled: ${entry.id}`)
    return { ...current, themes: [...themes, entry] }
  })
  return entry
}

/** Takes a theme out of the picker; config.json refuses to end up without any theme. A theme file stays on disk. */
export async function disableTheme(root: string, id: string): Promise<void> {
  await updateGromaConfig(root, current => {
    const themes = current.themes ?? [...defaultThemes]
    return { ...current, themes: themes.filter(theme => theme.id !== id) }
  })
}

/**
 * Copies an enabled or bundled theme into `<groma-root>/<id>.theme.json` and enables the copy. The file holds every
 * value of the theme, so editing it is how a project makes its own.
 */
export async function cloneTheme(root: string, from: string, id: string): Promise<ConfiguredTheme> {
  if (!isPluginId(id) || id === AUTO_THEME) throw new Error(`a theme id is lowercase kebab-case, such as midnight, and not ${AUTO_THEME}`)
  const config = await readGromaConfig(root)
  const themes = config.themes ?? defaultThemes
  if ([...config.scanners, ...config.workSources, ...themes].some(plugin => plugin.id === id)) {
    throw new Error(`config.json already uses the id ${id}`)
  }
  const source = await loadTheme(root, themes.find(theme => theme.id === from) ?? { id: from })
  const filesystem = GromaFileSystem.open(root)
  const filename = `${id}.theme.json`
  const title = `${id[0]!.toUpperCase()}${id.slice(1).replaceAll('-', ' ')}`
  const definition = { title, scheme: source.scheme, chromeOpacity: source.chromeOpacity, palette: source.palette }
  await filesystem.withAccess(async () => {
    // A theme taken out of the picker keeps its file, so an existing file may hold someone's palette.
    if (filesystem.exists(filename)) throw new Error(`${filesystem.sourceFilename(filename)} already exists; enable it with groma plugin add, or choose another id`)
    await filesystem.write(filename, `${JSON.stringify(definition, null, 2)}\n`)
  })
  return enableTheme(root, `./${filesystem.sourceFilename(filename)}`)
}
