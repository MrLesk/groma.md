import { fileURLToPath } from 'node:url'
import { readGromaConfig } from '../config.ts'
import { parseScannerSource } from './modules/package.ts'

/** A one-shot CLI scan can exit while this independent update-and-scan job finishes. */
export async function startBackgroundScannerUpdates(root: string): Promise<void> {
  const config = await readGromaConfig(root)
  if (config.automaticUpdates === false) return
  if (!config.scanners.some(scanner => parseScannerSource(root, scanner.source).kind === 'npm')) return
  const entry = Bun.isStandaloneExecutable ? [] : [fileURLToPath(new URL('../cli.ts', import.meta.url))]
  const child = Bun.spawn([process.execPath, ...entry, 'scanner', 'refresh'], {
    cwd: root, stdin: 'ignore', stdout: 'ignore', stderr: 'ignore', detached: true,
  })
  child.unref()
}
