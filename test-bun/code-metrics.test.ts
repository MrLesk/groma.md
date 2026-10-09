import { expect, test } from 'bun:test'
import { execFileSync } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { componentMetrics } from '../src/component-metrics.ts'
import { readCodeHistory } from '../src/history/code-metrics.ts'
import type { AnnotatedElement, ArchitectureGraph } from '../src/types.ts'

function component(id: string, files: string[], lines = 0): AnnotatedElement {
  return {
    id, representationId: id, kind: 'component', title: id, overview: '', parent: 'container',
    children: [], external: false, origin: 'observed', codeLines: lines,
    code: files.map(file => ({ file, scanner: 'typescript' })),
  }
}

function world(elements: AnnotatedElement[]): ArchitectureGraph {
  return {
    elements: [{ ...component('container', []), kind: 'container', parent: null }, ...elements],
    relationships: [], flows: [],
  }
}

test.concurrent('Git metrics deduplicate owned files, count distinct committers and pairs, and respect the window', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'groma-code-metrics-'))
  const architecture = world([component('a', ['a.ts', 'extra.ts']), component('b', ['b.ts']), component('untouched', [])])
  const git = (...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8' })
  const commit = (email: string) => {
    git('add', '.')
    git('-c', 'user.name=Fixture', '-c', `user.email=${email}`, 'commit', '--quiet', '-m', 'Source change')
  }
  try {
    git('init', '--quiet')
    expect(await readCodeHistory(root, architecture)).toBeNull()
    for (const file of ['a.ts', 'extra.ts', 'b.ts']) await writeFile(path.join(root, file), 'export const value = 1\n')
    commit('one@example.test')
    for (const file of ['a.ts', 'extra.ts']) await writeFile(path.join(root, file), 'export const value = 2\n')
    commit('two@example.test')
    await writeFile(path.join(root, 'README.md'), 'Unowned source change\n')
    commit('three@example.test')
    await writeFile(path.join(root, 'b.ts'), 'export const value = 2\n')
    commit('one@example.test')
    const history = await readCodeHistory(root, architecture)
    expect(history?.window).toBe(500)
    expect(history?.components).toEqual({
      a: { commits: 2, committers: 2, cochange: [{ id: 'b', commits: 1 }] },
      b: { commits: 2, committers: 1, cochange: [{ id: 'a', commits: 1 }] },
      untouched: { commits: 0, committers: 0, cochange: [] },
    })
    const recent = await readCodeHistory(root, architecture, 2)
    expect(recent?.window).toBe(2)
    expect(recent?.components.a).toEqual({ commits: 0, committers: 0, cochange: [] })
    expect(recent?.components.b).toEqual({ commits: 1, committers: 1, cochange: [] })
  } finally { await rm(root, { recursive: true, force: true }) }
})

test.concurrent('outliers require ten files and a strictly larger measure at least four times the container median', () => {
  const outliers = (counts: [number, number][]) => componentMetrics(world(counts.map(([files, lines], index) =>
    component(`part${index}`, Array.from({ length: files }, (_, file) => `${index}/${file}.ts`), lines)))).get('part0')!.outliers
  expect(outliers([[10, 400], [2, 100], [2, 100]])).toEqual(['files', 'lines of code'])
  expect(outliers([[9, 400], [2, 100], [2, 100]])).toEqual([])
  expect(outliers([[10, 399], [3, 100], [3, 100]])).toEqual([])
  expect(outliers([[10, 400], [1, 100], [3, 100], [4, 100]])).toEqual(['lines of code'])
  expect(outliers([[10, 0], [10, 0], [10, 0]])).toEqual([])
})
