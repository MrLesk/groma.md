import assert from 'node:assert/strict'
import { cp, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { loadAnnotatedArchitecture } from '../src/core.ts'

const binary = path.resolve(process.argv[2] ?? '')
if (!process.argv[2]) throw new Error('Usage: bun scripts/qualify-compiled-scanners.ts <binary> [scanner ids...]')
const repository = path.resolve(import.meta.dir, '..')
// Use the same fresh-checkout examples as the published scanner package checks.
const examples: Record<string, string> = {
  typescript: 'operation-wiring', javascript: 'javascript-source', python: 'python-project',
  c: 'c-source', cpp: 'cpp-source', ada: 'ada-source', mql5: 'mql5-source', mojo: 'mojo-source',
  dart: 'dart-source', java: 'java-maven', go: 'go-module', rust: 'rust-semantic',
  csharp: 'csharp-operations', angular: 'angular-output', react: 'react-callback', vue: 'vue-output',
  php: 'php-source', scala: 'scala-sbt-single', kotlin: 'kotlin-source', swift: 'swift-source',
  cobol: 'cobol-source', nasm: 'nasm-source',
}

async function prepareFiles(directory: string, relative = ''): Promise<string[]> {
  const files: string[] = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await prepareFiles(file, `${relative}${entry.name}/`))
    else {
      const name = entry.name.replace(/\.fixture$/, '')
      if (name !== entry.name) await rename(file, path.join(directory, name))
      files.push(`${relative}${name}`)
    }
  }
  return files
}

async function capture(args: string[], root: string) {
  const child = Bun.spawn(args, { cwd: root, stdout: 'pipe', stderr: 'pipe' })
  const timer = setTimeout(() => child.kill('SIGKILL'), 180000)
  try {
    const [code, stdout, stderr] = await Promise.all([
      child.exited, new Response(child.stdout).text(), new Response(child.stderr).text(),
    ])
    return { code, stdout, stderr }
  } finally {
    clearTimeout(timer)
  }
}

async function run(args: string[], root: string): Promise<void> {
  const result = await capture(args, root)
  assert.equal(result.code, 0, `${args.slice(1).join(' ')}: ${result.stdout}\n${result.stderr}`)
}

const failures: Error[] = []
for (const id of process.argv.slice(3).length ? process.argv.slice(3) : Object.keys(examples)) {
  const fixture = examples[id]
  assert.ok(fixture, `Unknown scanner ${id}`)
  const temporary = await mkdtemp(path.join(os.tmpdir(), `groma-native-scanner-${id}-`))
  const started = performance.now()
  try {
    const root = path.join(temporary, 'project')
    await cp(path.join(repository, 'test/fixtures', fixture), root, { recursive: true })
    const files = new Set(await prepareFiles(root))
    await cp(path.join(repository, 'test/fixtures/flows/groma'), path.join(root, 'groma'), { recursive: true })
    await writeFile(path.join(root, 'groma/config.json'), JSON.stringify({
      scanners: [], workSources: [], automaticUpdates: false,
    }))
    await run(['git', 'init', '--quiet'], root)
    const manifest = JSON.parse(await readFile(path.join(repository, 'plugins/scanners', id, 'package.json'), 'utf8'))
    const specifier = `${manifest.name}@${manifest.version}`
    await run([binary, 'plugin', 'add', specifier], root)
    await run([binary, 'scan'], root)
    const world = await loadAnnotatedArchitecture(root)
    assert.ok(world.elements.some(element => element.code?.some(code => files.has(code.file))),
      `${id}: no architecture evidence points to any source fixture file`)
    // Some package fixtures intentionally contain duplicate functions. Compare
    // findings with the same compiler running the source CLI under its JIT.
    const control = await capture([process.execPath, path.join(repository, 'src/cli.ts'), 'lint'], root)
    assert.ok(control.code === 0 || control.code === 1, control.stderr)
    assert.deepEqual(await capture([binary, 'lint'], root), control, `${id}: native lint differs from JIT control`)
    const output = path.join(temporary, 'export')
    await run([binary, 'export', output], root)
    assert.deepEqual((await readFile(path.join(output, 'cover-light.png'))).subarray(0, 8),
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    console.log(JSON.stringify({ scanner: specifier, sourceEvidence: true, export: true,
      milliseconds: Math.round(performance.now() - started) }))
  } catch (error) {
    failures.push(new Error(`${id}: ${String(error)}`, { cause: error }))
    console.error(failures.at(-1))
  } finally {
    await rm(temporary, { recursive: true, force: true })
  }
}

if (failures.length) throw new AggregateError(failures, 'Official scanner qualification failed')
