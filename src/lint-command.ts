import type { Command } from 'commander'
import { architectureFindingItems, detectDuplicatedLogic } from './architecture-findings.ts'
import { buildArchitectureModel } from './architecture-model.ts'
import { loadArchitecture } from './architecture-reader.ts'
import { criticalTaskFindings } from './criticality.ts'
import { unknownIcons } from './icon-packs.ts'
import { sourceIndex } from './source-index.ts'
import { parseListWindow, printListPage, withListWindowOptions, type ListWindow } from './list-window.ts'
import { loadScannerRegistry } from './scanner/registry.ts'
import { workSourceSession } from './work-sources.ts'

/**
 * Report tasks that change a critical component, possible duplicate logic in current scanner evidence, and icon
 * names no installed pack resolves. Saved architecture stays unchanged.
 */
async function lintArchitecture(repositoryRoot: string, window: ListWindow): Promise<number> {
  const records = await loadArchitecture(repositoryRoot)
  const model = buildArchitectureModel(records.documents)
  const owners = sourceIndex(model.elements).byFile
  const registry = await loadScannerRegistry(repositoryRoot)
  const { observations, failures } = await registry.collectObservations(repositoryRoot)
  // Tasks come from the work source that plugins.json selects; with none selected or ready there are no tasks.
  const work = await (await workSourceSession(repositoryRoot)).read()
  const findings = [...criticalTaskFindings(model.elements, work), ...detectDuplicatedLogic(observations, owners)]
  const icons = await unknownIcons(repositoryRoot, model.elements)
  printListPage([...architectureFindingItems(findings), ...icons], window)
  for (const failure of failures) console.error(failure.message)
  if (!window.count && findings.length === 0 && icons.length === 0 && failures.length === 0) {
    console.log('No task changes a critical component. No duplicate findings in available scanner evidence. No unknown icon names.')
  }
  return findings.length > 0 || icons.length > 0 || failures.length > 0 ? 1 : 0
}

export function registerLintCommand(program: Command): void {
  withListWindowOptions(program.command('lint')
    .description('Report architecture issues (critical task changes, possible duplicate logic and unknown icon names)'))
    .action(async options => {
      try {
        process.exitCode = await lintArchitecture(process.cwd(), parseListWindow(options, process.argv.slice(2)))
      } catch (error) {
        console.error(error instanceof Error ? error.message : String(error))
        process.exitCode = 1
      }
    })
}
