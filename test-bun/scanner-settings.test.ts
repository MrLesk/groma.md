import { expect, test } from 'bun:test'
import { scannerNotice, scannerSettingsState } from '../src/plugins/settings.ts'
import { pendingPlugin, pluginGroups, pluginProgress, pluginSettingAction, type PluginSettingsAction, type ScannerSetting } from '../src/plugins/settings-model.ts'
import type { ScannerDiscovery } from '../src/scanner/modules/discovery.ts'

function setting(id: string, status: ScannerSetting['status'], match: ScannerSetting['match'] = 'matched'): ScannerSetting {
  return { kind: 'scanner', id, name: id, listed: status !== 'available', official: false, technologies: [id], matches: [], status, match, message: '' }
}

test.concurrent('support notices distinguish empty, partial, ready, unknown and failed projects', () => {
  expect(scannerNotice([], []).tone).toBe('neutral')
  expect(scannerNotice([setting('rust', 'available')], []).tone).toBe('warning')
  expect(scannerNotice([setting('react', 'ready'), setting('rust', 'missing')], []).tone).toBe('hint')
  expect(scannerNotice([setting('react', 'ready'), setting('rust', 'ready')], []).tone).toBe('neutral')
  expect(scannerNotice([setting('react', 'blocked'), setting('rust', 'ready')], []).tone).toBe('error')
  expect(scannerNotice([setting('custom', 'ready', 'unknown')], []).tone).toBe('hint')
  expect(scannerNotice([setting('unrelated', 'unchecked', 'none')], []).tone).toBe('neutral')
  expect(scannerNotice([], ['Declaration is invalid']).tone).toBe('hint')
})

test.concurrent('an installed equivalent plugin suppresses duplicate official recommendations but unknown plugins do not', () => {
  const finding = { technology: 'react', kind: 'framework' as const, file: 'ui/package.json', declaration: 'react dependency', version: '19.0.0' }
  const proposal: ScannerDiscovery = {
    findings: [finding], inventory: [], limits: [],
    recommendations: [{ id: 'react', package: '@groma/scanner-react', status: 'installable', evidence: [finding], reason: '', installSource: '@groma/scanner-react@1.0.0' }],
  }
  const custom = { id: 'custom', name: 'custom', version: '1.0.0', source: '/plugins/custom', entry: '/plugins/custom/index.ts', include: ['**/*.custom'], status: 'found' as const }
  const known = scannerSettingsState(proposal, [{ ...custom, discovery: { technologies: ['react'], rules: [] } }])
  expect(known.plugins.map(item => item.id)).toEqual(['custom'])
  expect(known.plugins[0]?.matches).toEqual(['ui/package.json'])
  const unknown = scannerSettingsState(proposal, [custom])
  expect(unknown.plugins.map(item => item.id)).toEqual(['custom', 'react'])
  expect(unknown.plugins[0]?.match).toBe('unknown')
  const blocked = scannerSettingsState(proposal, [{ ...custom, discovery: { technologies: ['react'], rules: [] } }], [
    { id: 'custom', package: 'found', project: 'blocked', message: 'Tool unavailable' },
  ])
  expect(blocked.plugins.map(item => item.id)).toEqual(['custom', 'react'])
  expect(blocked.notice.tone).toBe('error')
})

