import assert from 'node:assert/strict'

import { test } from 'bun:test'

import { oneWriteAtATime } from '../src/viewers/web/atoms/write-form.ts'

test.concurrent('a second write of an approval bar does not start while the first is in flight', async () => {
  const states: boolean[] = []
  const writes = oneWriteAtATime(writing => states.push(writing))
  let started = 0
  let settle = (): void => {}
  const first = writes.run(() => new Promise<void>(resolve => {
    started += 1
    settle = resolve
  }))

  assert.equal(await writes.run(async () => { started += 1 }), 'ignored')
  assert.equal(started, 1)
  assert.equal(writes.writing, true)

  settle()
  assert.equal(await first, 'done')
  assert.equal(await writes.run(async () => { started += 1 }), 'done')
  assert.equal(started, 2)
  assert.deepEqual(states, [true, false, true, false])
})

test.concurrent('a failed write frees the approval bar for the next one', async () => {
  const writes = oneWriteAtATime(() => {})
  await assert.rejects(writes.run(async () => { throw new Error('refused') }), /refused/)
  assert.equal(writes.writing, false)
  assert.equal(await writes.run(async () => {}), 'done')
})
