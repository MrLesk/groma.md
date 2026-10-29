import assert from 'node:assert/strict'
import { test } from 'bun:test'
import { architectureIcons } from '../src/architecture-icons.ts'
import { matchingArchitectureIcons } from '../src/viewers/web/organisms/icon-catalog.ts'

test.concurrent('icon browsing searches names, exact IDs and categories without changing the catalog', () => {
  const ids = (query: string) => matchingArchitectureIcons(query).map(icon => icon.id)
  assert.deepEqual(ids('  EXTERNAL SYSTEM  '), ['groma:external'])
  assert.deepEqual(ids('groma:queue'), ['groma:queue'])
  assert.ok(ids('people').includes('groma:person'))
  assert.ok(!ids('people').includes('groma:database'))
  assert.deepEqual(ids('no matching architecture icon'), [])
  assert.deepEqual(matchingArchitectureIcons('   '), architectureIcons)
})
