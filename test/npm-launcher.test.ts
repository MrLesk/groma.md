import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import { createInterface } from 'node:readline'
import { test, type TestContext } from 'node:test'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const wrapper = fileURLToPath(new URL('../scripts/npm/cli.cjs', import.meta.url))
const worker = fileURLToPath(new URL('./fixtures/npm-launcher/native.cjs', import.meta.url))
const { platformPackageName } = require(wrapper)
const unix = process.platform !== 'win32'

async function startLauncher(t: TestContext, mode = 'handled', exitCode = 23, interruptDuringSpawn = false) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'groma-npm-launcher-'))
  const resultFile = path.join(root, 'closed.json')
  const platformPackage = path.join(root, 'node_modules', platformPackageName())
  await mkdir(platformPackage, { recursive: true })
  await writeFile(path.join(platformPackage, 'package.json'), '{}')
  await writeFile(path.join(platformPackage, process.platform === 'win32' ? 'groma.exe' : 'groma'), '')
  await cp(wrapper, path.join(root, 'cli.cjs'))
  // Exercise the release launcher with a real Node child on every test host.
  const driver = `
    const { spawn, spawnSync } = require('node:child_process')
    require('./cli.cjs').runWrapper({
      spawnBinary: (_binary, _args, options) => {
        const child = spawn(${JSON.stringify(mode === 'groma' ? 'bun' : process.execPath)},
          [${JSON.stringify(worker)}, ${JSON.stringify(mode)}, ${JSON.stringify(resultFile)}, ${JSON.stringify(String(exitCode))}], options)
        if (${interruptDuringSpawn}) {
          // Deliver the signal before spawn returns, independently of host scheduling.
          spawnSync(process.execPath, ['-e', 'process.kill(process.ppid, "SIGINT")'])
        }
        return child
      },
    })
  `
  const launcher = spawn(process.execPath, ['-e', driver], {
    cwd: root, detached: unix, stdio: ['ignore', 'pipe', 'pipe'],
  })
  let stderr = ''
  launcher.stderr.setEncoding('utf8').on('data', chunk => { stderr += chunk })
  const lines = createInterface({ input: launcher.stdout })
  const messages = lines[Symbol.asyncIterator]()
  const exited = new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolve, reject) => {
    launcher.once('exit', (code, signal) => resolve({ code, signal }))
    launcher.once('error', reject)
  })
  let nativePid: number | undefined
  t.after(async () => {
    if (nativePid !== undefined) {
      try { process.kill(nativePid, 'SIGKILL') }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error }
    }
    if (launcher.exitCode === null && launcher.signalCode === null) launcher.kill('SIGKILL')
    await exited
    lines.close()
    await rm(root, { recursive: true, force: true })
  })
  return {
    launcher,
    exited,
    async ready() {
      const line = await Promise.race([
        messages.next(),
        exited.then(result => { throw new Error(`Launcher exited before readiness: ${JSON.stringify(result)} ${stderr}`) }),
      ])
      assert.equal(line.done, false)
      nativePid = JSON.parse(line.value!).pid
      assert.equal(typeof nativePid, 'number')
      return nativePid!
    },
    async closedWith(signal?: string) {
      assert.deepEqual(await exited, { code: exitCode, signal: null })
      assert.deepEqual(JSON.parse(await readFile(resultFile, 'utf8')), signal === undefined ? { received: 1 } : { signal, received: 1 })
    },
  }
}

for (const signal of ['SIGTERM', 'SIGHUP', 'SIGQUIT'] as const) {
  test(`npm launcher forwards ${signal} and waits for native cleanup`, { concurrency: true, skip: !unix, timeout: 5000 }, async t => {
    const run = await startLauncher(t)
    await run.ready()
    run.launcher.kill(signal)
    await run.closedWith(signal)
  })
}

test('npm launcher waits for terminal Ctrl+C without sending a second interrupt', { concurrency: true, skip: !unix, timeout: 5000 }, async t => {
  const run = await startLauncher(t)
  await run.ready()
  // A terminal sends Ctrl+C to the foreground group, including launcher and native child.
  process.kill(-run.launcher.pid!, 'SIGINT')
  await run.closedWith('SIGINT')
})

test('npm launcher preserves native signal exit status', { concurrency: true, skip: !unix, timeout: 5000 }, async t => {
  const run = await startLauncher(t, 'unhandled')
  process.kill(await run.ready(), 'SIGKILL')
  assert.deepEqual(await run.exited, { code: 128 + os.constants.signals.SIGKILL, signal: null })
})

test('npm launcher preserves normal native exit codes on every platform', { concurrency: true, timeout: 5000 }, async t => {
  const run = await startLauncher(t, 'exit', 7)
  assert.deepEqual(await run.exited, { code: 7, signal: null })
})

test('npm launcher listens for terminal interrupts before starting the native process', { concurrency: true, skip: !unix, timeout: 5000 }, async t => {
  const run = await startLauncher(t, 'exit', 7, true)
  assert.deepEqual(await run.exited, { code: 7, signal: null })
})

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  test(`native CLI finishes cleanup after process-group ${signal}`, { concurrency: true, skip: !unix, timeout: 5000 }, async t => {
    const run = await startLauncher(t, 'groma')
    await run.ready()
    process.kill(-run.launcher.pid!, signal)
    await run.closedWith()
  })
}
