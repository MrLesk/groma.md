import type { Command } from 'commander'
import { parseListWindow, printListPage, withListWindowOptions, type ListWindowInput } from '../list-window.ts'
import { runPluginCommand } from '../plugin-cli.ts'
import { discoverScanners, discoveryItems, discoveryNote } from './modules/discovery.ts'
import { createClackInitUi } from '../init-command-ui.ts'
import { setupScanners } from './modules/setup.ts'
import { checkScannerReadiness, formatReadiness, requireScannerReadiness } from './modules/readiness.ts'

import {
  addScanner,
  installScanners,
  removeScanner,
  updateScanner,
  scannerInventory,
} from './modules/inventory.ts'

function scannerLine(scanner: { id: string; source: string; status: string }): string {
  return `${scanner.id}\t${scanner.status}\t${scanner.source}`
}

export function registerScannerCommands(program: Command): void {
  const scanner = program
    .command('scanner')
    .description('Manage scanner modules for this project')

  scanner.command('settings').description('Open project scanner settings').action(() => runPluginCommand(async () => {
    if (process.stdin.isTTY && process.stdout.isTTY) await (await import('../viewers/tui/scanner-settings.ts')).startPluginSettings(process.cwd())
    else console.log(JSON.stringify(await (await import('./modules/settings.ts')).readPluginSettings(process.cwd()), null, 2))
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

  scanner
    .command('add')
    .description('Install and enable a scanner from npm, Git, or a local path')
    .argument('<source>', 'package name, package@version, git+https://repository#tag-or-commit, or ./path')
    .action(async (source: string) => {
      await runPluginCommand(async () => {
        const added = await addScanner(process.cwd(), source)
        console.log('ok')
        console.log(scannerLine(added))
      })
    })

  scanner
    .command('update')
    .description('Update an npm scanner to its newest compatible release, or choose an exact source')
    .argument('<id>', 'configured scanner id')
    .argument('[source]', 'package name, package@version, or git+https://repository#tag-or-commit')
    .action(async (id: string, source?: string) => {
      await runPluginCommand(async () => {
        console.log(scannerLine(await updateScanner(process.cwd(), id, source)))
      })
    })

  scanner
    .command('install')
    .description('Restore configured npm and Git scanner packages')
    .action(async () => {
      await runPluginCommand(async () => {
        const installed = await installScanners(process.cwd())
        console.log('ok')
        console.log(`${installed} installed`)
      })
    })

  withListWindowOptions(scanner
    .command('list')
    .description('List configured scanner readiness'))
    .action(async options => {
      await runPluginCommand(async () => {
        const inventory = await scannerInventory(process.cwd())
        printListPage(inventory.map(scannerLine), parseListWindow(options, process.argv.slice(2)))
      })
    })

  scanner
    .command('remove')
    .description('Disable a scanner without deleting the shared cache')
    .argument('<id>', 'scanner id')
    .action(async (id: string) => {
      await runPluginCommand(async () => {
        const removed = await removeScanner(process.cwd(), id)
        console.log('ok')
        console.log(removed)
      })
    })
}
