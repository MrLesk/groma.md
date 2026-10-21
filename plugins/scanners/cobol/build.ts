import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { runtimeCertificates } from '../../../src/certificate-trust.ts'
import { secureJavaTrustStore } from '../jvm-package.ts'

const execute = promisify(execFile)
const root = fileURLToPath(new URL('./', import.meta.url))
const version = '2.5.1'
const archiveHash = '2c289eb94e12fc2e0eb388c2c6dd9c83b0140751d41795a272348f8d9fbeb16a'
const archiveUrl = `https://github.com/eclipse-che4z/che-che4z-lsp-for-cobol/releases/download/${version}/cobol-language-support-${version}.vsix`
// The current upstream engine embeds vulnerable Logback 1.3.16. Replace its logging libraries completely.
const loggingLibraries = [
  ['ch/qos/logback/logback-core/1.6.5/logback-core-1.6.5.jar', '03dcbf053b40166849b8eb0a30cbde40c04a448820e9a7589c4b0a2ec3a9db63'],
  ['ch/qos/logback/logback-classic/1.6.5/logback-classic-1.6.5.jar', '2e8c73aadad525e854af1ac95793af3dc75ecedd53c010ea2389de44c08e729b'],
  ['org/slf4j/slf4j-api/2.0.20/slf4j-api-2.0.20.jar', '7e1446499b359675d8aabe6af2de86b85e72ae8a2a932c0b40d0e5ba57097439'],
] as const


function tool(name: string): string {
  const executable = process.platform === 'win32' ? `${name}.exe` : name
  return process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, 'bin', executable) : executable
}

/** Build input only. Consumers receive the engine and runtime; scans never download tools. */
async function engineArchive(): Promise<string> {
  const archive = path.join(root, `dist/cobol-language-support-${version}.vsix`)
  await mkdir(path.dirname(archive), { recursive: true })
  if (!existsSync(archive)) {
    const response = await fetch(archiveUrl, { tls: { ca: runtimeCertificates() }, decompress: false, headers: { 'Accept-Encoding': 'identity' } })
    if (!response.ok) throw new Error(`Cannot download ${archiveUrl}: ${response.status}`)
    await writeFile(archive, new Uint8Array(await response.arrayBuffer()))
  }
  const hash = createHash('sha256').update(await readFile(archive)).digest('hex')
  if (hash !== archiveHash) throw new Error(`Unexpected COBOL engine archive checksum: ${archive}`)
  return archive
}

async function patchEngine(engine: string, temporary: string, destination: string): Promise<string[]> {
  const classes = path.join(temporary, 'engine')
  await mkdir(classes)
  await execute(tool('jar'), ['xf', engine], { cwd: classes })
  for (const entry of ['ch/qos/logback', 'org/slf4j', 'META-INF/maven/ch.qos.logback', 'META-INF/maven/org.slf4j',
    'META-INF/services/org.slf4j.spi.SLF4JServiceProvider']) {
    await rm(path.join(classes, entry), { recursive: true, force: true })
  }
  await execute(tool('jar'), ['--create', '--file', engine, '--no-manifest', '--date=2026-01-01T00:00:00Z', '-C', classes, '.'])
  const lib = path.join(destination, 'lib')
  await mkdir(lib, { recursive: true })
  return Promise.all(loggingLibraries.map(async ([artifact, hash]) => {
    const response = await fetch(`https://repo.maven.apache.org/maven2/${artifact}`, {
      tls: { ca: runtimeCertificates() }, decompress: false, headers: { 'Accept-Encoding': 'identity' },
    })
    if (!response.ok) throw new Error(`Cannot download ${artifact}: ${response.status}`)
    const jar = Buffer.from(await response.arrayBuffer())
    if (createHash('sha256').update(jar).digest('hex') !== hash) throw new Error(`Unexpected checksum for ${artifact}`)
    const output = path.join(lib, path.posix.basename(artifact))
    await writeFile(output, jar)
    return output
  }))
}

async function compileWorker(destination: string, classpath: string[], temporary: string) {
  const sources = path.join(root, 'java/md/groma/cobol')
  const classes = path.join(temporary, 'classes')
  await mkdir(classes)
  await execute(tool('javac'), ['--release', '21', '-encoding', 'UTF-8', '-cp', classpath.join(path.delimiter), '-d', classes,
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
    const logging = await patchEngine(engine, temporary, dist)
    await compileWorker(dist, [...logging, engine], temporary)
    await cp(engine, path.join(dist, 'engine.jar'))
    await cp(path.join(temporary, 'extension/LICENSE.txt'), path.join(destination, 'ECLIPSE-LICENSE.txt'))
    const runtime = path.join(dist, `${process.platform}-${process.arch}`, 'runtime')
    await mkdir(path.dirname(runtime), { recursive: true })
    await execute(tool('jlink'), ['--add-modules', 'java.base,java.logging,java.management,java.naming,java.xml,jdk.unsupported',
      '--strip-debug', '--no-header-files', '--no-man-pages', '--output', runtime])
    await secureJavaTrustStore(path.join(runtime, 'lib/security/cacerts'))
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
