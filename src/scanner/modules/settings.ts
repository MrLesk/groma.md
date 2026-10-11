import { scannerNotice, type ScannerSetting, type ScannerSettings, type ScannerSettingsAction, type WorkSourceSetting } from './settings-model.ts'
export * from './settings-model.ts'
import type { ScannerDiscovery } from './discovery.ts'
import { discoverScanners } from './discovery.ts'
import { officialScannerCatalog } from './catalog.ts'
import { officialWorkSourceIds } from './official-catalog.ts'
import { configuredScannerModules, addScanner, restoreScanner } from './inventory.ts'
import type { ScannerInstallOptions } from './inventory.ts'
import type { ScannerModuleLocation } from './inventory.ts'
import type { ProjectReadiness } from './readiness.ts'
import { parseScannerSource } from './package.ts'
import { readPublishedScanners, selectPublishedScanner } from './published.ts'
import { readScannerConfig } from './config.ts'
import { addPlugin, removePlugin, restoreWorkSource, updatePlugin } from '../../plugin-management.ts'
import { configuredWorkSource, type WorkSourceSelection } from '../../work-sources.ts'

/** Optional registry reads for an open settings dialog; scan readiness stays unchanged. */
export async function withScannerUpgrades(settings: ScannerSettings, registry?: string): Promise<ScannerSettings> {
  const upgrades: NonNullable<ScannerSettings['upgrades']> = {}
  await Promise.all(settings.plugins.map(async plugin => {
    if (!plugin.source || !plugin.version || plugin.status === 'missing') return
    const source = parseScannerSource('.', plugin.source)
    if (source.kind !== 'npm') return
    try {
      const release = selectPublishedScanner(source.name, await readPublishedScanners(source.name, registry), undefined, plugin.kind)
      if (Bun.semver.order(release.version, plugin.version) > 0) upgrades[plugin.source] = { version: release.version }
    } catch (error) {
      upgrades[plugin.source] = { error: error instanceof Error ? error.message : String(error) }
    }
  }))
  return { ...settings, upgrades }
}

function readinessStatus(check: ProjectReadiness): ScannerSetting['status'] {
  if (check.package === 'missing') return 'missing'
  return check.project
}

function projectMatch(technologies: string[], matches: string[]): ScannerSetting['match'] {
  if (!technologies.length) return 'unknown'
  return matches.length ? 'matched' : 'none'
}

function installedSetting(module: ScannerModuleLocation, proposal: ScannerDiscovery, checks: readonly ProjectReadiness[]): ScannerSetting {
  const official = officialScannerCatalog.find(item => item.id === module.id)
  const metadata = module.status === 'found' ? module.discovery : undefined
  const technologies = metadata?.technologies ?? official?.technologies ?? []
  const matches = [...new Set(proposal.findings.filter(finding => technologies.includes(finding.technology)).map(finding => finding.file))]
  const readiness = checks.find(check => check.id === module.id)
  const base: ScannerSetting = {
    kind: 'scanner', id: module.id, name: module.status === 'found' ? module.name : module.id,
    source: module.source, version: module.status === 'found' ? module.version : undefined,
    official: official !== undefined, technologies, matches,
    match: projectMatch(technologies, matches),
    status: module.status === 'missing' ? 'missing' : 'unchecked', message: '',
  }
  if (readiness && module.status === 'found') {
    base.status = readinessStatus(readiness)
    base.message = readiness.message
  }
  if (module.status === 'missing') base.message = `Package missing: ${module.source}`
  const candidate = proposal.recommendations.find(item => item.id === module.id)
  if (module.status === 'found' && candidate?.status === 'incompatible') { base.status = 'blocked'; base.message = candidate.reason }
  return base
}

/**
 * The scanner rows and the notice they produce; `readScannerSettings` adds the rows of the other plugin kinds.
 * Product state shared by terminal, web and CLI; no architecture concepts or guessed coverage scores.
 */
