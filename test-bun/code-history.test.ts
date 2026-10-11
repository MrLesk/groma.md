import { expect, test } from 'bun:test'
import { execFileSync } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { readCodeHistory } from '../src/history/code-history.ts'
import type { AnnotatedElement, ArchitectureGraph } from '../src/types.ts'

function component(id: string, files: string[]): AnnotatedElement {
  return {
    id, representationId: id, kind: 'component', title: id, overview: '', parent: null,
    children: [], external: false, origin: 'observed',
    code: files.map(file => ({ file, scanner: 'typescript' })),
  }
}

test.concurrent('code history counts a commit once per component, distinct authors and shared commits, skips merge commits and respects the window', async () => {
  const gitRoot = await mkdtemp(path.join(os.tmpdir(), 'groma-code-history-'))
  // The project sits one directory below the Git top level, so Git's own paths differ from the component's.
  const root = path.join(gitRoot, 'project')
  const architecture: ArchitectureGraph = {
    elements: [component('a', ['a.ts', 'extra.ts']), component('b', ['b.ts']), component('untouched', [])],
    relationships: [], flows: [],
  }
  // One identity creates every commit, as a hosting service's web merge does; only the author differs.
  const git = (...args: string[]) => execFileSync('git', ['-c', 'user.name=Merge', '-c', 'user.email=merge@example.test', ...args], { cwd: gitRoot, encoding: 'utf8' })
  const commit = (author: string) => {
    git('add', '.')
    git('commit', '--quiet', '-m', 'Source change', `--author=Fixture <${author}>`)
  }
  try {
    await mkdir(root)
    git('init', '--quiet')
    expect(await readCodeHistory(root, architecture, 10)).toBeNull()
    for (const file of ['a.ts', 'extra.ts', 'b.ts']) await writeFile(path.join(root, file), 'export const value = 1\n')
    commit('one@example.test')
    for (const file of ['a.ts', 'extra.ts']) await writeFile(path.join(root, file), 'export const value = 2\n')
    commit('two@example.test')
    await writeFile(path.join(root, 'README.md'), 'Unowned source change\n')
    commit('three@example.test')
    await writeFile(path.join(root, 'b.ts'), 'export const value = 2\n')
    commit('one@example.test')
    // A side branch changes a.ts once; its merge commit repeats that change under the merging identity.
    git('checkout', '--quiet', '-b', 'side')
    await writeFile(path.join(root, 'a.ts'), 'export const value = 3\n')
    commit('two@example.test')
    git('checkout', '--quiet', '-')
    git('merge', '--quiet', '--no-ff', '-m', 'Merge side', 'side')
    expect(await readCodeHistory(root, architecture, 10)).toEqual({
      window: 10,
      components: {
        a: { commits: 3, committers: 2, cochange: 1, peers: [{ id: 'b', commits: 1 }] },
        b: { commits: 2, committers: 1, cochange: 1, peers: [{ id: 'a', commits: 1 }] },
        untouched: { commits: 0, committers: 0, cochange: 0, peers: [] },
      },
    })
    // The three newest commits that are not merges: the side branch's, the last change of b.ts and the README's.
    const recent = await readCodeHistory(root, architecture, 3)
    expect(recent?.components.a).toEqual({ commits: 1, committers: 1, cochange: 0, peers: [] })
    expect(recent?.components.b).toEqual({ commits: 1, committers: 1, cochange: 0, peers: [] })
  } finally { await rm(gitRoot, { recursive: true, force: true }) }
})
