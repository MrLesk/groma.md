import { access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { CodeFile, SourceReference } from '@groma/scanner'
import { bundledJava, runJvmWorker, workerOutline } from '../../jvm-worker.ts'

const dist = fileURLToPath(new URL('../dist/', import.meta.url))
const worker = path.join(dist, 'worker.jar')
const runtime = bundledJava(dist)

export async function checkScalaReadiness(): Promise<void> {
  try { await Promise.all([access(worker), access(runtime)]) }
  catch { throw new Error('scala: Install the Scala scanner package with its bundled parser and runtime.') }
}

async function runWorker(mode: 'scan' | 'outline', root: string, files: readonly string[]): Promise<string> {
  await checkScalaReadiness()
  return runJvmWorker(runtime, ['-jar', worker, mode, root], root, files)
}

export function scanWithWorker(root: string, files: readonly string[]): Promise<string> {
  return runWorker('scan', root, files)
}

/** Outlines only the requested sources with the same bundled parser used by scans. */
export async function readScalaOutline(root: string, references: readonly SourceReference[]): Promise<CodeFile[]> {
  if (references.length === 0) return []
  return workerOutline(await runWorker('outline', root, references.map(reference => reference.file)), references)
}
