import { expect, test } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const cli = path.resolve(import.meta.dir, '../src/cli.ts')

test.concurrent('a failed export prints its message and exits 1 without a stack trace', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'groma-export-failure-'))
  try {
    const git = Bun.spawn(['git', 'init', '--quiet', root], { stdout: 'ignore', stderr: 'pipe' })
    expect(await git.exited).toBe(0)
    const child = Bun.spawn([process.execPath, cli, 'export', 'site', '--revision', 'not-a-commit'], {
      cwd: root, stdout: 'pipe', stderr: 'pipe',
    })
    const [code, stdout, stderr] = await Promise.all([
      child.exited, new Response(child.stdout).text(), new Response(child.stderr).text(),
    ])
    expect(code).toBe(1)
    expect(stdout).toBe('')
    expect(stderr.trim()).not.toBe('')
    // A stack trace prints one indented `at` line for each frame.
    expect(stderr).not.toMatch(/^\s+at /m)
  } finally { await rm(root, { recursive: true, force: true }) }
})
