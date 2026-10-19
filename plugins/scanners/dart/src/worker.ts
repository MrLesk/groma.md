import { execFile } from 'node:child_process'
import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { CodeSymbol, ScanInvocation, ScanOperation, ScanSymbol } from '@groma/scanner'

type OutlineSymbol = Omit<CodeSymbol, 'entry'>
export interface FileEvidence {
  file: string
  symbols: ScanSymbol[]
  operations: ScanOperation[]
  invocations: ScanInvocation[]
  declarations: ((OutlineSymbol & { kind: 'function' }) | (OutlineSymbol & { kind: 'type'; members: OutlineSymbol[] }))[]
  main: boolean
  parts: (string | null)[]
  isPart: boolean
  partOfUri: string | null
  partOfName: string | null
  library: string | null
}

const worker = fileURLToPath(new URL(`../dist/${process.platform}-${process.arch}/worker${process.platform === 'win32' ? '.exe' : ''}`, import.meta.url))

export async function checkWorker(): Promise<void> {
  try { await access(worker) }
  catch { throw new Error('dart: Install the Dart scanner package with its bundled native parser.') }
}

/** Pass requested source and selected language-version metadata; never discover project files here. */
export async function readEvidence(root: string, files: string[], context: readonly string[]): Promise<FileEvidence[]> {
  await checkWorker()
  const inputs = [...new Set([...files, ...context.filter(file => path.posix.basename(file) === 'pubspec.yaml')])]
  const input = await Promise.all(inputs.map(async file => ({
    file, source: new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(await readFile(path.join(root, file))),
  })))
  return new Promise((resolve, reject) => {
    const child = execFile(worker, [], { cwd: root, maxBuffer: Infinity }, (error, stdout, stderr) => {
      if (error) reject(new Error(stderr.trim() || error.message))
      else { try { resolve(JSON.parse(stdout)) } catch (error) { reject(error) } }
    })
    child.stdin!.on('error', () => { /* execFile reports the worker's exit. */ })
    child.stdin!.end(JSON.stringify(input))
  })
}
