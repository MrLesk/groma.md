import assert from 'node:assert/strict'
import { test } from 'bun:test'

import { createArchitectureSearch } from '../src/search.ts'
import {
  defaultSelection,
  detailsCommands,
  initialState,
  litAction,
  reduceViewer,
  selectMapItem,
  type ViewerState,
} from '../src/viewers/tui/navigation.ts'
import { reduceSearch } from '../src/viewers/tui/navigation-search.ts'
import { selectedWorkId } from '../src/viewers/tui/work/model.ts'
import { nearestInDirection } from '../src/viewers/tui/navigation-spatial.ts'
import { itemAt, projectWorld } from '../src/viewers/tui/projection.ts'
import { taskRecordView } from '../src/viewers/tui/panes/details.ts'
import { detailsContentWidth } from '../src/viewers/tui/layout.ts'
import { viewerTheme } from '../src/viewers/tui/atoms/theme.ts'
import {
  box,
  navigationWorld,
  terminalModel,
  uses,
  viewerFixtureRoot,
  worldOf,
} from './helpers.ts'

function actionWorld() {
  return worldOf([
    box('buyer', 'actor', { x: 0, y: 0, width: 1, height: 1 }),
    box('product', 'system', { x: 0, y: 0, width: 1, height: 1 }, {
      children: ['observed:api', 'observed:web', 'observed:jobs'],
    }),
    ...['api', 'web', 'jobs'].map(id => box(
      id,
      'container',
      { x: 0, y: 0, width: 1, height: 1 },
      { parent: 'observed:product' },
    )),
  ], [
    uses('buyer-api', 'buyer', 'api'),
    uses('buyer-web', 'buyer', 'web'),
    uses('api-web', 'api', 'web'),
    uses('api-jobs', 'api', 'jobs'),
  ])
}

test.concurrent('a map click selects the innermost drawn box, and a collapsed group opens on its first member', () => {
  const model = navigationWorld()
  const state = initialState(model)
  const root = projectWorld(model, { viewport: { x: 0, y: 0, width: 120, height: 36 }, currentId: state.currentId })
  const container = root.items.find(item => item.representationId === 'observed:cleft')!.cellBounds
  const hit = itemAt(root.items, container.x + 1, container.y + 1)!
  assert.equal(hit.representationId, 'observed:cleft', 'the collapsed container wins over its system island')
  const opened = reduceViewer(model, selectMapItem(model, state, hit.representationId!), 'enter')
  const inside = projectWorld(model, { viewport: { x: 0, y: 0, width: 120, height: 36 }, level: opened.level, currentId: opened.currentId })
  const card = inside.items.find(item => item.representationId === 'observed:pmid')!.cellBounds
  const picked = selectMapItem(model, opened, itemAt(inside.items, card.x + 1, card.y + 1)!.representationId!)
  assert.deepEqual([picked.level, picked.currentId], ['components', 'observed:pmid'])

  const grouped = worldOf([
    box('system', 'system', { x: 0, y: 0, width: 1, height: 1 }, { children: ['observed:service'] }),
    box('service', 'container', { x: 0, y: 0, width: 1, height: 1 }, { parent: 'observed:system', children: ['observed:read', 'observed:write'] }),
    box('read', 'component', { x: 0, y: 0, width: 1, height: 1 }, { parent: 'observed:service', group: 'Queries' }),
    box('write', 'component', { x: 0, y: 0, width: 1, height: 1 }, { parent: 'observed:service', group: 'Commands' }),
  ])
  const narrow = projectWorld(grouped, { viewport: { x: 0, y: 0, width: 20, height: 8 }, level: 'components', currentId: 'observed:read' })
  const group = narrow.items.find(item => item.members?.includes('observed:write'))!.cellBounds
  const member = itemAt(narrow.items, group.x + 1, group.y + 1)!
  assert.deepEqual(member.members, ['observed:write'], 'the collapsed group wins over the open container behind it')
})

/** Four buildings in two rows of two on the shared sheet. */
function laneNavigationWorld() {
  const ids = ['a', 'b', 'c', 'd']
  const cell = { x: 0, y: 0, width: 1, height: 1 }
  const model = worldOf([
    box('system', 'system', cell, { children: ['observed:container'] }),
    box('container', 'container', cell, { parent: 'observed:system', children: ids.map(id => `observed:${id}`) }),
    ...ids.map(id => box(id, 'component', cell, { parent: 'observed:container' })),
  ])
  return {
    ...model,
    sheet: {
      ...model.sheet,
      buildings: model.sheet.buildings.map(building => ({
        ...building,
        rect: { gx: (ids.indexOf(building.id) % 2) * 10, gy: Math.floor(ids.indexOf(building.id) / 2) * 8, w: 6, d: 4 },
      })),
    },
  }
}

