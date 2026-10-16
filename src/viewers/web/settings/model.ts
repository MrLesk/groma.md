import type { PluginSettings } from '../../../plugins/settings-model.ts'

/** Only actionable scanner problems need a warning; recommendations alone do not. */
export function scannerWarning(settings: PluginSettings | undefined): { scannerId?: string } | undefined {
  if (settings?.notice.tone !== 'warning' && settings?.notice.tone !== 'error') return undefined
  const scanners = settings.plugins.filter(plugin => plugin.kind === 'scanner')
  const scanner = scanners.find(item => item.status === 'blocked')
    ?? scanners.find(item => item.status === 'missing')
    ?? scanners.find(item => item.match === 'matched' && item.status === 'available')
  return { scannerId: scanner?.id }
}

/** Recommendations are matching scanners outside the project's configured selection. */
export function scannerRecommendationCount(settings: PluginSettings | undefined): number {
  return settings?.plugins.filter(plugin => plugin.kind === 'scanner' && !plugin.listed && plugin.match === 'matched').length ?? 0
}
