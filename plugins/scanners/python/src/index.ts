import { fork } from 'node:child_process'
import { access } from 'node:fs/promises'
import { parseScanObservation, type CodeFile, type ScannerPlugin, type SourceReference } from '@groma/scanner'

const worker = new URL('../dist/worker/runtime.js', import.meta.url)

/** A Python source; the other files the scanner reads are project declarations, which describe projects, not source. */
const isSource = (file: string) => file.endsWith('.py')

/** Scans the files, or outlines them when references are given. */
function run(workerData: { root: string; files?: readonly string[]; references?: readonly SourceReference[] }): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = fork(worker, [], { execArgv: [], env: { ...process.env, BUN_BE_BUN: '1' },
      stdio: ['ignore', 'inherit', 'pipe', 'ipc'] })
    let output: string | undefined
    let stderr = ''
    const timeout = setTimeout(() => {
      child.kill('SIGKILL')
      reject(new Error('PYTHON_SCAN_FAILED: Source analysis exceeded 120 seconds.'))
    }, 120000)
    child.stderr!.on('data', (chunk: Buffer) => { stderr += chunk.toString(); process.stderr.write(chunk) })
    child.once('message', (result: string) => { output = result })
    child.once('error', error => { clearTimeout(timeout); reject(new Error(`PYTHON_SCAN_FAILED: ${error.message}`)) })
    child.once('close', code => {
      clearTimeout(timeout)
      if (code === 0 && output !== undefined) resolve(output)
      else reject(new Error(`PYTHON_SCAN_FAILED: ${stderr.trim() || `Worker exited with code ${code}.`}`))
    })
    child.send(workerData)
  })
}

export default {
  id: 'python',
  listSourceFiles: async (_root, _settings, candidates) => candidates.filter(isSource),
  async checkReadiness(_root, _settings, files) {
    if (!files.some(isSource)) {
      throw new Error('python: No supported Python source files were found in the Git repository.')
    }
    await access(worker)
  },
  async readCodeStructure(root, references): Promise<CodeFile[]> {
    if (references.length === 0) return []
    return JSON.parse(await run({ root, references }))
  },
  async scan(root, _settings, files) {
    if (!files.some(isSource)) return undefined
    return parseScanObservation(await run({ root, files }))
  },
} satisfies ScannerPlugin
