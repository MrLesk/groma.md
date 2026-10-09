import { EMPTY_WORK_SNAPSHOT } from '@groma/work-source'
import { backlogPlugin } from '@groma/work-source-backlog'
import type { Command } from 'commander'
import { architectureFindingItems, detectDuplicatedLogic, criticalTaskFindings } from './architecture-findings.ts'
import { buildArchitectureModel } from './architecture-model.ts'
import { loadArchitecture } from './architecture-reader.ts'
import { sourceIndex } from './source-index.ts'
import { parseListWindow, printListPage, withListWindowOptions, type ListWindow } from './list-window.ts'
import { loadScannerRegistry } from './scanner/registry.ts'

/** Inspect current scanner evidence without folding it into saved architecture. */
async function lintArchitecture(repositoryRoot: string, window: ListWindow): Promise<number> {
  const records = await loadArchitecture(repositoryRoot)
  const model = buildArchitectureModel(records.documents)
  const owners = sourceIndex(model.elements).byFile
  const registry = await loadScannerRegistry(repositoryRoot)
  const { observations, failures } = await registry.collectObservations(repositoryRoot)
  // A repository without a Backlog.md project, or without the CLI, has no tasks to check.
  const work = await backlogPlugin.create(repositoryRoot).read().catch(() => EMPTY_WORK_SNAPSHOT)
  const findings = [...criticalTaskFindings(model.elements, work), ...detectDuplicatedLogic(observations, owners)]
  printListPage(architectureFindingItems(findings), window)
  for (const failure of failures) console.error(failure.message)
  if (!window.count && findings.length === 0 && failures.length === 0) {
    console.log('No architecture findings.')
  }
  return findings.length > 0 || failures.length > 0 ? 1 : 0
}

export function registerLintCommand(program: Command): void {
  withListWindowOptions(program.command('lint')
    .description('Report critical task changes and possible duplicate logic'))
    .action(async options => {
      try {
        process.exitCode = await lintArchitecture(process.cwd(), parseListWindow(options, process.argv.slice(2)))
      } catch (error) {
        console.error(error instanceof Error ? error.message : String(error))
        process.exitCode = 1
      }
    })
}
