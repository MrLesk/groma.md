import { expect, test } from 'bun:test'
import { spawn } from 'node:child_process'
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import { createInterface } from 'node:readline'
import { packageCli } from '../scripts/package-cli.ts'

const { platformPackageName } = createRequire(import.meta.url)('../scripts/npm/install.cjs') as {
  platformPackageName: (platform?: string, arch?: string, appleSilicon?: boolean) => string | undefined
}
const standalone = process.env.GROMA_TEST_CLI

function startCommand(file: string, args: string[], binDirectory: string) {
  const windows = process.platform === 'win32'
  const environment = Object.fromEntries(Object.entries(process.env).filter(([key]) => key.toUpperCase() !== 'PATH'))
  const powershell = windows && file.endsWith('.ps1')
  const command = windows
    ? (powershell ? path.join(path.dirname(process.env.ComSpec!), 'WindowsPowerShell/v1.0/powershell.exe') : process.env.ComSpec!)
    : file
  const arguments_ = powershell
    ? ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', file, ...args]
    : windows ? ['/d', '/s', '/c', `""${file}" ${args.map(value => `"${value}"`).join(' ')}"`] : args
  const child = spawn(command, arguments_, {
    env: { ...environment, PATH: binDirectory }, detached: !windows,
    windowsVerbatimArguments: windows && !powershell, stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = '', error = ''
  child.stdout!.setEncoding('utf8').on('data', chunk => { output += chunk })
  child.stderr!.setEncoding('utf8').on('data', chunk => { error += chunk })
  const exited = new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolve, reject) => {
    child.once('exit', (code, signal) => resolve({ code, signal }))
    child.once('error', reject)
  })
  return { child, exited, output: () => output, error: () => error }
}

async function npm(args: string[], root: string, cwd = root) {
  const child = Bun.spawn(['npm', ...args, '--offline', '--no-audit', '--no-fund', `--cache=${path.join(root, 'cache')}`], {
    cwd, stdout: 'pipe', stderr: 'pipe',
  })
  const [code, output, error] = await Promise.all([child.exited, new Response(child.stdout).text(), new Response(child.stderr).text()])
  expect(code, `${output}\n${error}`).toBe(0)
  return output
}

async function packedCli(root: string, binary: string) {
  const staged = path.join(root, 'package')
  await packageCli(staged, '0.0.0-test')
  const filename = path.join(staged, 'package.json')
  const manifest = JSON.parse(await readFile(filename, 'utf8'))
  expect(manifest.engines).toBeUndefined()
  const host = platformPackageName()!
  const runtime = path.join(staged, 'node_modules', host)
  await mkdir(runtime, { recursive: true })
  await writeFile(path.join(runtime, 'package.json'), JSON.stringify({ name: host, version: manifest.version }))
  await copyFile(binary, path.join(runtime, process.platform === 'win32' ? 'groma.exe' : 'groma'))
  // Bundle only the test host's native fixture so real npm installation needs no registry or shared cache.
  await writeFile(filename, JSON.stringify({ ...manifest, bundledDependencies: [host] }))
  const packed = JSON.parse(await npm(['pack', '--json', `--pack-destination=${root}`], root, staged)) as { filename: string }[]
  return path.join(root, packed[0]!.filename)
}

async function installCli(root: string, tarball: string, global: boolean) {
  const prefix = path.join(root, global ? 'global prefix' : 'local project')
  await mkdir(prefix)
  if (!global) await writeFile(path.join(prefix, 'package.json'), '{}')
  await npm(['install', ...(global ? ['--global'] : []), '--prefix', prefix, tarball], root)
  const binDirectory = global
    ? (process.platform === 'win32' ? prefix : path.join(prefix, 'bin'))
    : path.join(prefix, 'node_modules', '.bin')
  return { binDirectory, command: path.join(binDirectory, process.platform === 'win32' ? 'groma.cmd' : 'groma') }
}

