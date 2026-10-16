import { fileURLToPath } from 'node:url'

/** A one-shot CLI scan can exit while this independent update-and-scan job finishes. */
export function startBackgroundScannerUpdates(root: string): void {
  const entry = Bun.isStandaloneExecutable ? [] : [fileURLToPath(new URL('../cli.ts', import.meta.url))]
  const child = Bun.spawn([process.execPath, ...entry, 'scanner', 'refresh'], {
    cwd: root, stdin: 'ignore', stdout: 'ignore', stderr: 'ignore', detached: true,
  })
  child.unref()
}