export function scannerSettingsState(
  proposal: ScannerDiscovery, modules: readonly ScannerModuleLocation[], checks: readonly ProjectReadiness[] = [],
): { plugins: ScannerSetting[]; notice: ScannerSettings['notice']; limits: string[] } {
  const scanners = modules.map(module => installedSetting(module, proposal, checks))
  const covered = new Set(scanners.filter(item => item.match === 'matched' && ['ready', 'unchecked'].includes(item.status)).flatMap(item => item.technologies))
  for (const candidate of proposal.recommendations) {
    if (modules.some(module => module.id === candidate.id)) continue
    const official = officialScannerCatalog.find(item => item.id === candidate.id)
    const technologies = official?.technologies ?? []
    if (technologies.length && technologies.every(technology => covered.has(technology))) continue
    scanners.push({
      kind: 'scanner', id: candidate.id, name: candidate.package, official: official !== undefined,
      technologies,
      matches: [...new Set(candidate.evidence.map(finding => finding.file))],
      match: candidate.evidence.length ? 'matched' : 'none',
      status: 'available',
      message: candidate.reason, installSource: candidate.installSource,
    })
  }
  return { plugins: scanners, notice: scannerNotice(scanners, proposal.limits), limits: proposal.limits }
}

function workSourceSetting(work: WorkSourceSelection): WorkSourceSetting {
  return {
    kind: 'workSource', id: work.id, name: work.name ?? work.id, source: work.source, version: work.version,
    official: officialWorkSourceIds.includes(work.id),
    status: work.status === 'found' ? 'ready' : work.status, message: work.message,
  }
}

export async function readScannerSettings(root: string, checks: readonly ProjectReadiness[] = [], options: ScannerInstallOptions = {}): Promise<ScannerSettings> {
  try {
    const [proposal, modules] = await Promise.all([discoverScanners(root, options), configuredScannerModules(root, options)])
    const state = scannerSettingsState(proposal, modules, checks)
    const work = await configuredWorkSource(root, options)
    return work ? { ...state, plugins: [...state.plugins, workSourceSetting(work)] } : state
  } catch (error) {
    return { plugins: [], notice: { tone: 'error', message: error instanceof Error ? error.message : String(error) }, limits: [] }
  }
}

export async function changeScannerSettings(root: string, action: ScannerSettingsAction, options: ScannerInstallOptions = {}): Promise<void> {
  switch (action.action) {
    case 'add': await addPlugin(root, action.source, options); return
    case 'remove': await removePlugin(root, action.id); return
    case 'restore': {
      const config = await readScannerConfig(root)
      if (config.workSources?.some(work => work.id === action.id)) await restoreWorkSource(root, options)
      else await restoreScanner(root, action.id, options)
      return
    }
    case 'update': await updatePlugin(root, action.id, action.source, options); return
    case 'retry': return
    case 'install-recommended': case 'install-missing': await installGroup(root, action.action, options); return
    case 'install': {
      const item = (await readScannerSettings(root, [], options)).plugins.find(plugin => plugin.id === action.id)
      if (!item?.installSource) throw new Error('This scanner is no longer recommended. Review the current scanner list.')
      await addScanner(root, item.installSource, options)
    }
  }
}

async function installGroup(root: string, group: 'install-recommended' | 'install-missing', options: ScannerInstallOptions) {
  const settings = await readScannerSettings(root, [], options)
  const selected = settings.plugins.filter(item => group === 'install-recommended' ? !item.source && item.installSource : item.source && item.status === 'missing')
  const errors: string[] = []
  for (const item of selected) {
    try {
      if (group === 'install-recommended') await addScanner(root, item.installSource!, options)
      else if (item.kind === 'workSource') await restoreWorkSource(root, options)
      else await restoreScanner(root, item.id, options)
    } catch (error) { errors.push(`${item.id}: ${error instanceof Error ? error.message : String(error)}`) }
  }
  if (errors.length) throw new Error(errors.join('\n'))
}

export function parseScannerSettingsAction(input: unknown): ScannerSettingsAction {
  if (!input || typeof input !== 'object') throw new Error('Scanner action required')
  const value = input as Record<string, unknown>
  const action = value.action
  if (action === 'retry' || action === 'install-recommended' || action === 'install-missing') return { action }
  if (action === 'add' && typeof value.source === 'string') return { action, source: value.source }
  if (typeof value.id !== 'string') throw new Error('Scanner id required')
  if (action === 'update' && (value.source === undefined || typeof value.source === 'string')) return { action, id: value.id, source: value.source }
  if (action === 'install' || action === 'restore' || action === 'remove') return { action, id: value.id }
  throw new Error('Unknown scanner action')
}