async function verifyCleanup(command: string, binDirectory: string, root: string) {
  if (process.platform === 'win32') return
  for (const [signal, group] of [['SIGTERM', false], ['SIGTERM', true], ['SIGINT', true]] as const) {
    const resultFile = path.join(root, `${signal}-${group}.json`)
    const run = startCommand(command, ['serve', resultFile], binDirectory)
    const lines = createInterface({ input: run.child.stdout! })
    try {
      const ready = await Promise.race([
        lines[Symbol.asyncIterator]().next(),
        run.exited.then(() => { throw new Error(`Native command exited before readiness: ${run.error()}`) }),
      ])
      expect(JSON.parse(ready.value!).pid).toBe(run.child.pid)
      process.kill(group ? -run.child.pid! : run.child.pid!, signal)
      expect(await run.exited).toEqual({ code: 23, signal: null })
      expect(JSON.parse(await readFile(resultFile, 'utf8'))).toEqual({ received: 1 })
    } finally {
      if (run.child.exitCode === null && run.child.signalCode === null) run.child.kill('SIGKILL')
      await run.exited
      lines.close()
    }
  }
}

test.concurrent('npm installation selects each supported platform and rejects unsupported architectures', () => {
  for (const [platform, arch, name] of [
    ['linux', 'x64', 'groma.md-linux-x64'], ['linux', 'arm64', 'groma.md-linux-arm64'],
    ['win32', 'x64', 'groma.md-windows-x64'], ['win32', 'arm64', 'groma.md-windows-arm64'],
    ['darwin', 'arm64', 'groma.md-darwin-arm64'],
  ]) expect(platformPackageName(platform, arch, false)).toBe(name)
  expect(platformPackageName('darwin', 'x64', true)).toBe('groma.md-darwin-arm64')
  expect(platformPackageName('darwin', 'x64', false)).toBeUndefined()
  expect(platformPackageName('linux', 'ia32', false)).toBeUndefined()
})

test.concurrent('npm local and global commands run natively without Node or Bun and preserve process lifetime', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'groma-npm-native-'))
  try {
    const binary = path.join(root, 'fixture.exe')
    const build = await Bun.build({ entrypoints: [path.resolve('test/fixtures/npm-launcher/native.cjs')], compile: { outfile: binary } })
    expect(build.success, build.logs.map(String).join('\n')).toBe(true)
    const tarball = await packedCli(root, binary)
    for (const global of [false, true]) {
      const { command, binDirectory } = await installCli(root, tarball, global)
      const commands = process.platform === 'win32' ? [command, command.replace(/\.cmd$/, '.ps1')] : [command]
      for (const entry of commands) {
        const run = startCommand(entry, ['args', 'two words', '--flag=value'], binDirectory)
        expect(await run.exited, run.error()).toEqual({ code: 0, signal: null })
        expect(JSON.parse(run.output())).toEqual(['two words', '--flag=value'])
        const failure = startCommand(entry, ['exit', '7'], binDirectory)
        expect(await failure.exited, failure.error()).toEqual({ code: 7, signal: null })
      }
      if (global) await verifyCleanup(command, binDirectory, root)
    }
  } finally { await rm(root, { recursive: true, force: true }) }
}, 60000)

test.skipIf(standalone === undefined).concurrent('packaged Groma runs with no external JavaScript runtime', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'groma-npm-standalone-'))
  try {
    const tarball = await packedCli(root, path.resolve(standalone!))
    const { command, binDirectory } = await installCli(root, tarball, true)
    const run = startCommand(command, ['--version'], binDirectory)
    expect(await run.exited, run.error()).toEqual({ code: 0, signal: null })
    const manifest = await Bun.file(path.resolve('package.json')).json()
    expect(run.output().trim()).toBe(manifest.version)
  } finally { await rm(root, { recursive: true, force: true }) }
}, 60000)
