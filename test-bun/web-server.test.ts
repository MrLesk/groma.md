import { expect, test } from 'bun:test'
import { execFileSync } from 'node:child_process'
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { EMPTY_WORK_SOURCE } from '@groma/work-source'
import { startWebViewer } from '../src/viewers/web/server.ts'

async function preparedViewer(fixture: string) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'groma-web-server-'))
  await cp(path.resolve(import.meta.dir, `../test/fixtures/${fixture}`), root, { recursive: true })
  const git = Bun.spawn(['git', 'init', '--quiet', root], { stdout: 'ignore', stderr: 'pipe' })
  expect(await git.exited).toBe(0)
  const viewer = await startWebViewer(root, { port: 0, workSource: EMPTY_WORK_SOURCE, scan: false })
  return { root, viewer }
}

test.concurrent('the viewer serves the operator loopback and refuses a rebound foreign Host', async () => {
  const { root, viewer } = await preparedViewer('empty-project')
  try {
    const port = Number(new URL(viewer.url).port)
    // A rebound name reaches the server only in the Host header; the connection still goes to this machine.
    const status = async (host: string) => (await fetch(`${viewer.url}/`, { headers: { Host: host } })).status
    expect(await status(`localhost:${port}`)).toBe(200)
    expect(await status(`127.0.0.1:${port}`)).toBe(200)
    expect(await status('evil.com')).toBe(403)
    expect(await status('localhost.evil.com')).toBe(403)
    expect(await status('localhost:4747@evil.com')).toBe(403)
  } finally {
    await viewer.close()
    await rm(root, { recursive: true, force: true })
  }
})

/** An address of this machine that another machine on its network connects to, when it has one. */
const networkAddress = Object.values(os.networkInterfaces()).flat()
  .find(address => address?.family === 'IPv4' && !address.internal)?.address

test.skipIf(networkAddress === undefined).concurrent('the viewer accepts no connection on a network address', async () => {
  const { root, viewer } = await preparedViewer('empty-project')
  try {
    const port = Number(new URL(viewer.url).port)
    // A client that is not a browser sends whatever Host it likes, so the Host check cannot keep it out.
    await expect(fetch(`http://${networkAddress}:${port}/`, { headers: { Host: `localhost:${port}` } })).rejects.toThrow()
  } finally {
    await viewer.close()
    await rm(root, { recursive: true, force: true })
  }
})

test.concurrent('state-changing requests from a foreign origin are refused; same-origin and bare clients pass', async () => {
  const { root, viewer } = await preparedViewer('empty-project')
  try {
    const port = Number(new URL(viewer.url).port)
    const post = (headers: Record<string, string>) => fetch(`${viewer.url}/scanners`, { method: 'POST', headers })
    expect((await post({ Origin: `http://localhost:${port + 1}` })).status).toBe(403)
    expect((await post({ Referer: 'https://evil.example/page' })).status).toBe(403)
    // Past the origin gate the request reaches the map: the same-origin and bare posts render the page.
    expect((await post({ Origin: `http://localhost:${port}` })).status).toBe(200)
    expect((await post({ Referer: `http://localhost:${port}/page` })).status).toBe(200)
    expect((await fetch(`${viewer.url}/scanners`, { method: 'POST' })).status).toBe(200)
  } finally {
    await viewer.close()
    await rm(root, { recursive: true, force: true })
  }
})

// The model owns this rule and test/architecture-model-errors.test.ts covers it. This is the one route-level check,
// kept on purpose at the route the external review found reading outside the repository.
test.concurrent('the comparison route refuses a commit whose code reference climbs out of the repository (the model rule, checked once at a route)', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'groma-web-server-compare-'))
  const root = path.join(temporary, 'project')
  const git = (...args: string[]) => execFileSync('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.test', ...args], { cwd: root, encoding: 'utf8' }).trim()
  let viewer: Awaited<ReturnType<typeof startWebViewer>> | undefined
  try {
    await cp(path.resolve(import.meta.dir, '../test/fixtures/source-view'), root, { recursive: true })
    await writeFile(path.join(temporary, 'outside.txt'), 'outside content')
    const orders = path.join(root, 'groma/systems/shop/containers/api/components/orders.md')
    const stored = await readFile(orders, 'utf8')
    git('init', '--quiet')
    git('config', 'core.autocrlf', 'false')
    // Only the commit names the file beside the repository; the working tree keeps the fixture's reference.
    await writeFile(orders, stored.replace('file: src/orders.ts', 'file: ../outside.txt'))
    git('add', '.')
    git('commit', '--quiet', '-m', 'Reference a file outside the repository')
    const commit = git('rev-parse', 'HEAD')
    await writeFile(orders, stored)
    viewer = await startWebViewer(root, { port: 0, workSource: EMPTY_WORK_SOURCE, scan: false })
    const compared = await fetch(`${viewer.url}/world.json?from=${commit}`)
    expect(compared.status).toBe(422)
    expect(await compared.text()).not.toContain('outside content')
  } finally {
    await viewer?.close()
    await rm(temporary, { recursive: true, force: true })
  }
})
