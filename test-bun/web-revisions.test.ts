import { expect, test } from 'bun:test'
import { execFileSync } from 'node:child_process'
import { cp, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { EMPTY_WORK_SNAPSHOT } from '@groma/work-source'
import { createWebMapSession } from '../src/viewers/web/map-session.ts'
import type { WebPayload, WebRevision } from '../src/viewers/web/payload.ts'
import { listGromaRevisions } from '../src/history/revisions.ts'

const fixture = path.resolve(import.meta.dir, '../test/fixtures/source-view')

function gitIn(root: string) {
  return (...args: string[]) => execFileSync('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.test', ...args], { cwd: root, encoding: 'utf8' }).trim()
}

function openSession(root: string) {
  return createWebMapSession(root, { scan: false, workSource: {
    async read() { return EMPTY_WORK_SNAPSHOT },
    async readItem() { throw new Error('No task') },
    watch() { return { close() {} } },
  } })
}

test.concurrent('web history includes source-only commits and reads the selected snapshot without changing checkout', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'groma-web-revisions-'))
  const git = gitIn(root)
  let session: Awaited<ReturnType<typeof createWebMapSession>> | undefined
  try {
    git('init', '--quiet')
    git('config', 'core.autocrlf', 'false')
    await writeFile(path.join(root, 'README.md'), 'No architecture yet')
    git('add', '.')
    git('commit', '--quiet', '-m', 'Before architecture')
    const unsupported = git('rev-parse', 'HEAD')
    await cp(fixture, root, { recursive: true })
    git('add', '.')
    git('commit', '--quiet', '-m', 'Architecture snapshot')
    const before = git('rev-parse', 'HEAD')
    const original = await readFile(path.join(root, 'src/orders.ts'), 'utf8')
    const source = 'export const receipt = "changed source"\n'
    await writeFile(path.join(root, 'src/orders.ts'), source)
    git('add', '.')
    git('commit', '--quiet', '-m', 'Source-only receipt update', '-m', 'The architecture is unchanged.')
    const after = git('rev-parse', 'HEAD')
    const terminalHistory = await listGromaRevisions(root)
    expect(terminalHistory.map(revision => revision.id)).toEqual([before])
    expect(terminalHistory[0]?.compatible).toBe(true)
    session = await openSession(root)
    const request = (url: string) => session!.fetch(new Request(`http://localhost${url}`))
    const revisions = await (await request('/revisions.json')).json() as WebRevision[]
    expect(revisions.map(revision => revision.id)).toEqual([after, before, unsupported])
    expect(revisions[0]?.body).toBe('The architecture is unchanged.')
    const selected = await (await request(`/world.json?revision=${before}`)).json() as WebPayload
    const component = selected.world.elements.find(element => element.kind === 'component')!
    expect(selected.revision?.id).toBe(before)
    expect(selected.work.items).toEqual([])
    const query = new URLSearchParams({ element: component.representationId, file: 'src/orders.ts' })
    const oldSource = await (await request(`/source.json?${query}&revision=${before}`)).json()
    const newSource = await (await request(`/source.json?${query}&revision=${after}`)).json()
    expect(oldSource.source).toBe(original)
    expect(newSource.source).toBe(source)
    expect((await request(`/world.json?revision=${unsupported}`)).status).toBe(422)
    const comparison = await (await request(`/world.json?from=${before}&revision=${after}`)).json() as WebPayload
    expect(comparison.comparison?.from?.id).toBe(before)
    expect(comparison.comparison?.components[component.id]?.status).toBe('modified')
    // A request naming the newer commit as the start opens the same comparison, from the older commit.
    const reversed = await (await request(`/world.json?from=${after}&revision=${before}`)).json() as WebPayload
    expect([reversed.comparison?.from?.id, reversed.revision?.id]).toEqual([before, after])
    expect(comparison.work.items).toEqual([])
    const pairedSource = await (await request(`/source.json?${query}&from=${before}&revision=${after}`)).json()
    expect(pairedSource.source).toBe(source)
    expect((await request(`/world.json?from=${after}&revision=${after}`)).status).toBe(400)
    // A commit that is still extracted serves historical details without reading Git again.
    const gitDirectory = path.join(root, '.git')
    const heldGitDirectory = path.join(root, '.cached-git')
    await rename(gitDirectory, heldGitDirectory)
    try {
      const code = await request(`/code.json?element=${component.representationId}&revision=${before}`)
      expect(code.status).toBe(200)
      const cachedSource = await (await request(`/source.json?${query}&revision=${before}`)).json()
      expect(cachedSource.source).toBe(original)
    } finally { await rename(heldGitDirectory, gitDirectory) }
    expect(git('rev-parse', 'HEAD')).toBe(after)
    expect(git('status', '--porcelain')).toBe('')
    const reader = (await request('/events')).body!.getReader()
    try {
      await reader.read()
      await writeFile(path.join(root, 'src/orders.ts'), 'export const receipt = "live change"\n')
      let event = ''
      while (!event.startsWith('event: world')) {
        event = new TextDecoder().decode((await reader.read()).value)
      }
      const live = await (await request(`/world.json?from=${after}`)).json() as WebPayload
      expect(live.revision).toBeNull()
      expect(live.comparison?.components[component.id]?.status).toBe('modified')
      expect(live.generation).toBeGreaterThan(selected.generation)
    } finally { await reader.cancel() }
  } finally {
    await session?.close()
    await rm(root, { recursive: true, force: true })
  }
})

