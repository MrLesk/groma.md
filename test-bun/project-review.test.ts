import { expect, test } from 'bun:test'
import type { ScannerSetting, PluginSettings } from '../src/plugins/settings-model.ts'
import { pluginSettingAction } from '../src/plugins/settings-model.ts'
import { scannerRecommendationCount, scannerWarning } from '../src/viewers/web/settings/model.ts'

function settings(tone: PluginSettings['notice']['tone'], statuses: ScannerSetting['status'][]): PluginSettings {
  return { automaticUpdates: true, notice: { tone, message: '' }, limits: [], plugins: statuses.map((status, index) => ({
    kind: 'scanner', id: String(index), name: '', listed: status !== 'available', official: true, technologies: [], matches: [], match: 'matched', status, message: '',
  })) }
}

test.concurrent('scanner warnings open a failed plugin before missing or recommended plugins', () => {
  expect(scannerWarning(settings('error', ['available', 'missing', 'blocked']))?.scannerId).toBe('2')
  expect(scannerWarning(settings('warning', ['available', 'missing']))?.scannerId).toBe('1')
  expect(scannerWarning(settings('warning', ['available']))?.scannerId).toBe('0')
})

test.concurrent('a scanner warning opens a scanner even when a work source needs attention', () => {
  const state = settings('warning', ['available'])
  state.plugins.unshift({ kind: 'workSource', id: 'tasks', name: '', listed: true, official: false, status: 'blocked', message: '' })
  expect(scannerWarning(state)?.scannerId).toBe('0')
})

test.concurrent('healthy and partial coverage states do not show scanner warnings', () => {
  expect(scannerWarning(settings('neutral', ['ready']))).toBeUndefined()
  expect(scannerWarning(settings('hint', ['ready', 'available']))).toBeUndefined()
})

test.concurrent('a settings load failure opens general settings and static exports have no warning', () => {
  expect(scannerWarning(settings('error', []))).toEqual({ scannerId: undefined })
  expect(scannerWarning(undefined)).toBeUndefined()
})

test.concurrent('recommendation counts exclude configured scanners, work sources, unmatched rows and version offers', () => {
  const state = settings('hint', ['ready', 'missing', 'blocked', 'available', 'available', 'available', 'available'])
  const scanners = state.plugins as ScannerSetting[]
  scanners[5]!.match = 'none'
  scanners[6]!.match = 'unknown'
  scanners[0]!.source = 'configured@1.0.0'
  state.upgrades = { 'configured@1.0.0': { version: '2.0.0' } }
  state.plugins.push({ kind: 'workSource', id: 'tasks', name: '', listed: false, official: true, status: 'available', installSource: 'tasks', message: '' })
  expect(scannerRecommendationCount(state)).toBe(2)
  expect(scannerRecommendationCount(settings('neutral', ['ready', 'missing']))).toBe(0)
  expect(scannerRecommendationCount(undefined)).toBe(0)
})

test.concurrent('installing recommendations reduces their count while scanner warning actions stay separate', () => {
  const state = settings('error', ['blocked', 'missing', 'available', 'available'])
  const recommended = state.plugins.slice(2) as ScannerSetting[]
  for (const scanner of recommended) scanner.installSource = `${scanner.id}@1.0.0`
  expect(scannerRecommendationCount(state)).toBe(2)
  expect(scannerWarning(state)?.scannerId).toBe('0')
  expect(pluginSettingAction(state.plugins[0]!)).toEqual({ action: 'retry' })
  expect(pluginSettingAction(state.plugins[1]!)).toEqual({ action: 'restore', id: '1' })
  for (const [index, scanner] of recommended.entries()) {
    expect(pluginSettingAction(scanner)).toEqual({ action: 'install', id: scanner.id })
    scanner.listed = true
    scanner.status = 'unchecked'
    expect(scannerRecommendationCount(state)).toBe(1 - index)
    expect(scannerWarning(state)?.scannerId).toBe('0')
  }
})
