import { expect, test } from 'bun:test'
import { chmod, cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { runInitCommand, type InitCommandDependencies, type InitCommandUi } from '../src/init-command.ts'
import { readGromaConfig, writeGromaConfig } from '../src/config.ts'

const source = path.resolve(import.meta.dir, '../src')

/**
 * Runs a script in a child process whose PATH starts with a fake `backlog` CLI, so the bundled Backlog.md work source
 * finds it. The CLI prints the version in `<root>/version`, logs every call to `<root>/calls` and lists one task.
 */
async function withFakeBacklog(root: string, version: string, script: string): Promise<Record<string, unknown>> {
  const bin = path.join(root, 'bin')
  await mkdir(bin)
  await writeFile(path.join(root, 'version'), version)
  await writeFile(path.join(bin, 'backlog'), `#!${process.execPath}
    import { appendFileSync, readFileSync } from 'node:fs'
    const args = process.argv.slice(2)
    appendFileSync(${JSON.stringify(path.join(root, 'calls'))}, args.join(' ') + '\\n')
    if (args[0] === '--version') console.log(readFileSync(${JSON.stringify(path.join(root, 'version'))}, 'utf8'))
    else if (args[0] === 'config') console.log('To Do')
    else console.log(JSON.stringify({ tasks: [{ id: 'TASK-1', title: 'One', status: 'To Do', assignees: [], references: [], modifiedFiles: [], acceptanceCriteriaCount: 0, acceptanceCriteriaCompleted: 0, updatedAt: null }] }))
  `)
  await chmod(path.join(bin, 'backlog'), 0o755)
  const file = path.join(root, 'probe.ts')
  await writeFile(file, `
    import { readFile, writeFile } from 'node:fs/promises'
    import { addPlugin, pluginPresence, removePlugin } from ${JSON.stringify(path.join(source, 'plugin-management.ts'))}
    import { readGromaConfig } from ${JSON.stringify(path.join(source, 'config.ts'))}
    import { workSourceSession } from ${JSON.stringify(path.join(source, 'work-sources.ts'))}
    const root = ${JSON.stringify(root)}
    const calls = () => readFile(root + '/calls', 'utf8').then(text => text.trim().split('\\n'), () => [])
    const result = {}
    ${script}
    console.log(JSON.stringify(result))
  `)
  const child = Bun.spawn([process.execPath, file], {
    cwd: root, stdout: 'pipe', stderr: 'pipe', env: { ...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH}` },
  })
  const [code, stdout, stderr] = await Promise.all([child.exited, new Response(child.stdout).text(), new Response(child.stderr).text()])
  expect(code, stderr).toBe(0)
  return JSON.parse(stdout)
}

async function project(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'groma-work-selection-'))
  await cp(path.resolve(import.meta.dir, '../test/fixtures/flows'), root, { recursive: true })
  await writeGromaConfig(root, { scanners: [], workSources: [] })
  return root
}

test.skipIf(process.platform === 'win32').concurrent('the Backlog.md CLI runs only while config.json lists Backlog.md, added by id with its installed version', async () => {
  const root = await project()
  try {
    const result = await withFakeBacklog(root, '1.53.0', `
      const session = await workSourceSession(root)
      result.unlisted = (await session.read()).items.length
      result.callsBeforeAdding = await calls()
      await addPlugin(root, 'backlog')
      result.workSources = (await readGromaConfig(root)).workSources
      await session.reconfigure()
      result.listed = (await session.read()).items.map(item => item.id)
      await removePlugin(root, 'backlog')
      await session.reconfigure()
      result.removed = (await session.read()).items.length
    `)
    expect(result).toEqual({
      unlisted: 0, callsBeforeAdding: [], workSources: [{ id: 'backlog', version: '1.53.0' }], listed: ['TASK-1'], removed: 0,
    })
  } finally { await rm(root, { recursive: true, force: true }) }
})

test.skipIf(process.platform === 'win32').concurrent('a Backlog.md CLI older than the version config.json lists counts as missing', async () => {
  const root = await project()
  try {
    await writeGromaConfig(root, { scanners: [], workSources: [{ id: 'backlog', version: '1.53.0' }] })
    const result = await withFakeBacklog(root, '1.2.0', `
      result.older = (await pluginPresence(root)).map(({ id, present }) => ({ id, present }))
      await writeFile(root + '/version', '1.53.0')
      result.current = (await pluginPresence(root)).map(({ id, present }) => ({ id, present }))
    `)
    expect(result).toEqual({ older: [{ id: 'backlog', present: false }], current: [{ id: 'backlog', present: true }] })
  } finally { await rm(root, { recursive: true, force: true }) }
})

/** config.json as a person could write it by hand; the writer refuses what the parser refuses. */
async function handWritten(root: string, config: unknown): Promise<void> {
  await writeFile(path.join(root, 'groma/config.json'), JSON.stringify(config))
}

test.concurrent('a config.json with a second work-source entry is refused when read and when written', async () => {
  const root = await project()
  const workSources = [{ id: 'backlog', version: '1.0.0' }, { id: 'other', version: '1.0.0' }]
  try {
    await expect(writeGromaConfig(root, { scanners: [], workSources })).rejects.toThrow('at most one work source')
    await handWritten(root, { scanners: [], workSources })
    await expect(readGromaConfig(root)).rejects.toThrow('at most one work source')
  } finally { await rm(root, { recursive: true, force: true }) }
})

test.concurrent('a plugin id shared by a scanner and a work source is refused when read and when written', async () => {
  const root = await project()
  const config = {
    scanners: [{ id: 'backlog', source: './scanner', include: ['**/*.fixture'] }],
    workSources: [{ id: 'backlog', version: '1.0.0' }],
  }
  try {
    await expect(writeGromaConfig(root, config)).rejects.toThrow('more than once')
    await handWritten(root, config)
    await expect(readGromaConfig(root)).rejects.toThrow('more than once')
  } finally { await rm(root, { recursive: true, force: true }) }
})

/** Runs the interactive wizard with every prompt answered. The `backlog` CLI exists and Backlog.md is not initialized unless overridden. */
async function runWizard(root: string, overrides: Partial<InitCommandDependencies>, useBacklog = false) {
  const errors: string[] = []
  const ui: InitCommandUi = {
    cancel() {}, intro() {}, note() {}, outro() {}, error: message => { errors.push(message) },
    confirmInit: async () => true, confirmOpenWeb: async () => false, confirmScan: async () => false, confirmUseBacklog: async () => useBacklog,
    directory: async () => 'groma', install: async (_message, operation) => operation(),
    projectName: async current => current, selectScanners: async () => [],
  }
  const outcome = await runInitCommand({ repositoryRoot: root, interactive: true, opensViewer: true }, { openWeb: async () => {} }, {
    ui, gitInitialized: async () => true, setupScanners: async () => true,
    backlogAvailable: () => true, backlogInitialized: async () => false, ...overrides,
  })
  return { errors, outcome }
}

test.concurrent('groma init reports a failed Backlog initialization when config.json already lists Backlog.md', async () => {
  const root = await project()
  try {
    await writeGromaConfig(root, { scanners: [], workSources: [{ id: 'backlog', version: '1.0.0' }] })
    expect((await runWizard(root, { initializeBacklog: async () => false })).errors).toHaveLength(1)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test.concurrent('choosing Backlog.md during groma init adds it, then initializes it', async () => {
  const root = await project()
  const steps: string[] = []
  try {
    const { errors } = await runWizard(root, {
      addBacklog: async () => {
        await writeGromaConfig(root, { scanners: [], workSources: [{ id: 'backlog', version: '1.0.0' }] })
        steps.push('add')
      },
      initializeBacklog: async () => { steps.push('initialize'); return true },
    }, true)
    expect(steps).toEqual(['add', 'initialize'])
    expect(errors).toEqual([])
  } finally { await rm(root, { recursive: true, force: true }) }
})

test.concurrent('groma init reports a Backlog.md that cannot be added and continues without initializing it', async () => {
  const root = await project()
  let initialized = 0
  try {
    const { errors, outcome } = await runWizard(root, {
      addBacklog: async () => { throw new Error('Could not run bun add --global backlog.md@latest.') },
      initializeBacklog: async () => { initialized++; return true },
    }, true)
    expect(outcome).toBe('completed')
    expect(errors).toHaveLength(1)
    expect(initialized).toBe(0)
  } finally { await rm(root, { recursive: true, force: true }) }
})
