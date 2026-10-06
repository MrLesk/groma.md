import { expect, test } from 'bun:test'
import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { loadAnnotatedArchitecture } from '../src/core.ts'
import { writeScannerConfig } from '../src/scanner/modules/config.ts'

const repository = path.resolve(import.meta.dir, '..')

async function run(command: string[], cwd: string, env = process.env): Promise<void> {
  const child = Bun.spawn(command, { cwd, env, stdout: 'pipe', stderr: 'pipe' })
  const [code, output, error] = await Promise.all([
    child.exited, new Response(child.stdout).text(), new Response(child.stderr).text(),
  ])
  expect(code, error || output).toBe(0)
}

test.concurrent('the standalone CLI resolves an installed dependency of a local scanner', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'groma-compiled-scanner-'))
  try {
    const root = path.join(temporary, 'project')
    const binary = path.join(temporary, process.platform === 'win32' ? 'groma.exe' : 'groma')
    await cp(path.join(repository, 'test/fixtures/flows'), root, { recursive: true })
    await run(['git', 'init', '--quiet'], root)
    const dependency = path.join(root, 'plugin/node_modules/scan-evidence')
    await mkdir(dependency, { recursive: true })
    await writeFile(path.join(dependency, 'package.json'), JSON.stringify({
      name: 'scan-evidence', version: '1.0.0', type: 'module', exports: './evidence.js',
    }))
    await writeFile(path.join(dependency, 'evidence.js'), `export default {
      schemaVersion: 1,
      scanner: { id: 'local', technology: 'fixture', engine: 'fixture', engineVersion: '1' },
      roots: [{ id: 'sample', kind: 'package', name: 'Sample', file: 'package.json' }],
      files: [{ file: 'probe.local', roots: ['sample'], symbols: [] }], diagnostics: [],
    }`)
    await writeFile(path.join(root, 'plugin/package.json'), JSON.stringify({
      name: 'local-scanner', version: '1.0.0', type: 'module',
      groma: { scanner: { id: 'local', entry: './scanner.js', include: ['*.local'] } },
    }))
    await writeFile(path.join(root, 'plugin/scanner.js'),
      "import evidence from 'scan-evidence'; export default { id: 'local', async scan() { return evidence } }")
    await writeFile(path.join(root, 'package.json'), '{ "name": "sample" }')
    await writeFile(path.join(root, 'probe.local'), 'source for the local scanner')
    await writeScannerConfig(root, { scanners: [{ id: 'local', source: './plugin', include: ['*.local'] }] })
    await run([process.execPath, 'scripts/build.ts'], repository, {
      ...process.env, GROMA_BUILD_OUTFILE: binary,
    })
    await run([binary, 'scan'], root)
    const world = await loadAnnotatedArchitecture(root)
    expect(world.elements.some(element => element.code?.some(code => code.file === 'probe.local'))).toBe(true)
  } finally {
    await rm(temporary, { recursive: true, force: true })
  }
}, 60000)
