import { readFile } from 'node:fs/promises'
import { writeSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { loadPyodide } from 'pyodide'
import type { SourceReference } from '@groma/scanner'
import { workerModules } from './modules.ts'

const request = new Promise<{ root: string; files?: string[]; references?: SourceReference[] }>(resolve => {
  process.once('message', resolve)
})

const runtime = fileURLToPath(new URL('../runtime/pyodide.mjs', import.meta.url))
const { loadPyodide: load }: { loadPyodide: typeof loadPyodide } = await import(runtime)
// Keep parser diagnostics separate from the result sent through IPC.
const python = await load({
  indexURL: path.dirname(runtime),
  stdout: line => writeSync(2, `${line}\n`),
  stderr: line => writeSync(2, `${line}\n`),
})
/** With references, the worker outlines those files instead of scanning. */
const { root, files: scanned, references }: { root: string; files?: string[]; references?: SourceReference[] } = await request
const files = references?.map(reference => reference.file) ?? scanned!
const directory = `/checkout/${path.basename(root)}`
python.FS.mkdirTree(directory)
python.FS.chdir(directory)
for (const file of files) {
  python.FS.mkdirTree(path.posix.dirname(file))
  python.FS.writeFile(file, await readFile(path.join(root, file)))
}
const globals = python.toPy({ __name__: 'groma_scanner', files, references })
try {
  for (const module of workerModules) {
    python.runPython(await readFile(new URL(`./${module}`, import.meta.url), 'utf8'), { globals })
  }
  const call = references === undefined ? 'scan(files)' : 'outline(references)'
  process.send!(python.runPython(`json.dumps(${call})`, { globals }), () => process.disconnect!())
} finally { globals.destroy() }
