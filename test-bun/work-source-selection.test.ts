import { expect, test } from 'bun:test'
import { chmod, cp, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { runInitCommand, type InitCommandDependencies, type InitCommandUi } from '../src/init-command.ts'
import { readGromaConfig, writeGromaConfig } from '../src/config.ts'

const source = path.resolve(import.meta.dir, '../src')

/**
 * Runs a script in a child process whose PATH starts with a fake `backlog` CLI, so the bundled Backlog.md work source
 * finds it. The CLI prints the version in `<root>/version`, logs every call to `<root>/calls` and lists one task.
 */
async function withFakeBacklog(root: string, version: string, script: string, available = true): Promise<Record<string, unknown>> {
  const bin = path.join(root, 'bin')
  await mkdir(bin)
  await writeFile(path.join(root, 'version'), version)
  const executable = path.join(bin, process.platform === 'win32' ? 'backlog.ts' : 'backlog')
  if (available) await writeFile(executable, `#!${process.execPath}
    import { appendFileSync, readFileSync } from 'node:fs'
    const args = process.argv.slice(2)
    appendFileSync(${JSON.stringify(path.join(root, 'calls'))}, args.join(' ') + '\\n')
    if (args[0] === '--version') console.log(readFileSync(${JSON.stringify(path.join(root, 'version'))}, 'utf8'))
    else if (args[0] === 'config') console.log('To Do')
    else console.log(JSON.stringify({ tasks: [{ id: 'TASK-1', title: 'One', status: 'To Do', assignees: [], references: [], modifiedFiles: [], acceptanceCriteriaCount: 0, acceptanceCriteriaCompleted: 0, updatedAt: null }] }))
  `)
  if (available) {
    if (process.platform === 'win32') await writeFile(path.join(bin, 'backlog.cmd'), `@"${process.execPath}" "${executable}" %*\r\n`)
    else await chmod(executable, 0o755)
  }
  const file = path.join(root, 'probe.ts')
  await writeFile(file, `
    import { readFile, writeFile } from 'node:fs/promises'
    import { addPlugin, pluginPresence, removePlugin } from ${JSON.stringify(path.join(source, 'plugins/management.ts'))}
    import { readGromaConfig } from ${JSON.stringify(path.join(source, 'config.ts'))}
    import { workSourceSession } from ${JSON.stringify(path.join(source, 'work/sources.ts'))}
    const root = ${JSON.stringify(root)}
    const calls = () => readFile(root + '/calls', 'utf8').then(text => text.trim().split('\\n'), () => [])
    const result = {}
    ${script}
    console.log(JSON.stringify(result))
  `)
  const executablePath = [bin]
  // The Windows adapter uses cmd.exe to launch the fake npm-style command shim.
  if (process.platform === 'win32') executablePath.push(`${process.env.SystemRoot}\\System32`)
  const child = Bun.spawn([process.execPath, file], {
    cwd: root, stdout: 'pipe', stderr: 'pipe', env: { ...process.env, PATH: executablePath.join(path.delimiter) },
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

test.concurrent('the Backlog.md CLI runs only while config.json lists Backlog.md, added by id with its installed version', async () => {
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

test.concurrent('a Backlog.md CLI older than the version config.json lists counts as missing', async () => {
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

/**
 * Runs the interactive wizard with every prompt answered; `installBacklog` answers the Backlog.md install question.
 * The `backlog` CLI exists and Backlog.md is not initialized unless overridden.
 */
async function runWizard(root: string, overrides: Partial<InitCommandDependencies>, installBacklog = false) {
  const errors: string[] = []
  const asked: string[] = []
  const ui: InitCommandUi = {
    cancel() {}, intro() {}, note() {}, outro() {}, error: message => { errors.push(message) },
    confirmInit: async () => true, confirmOpenWeb: async () => false, confirmScan: async () => false,
    confirmBacklogInstall: async () => { asked.push('install Backlog.md'); return installBacklog },
    directory: async () => 'groma', install: async (_message, operation) => operation(),
    projectName: async current => current, selectScanners: async () => [],
  }
  const outcome = await runInitCommand({ repositoryRoot: root, interactive: true, opensViewer: true }, { openWeb: async () => {} }, {
    ui, gitInitialized: async () => true, setupScanners: async () => true,
    backlogAvailable: () => true, backlogInitialized: async () => false, ...overrides,
  })
  return { asked, errors, outcome }
}

test.concurrent('groma init reports a failed Backlog initialization when config.json already lists Backlog.md', async () => {
  const root = await project()
  try {
    await writeGromaConfig(root, { scanners: [], workSources: [{ id: 'backlog', version: '1.0.0' }] })
    expect((await runWizard(root, { initializeBacklog: async () => false })).errors).toHaveLength(1)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test.concurrent('with the Backlog.md CLI installed, groma init adds Backlog.md without asking, then initializes it', async () => {
  const root = await project()
  const steps: string[] = []
  try {
    const { asked, errors } = await runWizard(root, {
      addBacklog: async () => {
        await writeGromaConfig(root, { scanners: [], workSources: [{ id: 'backlog', version: '1.0.0' }] })
        steps.push('add')
      },
      initializeBacklog: async () => { steps.push('initialize'); return true },
    })
    expect(asked).toEqual([])
    expect(steps).toEqual(['add', 'initialize'])
    expect(errors).toEqual([])
  } finally { await rm(root, { recursive: true, force: true }) }
})

test.concurrent('without the Backlog.md CLI, groma init offers to install it and adds nothing when declined', async () => {
  const root = await project()
  let added = 0
  try {
    const { asked } = await runWizard(root, { backlogAvailable: () => false, addBacklog: async () => { added++ } }, false)
    expect(asked).toEqual(['install Backlog.md'])
    expect(added).toBe(0)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test.concurrent('groma init reports a Backlog.md that cannot be added and continues without initializing it', async () => {
  const root = await project()
  let initialized = 0
  try {
    const { errors, outcome } = await runWizard(root, {
      addBacklog: async () => { throw new Error('Could not run bun add --global backlog.md@latest.') },
      initializeBacklog: async () => { initialized++; return true },
    })
    expect(outcome).toBe('completed')
    expect(errors).toHaveLength(1)
    expect(initialized).toBe(0)
  } finally { await rm(root, { recursive: true, force: true }) }
})


test.concurrent('the configuration upgrade preserves scanner choices and registers the installed Backlog CLI once', async () => {
  const root = await project()
  const legacy = {
    scanners: [{ id: 'typescript', source: '@groma/scanner-typescript@0.2.2', include: ['**/*.ts'],
      exclude: ['generated/**'], settings: { workspace: 'application' } }],
    exclude: ['vendor/**'], useGitignore: false,
  }
  try {
    await rm(path.join(root, 'groma/config.json'))
    await writeFile(path.join(root, 'groma/scanners.json'), JSON.stringify(legacy))
    const result = await withFakeBacklog(root, '1.53.0', `
      result.config = await readGromaConfig(root)
      result.saved = JSON.parse(await readFile(root + '/groma/config.json', 'utf8'))
      result.legacyExists = await Bun.file(root + '/groma/scanners.json').exists()
      await removePlugin(root, 'backlog')
      result.afterRemoval = (await readGromaConfig(root)).workSources
      result.calls = await calls()
    `)
    const converted = { ...legacy, workSources: [{ id: 'backlog', version: '1.53.0' }] }
    expect(result).toEqual({ config: converted, saved: converted, legacyExists: false, afterRemoval: [], calls: ['--version'] })
  } finally { await rm(root, { recursive: true, force: true }) }
})

test.concurrent('an old .groma configuration converts without installing a missing Backlog CLI', async () => {
  const root = await project()
  try {
    await rename(path.join(root, 'groma'), path.join(root, '.groma'))
    await rm(path.join(root, '.groma/config.json'))
    await writeFile(path.join(root, '.groma/scanners.json'), JSON.stringify({ scanners: [] }))
    const result = await withFakeBacklog(root, '1.53.0', `
      result.config = await readGromaConfig(root)
      result.saved = JSON.parse(await readFile(root + '/.groma/config.json', 'utf8'))
      result.legacyExists = await Bun.file(root + '/.groma/scanners.json').exists()
      result.calls = await calls()
    `, false)
    const converted = { scanners: [], workSources: [] }
    expect(result).toEqual({ config: converted, saved: converted, legacyExists: false, calls: [] })
  } finally { await rm(root, { recursive: true, force: true }) }
})

test.concurrent('an explicit config.json is unchanged and never reads an old file or probes the Backlog CLI', async () => {
  const root = await project()
  try {
    await writeFile(path.join(root, 'groma/scanners.json'), '{')
    const before = await readFile(path.join(root, 'groma/config.json'), 'utf8')
    const result = await withFakeBacklog(root, '1.53.0', `
      result.config = await readGromaConfig(root)
      result.calls = await calls()
    `)
    expect(result).toEqual({ config: { scanners: [], workSources: [] }, calls: [] })
    expect(await readFile(path.join(root, 'groma/config.json'), 'utf8')).toBe(before)
    expect(await readFile(path.join(root, 'groma/scanners.json'), 'utf8')).toBe('{')
  } finally { await rm(root, { recursive: true, force: true }) }
})


test.concurrent('the upgrade preserves a legacy scanner that already owns the backlog plugin ID', async () => {
  const root = await project()
  const legacy = { scanners: [{ id: 'backlog', source: '@example/scanner-backlog@1.0.0', include: ['**/*.ts'] }] }
  try {
    await rm(path.join(root, 'groma/config.json'))
    await writeFile(path.join(root, 'groma/scanners.json'), JSON.stringify(legacy))
    const result = await withFakeBacklog(root, '1.53.0', `
      result.config = await readGromaConfig(root)
      result.saved = JSON.parse(await readFile(root + '/groma/config.json', 'utf8'))
      result.legacyExists = await Bun.file(root + '/groma/scanners.json').exists()
      result.calls = await calls()
    `)
    const converted = { ...legacy, workSources: [] }
    expect(result).toEqual({ config: converted, saved: converted, legacyExists: false, calls: [] })
  } finally { await rm(root, { recursive: true, force: true }) }
})
