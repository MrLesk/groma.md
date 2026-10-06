import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseScanObservation, type CodeFile, type CodeSymbol, type ScanObservation, type SourceReference } from '@groma/scanner'
import { exists, type JavaInput } from './java-input.ts'
import { run, runCompiler } from './process.ts'

const worker = fileURLToPath(new URL('../dist/worker.jar', import.meta.url))
const runtime = fileURLToPath(new URL(`../dist/${process.platform}-${process.arch}/runtime/bin/java${process.platform === 'win32' ? '.exe' : ''}`, import.meta.url))

export interface JavaScanOptions {
  worker?: string
  timeout?: number
}

async function requireWorker(options: JavaScanOptions): Promise<string> {
  const jar = options.worker ?? worker
  if (!await exists(jar)) throw new Error('JAVA_WORKER_MISSING: Install the packaged Java scanner, or build it with bun plugins/scanners/java/build.ts.')
  return jar
}

/** Setup checks the packaged runtime; the source scan runs its compiler directly. */
export async function checkJavaReadiness(projectRoot: string, options: JavaScanOptions = {}) {
  await requireWorker(options)
  try {
    const modules = await run(runtime, ['--list-modules'], projectRoot)
    if (!modules.includes('jdk.compiler@')) throw new Error('The selected runtime has no Java compiler module.')
  }
  catch (error) { throw new Error(`JAVA_RUNTIME_MISSING: Reinstall the Java scanner with its bundled compiler runtime. ${error}`) }
}

/** In the Java host worker, one JVM serves isolated compiler tasks and returns observations in project order. */
export async function scanJavaInputs(projectRoot: string, inputs: JavaInput[],
  options: JavaScanOptions = {}): Promise<ScanObservation[]> {
  const jar = await requireWorker(options)
  const command = runtime
  if (!inputs.length) return []
  let stdout: string
  try {
    stdout = runCompiler(command, ['-Xmx2048m', '-jar', jar,
      ...inputs.flatMap(input => [input.root, input.release, input.encoding])], projectRoot,
    inputs.map(input => `${input.files.join('\n')}\n`).join('\n'), options.timeout)
  } catch (error) {
    throw new Error(`JAVA_SOURCE_INVALID: No observation was produced. Check the declared Java language version and source syntax. ${error}`)
  }
  return stdout.trimEnd().split('\n').map((line, index) => {
    const observation = parseScanObservation(line)
    const input = inputs[index]!
    // The worker only compiles sources; build declarations own the project's name and kind.
    const [root] = observation.roots
    observation.roots[0] = { ...root!, name: input.name, kind: input.kind, ...(input.file ? { file: input.file } : {}) }
    return observation
  })
}

type WorkerSymbol = Omit<CodeSymbol, 'entry'>
type WorkerOutline = { file: string; declarations: (WorkerSymbol & { kind: 'type'; members: WorkerSymbol[] })[] }

/** Outlines Java files with the bundled compiler's parser; parsing needs no classpath. */
export async function readJavaOutline(repositoryRoot: string, references: readonly SourceReference[]): Promise<CodeFile[]> {
  // A past revision may lack some of today's Code files.
  const present = references.filter(reference => existsSync(path.join(repositoryRoot, reference.file)))
  if (present.length === 0) return []
  const stdout = await run(runtime, ['-jar', worker, 'outline', repositoryRoot], repositoryRoot,
    `${present.map(reference => reference.file).join('\n')}\n`)
  const symbols = new Map(present.map(reference => [reference.file, reference.symbols]))
  // Code links name a type by its simple name and a member as `Type.member`; constructors share the type's name.
  return (JSON.parse(stdout) as WorkerOutline[]).filter(file => file.declarations.length > 0).map(({ file, declarations }) => {
    const named = symbols.get(file) ?? []
    return { file, declarations: declarations.map(type => ({
      ...type, entry: named.includes(type.name),
      members: type.members.map(member => ({ ...member, entry: named.includes(`${type.name}.${member.name}`) })),
    })) }
  })
}
