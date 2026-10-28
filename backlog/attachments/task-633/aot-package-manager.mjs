// Run with the experimental compiler from Bun PR 45631, not stable Bun:
// bun backlog/attachments/task-633/aot-package-manager.mjs
// Tested: d260d7d51ba4280c836a600df2123f42986c8669, Buildkite 133944.
import { mkdtemp, writeFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const help = Bun.spawnSync([process.execPath, 'build', '--help']).stdout.toString()
if (!help.includes('--aot ')) throw new Error('Use a compiler supporting --aot')
const root = await mkdtemp(path.join(tmpdir(), 'bun-aot-package-manager-'))
try {
  const entry = path.join(root, 'app.js')
  await writeFile(entry, 'console.log("application entry")\n')
  for (const [mode, options] of [
    ['aot', {}],
    ['aot-trim-install', { trim: { allow: ['install'] } }],
    ['aot-trim-cli', { trim: { allow: ['cli'] } }],
  ]) {
    const outfile = path.join(root, mode + (process.platform === 'win32' ? '.exe' : ''))
    const build = await Bun.build({ entrypoints: [entry],
      compile: { outfile, executablePath: process.execPath, aot: true, ...options } })
    if (!build.success) throw new Error(build.logs.join('\n'))
    const child = Bun.spawn([outfile, 'pm', '--help'], {
      env: { ...process.env, BUN_BE_BUN: '1' }, stdout: 'pipe', stderr: 'pipe',
    })
    const [exit, stdout, stderr] = await Promise.all([
      child.exited, new Response(child.stdout).text(), new Response(child.stderr).text(),
    ])
    console.log(JSON.stringify({ mode, bytes: (await stat(outfile)).size, exit,
      packageManager: stdout.includes('Run package manager utilities'), stderr: stderr.trim() }))
  }
} finally {
  await rm(root, { recursive: true, force: true })
}