test.concurrent('map navigation enters only containers and returns to the same container', () => {
  const model = navigationWorld()
  assert.equal(defaultSelection(model, 'context')?.representationId, 'observed:cleft')

  let state: ViewerState = {
    ...initialState(model),
    currentId: 'observed:cleft',
  }
  state = reduceViewer(model, state, 'enter')
  assert.deepEqual(
    { level: state.level, currentId: state.currentId },
    { level: 'components', currentId: 'observed:pleft' },
  )

  state = reduceViewer(model, state, 'right')
  assert.equal(state.currentId, 'observed:pmid')
  state = reduceViewer(model, state, 'leave')
  assert.deepEqual(
    { level: state.level, currentId: state.currentId },
    { level: 'context', currentId: 'observed:cleft' },
  )

  const actor = reduceViewer(model, {
    ...initialState(model),
    currentId: 'observed:ann',
  }, 'enter')
  assert.equal(actor.level, 'context')
  assert.equal(actor.focus, 'details')
})

test.concurrent('map edges preserve map focus until an explicit pane key', () => {
  const model = navigationWorld()
  const left = reduceViewer(model, {
    ...initialState(model),
    currentId: 'observed:ann',
  }, 'left')
  assert.equal(left.focus, 'architecture')
  assert.equal(left.tree.cursor, 'observed:ann')

  const right = reduceViewer(model, {
    ...initialState(model),
    currentId: 'observed:ext',
    panes: { hierarchy: true, details: false },
  }, 'right')
  assert.equal(right.focus, 'architecture')
  assert.equal(right.panes.details, false)
  assert.equal(reduceViewer(model, right, 'enter').focus, 'details')
})

test.concurrent('container arrows select only buildings in the pressed direction', () => {
  const model = laneNavigationWorld()
  const state: ViewerState = { ...initialState(model), level: 'components', currentId: 'observed:a' }

  assert.equal(reduceViewer(model, state, 'right').currentId, 'observed:b')
  assert.equal(reduceViewer(model, state, 'down').currentId, 'observed:c')
  assert.equal(reduceViewer(model, { ...state, currentId: 'observed:b' }, 'down').currentId, 'observed:d')
  assert.equal(reduceViewer(model, { ...state, currentId: 'observed:d' }, 'left').currentId, 'observed:c')
  assert.equal(reduceViewer(model, { ...state, currentId: 'observed:c' }, 'up').currentId, 'observed:a')
  assert.equal(reduceViewer(model, { ...state, currentId: 'observed:d' }, 'up').currentId, 'observed:b')

  const noRightCandidate = reduceViewer(model, { ...state, currentId: 'observed:b' }, 'right')
  assert.equal(noRightCandidate.currentId, 'observed:b')
  assert.equal(noRightCandidate.focus, 'architecture')
})

test.concurrent('root arrows choose the nearest box that way across the islands of the shared map', () => {
  const model = navigationWorld()
  const viewport = { x: 0, y: 0, width: 200, height: 60 }
  const root = projectWorld(model, { viewport })
  const bounds = (id: string) => root.items.find(item => item.representationId === id)!.worldBounds
  const start: ViewerState = { ...initialState(model), currentId: 'observed:cleft' }
  const west = reduceViewer(model, start, 'left')
  assert.equal(west.currentId, 'observed:ann')
  const east = reduceViewer(model, start, 'right')
  assert.equal(east.currentId, 'observed:cright')
  assert.ok(bounds('observed:cright').x >= bounds('observed:cleft').x + bounds('observed:cleft').width)
  const empty = reduceViewer(model, east, 'right')
  assert.equal(empty.currentId, 'observed:empty', 'a system with nothing on it is a stop of its own')
  assert.equal(reduceViewer(model, empty, 'right').currentId, 'observed:cfar')
  assert.equal(reduceViewer(model, west, 'right').currentId, 'observed:cleft')
})

test.concurrent('Escape returns to the map without changing pane visibility, scope or selection', () => {
  const model = navigationWorld()
  const state = reduceViewer(model, {
    ...initialState(model),
    focus: 'details',
  }, 'dismiss')

  assert.equal(state.panes.details, true)
  assert.equal(state.focus, 'architecture')

  const nested = reduceViewer(model, {
    ...initialState(model),
    level: 'components',
    currentId: 'observed:pleft',
    focus: 'details',
  }, 'dismiss')
  assert.equal(nested.level, 'components')
  assert.equal(nested.currentId, 'observed:pleft')
  assert.equal(nested.panes.details, true)
  assert.equal(nested.focus, 'architecture')
})