test.concurrent('web history keeps few commits extracted, retries a failed read, and lists a playback range without reading its middle', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'groma-web-archives-'))
  const git = gitIn(root)
  const commit = (message: string) => { git('add', '--all'); git('commit', '--quiet', '-m', message); return git('rev-parse', 'HEAD') }
  let session: Awaited<ReturnType<typeof createWebMapSession>> | undefined
  try {
    git('init', '--quiet')
    git('config', 'core.autocrlf', 'false')
    await cp(fixture, root, { recursive: true })
    const readable = [commit('Architecture')]
    const project = path.join(root, 'groma/project.md')
    const profile = await readFile(project, 'utf8')
    await rm(project)
    const unreadable = commit('Architecture without its project document')
    await writeFile(project, profile)
    // More readable commits than the host keeps extracted at once.
    for (let receipt = 1; receipt <= 5; receipt++) {
      await writeFile(path.join(root, 'src/orders.ts'), `export const receipt = ${receipt}\n`)
      readable.push(commit(`Receipt ${receipt}`))
    }
    const [oldest, newest] = [readable[0]!, readable.at(-1)!]
    session = await openSession(root)
    const status = async (url: string) => (await session!.fetch(new Request(`http://localhost${url}`))).status
    const range = await session.fetch(new Request(`http://localhost/playback.json?from=${oldest}&revision=${newest}`))
    expect((await range.json() as WebRevision[]).map(revision => revision.id)).toEqual([oldest, unreadable, ...readable.slice(1)])
    expect(await status(`/playback.json?from=${unreadable}&revision=${newest}`)).toBe(422)
    for (const id of readable) expect(await status(`/world.json?revision=${id}`)).toBe(200)
    // With Git out of reach, only a commit that is still extracted can be served.
    const gitDirectory = path.join(root, '.git')
    const heldGitDirectory = path.join(root, '.held-git')
    await rename(gitDirectory, heldGitDirectory)
    try {
      expect(await status(`/world.json?revision=${newest}`)).toBe(200)
      // The oldest commit was closed, and a Git failure is a server error, not an unreadable architecture.
      expect(await status(`/world.json?revision=${oldest}`)).toBe(500)
    } finally { await rename(heldGitDirectory, gitDirectory) }
    expect(await status(`/world.json?revision=${oldest}`)).toBe(200)
  } finally {
    await session?.close()
    await rm(root, { recursive: true, force: true })
  }
})
