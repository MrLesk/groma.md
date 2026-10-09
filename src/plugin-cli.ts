import type { Command } from 'commander'
import { addPlugin, installPlugins, pluginInventory, removePlugin, updatePlugin } from './plugin-management.ts'
import { parseListWindow, printListPage, withListWindowOptions } from './list-window.ts'

async function run(action: () => Promise<void>): Promise<void> {
  try { await action() }
  catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1 }
}

export function registerPluginCommands(program: Command): void {
  const plugin = program.command('plugin').description('Manage project plugins by kind')
  plugin.command('add').argument('<source>', 'npm package, exact version, Git source or local path')
    .action((source: string) => run(async () => { console.log(await addPlugin(process.cwd(), source)) }))
  withListWindowOptions(plugin.command('list').description('List configured plugins and readiness'))
    .action(options => run(async () => {
      const rows = await pluginInventory(process.cwd())
      printListPage(rows.map(row => `${row.kind}\t${row.id}\t${row.status}\t${row.source}\t${row.message}`), parseListWindow(options, process.argv.slice(2)))
    }))
  plugin.command('remove').argument('<id>').action((id: string) => run(async () => { console.log(await removePlugin(process.cwd(), id)) }))
  plugin.command('install').description('Restore configured plugin packages')
    .action(() => run(async () => { console.log(`${await installPlugins(process.cwd())} installed`) }))
  plugin.command('update').argument('<id>').argument('[source]')
    .action((id: string, source?: string) => run(async () => { console.log(await updatePlugin(process.cwd(), id, source)) }))
}
