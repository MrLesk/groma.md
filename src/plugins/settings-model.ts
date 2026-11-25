/** What a settings row shows for a plugin of any kind. */
interface PluginSettingFields {
  id: string
  name: string
  /** Whether config.json lists the plugin. An unlisted row is a recommended scanner or a bundled plugin to add. */
  listed: boolean
  /** A listed scanner's exact source in config.json. */
  source?: string
  /** What Install adds for an unlisted row: a recommended scanner's source, or a bundled plugin's id. */
  installSource?: string
  version?: string
  official: boolean
  status: 'ready' | 'unchecked' | 'blocked' | 'missing' | 'available'
  message: string
}
/** A scanner row adds what project detection found for the scanner's technologies. */
export interface ScannerSetting extends PluginSettingFields {
  kind: 'scanner'
  technologies: string[]
  matches: string[]
  match: 'matched' | 'none' | 'unknown'
}
export interface WorkSourceSetting extends PluginSettingFields {
  kind: 'workSource'
}
/** One row of the plugin settings list; `kind` tells which fields the row has. */
export type PluginSetting = ScannerSetting | WorkSourceSetting
export interface PluginSettings {
  automaticUpdates: boolean
  plugins: PluginSetting[]
  notice: { tone: 'neutral' | 'hint' | 'warning' | 'error'; message: string }
  limits: string[]
  upgrades?: Record<string, { version?: string; error?: string }>
}
export type PluginSettingsAction =
  | { action: 'automatic-updates'; enabled: boolean }
  | { action: 'add'; source: string }
  | { action: 'install' | 'restore' | 'remove'; id: string }
  | { action: 'update'; id: string; source?: string }
  | { action: 'retry' | 'install-recommended' | 'install-missing' }

/** An offered update belongs to the exact source that was checked. */
export function pluginUpgradeAction(plugin: PluginSetting, upgrades: PluginSettings['upgrades']): PluginSettingsAction | undefined {
  const version = plugin.source ? upgrades?.[plugin.source]?.version : undefined
  return version ? { action: 'update', id: plugin.id, source: `${plugin.name}@${version}` } : undefined
}

export function scannerNotice(scanners: readonly ScannerSetting[], limits: readonly string[]): PluginSettings['notice'] {
  if (scanners.some(scanner => scanner.status === 'blocked')) return { tone: 'error', message: 'A scanner needs attention. Saved architecture is available.' }
  const matched = scanners.filter(scanner => scanner.match === 'matched')
  const useful = matched.filter(scanner => scanner.status === 'ready' || scanner.status === 'unchecked')
  const covered = new Set(useful.flatMap(scanner => scanner.technologies))
  const gaps = matched.filter(scanner => scanner.technologies.some(technology => !covered.has(technology)))
  if (matched.length && !useful.length) return { tone: 'warning', message: 'No matching scanners installed. Saved architecture is available.' }
  if (gaps.length) return { tone: 'hint', message: 'More scanner support available.' }
  if (limits.length) return { tone: 'hint', message: 'Scanner support could not be fully determined.' }
  if (scanners.some(scanner => scanner.match === 'unknown')) return { tone: 'hint', message: 'Project match unknown for some scanners.' }
  return { tone: 'neutral', message: matched.length ? '' : 'No source project detected. Showing saved architecture.' }
}

export function pluginSettingLabel(plugin: PluginSetting): string {
  if (plugin.status === 'blocked' || plugin.kind === 'workSource') return plugin.message
  if (plugin.match === 'none' && plugin.status !== 'missing') return 'No matching project files'
  return { ready: '', unchecked: '', missing: 'Package missing', available: 'Not installed' }[plugin.status]
}

