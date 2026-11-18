import assert from 'node:assert/strict'

import { test } from 'bun:test'

import { editEntry } from '../src/viewers/web/organisms/commands.ts'

/** The Edit of elements whose colors differ: the Color field opens without a value. Returns what Save sends. */
async function saveMixedColor(formValues: Record<string, string>): Promise<unknown[]> {
  const sent: unknown[] = []
  const edit = editEntry([{ name: 'color', label: 'Color', value: undefined, choices: [] }], async changes => { sent.push(changes) })
  await edit.view.write(formValues)
  return sent
}

test.concurrent('Save leaves a mixed color nobody picked in and clears it on all when no color is picked', async () => {
  assert.deepEqual(await saveMixedColor({}), [])
  assert.deepEqual(await saveMixedColor({ color: '' }), [{ color: '' }])
})
