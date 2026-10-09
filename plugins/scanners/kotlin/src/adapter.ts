import { execFile } from 'node:child_process'
import { access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { CodeDeclaration, CodeFile, CodeSymbol, SourceReference } from '@groma/scanner'

const dist = fileURLToPath(new URL('../dist/', import.meta.url))
const worker = path.join(dist, 'worker.jar')
const runtime = path.join(dist, `${process.platform}-${process.arch}`, 'runtime/bin',
  process.platform === 'win32' ? 'java.exe' : 'java')
// The worker beside the unmodified Kotlin compiler jars it parses with.
const classpath = [worker, path.join(dist, 'lib', '*')].join(path.delimiter)

export async function checkKotlinReadiness(): Promise<void> {
  try { await Promise.all([access(worker), access(runtime)]) }
  catch { throw new Error('kotlin: Install the Kotlin scanner package with its bundled parser and runtime.') }
}

async function runWorker(mode: 'scan' | 'outline', root: string, files: readonly string[]): Promise<string> {
  await checkKotlinReadiness()
  return new Promise((resolve, reject) => {
    const child = execFile(runtime, ['-cp', classpath, 'md.groma.scanner.MainKt', mode, root], {
      cwd: root, encoding: 'utf8', timeout: 120000, killSignal: 'SIGKILL', maxBuffer: 64 * 1024 * 1024,
    }, (error, stdout, stderr) => {
      if (error) reject(new Error(stderr.trim() || error.message))
      else resolve(stdout)
    })
    child.stdin?.on('error', () => { /* execFile reports early process termination. */ })
    child.stdin?.end(`${files.join('\n')}\n`)
  })
}

export function scanWithWorker(root: string, files: readonly string[]): Promise<string> {
  return runWorker('scan', root, files)
}

type WorkerSymbol = Omit<CodeSymbol, 'entry'>
type WorkerDeclaration = WorkerSymbol & { kind: 'function' | 'type'; members: WorkerSymbol[] }
type WorkerOutline = { file: string; declarations: WorkerDeclaration[] }

/** Code links name Kotlin symbols by bare name; a link naming a type never marks its members. */
function declarationEntry(declaration: WorkerDeclaration, symbols: readonly string[]): CodeDeclaration {
  const { members, ...named } = declaration
  const entry = symbols.includes(declaration.name)
  if (named.kind === 'function') return { ...named, kind: 'function', entry }
  return { ...named, kind: 'type', entry, members: members.map(member => ({ ...member, entry: symbols.includes(member.name) })) }
}

/** Outlines only the requested sources with the same bundled parser used by scans. */
export async function readKotlinOutline(root: string, references: readonly SourceReference[]): Promise<CodeFile[]> {
  if (references.length === 0) return []
  const stdout = await runWorker('outline', root, references.map(reference => reference.file))
  const symbols = new Map(references.map(reference => [reference.file, reference.symbols]))
  return (JSON.parse(stdout) as WorkerOutline[]).filter(file => file.declarations.length > 0)
    .map(({ file, declarations }) => ({
      file, declarations: declarations.map(declaration => declarationEntry(declaration, symbols.get(file) ?? [])),
    }))
}
