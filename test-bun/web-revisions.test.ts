import { expect, test } from 'bun:test'
import { execFileSync } from 'node:child_process'
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { EMPTY_WORK_SNAPSHOT } from '@groma/work-source'
import { createWebMapSession } from '../src/viewers/web/map-session.ts'
import type { WebPayload, WebRevision } from '../src/viewers/web/payload.ts'
import { listGromaRevisions } from '../src/history/revisions.ts'

test.concurrent('web history includes source-only commits and reads the selected snapshot without changing checkout', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'groma-web-revisions-'))
  const git = (...args: string[]) => execFileSync('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.test', ...args], { cwd: root, encoding: 'utf8' }).trim()
  let session: Awaited<ReturnType<typeof createWebMapSession>> | undefined
  try {
    console.error('WEB line 16', performance.now())
    git('init', '--quiet')
    console.error('WEB line 17', performance.now())
    git('config', 'core.autocrlf', 'false')
    console.error('WEB line 18', performance.now())
    await writeFile(path.join(root, 'README.md'), 'No architecture yet')
    console.error('WEB line 19', performance.now())
    git('add', '.')
    console.error('WEB line 20', performance.now())
    git('commit', '--quiet', '-m', 'Before architecture')
    console.error('WEB line 21', performance.now())
    const unsupported = git('rev-parse', 'HEAD')
    await cp(path.resolve(import.meta.dir, '../test/fixtures/source-view'), root, { recursive: true })
    console.error('WEB line 23', performance.now())
    git('add', '.')
    console.error('WEB line 24', performance.now())
    git('commit', '--quiet', '-m', 'Architecture snapshot')
    console.error('WEB line 25', performance.now())
    const before = git('rev-parse', 'HEAD')
    const original = await readFile(path.join(root, 'src/orders.ts'), 'utf8')
    const source = 'export const receipt = "changed source"\n'
    console.error('WEB line 28', performance.now())
    await writeFile(path.join(root, 'src/orders.ts'), source)
    console.error('WEB line 29', performance.now())
    git('add', '.')
    console.error('WEB line 30', performance.now())
    git('commit', '--quiet', '-m', 'Source-only receipt update', '-m', 'The architecture is unchanged.')
    console.error('WEB line 31', performance.now())
    const after = git('rev-parse', 'HEAD')
    console.error('WEB line 32', performance.now())
    const terminalHistory = await listGromaRevisions(root)
    expect(terminalHistory.map(revision => revision.id)).toEqual([before])
    expect(terminalHistory[0]?.compatible).toBe(true)
    console.error('WEB line 35', performance.now())
    session = await createWebMapSession(root, { scan: false, workSource: {
      async read() { return EMPTY_WORK_SNAPSHOT },
      async readItem() { throw new Error('No task') },
      watch() { return { close() {} } },
    } })
    const request = (url: string) => session!.fetch(new Request(`http://localhost${url}`))
    console.error('WEB line 41', performance.now())
    const revisions = await (await request('/revisions.json')).json() as WebRevision[]
    expect(revisions.map(revision => revision.id)).toEqual([after, before, unsupported])
    expect(revisions[0]?.body).toBe('The architecture is unchanged.')
    console.error('WEB line 44', performance.now())
    const selected = await (await request(`/world.json?revision=${before}`)).json() as WebPayload
    const component = selected.world.elements.find(element => element.kind === 'component')!
    expect(selected.revision?.id).toBe(before)
    expect(selected.work.items).toEqual([])
    const query = new URLSearchParams({ element: component.representationId, file: 'src/orders.ts' })
    console.error('WEB line 49', performance.now())
    const oldSource = await (await request(`/source.json?${query}&revision=${before}`)).json()
    console.error('WEB line 50', performance.now())
    const newSource = await (await request(`/source.json?${query}&revision=${after}`)).json()
    expect(oldSource.source).toBe(original)
    expect(newSource.source).toBe(source)
    expect((await request(`/world.json?revision=${unsupported}`)).status).toBe(422)
    console.error('WEB line 54', performance.now())
    const comparison = await (await request(`/world.json?from=${before}&revision=${after}`)).json() as WebPayload
    expect(comparison.comparison?.from?.id).toBe(before)
    expect(comparison.comparison?.components[component.id]?.status).toBe('modified')
    // A request naming the newer commit as the start opens the same comparison, from the older commit.
    console.error('WEB line 58', performance.now())
    const reversed = await (await request(`/world.json?from=${after}&revision=${before}`)).json() as WebPayload
    expect([reversed.comparison?.from?.id, reversed.revision?.id]).toEqual([before, after])
    expect(comparison.work.items).toEqual([])
    console.error('WEB line 61', performance.now())
    const pairedSource = await (await request(`/source.json?${query}&from=${before}&revision=${after}`)).json()
    expect(pairedSource.source).toBe(source)
    expect((await request(`/world.json?from=${after}&revision=${after}`)).status).toBe(400)
    console.error('WEB line 64', performance.now())
    expect(git('rev-parse', 'HEAD')).toBe(after)
    console.error('WEB line 65', performance.now())
    expect(git('status', '--porcelain')).toBe('')
    console.error('WEB line 66', performance.now())
    const reader = (await request('/events')).body!.getReader()
    try {
      console.error('WEB line 68', performance.now())
      await reader.read()
      console.error('WEB line 69', performance.now())
      await writeFile(path.join(root, 'src/orders.ts'), 'export const receipt = "live change"\n')
      let event = ''
      console.error('WEB line 71', performance.now())
      while (!event.startsWith('event: world')) {
        console.error('WEB line 72', performance.now())
        event = new TextDecoder().decode((await reader.read()).value)
      }
      console.error('WEB line 74', performance.now())
      const live = await (await request(`/world.json?from=${after}`)).json() as WebPayload
      expect(live.revision).toBeNull()
      expect(live.comparison?.components[component.id]?.status).toBe('modified')
      expect(live.generation).toBeGreaterThan(selected.generation)
    } finally { await reader.cancel() }
  } finally {
    console.error('WEB line 80', performance.now())
    await session?.close()
    await rm(root, { recursive: true, force: true })
  }
})
