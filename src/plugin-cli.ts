import type { Command } from 'commander'
import { parseListWindow, printListPage, withListWindowOptions } from './list-window.ts'
import { addPlugin, pluginPresence, removePlugin, restoreFailure, restoreMissingPlugins, updatePlugin, type PluginSelection } from './plugin-management.ts'

/** Runs one command action; a failure prints its message alone and sets the exit code. The scanner commands share it. */
export async function runPluginCommand(action: () => Promise<void>): Promise<void> {
  try {
    await action()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}

/** One plugin on one line, its fields separated by tabs; empty fields are left out. */
function pluginLine(fields: string[]): string {
  return fields.filter(Boolean).join('\t')
}

function selectionLine(plugin: PluginSelection): string {
  return pluginLine([plugin.kind, plugin.id, plugin.pinned])
}

export function registerPluginCommands(program: Command): void {
  const plugin = program
    .command('plugin')
    .description('Manage the plugins config.json lists for this project')

  plugin
    .command('add')
    .description('Add a bundled plugin by id, or install and add a scanner from npm, Git, or a local path')
    .argument('<plugin>', 'bundled plugin id (backlog), package name, package@version, git+https://repository#tag-or-commit, or ./path')
    .action(async (input: string) => {
      await runPluginCommand(async () => {
        const added = await addPlugin(process.cwd(), input)
        console.log('ok')
        console.log(selectionLine(added))
      })
    })

  plugin
    .command('update')
    .description('Update a plugin to its newest compatible release, or a scanner to an exact source, and record it')
    .argument('<id>', 'configured plugin id')
    .argument('[source]', 'package name, package@version, or git+https://repository#tag-or-commit')
    .action(async (id: string, source?: string) => {
      await runPluginCommand(async () => {
        console.log(selectionLine(await updatePlugin(process.cwd(), id, source)))
      })
    })

  plugin
    .command('install')
    .description('Restore the plugins config.json lists that this computer lacks')
    .action(async () => {
      await runPluginCommand(async () => {
        const { restored, failed } = await restoreMissingPlugins(process.cwd())
        if (failed.length) throw restoreFailure(failed)
        console.log('ok')
        console.log(`${restored.length} restored`)
      })
    })

  withListWindowOptions(plugin
    .command('list')
    .description('List the plugins config.json lists and whether this computer has them'))
    .action(async options => {
      await runPluginCommand(async () => {
        const lines = (await pluginPresence(process.cwd())).map(item =>
          pluginLine([item.kind, item.id, item.present ? 'found' : 'missing', item.pinned, item.message]))
        printListPage(lines, parseListWindow(options, process.argv.slice(2)))
      })
    })

  plugin
    .command('remove')
    .description('Remove a plugin from config.json without deleting the shared cache')
    .argument('<id>', 'plugin id')
    .action(async (id: string) => {
      await runPluginCommand(async () => {
        const removed = await removePlugin(process.cwd(), id)
        console.log('ok')
        console.log(removed)
      })
    })
}
