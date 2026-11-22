import assert from 'node:assert/strict'

import { test } from 'bun:test'

import { createDetailsExpansion } from '../src/viewers/web/chrome/shell.ts'
test.concurrent('file inspection widens the reader until an explicit panel choice is made', () => {
  const panel = createDetailsExpansion()
  assert.equal(panel.expanded(false), false)
  assert.equal(panel.expanded(true), true)
  assert.equal(panel.expanded(false), false)

  panel.toggle(true)
  assert.equal(panel.expanded(true), false)
  assert.equal(panel.expanded(false), false)
  // Reopening another source or diff cannot override the explicit compact choice.
  assert.equal(panel.expanded(true), false)
})

test.concurrent('manual expansion belongs to the panel across content and file returns', () => {
  const panel = createDetailsExpansion()
  panel.toggle(false)
  assert.equal(panel.expanded(false), true)
  assert.equal(panel.expanded(true), true)
  assert.equal(panel.expanded(false), true)
  panel.toggle(false)
  assert.equal(panel.expanded(false), false)
  assert.equal(panel.expanded(true), false)
})
