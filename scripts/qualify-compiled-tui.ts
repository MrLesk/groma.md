import assert from 'node:assert/strict'
import { cp, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const binary = path.resolve(process.argv[2] ?? '')
if (!process.argv[2]) throw new Error('Usage: bun scripts/qualify-compiled-tui.ts <binary>')
const root = await mkdtemp(path.join(os.tmpdir(), 'groma-native-console-'))
const session = `groma-native-${process.pid}-${Date.now()}`
const repository = path.resolve(import.meta.dir, '..')

async function terminal(args: string[]): Promise<string> {
  const child = Bun.spawn(['tui-test', '--session', session, ...args], { stdout: 'pipe', stderr: 'pipe' })
  const [code, stdout, stderr] = await Promise.all([
    child.exited, new Response(child.stdout).text(), new Response(child.stderr).text(),
  ])
  assert.equal(code, 0, `tui-test ${args.join(' ')}: ${stderr}\n${stdout}`)
  return stdout
}

try {
  await cp(path.join(repository, 'test/fixtures/flows'), root, { recursive: true })
  await writeFile(path.join(root, 'groma/config.json'), JSON.stringify({
    scanners: [], workSources: [], automaticUpdates: false,
  }))
  await terminal(['run', '--cols', '120', '--rows', '36', '--cwd', root, binary, 'view'])
  await terminal(['expect', 'text', 'Service', '--timeout', '10000'])
  await terminal(['screenshot', `${binary}.tui-root.svg`])
  await terminal(['key', 'press', 'd'])
  await terminal(['expect', 'text', 'Runs request handlers.', '--timeout', '10000'])
  await terminal(['screenshot', `${binary}.tui-details.svg`])
  await terminal(['key', 'press', 'Escape'])
  await terminal(['key', 'press', 'Enter'])
  await terminal(['expect', 'text', 'Entry', '--timeout', '10000'])
  await terminal(['screenshot', `${binary}.tui-container.svg`])
  await terminal(['key', 'press', 'Backspace'])
  await terminal(['resize', '200', '60'])
  await terminal(['expect', 'text', 'Service', '--timeout', '10000'])
  await terminal(['screenshot', `${binary}.tui-large.svg`])
  await terminal(['key', 'press', 'Ctrl+C'])
  await terminal(['wait', 'exit', '--timeout', '10000'])
  await terminal(['expect', 'exit-code', '0', '--timeout', '10000'])
  console.log(`Native console navigation and Ctrl+C passed: ${process.platform}-${process.arch}`)
} finally {
  // Capture the final screen even if an interaction fails, then close the session.
  await terminal(['screenshot', `${binary}.tui-final.svg`]).catch(error => console.error(error))
  await terminal(['close']).catch(error => console.error(error))
  await rm(root, { recursive: true, force: true })
}
