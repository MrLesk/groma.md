import { expect, test } from 'bun:test'
import { execFileSync } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import type { WorkItem } from '../src/types.ts'
import { readTaskDiff } from '../src/viewers/source/diff.ts'
import { projectFileDiff } from '../src/viewers/source/diff-lines.ts'

test.concurrent('a unified diff preserves context and independent old and new line numbers', () => {
  const file = projectFileDiff('receipt.fixture', 'first\nold\nlast\n', 'first\nnew\nextra\nlast\n')
  expect(file.status).toBe('modified')
  expect([file.additions, file.deletions]).toEqual([2, 1])
  expect(file.hunks.flatMap(hunk => hunk.lines)).toEqual([
    { kind: 'context', oldLine: 1, newLine: 1, text: 'first' },
    { kind: 'removed', oldLine: 2, text: 'old' },
    { kind: 'added', newLine: 2, text: 'new' },
    { kind: 'added', newLine: 3, text: 'extra' },
    { kind: 'context', oldLine: 3, newLine: 4, text: 'last' },
  ])
})

test.concurrent('added and removed files include complete content while unchanged files have no hunks', () => {
  const content = `${Array.from({ length: 12 }, (_, i) => `line ${i + 1}`).join('\n')}\n`
  const added = projectFileDiff('receipt.fixture', undefined, content)
  const removed = projectFileDiff('receipt.fixture', content, undefined)
  expect(added.status).toBe('added')
  expect(removed.status).toBe('removed')
  expect(added.hunks.flatMap(hunk => hunk.lines).map(line => line.text).join('\n')).toBe(content.trimEnd())
  expect(removed.hunks.flatMap(hunk => hunk.lines).map(line => line.text).join('\n')).toBe(content.trimEnd())
  expect(added.additions).toBe(12)
  expect(removed.deletions).toBe(12)
  expect(added.hunks.flatMap(hunk => hunk.lines).every(line => line.kind === 'added' && line.oldLine === undefined)).toBe(true)
  expect(removed.hunks.flatMap(hunk => hunk.lines).every(line => line.kind === 'removed' && line.newLine === undefined)).toBe(true)
  expect(projectFileDiff('receipt.fixture', content, content).hunks).toEqual([])
})

test.concurrent('an open task reads its modified files from the working tree, and never one named outside the repository', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'groma-task-diff-'))
  const root = path.join(temporary, 'project')
  const git = (...args: string[]) => execFileSync('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.test', ...args], { cwd: root })
  try {
    await mkdir(root)
    await writeFile(path.join(root, 'inside.txt'), 'committed\n')
    await writeFile(path.join(temporary, 'outside.txt'), 'outside content\n')
    git('init', '--quiet')
    git('add', '.')
    git('commit', '--quiet', '-m', 'Fixture')
    await writeFile(path.join(root, 'inside.txt'), 'edited\n')
    const item: WorkItem = { id: 'TASK-1', title: 'Edit', status: 'To Do', assignees: [], references: [],
      modifiedFiles: ['../outside.txt', 'inside.txt'], acceptanceCriteriaCompleted: 0, acceptanceCriteriaCount: 0, updatedAt: '' }
    const diff = await readTaskDiff(root, item, { statuses: ['To Do', 'Done'], defaultStatus: 'To Do', items: [item] })
    // The file beside the repository reads as absent, like a missing one; main reports it as added, with its content.
    expect(diff.files.map(file => [file.file, file.status])).toEqual([['../outside.txt', 'unchanged'], ['inside.txt', 'modified']])
  } finally { await rm(temporary, { recursive: true, force: true }) }
})
