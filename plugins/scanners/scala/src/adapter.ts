import { execFile } from 'node:child_process'
import { access } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import type { CodeDeclaration, CodeFile, CodeSymbol, SourceReference } from '@groma/scanner'

const worker = fileURLToPath(new URL('../dist/worker.jar', import.meta.url))
const runtime = fileURLToPath(new URL(
  `../dist/${process.platform}-${process.arch}/runtime/bin/java${process.platform === 'win32' ? '.exe' : ''}`,
  import.meta.url,
))

export async function checkScalaReadiness(): Promise<void> {
  try { await Promise.all([access(worker), access(runtime)]) }
  catch { throw new Error('scala: Install the Scala scanner package with its bundled parser and runtime.') }
}

async function runWorker(mode: 'scan' | 'outline', root: string, files: readonly string[]): Promise<string> {
  await checkScalaReadiness()
  return new Promise((resolve, reject) => {
    const child = execFile(runtime, ['-jar', worker, mode, root], {
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

function declarationEntry(declaration: WorkerDeclaration, symbols: readonly string[]): CodeDeclaration {
  const { members, ...named } = declaration
  const entry = symbols.includes(declaration.name)
  if (named.kind === 'function') return { ...named, kind: 'function', entry }
  return { ...named, kind: 'type', entry, members: members.map(member => ({ ...member, entry: member.name !== declaration.name && symbols.includes(member.name) })) }
}

/** Outlines only the requested sources with the same bundled parser used by scans. */
export async function readScalaOutline(root: string, references: readonly SourceReference[]): Promise<CodeFile[]> {
  if (references.length === 0) return []
  const stdout = await runWorker('outline', root, references.map(reference => reference.file))
  const symbols = new Map(references.map(reference => [reference.file, reference.symbols]))
  return (JSON.parse(stdout) as WorkerOutline[]).filter(file => file.declarations.length > 0)
    .map(({ file, declarations }) => ({
      file, declarations: declarations.map(declaration => declarationEntry(declaration, symbols.get(file) ?? [])),
    }))
}
