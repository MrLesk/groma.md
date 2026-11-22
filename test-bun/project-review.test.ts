import { expect, test } from 'bun:test'
import type { ScannerSetting, PluginSettings } from '../src/plugins/settings-model.ts'
import { pluginSettingAction } from '../src/plugins/settings-model.ts'
import { scannerRecommendationCount, scannerWarning } from '../src/viewers/web/settings/model.ts'

function settings(tone: PluginSettings['notice']['tone'], statuses: ScannerSetting['status'][]): PluginSettings {
  return { automaticUpdates: true, notice: { tone, message: '' }, limits: [], plugins: statuses.map((status, index) => ({
    kind: 'scanner', id: String(index), name: '', listed: status !== 'available', official: true, technologies: [], matches: [], match: 'matched', status, message: '',
  })) }
}

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
