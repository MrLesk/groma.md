import { execFile } from 'node:child_process'
import { cp, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execute = promisify(execFile)
const pluginRoot = fileURLToPath(new URL('./', import.meta.url))
const maven = 'https://repo.maven.apache.org/maven2'
const kotlin = '2.4.21'
// The compiler parses the scanned source; the other two are what it needs to start.
const libraries = [
  `org/jetbrains/kotlin/kotlin-compiler-embeddable/${kotlin}/kotlin-compiler-embeddable-${kotlin}.jar`,
  `org/jetbrains/kotlin/kotlin-stdlib/${kotlin}/kotlin-stdlib-${kotlin}.jar`,
  'org/jetbrains/kotlinx/kotlinx-coroutines-core-jvm/1.8.0/kotlinx-coroutines-core-jvm-1.8.0.jar',
]
// Needed only while the compiler compiles the worker; never shipped.
const buildOnly = 'org/jetbrains/annotations/13.0/annotations-13.0.jar'

function tool(name: string): string {
  const executable = process.platform === 'win32' ? `${name}.exe` : name
  return process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, 'bin', executable) : executable
}

async function download(artifact: string, directory: string): Promise<string> {
  const response = await fetch(`${maven}/${artifact}`)
  if (!response.ok) throw new Error(`Could not download ${artifact}: ${response.status}`)
  const file = path.join(directory, path.posix.basename(artifact))
  await writeFile(file, Buffer.from(await response.arrayBuffer()))
  return file
}

/**
 * Maintainer-only compilation. The downloaded compiler compiles the worker that will parse with it, so the build needs
 * a JDK but no installed Kotlin compiler or Gradle. Writes `worker.jar` and the shipped jars under `lib/`.
 */
export async function buildWorker(dist: string): Promise<void> {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'groma-kotlin-build-'))
  try {
    const lib = path.join(dist, 'lib')
    await mkdir(lib, { recursive: true })
    const jars = await Promise.all([...libraries.map(artifact => download(artifact, lib)), download(buildOnly, temporary)])
    const classpath = jars.join(path.delimiter)
    const sources = path.join(pluginRoot, 'worker/md/groma/scanner')
    const files = (await readdir(sources)).filter(file => file.endsWith('.kt')).sort()
    // The opt-ins acknowledge the compiler's parser-environment API, which has no stable replacement.
    await execute(tool('java'), ['-cp', classpath, 'org.jetbrains.kotlin.cli.jvm.K2JVMCompiler',
      '-no-stdlib', '-no-reflect', '-jvm-target', '21',
      '-opt-in=org.jetbrains.kotlin.CoreEnvironmentDeprecation',
      '-opt-in=org.jetbrains.kotlin.config.CompilerConfiguration.Internals',
      '-opt-in=org.jetbrains.kotlin.compiler.plugin.ExperimentalCompilerApi',
      '-cp', classpath, '-d', path.join(dist, 'worker.jar'), ...files.map(file => path.join(sources, file))],
    { maxBuffer: 8 * 1024 * 1024 })
  } finally { await rm(temporary, { recursive: true, force: true }) }
}

async function writeNotices(inputs: string[], output: string): Promise<void> {
  const directories = new Set(inputs.flatMap(input => /^(.*node_modules\/(?:@[^/]+\/)?[^/]+)\//.exec(input.replaceAll('\\', '/'))?.[1] ?? []))
  const sections = [
    await readFile(path.join(pluginRoot, 'THIRD-PARTY-NOTICES.txt'), 'utf8'),
    'Java runtime licenses are in each dist/<host>/runtime/legal directory.\n',
    'Bundled npm package license texts follow.\n',
  ]
  for (const directory of [...directories].map(item => path.resolve(item)).sort()) {
    const manifest = JSON.parse(await readFile(path.join(directory, 'package.json'), 'utf8'))
    const license = (await readdir(directory)).find(name => /^licen[cs]e/i.test(name))
    if (!license) throw new Error(`Review the missing license text for ${manifest.name}@${manifest.version}`)
    sections.push(`\n${manifest.name} ${manifest.version}\nLicense: ${manifest.license}\n\n${await readFile(path.join(directory, license), 'utf8')}`)
  }
  await writeFile(output, sections.join(''))
}

/** Consumers receive the parser, its jars and a Java runtime; the compilation above is used only by maintainers. */
export async function buildPackage(destination: string): Promise<void> {
  await rm(destination, { recursive: true, force: true })
  await mkdir(destination, { recursive: true })
  await buildWorker(path.join(destination, 'dist'))
  const runtime = path.join(destination, 'dist', `${process.platform}-${process.arch}`, 'runtime')
  await mkdir(path.dirname(runtime), { recursive: true })
  // The compiler's parser links javax.swing.Icon and java.util.logging at class load; it needs no other module.
  await execute(tool('jlink'), ['--add-modules', 'java.base,java.desktop,java.logging,jdk.unsupported',
    '--strip-debug', '--no-header-files', '--no-man-pages', '--output', runtime])
  const built = await Bun.build({
    entrypoints: [path.join(pluginRoot, 'src/index.ts')],
    outdir: path.join(destination, 'src'), target: 'bun', format: 'esm', naming: 'index.js', metafile: true,
  })
  if (!built.success) throw new Error(built.logs.join('\n'))
  await writeNotices(Object.keys(built.metafile?.inputs ?? {}), path.join(destination, 'THIRD-PARTY-NOTICES.txt'))
  const manifest = JSON.parse(await readFile(path.join(pluginRoot, 'package.json'), 'utf8'))
  await writeFile(path.join(destination, 'package.json'), `${JSON.stringify({
    name: manifest.name, version: manifest.version, description: manifest.description,
    private: manifest.private, type: 'module', license: 'MIT', os: [process.platform], cpu: [process.arch],
    groma: { scanner: { ...manifest.groma.scanner, entry: './src/index.js' } },
  }, null, 2)}\n`)
  await cp(path.join(pluginRoot, '../../../LICENSE'), path.join(destination, 'LICENSE'))
}

if (import.meta.main) {
  const output = path.join(pluginRoot, 'dist/package')
  await buildPackage(output)
  await cp(path.join(output, 'dist'), path.join(pluginRoot, 'dist'), { recursive: true })
  console.log(output)
}
