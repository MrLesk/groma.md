import { expect, test } from 'bun:test'
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { runInitCommand, type InitCommandDependencies, type InitCommandUi } from '../src/init-command.ts'
import { addPlugin, removePlugin } from '../src/plugin-management.ts'
import { readPluginConfig, writePluginConfig } from '../src/scanner/modules/config.ts'
import { checkWorkSourceReadiness, workSourceSession } from '../src/work-sources.ts'

async function project(range = '*', id = 'tasks') {
  const root = await mkdtemp(path.join(os.tmpdir(), 'groma-work-selection-'))
  await cp(path.resolve(import.meta.dir, '../test/fixtures/flows'), root, { recursive: true })
  await mkdir(path.join(root, 'adapter'))
  await writeFile(path.join(root, 'adapter/package.json'), JSON.stringify({
    name: 'work-source-fixture', version: '1.0.0', type: 'module',
    groma: { workSource: { id, entry: './index.js', compatibility: { groma: range } } },
  }))
  await writeFile(path.join(root, 'adapter/index.js'), range === '*' ? `
    import { appendFileSync } from 'node:fs'
    export default { id: '${id}', readiness: () => ({ status: 'found' }), create(root) {
      return {
        read: async () => { appendFileSync(root + '/calls', 'read\\n'); return { statuses: [], defaultStatus: '', items: [{ id: 'WORK-1' }] } },
        readItem: async id => ({ id }),
        watch: () => { appendFileSync(root + '/calls', 'watch\\n'); return { close: () => appendFileSync(root + '/calls', 'close\\n') } },
      }
    } }
  ` : 'throw new Error("An incompatible adapter must never be imported")')
  return root
}

test.concurrent('work-source selection controls reads and closes its watch when removed', async () => {
  const root = await project()
  let watch: { close(): void | Promise<void> } | undefined
  try {
    await writePluginConfig(root, { scanners: [], workSources: [], icons: [] })
    const session = await workSourceSession(root)
    watch = session.watch(() => {})
    expect((await session.read()).items).toEqual([])
    await expect(readFile(path.join(root, 'calls'), 'utf8')).rejects.toThrow()
    await addPlugin(root, './adapter')
    await session.reconfigure()
    expect((await session.read()).items[0]?.id).toBe('WORK-1')
    await removePlugin(root, 'tasks')
    await session.reconfigure()
    expect((await session.read()).items).toEqual([])
    expect((await readFile(path.join(root, 'calls'), 'utf8')).trim().split('\n')).toEqual(['watch', 'read', 'close'])
  } finally { await watch?.close(); await rm(root, { recursive: true, force: true }) }
})

test.concurrent('a work-source version mismatch blocks loading before plugin code executes', async () => {
  const root = await project('>=99.0.0')
  try {
    await writePluginConfig(root, { scanners: [], workSources: [{ id: 'tasks', source: './adapter' }], icons: [] })
    const selection = await checkWorkSourceReadiness(root)
    expect(selection?.status).toBe('blocked')
    expect(selection?.message).toContain('>=99.0.0')
  } finally { await rm(root, { recursive: true, force: true }) }
})

/** plugins.json as a person could write it by hand; the writer refuses what the parser refuses. */
async function handWritten(root: string, config: unknown): Promise<void> {
  await writeFile(path.join(root, 'groma/plugins.json'), JSON.stringify(config))
}

test.concurrent('a plugins.json with a second work-source entry is refused when read and when written', async () => {
  const root = await project()
  const workSources = [{ id: 'tasks', source: './adapter' }, { id: 'other', source: './other' }]
  try {
    await expect(writePluginConfig(root, { scanners: [], workSources, icons: [] })).rejects.toThrow('at most one work source')
    await handWritten(root, { scanners: [], workSources })
    await expect(readPluginConfig(root)).rejects.toThrow('at most one work source')
  } finally { await rm(root, { recursive: true, force: true }) }
})

test.concurrent('a plugin id shared by two sections is refused when read and when written', async () => {
  const root = await project()
  const scanners = [{ id: 'tasks', source: './scanner', include: ['**/*.fixture'] }]
  const shared = [{ id: 'tasks', source: './adapter' }]
  try {
    for (const config of [{ scanners, workSources: shared, icons: [] }, { scanners, workSources: [], icons: shared }]) {
      await expect(writePluginConfig(root, config)).rejects.toThrow('more than once')
      await handWritten(root, config)
      await expect(readPluginConfig(root)).rejects.toThrow('more than once')
    }
  } finally { await rm(root, { recursive: true, force: true }) }
})

/** Runs the interactive wizard with every prompt answered. The `backlog` CLI exists and Backlog.md is not initialized unless overridden. */
async function runWizard(root: string, overrides: Partial<InitCommandDependencies>, useBacklog = false) {
  const errors: string[] = []
  const ui: InitCommandUi = {
    cancel() {}, intro() {}, note() {}, outro() {}, error: message => { errors.push(message) },
    confirmInit: async () => true, confirmOpenWeb: async () => false, confirmScan: async () => false, confirmUseBacklog: async () => useBacklog,
    directory: async () => 'groma', install: async (_message, operation) => operation(), installer: async () => 'bun',
    projectName: async current => current, selectScanners: async () => [],
  }
  const outcome = await runInitCommand({ repositoryRoot: root, interactive: true, opensViewer: true }, { openWeb: async () => {} }, {
    ui, gitInitialized: async () => true, setupScanners: async () => true, executablePath: async () => '',
    backlogAvailable: () => true, backlogInitialized: async () => false, ...overrides,
  })
  return { errors, outcome }
}

test.concurrent('groma init reports a failed Backlog initialization when the work source is already selected', async () => {
  const root = await project()
  try {
    await writePluginConfig(root, { scanners: [], workSources: [{ id: 'backlog', source: '@groma/work-source-backlog@0.1.0' }], icons: [] })
    expect((await runWizard(root, { initializeBacklog: async () => false })).errors).toHaveLength(1)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test.concurrent('groma init leaves Backlog alone when the project selects another work source', async () => {
  const root = await project()
  let initialized = 0
  try {
    await writePluginConfig(root, { scanners: [], workSources: [{ id: 'tasks', source: './adapter' }], icons: [] })
    await runWizard(root, { initializeBacklog: async () => { initialized++; return true } })
    expect(initialized).toBe(0)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test.concurrent('choosing Backlog during groma init records the work source, then installs its CLI and initializes it', async () => {
  const root = await project('*', 'backlog')
  const steps: string[] = []
  try {
    const { errors } = await runWizard(root, {
      selectBacklog: async () => { await addPlugin(root, './adapter'); steps.push('select'); return true },
      backlogAvailable: () => steps.includes('install'),
      install: async () => { steps.push('install'); return true },
      initializeBacklog: async () => { steps.push('initialize'); return true },
    }, true)
    expect((await readPluginConfig(root)).workSources).toEqual([{ id: 'backlog', source: './adapter' }])
    expect(steps).toEqual(['select', 'install', 'initialize'])
    expect(errors).toEqual([])
  } finally { await rm(root, { recursive: true, force: true }) }
})

test.concurrent('groma init continues and installs nothing when the Backlog work source cannot be selected', async () => {
  const root = await project()
  let installs = 0
  try {
    const { errors, outcome } = await runWizard(root, {
      selectBacklog: async () => false, backlogAvailable: () => false,
      install: async () => { installs++; return true },
    }, true)
    expect(outcome).toBe('completed')
    expect(errors).toHaveLength(1)
    expect(installs).toBe(0)
  } finally { await rm(root, { recursive: true, force: true }) }
})
