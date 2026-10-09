import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cp, mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { buildJvmPackage, jdkTool } from '../jvm-package.ts'

const execute = promisify(execFile)
const pluginRoot = fileURLToPath(new URL('./', import.meta.url))
const maven = 'https://repo.maven.apache.org/maven2'
const kotlin = '2.4.21'
// Each Maven Central artifact with the SHA-256 of the reviewed jar; a download that differs fails the build.
// The compiler parses the scanned source; the other two are what it needs to start.
const libraries = [
  [`org/jetbrains/kotlin/kotlin-compiler-embeddable/${kotlin}/kotlin-compiler-embeddable-${kotlin}.jar`,
    'ef19419c765e7ac8404465fa026ca8fc4dbb8a822de0fc79aa53c8dce29f1d02'],
  [`org/jetbrains/kotlin/kotlin-stdlib/${kotlin}/kotlin-stdlib-${kotlin}.jar`,
    'bd8250210584cb659847dce9cda660f8e9906e5def7fbebcea93dc6dcb6a88a3'],
  ['org/jetbrains/kotlinx/kotlinx-coroutines-core-jvm/1.8.0/kotlinx-coroutines-core-jvm-1.8.0.jar',
    '9860906a1937490bf5f3b06d2f0e10ef451e65b95b269f22daf68a3d1f5065c5'],
] as const
// Needed only while the compiler compiles the worker; never shipped.
const buildOnly = ['org/jetbrains/annotations/13.0/annotations-13.0.jar',
  'ace2a10dc8e2d5fd34925ecac03e4988b2c0f851650c94b8cef49ba1bd111478'] as const

async function download([artifact, hash]: readonly [string, string], directory: string): Promise<string> {
  const response = await fetch(`${maven}/${artifact}`)
  if (!response.ok) throw new Error(`Could not download ${artifact}: ${response.status}`)
  const jar = Buffer.from(await response.arrayBuffer())
  if (createHash('sha256').update(jar).digest('hex') !== hash) throw new Error(`Unexpected checksum for ${artifact}`)
  const file = path.join(directory, path.posix.basename(artifact))
  await writeFile(file, jar)
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
    await execute(jdkTool('java'), ['-cp', classpath, 'org.jetbrains.kotlin.cli.jvm.K2JVMCompiler',
      '-no-stdlib', '-no-reflect', '-jvm-target', '21',
      '-opt-in=org.jetbrains.kotlin.CoreEnvironmentDeprecation',
      '-opt-in=org.jetbrains.kotlin.config.CompilerConfiguration.Internals',
      '-opt-in=org.jetbrains.kotlin.compiler.plugin.ExperimentalCompilerApi',
      '-cp', classpath, '-d', path.join(dist, 'worker.jar'), ...files.map(file => path.join(sources, file))],
    { maxBuffer: 8 * 1024 * 1024 })
  } finally { await rm(temporary, { recursive: true, force: true }) }
}

/** Consumers receive the parser, its jars and a Java runtime; the compilation above is used only by maintainers. */
export function buildPackage(destination: string): Promise<void> {
  // The compiler's parser links javax.swing.Icon and java.util.logging at class load; it needs no other module.
  return buildJvmPackage(pluginRoot, destination, 'java.base,java.desktop,java.logging,jdk.unsupported', buildWorker)
}

if (import.meta.main) {
  const output = path.join(pluginRoot, 'dist/package')
  await buildPackage(output)
  await cp(path.join(output, 'dist'), path.join(pluginRoot, 'dist'), { recursive: true })
  console.log(output)
}
