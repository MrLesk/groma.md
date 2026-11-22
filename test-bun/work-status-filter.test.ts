import assert from 'node:assert/strict'

import { test } from 'bun:test'

import {
  preservedWorkStatuses,
  toggleWorkStatus,
  workStatusFilters,
} from '../src/work/status-filter.ts'

const statuses = ['To Do', 'In Progress', 'Done']

test.concurrent('an unconfigured cold start cannot become an empty user filter choice', () => {
  const boot = workStatusFilters([], '', [])
  const arrived = workStatusFilters(
    statuses,
    'To Do',
    ['In Progress'],
    preservedWorkStatuses([], boot.enabled),
  )

  assert.deepEqual(arrived, { available: ['In Progress'], enabled: ['To Do', 'In Progress'] })
})

test.concurrent('a filter choice survives an empty snapshot and a later pin', () => {
  const initial = workStatusFilters(statuses, 'To Do', ['In Progress'])
  const disabled = toggleWorkStatus(initial, 'In Progress')
  const empty = workStatusFilters(statuses, 'To Do', [], disabled.enabled)
  const returned = workStatusFilters(statuses, 'To Do', ['In Progress'], empty.enabled)

  assert.deepEqual(returned, { available: ['In Progress'], enabled: ['To Do'] })
})
