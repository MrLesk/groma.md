import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const binary = path.resolve(process.argv[2] ?? 'dist/groma')
const temporary = await mkdtemp(path.join(os.tmpdir(), 'groma-native-web-'))
const root = path.join(temporary, 'project')

/** A consumer gate, outside the domain tests: wait for a real compiled server or watch result. */
async function waitFor(read: () => Promise<boolean>, label: string): Promise<void> {
  const deadline = performance.now() + 20000
  while (performance.now() < deadline) {
    if (await read()) return
    await Bun.sleep(100)
  }
  throw new Error(`Timed out waiting for ${label}`)
}

async function prepareProject(): Promise<void> {
  await cp(path.resolve(import.meta.dir, '../test/fixtures/flows'), root, { recursive: true })
  const git = Bun.spawnSync(['git', 'init', '--quiet'], { cwd: root })
  if (git.exitCode !== 0) throw new Error(git.stderr.toString())
  const dependency = path.join(root, 'plugin/node_modules/scan-evidence')
  await mkdir(dependency, { recursive: true })
  await writeFile(path.join(dependency, 'package.json'), JSON.stringify({
    name: 'scan-evidence', version: '1.0.0', type: 'module', exports: './evidence.js',
  }))
  await writeFile(path.join(dependency, 'evidence.js'), `
import { readdir } from 'node:fs/promises'
export default async root => ({
  schemaVersion: 1,
  scanner: { id: 'local', technology: 'fixture', engine: 'fixture', engineVersion: '1' },
  roots: [{ id: 'sample', kind: 'package', name: 'Sample', file: 'package.json' }],
  files: (await readdir(root)).filter(file => file.endsWith('.local'))
    .map(file => ({ file, roots: ['sample'], symbols: [] })), diagnostics: [],
})`)
  await writeFile(path.join(root, 'plugin/package.json'), JSON.stringify({
    name: 'local-scanner', version: '1.0.0', type: 'module',
    groma: { scanner: { id: 'local', entry: './scanner.js', include: ['*.local'] } },
  }))
  await writeFile(path.join(root, 'plugin/scanner.js'),
    "import evidence from 'scan-evidence'; export default { id: 'local', scan: evidence }")
  await writeFile(path.join(root, 'package.json'), '{ "name": "sample" }')
  await writeFile(path.join(root, 'probe.local'), 'initial source')
  await writeFile(path.join(root, 'groma/config.json'), JSON.stringify({
    scanners: [{ id: 'local', source: './plugin', include: ['*.local'] }],
    workSources: [], automaticUpdates: false,
  }))
}

/** Windows has forced process termination rather than POSIX SIGTERM delivery. Compare the host runtime. */
async function windowsTerminationExit(): Promise<number> {
  const control = Bun.spawn([process.execPath, '-e',
    'process.on("SIGTERM", () => process.exit(0)); console.log("ready"); setInterval(() => {}, 1000)'],
  { stdout: 'pipe', stderr: 'pipe' })
  const reader = control.stdout.getReader()
  try {
    await reader.read()
    control.kill('SIGTERM')
    return await control.exited
  } finally {
    reader.releaseLock()
    control.kill('SIGKILL')
    await control.exited
  }
}

async function qualify(): Promise<void> {
  const expectedExit = process.platform === 'win32' ? await windowsTerminationExit() : 0
  const child = Bun.spawn([binary, 'web', '--port', '0'], { cwd: root, stdout: 'pipe', stderr: 'pipe' })
  let output = ''
  const stdout = (async () => {
    for await (const chunk of child.stdout) output += new TextDecoder().decode(chunk)
  })()
  const stderr = new Response(child.stderr).text()
  try {
    await waitFor(async () => /http:\/\/localhost:\d+/.test(output), 'listening URL')
    const url = output.match(/http:\/\/localhost:\d+/)![0]
    await waitFor(async () => (await fetch(`${url}/render.js`)).headers.get('content-type')?.includes('javascript') === true,
      'embedded renderer')
    const html = await (await fetch(url)).text()
    if (!html.includes('id="map"') || !html.includes('DejaVu')) throw new Error('Embedded map or fonts missing')
    if (process.env.GROMA_QUALIFY_BROWSER === '1') {
      const browser = Bun.spawn(['bun', 'x', 'playwright@1.62.1', 'screenshot', '--timeout', '20000',
        '--wait-for-selector', '#map svg', '--viewport-size', '1440,900', url, `${binary}.png`],
      { stdout: 'pipe', stderr: 'pipe' })
      const [exit, output, error] = await Promise.all([
        browser.exited, new Response(browser.stdout).text(), new Response(browser.stderr).text(),
      ])
      if (exit !== 0) throw new Error(`Browser rendering failed: ${output}\n${error}`)
    }
    for (const theme of ['light', 'dark', 'blueprint']) {
      const response = await fetch(`${url}/cover-${theme}.png`)
      const bytes = Buffer.from(await response.arrayBuffer())
      if (response.status !== 200 || !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
        throw new Error(`Invalid ${theme} cover`)
      }
    }
    const world = async () => (await fetch(`${url}/world.json`)).text()
    if (!(await world()).includes('probe.local')) throw new Error('Initial scanner result missing')
    await writeFile(path.join(root, 'watched.local'), 'new watched source')
    await waitFor(async () => (await world()).includes('watched.local'), 'source watch refresh')
    child.kill('SIGTERM')
    const exit = await Promise.race([child.exited, Bun.sleep(10000).then(() => { throw new Error('Shutdown timed out') })])
    if (exit !== expectedExit) throw new Error(`Shutdown exited ${exit}; host runtime expects ${expectedExit}`)
    console.log(`Compiled web: assets, covers, scanner dependency, source watch and termination pass (exit ${exit})`)
  } catch (error) {
    child.kill('SIGKILL')
    await child.exited
    throw new Error(`${error instanceof Error ? error.message : error}\n${output}\n${await stderr}`)
  } finally {
    child.kill('SIGKILL')
    await child.exited
    await stdout
    await stderr
  }
}

try {
  await prepareProject()
  await qualify()
} finally {
  await rm(temporary, { recursive: true, force: true })
}