test.concurrent('search follows matches live and cancel restores the prior view', async () => {
  const model = await terminalModel(viewerFixtureRoot)
  const search = createArchitectureSearch(model.elements)
  const before = initialState(model)
  let state = reduceSearch(model, search, before, { type: 'open' })
  for (const char of 'view') state = reduceSearch(model, search, state, { type: 'char', char })
  const matches = state.search?.matches ?? []
  assert.deepEqual(
    matches.map(element => element.representationId).sort(),
    ['order-page', 'order-viewer', 'stock-page', 'stock-viewer'],
  )

  assert.equal(state.currentId, matches[0]!.representationId)
  assert.equal(state.level, 'context')
  state = reduceSearch(model, search, state, { type: 'next' })
  assert.equal(state.currentId, matches[1]!.representationId)

  const cancelled = reduceSearch(model, search, state, { type: 'cancel' })
  assert.equal(cancelled.search, undefined)
  assert.equal(cancelled.currentId, before.currentId)
})

test.concurrent('a one-row rectangle overlap selects the nearer card outside the centre cone', () => {
  const a = { x: 0, y: 0, width: 10, height: 8 }
  const b = { x: 11, y: 7, width: 10, height: 12 }
  const c = { x: 30, y: 0, width: 10, height: 8 }
  const anchors = new Map([['a', a], ['b', b], ['c', c]])
  assert.equal(nearestInDirection(anchors, 'a', a, 'right'), 'b')
  assert.equal(nearestInDirection(anchors, 'b', b, 'left'), 'a')
})

test.concurrent('Work focus keeps architecture and flow state while tasks own the side panes', () => {
  const base = actionWorld()
  const model = {
    ...base,
    work: {
      statuses: ['To Do', 'In Progress', 'Done'],
      defaultStatus: 'To Do',
      items: [
        {
          id: 'TASK-1', title: 'First', status: 'In Progress', assignees: [], references: ['api'], modifiedFiles: [],
          acceptanceCriteriaCompleted: 0, acceptanceCriteriaCount: 0, updatedAt: '2026-08-30T12:00:00Z',
        },
        {
          id: 'TASK-2', title: 'Second', status: 'In Progress', assignees: [], references: ['web'], modifiedFiles: [],
          acceptanceCriteriaCompleted: 0, acceptanceCriteriaCount: 0, updatedAt: '2026-08-30T12:00:00Z',
        },
      ],
    },
  }
  const before: ViewerState = {
    ...initialState(model),
    currentId: 'observed:product',
    focus: 'hierarchy',
    panes: { hierarchy: true, details: false },
    detailsScroll: 4,
    activeActionId: 'buyer-api',
    actionCursor: 'buyer-api',
  }

  let state = reduceViewer(model, before, 'toggle-work')
  assert.equal(state.currentId, before.currentId)
  assert.equal(state.focus, 'hierarchy')
  assert.equal(selectedWorkId(state.work), 'TASK-1')
  assert.equal(litAction(model, state).id, undefined)

  state = reduceViewer(model, state, 'down')
  assert.equal(selectedWorkId(state.work), 'TASK-2')
  state = reduceViewer(model, state, 'enter')
  assert.equal(state.focus, 'details')

  state = reduceViewer(model, state, 'toggle-work')
  assert.equal(state.work, undefined)
  assert.equal(state.currentId, before.currentId)
  assert.equal(state.focus, 'architecture')
  assert.deepEqual(state.panes, before.panes)
  assert.equal(state.detailsScroll, before.detailsScroll)
  assert.equal(state.actionCursor, before.actionCursor)
  assert.equal(litAction(model, state).id, 'buyer-api')
})