test.concurrent('scanner groups follow local availability while preserving project selection across restore and removal', () => {
  const installed = { ...setting('first', 'blocked'), source: 'first@1.0.0' }
  const missing = { ...setting('second', 'missing'), source: 'second@1.0.0' }
  const recommended = { ...setting('third', 'available'), installSource: 'third@1.0.0' }
  const scanners = [recommended, missing, installed]
  const ids = (items: ScannerSetting[]) => pluginGroups(items).map(group => group.plugins.map(item => item.id))
  expect(ids(scanners)).toEqual([['first'], ['second'], ['third']])
  expect(ids([recommended, { ...missing, status: 'ready' }, installed])).toEqual([['second', 'first'], ['third']])
  expect(ids([recommended, missing])).toEqual([['second'], ['third']])
  expect(scanners.map(item => item.id)).toEqual(['third', 'second', 'first'])
  expect(pluginSettingAction(missing)).toEqual({ action: 'restore', id: 'second' })
  expect(pluginSettingAction(recommended)).toEqual({ action: 'install', id: 'third' })
  expect(pluginSettingAction(installed)).toEqual({ action: 'retry' })
  expect(pluginSettingAction({ ...installed, status: 'unchecked' })).toBeUndefined()
  expect(pluginSettingAction({ ...installed, status: 'ready' })).toBeUndefined()
  expect(scannerNotice([{ ...installed, status: 'unchecked' }], []).tone).toBe('neutral')
})

test.concurrent('an incompatible recommendation does not make a missing project selection appear installed', () => {
  const proposal: ScannerDiscovery = { findings: [], inventory: [], limits: [], recommendations: [
    { id: 'react', package: '@groma/scanner-react', status: 'incompatible', evidence: [], reason: 'Unsupported technology version' },
  ] }
  const state = scannerSettingsState(proposal, [{ id: 'react', source: '@groma/scanner-react@1.0.0', status: 'missing' }])
  expect(state.plugins[0]?.status).toBe('missing')
  const removed = scannerSettingsState(proposal, [{ id: 'react', source: '@groma/scanner-react@1.0.0', status: 'missing' }], [{ id: 'react', package: 'found', project: 'ready', message: '' }])
  expect(removed.plugins[0]?.status).toBe('missing')
  expect(pluginSettingAction(state.plugins[0]!)).toEqual({ action: 'restore', id: 'react' })
})

test.concurrent('a running action marks the rows it acts on until it ends, and no other row', () => {
  const recommended = { ...setting('swift', 'available'), installSource: 'swift@1.0.0' }
  const missing = { ...setting('rust', 'missing'), source: 'rust@1.0.0' }
  const blocked = { ...setting('react', 'blocked'), source: 'react@1.0.0' }
  const before = [recommended, missing, blocked]
  /** The ids of the rows that say what the action is doing, among the rows as they are now. */
  const marked = (action: PluginSettingsAction, now: ScannerSetting[] = before): string[] =>
    now.filter(row => pluginProgress({ action, before }, row) !== undefined).map(row => row.id)

  expect(marked({ action: 'install', id: 'swift' })).toEqual(['swift'])
  expect(marked({ action: 'restore', id: 'rust' })).toEqual(['rust'])
  expect(marked({ action: 'update', id: 'react' })).toEqual(['react'])
  expect(marked({ action: 'remove', id: 'react' })).toEqual(['react'])
  expect(marked({ action: 'install-recommended' })).toEqual(['swift'])
  expect(marked({ action: 'install-missing' })).toEqual(['rust'])
  expect(marked({ action: 'retry' })).toEqual(['react'])
  expect(marked({ action: 'automatic-updates', enabled: false })).toEqual([])

  // config.json lists the new plugin while the action still scans with it: its row stays marked, so it shows no status yet.
  const listed = [{ ...recommended, listed: true, status: 'unchecked' as const }, missing, blocked]
  expect(marked({ action: 'install', id: 'swift' }, listed)).toEqual(['swift'])
  expect(marked({ action: 'install-recommended' }, listed)).toEqual(['swift'])

  // Add names a source, not a row. Until config.json lists the new plugin, the typed source stands for it.
  const add: PluginSettingsAction = { action: 'add', source: 'swift@1.0.0' }
  expect(marked(add)).toEqual([])
  expect(pendingPlugin({ action: add, before }, before)?.source).toBe('swift@1.0.0')
  expect(marked(add, listed)).toEqual(['swift'])
  expect(pendingPlugin({ action: add, before }, listed)).toBeUndefined()
  expect(pendingPlugin({ action: { action: 'install', id: 'swift' }, before }, before)).toBeUndefined()
})
