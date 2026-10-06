import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execute = promisify(execFile)
const root = fileURLToPath(new URL('./', import.meta.url))
const version = '2.5.1'
const archiveHash = '2c289eb94e12fc2e0eb388c2c6dd9c83b0140751d41795a272348f8d9fbeb16a'
const archiveUrl = `https://github.com/eclipse-che4z/che-che4z-lsp-for-cobol/releases/download/${version}/cobol-language-support-${version}.vsix`

function tool(name: string): string {
  const executable = process.platform === 'win32' ? `${name}.exe` : name
  return process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, 'bin', executable) : executable
}

/** Build input only. Consumers receive the engine and runtime; scans never download tools. */
async function engineArchive(): Promise<string> {
  const archive = path.join(root, `dist/cobol-language-support-${version}.vsix`)
  await mkdir(path.dirname(archive), { recursive: true })
  if (!existsSync(archive)) {
    const response = await fetch(archiveUrl)
    if (!response.ok) throw new Error(`Cannot download ${archiveUrl}: ${response.status}`)
    await writeFile(archive, new Uint8Array(await response.arrayBuffer()))
  }
  const hash = createHash('sha256').update(await readFile(archive)).digest('hex')
  if (hash !== archiveHash) throw new Error(`Unexpected COBOL engine archive checksum: ${archive}`)
  return archive
}

async function compileWorker(destination: string, engine: string, temporary: string) {
  const sources = path.join(root, 'java/md/groma/cobol')
  const classes = path.join(temporary, 'classes')
  await mkdir(classes)
  await execute(tool('javac'), ['--release', '21', '-encoding', 'UTF-8', '-cp', engine, '-d', classes,
    ...(await readdir(sources)).filter(file => file.endsWith('.java')).sort().map(file => path.join(sources, file))])
  await execute(tool('jar'), ['--create', '--file', path.join(destination, 'worker.jar'), '--date=2026-01-01T00:00:00Z', '-C', classes, '.'])
}

export async function buildPackage(destination: string): Promise<void> {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'groma-cobol-build-'))
  try {
    await execute(tool('jar'), ['xf', await engineArchive(), 'extension/server/jar/server.jar', 'extension/LICENSE.txt'], { cwd: temporary })
    const dist = path.join(destination, 'dist')
    await mkdir(dist, { recursive: true })
    const engine = path.join(temporary, 'extension/server/jar/server.jar')
    await compileWorker(dist, engine, temporary)
    await cp(engine, path.join(dist, 'engine.jar'))
    await cp(path.join(temporary, 'extension/LICENSE.txt'), path.join(destination, 'ECLIPSE-LICENSE.txt'))
    const runtime = path.join(dist, `${process.platform}-${process.arch}`, 'runtime')
    await mkdir(path.dirname(runtime), { recursive: true })
    await execute(tool('jlink'), ['--add-modules', 'java.base,java.logging,java.management,java.naming,java.xml,jdk.unsupported',
      '--strip-debug', '--no-header-files', '--no-man-pages', '--output', runtime])
    const built = await Bun.build({ entrypoints: [path.join(root, 'src/index.ts')], outdir: path.join(destination, 'src'),
      target: 'bun', format: 'esm', naming: 'index.js' })
    if (!built.success) throw new Error(built.logs.join('\n'))
    const { dependencies: _, ...manifest } = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'))
    await writeFile(path.join(destination, 'package.json'), `${JSON.stringify({ ...manifest,
      os: [process.platform], cpu: [process.arch],
      groma: { scanner: { ...manifest.groma.scanner, entry: './src/index.js' } },
    }, null, 2)}\n`)
    await cp(path.join(root, '../../../LICENSE'), path.join(destination, 'LICENSE'))
    await cp(path.join(root, 'THIRD-PARTY-NOTICES.txt'), path.join(destination, 'THIRD-PARTY-NOTICES.txt'))
  } finally { await rm(temporary, { recursive: true, force: true }) }
}

if (import.meta.main) {
  const output = path.resolve(process.argv[2] ?? path.join(root, 'dist/package'))
  await rm(output, { recursive: true, force: true })
  await buildPackage(output)
  await cp(path.join(output, 'dist'), path.join(root, 'dist'), { recursive: true })
  console.log(output)
}