test.concurrent('component Tasks and global Work open the same record, diff and architecture reference', () => {
  const model = { ...navigationWorld(), work: {
    statuses: ['To Do', 'In Progress', 'Done'], defaultStatus: 'To Do', items: [{
      id: 'TASK-1', title: 'Change a component', status: 'In Progress', assignees: [],
      references: ['pmid'], modifiedFiles: ['src/change.ts'],
      acceptanceCriteriaCompleted: 1, acceptanceCriteriaCount: 2, updatedAt: '2026-09-04T12:00:00Z',
    }],
  } }
  const before: ViewerState = { ...initialState(model), currentId: 'observed:pmid', level: 'components', focus: 'details' }
  let component = reduceViewer(model, before, 'tab')
  component = reduceViewer(model, component, 'tab')
  assert.equal(component.detailsTab, 'tasks')
  component = reduceViewer(model, component, 'down')
  component = reduceViewer(model, component, 'down')
  component = reduceViewer(model, component, 'enter')
  const global = reduceViewer(model, reduceViewer(model, initialState(model), 'toggle-work'), 'enter')
  assert.deepEqual(component.taskRecord, global.taskRecord)
  assert.equal(selectedWorkId(component.work), selectedWorkId(global.work))
  assert.equal(component.currentId, before.currentId)
  component = { ...component, taskRecord: { id: 'TASK-1', row: 0, details: { id: 'TASK-1', description: '', acceptanceCriteria: [], definitionOfDone: [], implementationPlan: '', implementationNotes: '', comments: [] } } }
  const rows = taskRecordView(viewerTheme(), model.work.items[0]!, component.taskRecord!.details, detailsContentWidth(component), undefined)
  const readTo = (id: string) => {
    const row = rows.ids!.indexOf(id)
    assert.ok(row >= 0)
    while (component.taskRecord!.row < row) component = reduceViewer(model, component, 'down')
  }
  readTo('src/change.ts')
  component = reduceViewer(model, component, 'enter')
  assert.equal(component.diffView?.file, 'src/change.ts')
  assert.equal(component.taskRecord?.id, 'TASK-1')
  component = reduceViewer(model, component, 'dismiss')
  readTo('pmid')
  component = reduceViewer(model, component, 'enter')
  assert.equal(component.work, undefined)
  assert.equal(component.taskRecord, undefined)
  assert.equal(component.currentId, 'observed:pmid')
  assert.equal(component.level, 'components')
})

test.concurrent('folding the Backlog hierarchy leaves map arrows usable', () => {
  const model = actionWorld()
  const before = initialState(model)
  let state = reduceViewer(model, before, 'toggle-work')
  state = reduceViewer(model, state, 'toggle-hierarchy')
  assert.equal(state.focus, 'architecture')
  const expected = reduceViewer(model, before, 'down')
  state = reduceViewer(model, state, 'down')
  assert.equal(state.currentId, expected.currentId)
  assert.notEqual(state.currentId, before.currentId)
  assert.equal(state.focus, 'architecture')
})

test.concurrent('How navigates declarations while What follows a selected relationship', () => {
  const base = navigationWorld()
  const model = { ...base, relationships: [uses('read', 'ann', 'pleft')] }
  let state: ViewerState = {
    ...initialState(model), currentId: 'observed:pleft', focus: 'details', detailsTab: 'how',
    codeStructure: { elementId: 'observed:pleft', files: [{ file: 'src/part.ts', declarations: [
      { kind: 'function', name: 'run', line: 8, visibility: 'public', entry: true },
      { kind: 'function', name: 'save', line: 18, visibility: 'public', entry: false },
    ] }] },
  }
  assert.deepEqual(detailsCommands(model, state), [])
  state = reduceViewer(model, state, 'down')
  state = reduceViewer(model, state, 'down')
  state = reduceViewer(model, state, 'enter')
  assert.equal(state.sourceView?.line, 18)
  state = reduceViewer(model, state, 'dismiss')
  state = reduceViewer(model, state, 'up')
  state = reduceViewer(model, state, 'enter')
  assert.equal(state.sourceView?.line, 8)
  state = reduceViewer(model, state, 'dismiss')
  state = { ...state, focus: 'details', detailsTab: 'what', actionCursor: undefined }
  assert.deepEqual(detailsCommands(model, state).map(item => item.id), ['read'])
  state = reduceViewer(model, state, 'down')
  assert.equal(state.activeActionId, undefined)
  state = reduceViewer(model, state, 'enter')
  assert.equal(state.activeActionId, 'read')
  state = reduceViewer(model, state, 'enter')
  assert.equal(state.activeActionId, 'read')
  assert.equal(state.currentId, 'observed:ann')
})

test.concurrent('a newly opened element starts on its first details tab while a key that keeps the selection keeps the tab', () => {
  const model = navigationWorld()
  const onHow: ViewerState = { ...initialState(model), level: 'components', currentId: 'observed:pleft', detailsTab: 'how' }
  const neighbour = reduceViewer(model, onHow, 'right')
  assert.equal(neighbour.currentId, 'observed:pmid')
  assert.equal(neighbour.detailsTab, 'what')
  const stayed = reduceViewer(model, onHow, 'up')
  assert.equal(stayed.currentId, 'observed:pleft')
  assert.equal(stayed.detailsTab, 'how')
})
