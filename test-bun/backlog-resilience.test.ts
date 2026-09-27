import { expect, test } from 'bun:test'
import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createBacklogPlugin } from '../plugins/work-sources/backlog/src/index.ts'
import { pinsOf } from '../src/work/pins.ts'
import { box, worldOf } from './helpers.ts'

const unit = { x: 0, y: 0, width: 1, height: 1 }

async function executable(root: string, name: string, source: string) {
  const file = path.join(root, name)
  await writeFile(file, `#!${process.execPath}\n${source}`)
  await chmod(file, 0o755)
  return file
}

function alive(pid: number) {
  const probe = Bun.spawnSync(['ps', '-p', String(pid), '-o', 'stat='])
  expect([0, 1], probe.stderr.toString()).toContain(probe.exitCode)
  const state = probe.stdout.toString().trim()
  // A terminated child can remain as a zombie until its new parent reaps it.
  return state !== '' && !state.startsWith('Z')
}

// The snapshots arrive on the child process's own clock; fake timers cannot drive spawned stdout, so the deadline below is a guard, not a wait.

test.skipIf(process.platform === 'win32').concurrent('the watch stream skips noise and keeps delivering snapshots', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'groma-backlog-stream-'))
  try {
    const command = await executable(root, 'backlog.js', `
      const args = process.argv.slice(2);
      if (args[0] === 'config') { console.log('To Do'); process.exit(0); }
      const snapshot = id => JSON.stringify({ tasks: [{ id, title: id, status: 'To Do', assignees: [], references: [], modifiedFiles: [], acceptanceCriteriaCount: 0, acceptanceCriteriaCompleted: 0, updatedAt: null }] });
      process.stdout.write('noise!! } "unclosed quote\\nlog line "quoted" }}\\n');
      console.log(snapshot('first'));
      setTimeout(() => process.stdout.write('more "noise }}\\n'), 20);
      setTimeout(() => { console.log(snapshot('second')); setInterval(() => {}, 1000) }, 40);
    `)
    const source = createBacklogPlugin(() => command).create(root)
    let updates = 0
    const second = Promise.withResolvers<void>()
    const watcher = source.watch(() => { if (++updates === 2) second.resolve() })
    const timer = setTimeout(() => second.reject(new Error(`Watch stream stopped after ${updates} updates`)), 3000)
    try {
      await second.promise
      const work = await source.read()
      expect(work.statuses).toEqual(['To Do'])
      expect(work.items.map(item => item.id)).toEqual(['second'])
    } finally { clearTimeout(timer); await watcher.close() }
  } finally { await rm(root, { recursive: true, force: true }) }
})
// The escalation lives on the platform clock (SIGTERM, then a real 5s grace, then SIGKILL); deterministic timers cannot signal a spawned child.

test.skipIf(process.platform === 'win32').concurrent('a watcher whose child ignores SIGTERM is killed on close after the grace period', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'groma-backlog-escalate-'))
  try {
    const command = await executable(root, 'backlog.js', `
      import { writeFileSync } from 'node:fs';
      writeFileSync('stub.pid', String(process.pid));
      process.on('SIGTERM', () => { /* ignores the graceful stop request */ });
      console.log(JSON.stringify({ tasks: [] }));
      setInterval(() => {}, 1000);
    `)
    const first = Promise.withResolvers<void>()
    const watcher = createBacklogPlugin(() => command).create(root).watch(() => first.resolve())
    const started = setTimeout(() => first.reject(new Error('Watcher did not emit its initial tasks')), 3000)
    try { await first.promise } finally { clearTimeout(started) }
    const nativePid = Number(await readFile(path.join(root, 'stub.pid'), 'utf8'))
    try {
      const start = Date.now()
      await watcher.close()
      expect(Date.now() - start).toBeGreaterThanOrEqual(4500)
      expect(alive(nativePid)).toBe(false)
    } finally { if (alive(nativePid)) process.kill(nativePid, 'SIGKILL') }
  } finally { await rm(root, { recursive: true, force: true }) }
}, 15000)

test.skipIf(process.platform === 'win32').concurrent('readItem rejects a task id with shell metacharacters before invoking the CLI', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'groma-backlog-id-'))
  try {
    const command = await executable(root, 'backlog.js', `
      import { appendFileSync } from 'node:fs';
      appendFileSync('invocations.txt', process.argv.slice(2).join(' ') + '\\n');
      if (process.argv[4] === 'TASK-1') {
        console.log(JSON.stringify({ task: { id: 'TASK-1' } }));
        process.exit(0);
      }
      console.error('unknown task'); process.exit(1);
    `)
    const source = createBacklogPlugin(() => command).create(root)
    await expect(source.readItem('TASK-1 & calc')).rejects.toThrow('Invalid task id')
    let invocations = ''
    try { invocations = await readFile(path.join(root, 'invocations.txt'), 'utf8') } catch { /* the CLI was never invoked */ }
    expect(invocations).not.toContain('&')
    expect(invocations).toBe('')
    const details = await source.readItem('TASK-1')
    expect(details.id).toBe('TASK-1')
  } finally { await rm(root, { recursive: true, force: true }) }
})

test.skipIf(process.platform === 'win32').concurrent('degenerate task fields are coerced to the work-source contract shape', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'groma-backlog-fields-'))
  try {
    const command = await executable(root, 'backlog.js', `
      const args = process.argv.slice(2);
      if (args[0] === 'config') { console.log('To Do'); process.exit(0); }
      if (args[0] === 'task' && args[1] === 'view') {
        console.log(JSON.stringify({ task: { id: args[2], description: null, acceptanceCriteria: null, definitionOfDone: [{ text: 'done', checked: 'yes' }], implementationPlan: 5, implementationNotes: null, comments: null } }));
        process.exit(0);
      }
      console.log(JSON.stringify({ tasks: [
        { id: 'TASK-1', title: null, status: null, assignees: null, references: null, modifiedFiles: null, acceptanceCriteriaCompleted: null, acceptanceCriteriaCount: null, updatedAt: null },
        { id: 'TASK-2', title: 'second', status: 'Done', modifiedFiles: 'src/api.ts' },
      ] }));
      process.exit(0);
    `)
    const source = createBacklogPlugin(() => command).create(root)
    const work = await source.read()
    expect(work.statuses).toEqual(['To Do'])
    expect(work.items[0]).toEqual({
      id: 'TASK-1',
      title: '',
      status: '',
      assignees: [],
      references: [],
      modifiedFiles: [],
      acceptanceCriteriaCompleted: 0,
      acceptanceCriteriaCount: 0,
      updatedAt: '',
    })
    expect(work.items[1]!.assignees).toEqual([])
    const world = worldOf([box('api', 'container', unit, { parent: 'observed:shop', code: [{ scanner: 'ts', file: 'src/api.ts' }] })])
    const pins = pinsOf(work.items, world, 'Done', 'To Do')
    expect(pins.map(pin => [pin.taskId, pin.assignee, pin.elementId])).toEqual([['TASK-2', null, 'observed:api']])
    const details = await source.readItem('TASK-2')
    expect(details).toEqual({
      id: 'TASK-2',
      description: '',
      acceptanceCriteria: [],
      definitionOfDone: [{ text: 'done', checked: false }],
      implementationPlan: '5',
      implementationNotes: '',
      comments: [],
    })
  } finally { await rm(root, { recursive: true, force: true }) }
})
