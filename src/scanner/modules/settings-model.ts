/** What a settings row shows for a plugin of any kind. */
interface PluginSettingFields {
  id: string
  name: string
  /** The selection saved in plugins.json. A recommendation that is not selected yet has `installSource` instead. */
  source?: string
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
export interface ScannerSettings {
  plugins: PluginSetting[]
  notice: { tone: 'neutral' | 'hint' | 'warning' | 'error'; message: string }
  limits: string[]
  upgrades?: Record<string, { version?: string; error?: string }>
}
export type ScannerSettingsAction =
  | { action: 'add'; source: string }
  | { action: 'install' | 'restore' | 'remove'; id: string }
  | { action: 'update'; id: string; source?: string }
  | { action: 'retry' | 'install-recommended' | 'install-missing' }

/** An offered update belongs to the exact source that was checked. */
export function scannerUpgradeAction(plugin: PluginSetting, upgrades: ScannerSettings['upgrades']): ScannerSettingsAction | undefined {
  const version = plugin.source ? upgrades?.[plugin.source]?.version : undefined
  return version ? { action: 'update', id: plugin.id, source: `${plugin.name}@${version}` } : undefined
}

export function scannerNotice(scanners: readonly ScannerSetting[], limits: readonly string[]): ScannerSettings['notice'] {
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

export function scannerSettingLabel(plugin: PluginSetting): string {
  if (plugin.status === 'blocked') return plugin.message
  if (plugin.kind === 'workSource') return plugin.message
  if (plugin.match === 'none' && plugin.status !== 'missing') return 'No matching project files'
  return { ready: '', unchecked: '', missing: 'Package missing', available: 'Not installed' }[plugin.status]
}

/** Project selection and local package availability are different responsibilities. */
export function scannerGroups(plugins: readonly PluginSetting[], query = ''): { title: string; plugins: PluginSetting[] }[] {
  const search = query.trim().toLocaleLowerCase()
  const matching = plugins.filter(plugin => [plugin.id, plugin.name, plugin.source ?? '', ...(plugin.kind === 'scanner' ? plugin.technologies : [])]
    .some(value => value.toLocaleLowerCase().includes(search)))
  const scanners = matching.filter(plugin => plugin.kind === 'scanner')
  return [
    { title: 'Scanners · Installed', plugins: scanners.filter(scanner => scanner.source && scanner.status !== 'missing') },
    { title: 'Scanners · Missing on this computer', plugins: scanners.filter(scanner => scanner.source && scanner.status === 'missing') },
    { title: 'Scanners · Recommended', plugins: scanners.filter(scanner => !scanner.source) },
    { title: 'Work sources', plugins: matching.filter(plugin => plugin.kind === 'workSource') },
  ].filter(group => group.plugins.length)
}

export function scannerSettingAction(plugin: PluginSetting): ScannerSettingsAction | undefined {
  if (plugin.source && plugin.status === 'blocked') return { action: 'retry' }
  if (plugin.source) return plugin.status === 'missing' ? { action: 'restore', id: plugin.id } : undefined
  return plugin.installSource ? { action: 'install', id: plugin.id } : undefined
}

export function scannerMatchReason(scanner: ScannerSetting): string {
  const folders = [...new Set(scanner.matches.map(file => file.includes('/') ? file.slice(0, file.lastIndexOf('/') + 1) : 'project root'))]
  if (!folders.length) return scanner.match === 'unknown' ? 'Project match unknown' : 'No matching project files'
  return `Found in ${folders[0]}${folders.length > 1 ? ` and ${folders.length - 1} more folders` : ''}`
}
