import type { Command } from 'commander'
import { iconPackInventory } from './icon-packs.ts'
import { parseListWindow, printListPage, withListWindowOptions } from './list-window.ts'
import { addPlugin, installPlugins, removePlugin, updatePlugin } from './plugin-management.ts'
import { scannerInventory } from './scanner/modules/inventory.ts'
import { checkWorkSourceReadiness } from './work-sources.ts'

/** Runs one command action; a failure prints its message alone and sets the exit code. The scanner commands share it. */
export async function runPluginCommand(action: () => Promise<void>): Promise<void> {
  try {
    await action()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}

/** One selection on one line: the scanner commands' form with the kind first, and a message only when there is one. */
function pluginLine(plugin: { kind: string; id: string; status: string; source: string; message?: string }): string {
  return [plugin.kind, plugin.id, plugin.status, plugin.source, ...(plugin.message ? [plugin.message] : [])].join('\t')
}

/** Every selection with what this computer has of it. Reading a work source's readiness imports its adapter. */
async function pluginInventory(root: string) {
  const scanners = (await scannerInventory(root)).map(scanner => ({ ...scanner, kind: 'scanner' }))
  const workSource = await checkWorkSourceReadiness(root)
  return [...scanners, ...(workSource ? [workSource] : []), ...await iconPackInventory(root)]
}

export function registerPluginCommands(program: Command): void {
  const plugin = program
    .command('plugin')
    .description('Manage the plugins of every kind for this project')

  plugin
    .command('add')
    .description('Install and select a plugin from npm, Git, or a local path')
    .argument('<source>', 'package name, package@version, git+https://repository#tag-or-commit, or ./path')
    .action(async (source: string) => {
      await runPluginCommand(async () => {
        const added = await addPlugin(process.cwd(), source)
        console.log('ok')
        console.log(pluginLine(added))
      })
    })

  plugin
    .command('update')
    .description('Update an npm plugin to its newest compatible release, or choose an exact source')
    .argument('<id>', 'configured plugin id')
    .argument('[source]', 'package name, package@version, or git+https://repository#tag-or-commit')
    .action(async (id: string, source?: string) => {
      await runPluginCommand(async () => {
        console.log(pluginLine(await updatePlugin(process.cwd(), id, source)))
      })
    })

  plugin
    .command('install')
    .description('Restore configured npm and Git plugin packages')
    .action(async () => {
      await runPluginCommand(async () => {
        const installed = await installPlugins(process.cwd())
        console.log('ok')
        console.log(`${installed} installed`)
      })
    })

  withListWindowOptions(plugin
    .command('list')
    .description('List configured plugins and their readiness'))
    .action(async options => {
      await runPluginCommand(async () => {
        const inventory = await pluginInventory(process.cwd())
        printListPage(inventory.map(pluginLine), parseListWindow(options, process.argv.slice(2)))
      })
    })

  plugin
    .command('remove')
    .description('Remove a plugin from this project without deleting the shared cache')
    .argument('<id>', 'plugin id')
    .action(async (id: string) => {
      await runPluginCommand(async () => {
        const removed = await removePlugin(process.cwd(), id)
        console.log('ok')
        console.log(removed)
      })
    })
}
