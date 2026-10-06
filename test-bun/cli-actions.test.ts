import { expect, mock, test } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const cli = path.resolve(import.meta.dir, '../src/cli.ts')
async function runCli(arguments_: string[]): Promise<{ code: number | null; stdout: string; stderr: string }> {
  const child = Bun.spawn([process.execPath, cli, ...arguments_], {
    cwd: path.resolve(import.meta.dir, '..'),
    stdout: 'pipe',
    stderr: 'pipe',
  })
  const [code, stdout, stderr] = await Promise.all([
    child.exited,
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ])
  return { code, stdout, stderr }
}

test.concurrent('export with an unknown revision reports the failure and exits 1 without a stack', async () => {
  const output = await mkdtemp(path.join(os.tmpdir(), 'groma-export-bad-revision-'))
  try {
    const result = await runCli(['export', output, '--revision', 'not-a-commit'])
    expect(result.code).toBe(1)
    expect(result.stderr).toContain('fatal:')
    expect(result.stderr).not.toMatch(/^\s+at /m)
    expect(result.stdout).toBe('')
  } finally { await rm(output, { recursive: true, force: true }) }
})

test.concurrent('draft help names --description and --technology as required for a relation', async () => {
  const result = await runCli(['draft', '--help'])
  expect(result.code).toBe(0)
  expect(result.stdout).toContain('short summary (required for a relation)')
  expect(result.stdout).toContain('implementation technology (required for a relation)')
})

// The welcome model reads scanner settings at load time; the stub makes the tone depend on the
// requested root so both status derivations are observable without a blocked scanner fixture.
// Static imports of model.ts cannot be used here: bun applies mock.module only to modules
// loaded after it runs, so the welcome model must be imported dynamically below.
mock.module(path.resolve(import.meta.dir, '../src/scanner/modules/settings.ts'), () => ({
  readScannerSettings: async (root: string) => ({
    scanners: [],
    notice: root.endsWith('blocked-root')
      ? { tone: 'error' as const, message: 'A scanner needs attention. Saved architecture is available.' }
      : { tone: 'neutral' as const, message: 'No source project detected. Showing saved architecture.' },
    limits: [],
  }),
}))

const { loadWelcomeModel, renderPlainWelcome } = await import('../src/welcome/model.ts')

test.concurrent('welcome status stays Architecture ready for a healthy scanner notice', async () => {
  const model = await loadWelcomeModel(os.tmpdir())
  expect(model.status).toBe('Architecture ready')
  expect(model.scanners?.notice.tone).toBe('neutral')
})

test.concurrent('welcome status reports Scanners need attention for an error-toned notice', async () => {
  const model = await loadWelcomeModel('/tmp/groma-welcome-blocked-root')
  expect(model.status).toBe('Scanners need attention')
  expect(model.scanners?.notice.tone).toBe('error')
  expect(await renderPlainWelcome('/tmp/groma-welcome-blocked-root')).toContain('status: Scanners need attention')
})
