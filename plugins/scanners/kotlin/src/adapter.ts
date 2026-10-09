import { access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { CodeFile, SourceReference } from '@groma/scanner'
import { bundledJava, runJvmWorker, workerOutline } from '../../jvm-worker.ts'

const dist = fileURLToPath(new URL('../dist/', import.meta.url))
const worker = path.join(dist, 'worker.jar')
const runtime = bundledJava(dist)
// The worker beside the unmodified Kotlin compiler jars it parses with.
const classpath = [worker, path.join(dist, 'lib', '*')].join(path.delimiter)

export async function checkKotlinReadiness(): Promise<void> {
  try { await Promise.all([access(worker), access(runtime)]) }
  catch { throw new Error('kotlin: Install the Kotlin scanner package with its bundled parser and runtime.') }
}

async function runWorker(mode: 'scan' | 'outline', root: string, files: readonly string[]): Promise<string> {
  await checkKotlinReadiness()
  // The worker walks nested expressions recursively, so long generated chains need more than the default stack.
  return runJvmWorker(runtime, ['-Xss512m', '-cp', classpath, 'md.groma.scanner.MainKt', mode, root], root, files)
}

export function scanWithWorker(root: string, files: readonly string[]): Promise<string> {
  return runWorker('scan', root, files)
}

/** Outlines only the requested sources with the same bundled parser used by scans. */
export async function readKotlinOutline(root: string, references: readonly SourceReference[]): Promise<CodeFile[]> {
  if (references.length === 0) return []
  return workerOutline(await runWorker('outline', root, references.map(reference => reference.file)), references)
}
