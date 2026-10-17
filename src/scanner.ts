import { architectureFindingsFor } from './architecture-findings.ts'
import { reconcileScanObservations } from './core.ts'
import { loadScannerRegistry, type ScanBatch } from './scanner/registry.ts'
import { createScannerSession } from './scanner/session.ts'
import type { ScannerInstallOptions, ScannerResolutionOptions } from './scanner/modules/inventory.ts'
import type { ScanSummary } from './types.ts'

export function formatScanSummary(summary: ScanSummary): string {
  const counts = `created ${summary.created}, refreshed ${summary.refreshed}, matched ${summary.matched}`
  const findings = summary.findings ? `, findings ${summary.findings}` : ''
  const conflicts = summary.evidenceConflicts?.length ? `, evidence conflicts ${summary.evidenceConflicts.length}` : ''
  return `${counts}${findings}${conflicts}`
}

type ScannerDiagnostic = NonNullable<ScanSummary['scannerDiagnostics']>[number]

/** One line per scanner and code: diagnostic count, then the first listed diagnostic as an example. */
function formatScannerDiagnostics(diagnostics: ScannerDiagnostic[]): string[] {
  const groups = new Map<string, { first: ScannerDiagnostic; count: number }>()
  for (const entry of diagnostics) {
    const key = JSON.stringify([entry.scanner.id, entry.diagnostic.code])
    const group = groups.get(key)
    if (group) group.count++
    else groups.set(key, { first: entry, count: 1 })
  }
  return [...groups.values()].map(({ first: { scanner, diagnostic }, count }) => {
    const location = [diagnostic.file, diagnostic.line].filter(value => value !== undefined).join(':')
    const [firstLine] = diagnostic.message.split('\n')
    const example = location ? `${location}: ${firstLine}` : firstLine
    return `${scanner.id} · ${diagnostic.severity} · ${diagnostic.code} ×${count}: ${example}`
  })
}

export function formatScanReport(repositoryRoot: string, summary: ScanSummary): string {
  // The report stays short: findings are counted here and read through groma lint, which pages them.
  const found = architectureFindingsFor(repositoryRoot).length
  const findings = found === 0 ? [] : ['Run groma lint to review the findings.']
  const conflicts = summary.evidenceConflicts?.map(conflict => `${conflict.code}: ${conflict.message}`) ?? []
  const diagnostics = formatScannerDiagnostics(summary.scannerDiagnostics ?? [])
  const failures = summary.scannerFailures?.map(failure => `${failure.message} (saved scanner data kept)`) ?? []
  return [formatScanSummary(summary), ...failures, ...diagnostics, ...conflicts, ...findings].join('\n')
}

async function reconcileBatch(root: string, { observations, failures }: ScanBatch): Promise<ScanSummary> {
  const summary = await reconcileScanObservations(root, observations)
  if (failures.length) summary.scannerFailures = failures.map(({ scanner, message }) => ({ scanner, message }))
  return summary
}

export async function scanRepository(
  repositoryRoot: string,
  options: ScannerResolutionOptions = {},
): Promise<ScanSummary> {
  const registry = await loadScannerRegistry(repositoryRoot, options)
  return reconcileBatch(repositoryRoot, await registry.collectObservations(repositoryRoot))
}

export async function watchScan(
  repositoryRoot: string,
  options: {
    onFold?: (summary: ScanSummary) => void | Promise<void>
    onError?: (error: unknown) => void
  } & ScannerInstallOptions = {},
): Promise<{ close(): Promise<void> }> {
  const session = await createScannerSession(repositoryRoot, { ...options, scan: false })
  await session.ready
  return { close: () => session.close() }
}
