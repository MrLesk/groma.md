import type { Command } from 'commander'
import { updateNpmScanners } from './modules/inventory.ts'
import { scanRepository } from '../scanner.ts'
import { parseListWindow, printListPage, withListWindowOptions, type ListWindowInput } from '../list-window.ts'
import { runPluginCommand } from '../plugins/cli.ts'
import { discoverScanners, discoveryItems, discoveryNote } from './modules/discovery.ts'
import { createClackInitUi } from '../init-command-ui.ts'
import { setupScanners } from './modules/setup.ts'
import { checkScannerReadiness, formatReadiness, requireScannerReadiness } from './modules/readiness.ts'

export function registerScannerCommands(program: Command): void {
  const scanner = program
    .command('scanner')
    .description('Set up and check the scanners of this project; groma plugin adds, updates and removes them')

  // Internal job for a one-shot scan; ordinary architecture watching publishes its scan result.
  scanner.command('refresh', { hidden: true })
    .action(async () => {
      if (await updateNpmScanners(process.cwd())) await scanRepository(process.cwd())
    })

  scanner.command('settings').description('Open the plugins screen of this project').action(() => runPluginCommand(async () => {
    if (process.stdin.isTTY && process.stdout.isTTY) await (await import('../viewers/tui/plugin-settings.ts')).startPluginSettings(process.cwd())
    else console.log(JSON.stringify(await (await import('../plugins/settings.ts')).readPluginSettings(process.cwd()), null, 2))
  }))

  scanner
    .command('setup')
    .description('Review project scanners, select additions, and check project readiness')
    .option('--no-interactive', 'Report recommendations and readiness without installing')
    .action(async (options: { interactive: boolean }) => {
      await runPluginCommand(async () => {
        const interactive = options.interactive && Boolean(process.stdin.isTTY && process.stdout.isTTY)
        const completed = await setupScanners(process.cwd(), interactive, createClackInitUi(), console.log)
        if (!completed) process.exitCode = 1
      })
    })

  scanner
    .command('check')
    .description('Check enabled scanner packages and project tooling without installing')
    .action(async () => {
      await runPluginCommand(async () => {
        const readiness = await checkScannerReadiness(process.cwd())
        console.log(formatReadiness(readiness))
        requireScannerReadiness(readiness)
      })
    })

  withListWindowOptions(scanner
    .command('discover')
    .description('Find project declarations and recommend official scanners')
    .option('--json', 'Print the discovery result as JSON'))
    .action(async (options: ListWindowInput & { json?: boolean }) => {
      await runPluginCommand(async () => {
        const window = parseListWindow(options, process.argv.slice(2))
        const result = await discoverScanners(process.cwd())
        if (options.json) {
          console.log(JSON.stringify(result, null, 2))
          return
        }
        printListPage(discoveryItems(result), window, [discoveryNote])
      })
    })
}
