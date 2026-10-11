import { execFile } from 'node:child_process'
import path from 'node:path'
import type { CodeDeclaration, CodeFile, CodeSymbol, SourceReference } from '@groma/scanner'

/** The Java launcher a scanner package ships for this host under its `dist/` directory. */
export function bundledJava(dist: string): string {
  return path.join(dist, `${process.platform}-${process.arch}`, 'runtime/bin', process.platform === 'win32' ? 'java.exe' : 'java')
}

/**
 * Runs a scanner's JVM worker once. The repository-relative files go in on stdin, one per line, and the worker's single
 * JSON document comes back from stdout. A failed run rejects with what the worker wrote to stderr.
 */
export function runJvmWorker(java: string, args: readonly string[], root: string, files: readonly string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    // One document covers every selected file, so its size grows with the repository and has no fixed limit.
    const child = execFile(java, [...args], {
      cwd: root, encoding: 'utf8', timeout: 120000, killSignal: 'SIGKILL', maxBuffer: Infinity,
    }, (error, stdout, stderr) => {
      if (error) reject(new Error(stderr.trim() || error.message))
      else resolve(stdout)
    })
    child.stdin?.on('error', () => { /* execFile reports early process termination. */ })
    child.stdin?.end(`${files.join('\n')}\n`)
  })
}

type WorkerSymbol = Omit<CodeSymbol, 'entry'>
type WorkerDeclaration = WorkerSymbol & { kind: 'function' | 'type'; members: WorkerSymbol[] }
type WorkerOutline = { file: string; declarations: WorkerDeclaration[] }

/** Code links name symbols by bare name; a link naming a type marks the type, never a member that shares its name. */
function declarationEntry(declaration: WorkerDeclaration, symbols: readonly string[]): CodeDeclaration {
  const { members, ...named } = declaration
  const entry = symbols.includes(declaration.name)
  if (named.kind === 'function') return { ...named, kind: 'function', entry }
  return { ...named, kind: 'type', entry, members: members.map(member => ({ ...member, entry: member.name !== declaration.name && symbols.includes(member.name) })) }
}

/** A worker's outline document as code files, marking the declarations each reference names; empty files are left out. */
export function workerOutline(stdout: string, references: readonly SourceReference[]): CodeFile[] {
  const symbols = new Map(references.map(reference => [reference.file, reference.symbols]))
  return (JSON.parse(stdout) as WorkerOutline[]).filter(file => file.declarations.length > 0)
    .map(({ file, declarations }) => ({
      file, declarations: declarations.map(declaration => declarationEntry(declaration, symbols.get(file) ?? [])),
    }))
}