/** Project selection and local package availability are different responsibilities. */
export function pluginGroups(plugins: readonly PluginSetting[], query = ''): { title: string; plugins: PluginSetting[] }[] {
  const search = query.trim().toLocaleLowerCase()
  const matching = plugins.filter(plugin => [plugin.id, plugin.name, plugin.source ?? '', ...(plugin.kind === 'scanner' ? plugin.technologies : [])]
    .some(value => value.toLocaleLowerCase().includes(search)))
  const scanners = matching.filter(plugin => plugin.kind === 'scanner')
  return [
    { title: 'Scanners · Installed', plugins: scanners.filter(scanner => scanner.listed && scanner.status !== 'missing') },
    { title: 'Scanners · Missing on this computer', plugins: scanners.filter(scanner => scanner.listed && scanner.status === 'missing') },
    { title: 'Scanners · Recommended', plugins: scanners.filter(scanner => !scanner.listed) },
    { title: 'Work sources', plugins: matching.filter(plugin => plugin.kind === 'workSource') },
  ].filter(group => group.plugins.length)
}

export function pluginSettingAction(plugin: PluginSetting): PluginSettingsAction | undefined {
  if (plugin.listed && plugin.status === 'blocked') return { action: 'retry' }
  if (plugin.listed) return plugin.status === 'missing' ? { action: 'restore', id: plugin.id } : undefined
  return plugin.installSource ? { action: 'install', id: plugin.id } : undefined
}

/** A plugin action that is running, with the rows as they were when it started. */
export interface RunningPluginAction {
  action: PluginSettingsAction
  before: readonly PluginSetting[]
}

const INSTALLING = 'Installing…'

/**
 * What a row says while an action runs on it, in the place of its status; undefined when the action leaves the
 * row alone. A row an action acts on shows no status until the action has ended: config.json lists a new plugin
 * while the same action still scans with it, so what its status says by then is not the result yet.
 *
 * Each case names the rows its action acts on, as changePluginSettings in settings.ts carries the action out.
 * `was` is the row as it was when the action started.
 */
export function pluginProgress({ action, before }: RunningPluginAction, plugin: PluginSetting): string | undefined {
  const was = before.find(row => row.id === plugin.id)
  /** The words for a row the action acts on, and nothing for any other row. */
  const says = (actsOnRow: boolean, words: string): string | undefined => actsOnRow ? words : undefined
  switch (action.action) {
    case 'install': case 'restore': return says(plugin.id === action.id, INSTALLING)
    case 'update': return says(plugin.id === action.id, 'Updating…')
    case 'remove': return says(plugin.id === action.id, 'Removing…')
    // Add names a source, not a row: its row is the one config.json lists now and did not list at the start.
    case 'add': return says(plugin.listed && was?.listed !== true, INSTALLING)
    case 'install-recommended': return says(was?.kind === 'scanner' && !was.listed && Boolean(was.installSource), INSTALLING)
    case 'install-missing': return says(was?.status === 'missing', INSTALLING)
    case 'retry': return says(was?.status === 'blocked', 'Scanning…')
    case 'automatic-updates': return undefined
  }
}

/**
 * The plugin Add is installing while it has no row of its own: the typed source, and what a row for it says.
 * Once config.json lists the new plugin its own row says it (pluginProgress), and this is undefined.
 */
export function pendingPlugin(running: RunningPluginAction, plugins: readonly PluginSetting[]): { source: string; progress: string } | undefined {
  const { action } = running
  if (action.action !== 'add' || plugins.some(plugin => pluginProgress(running, plugin) !== undefined)) return undefined
  return { source: action.source, progress: INSTALLING }
}

export function scannerMatchReason(scanner: ScannerSetting): string {
  const folders = [...new Set(scanner.matches.map(file => file.includes('/') ? file.slice(0, file.lastIndexOf('/') + 1) : 'project root'))]
  if (!folders.length) return scanner.match === 'unknown' ? 'Project match unknown' : 'No matching project files'
  return `Found in ${folders[0]}${folders.length > 1 ? ` and ${folders.length - 1} more folders` : ''}`
}
