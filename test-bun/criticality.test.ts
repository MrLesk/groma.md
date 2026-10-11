import { expect, test } from 'bun:test'
import { architectureFindingItems } from '../src/architecture-findings.ts'
import { criticalityMark, criticalTaskFindings, type Criticality } from '../src/criticality.ts'
import type { AnnotatedElement, ArchitectureElement, C4Kind, WorkItem } from '../src/types.ts'
import type { TaskFileDiff } from '../src/viewers/source/diff.ts'
import { placeSheet } from '../src/viewers/tui/projection-sheet.ts'
import { taskReviewFiles } from '../src/viewers/web/task-diff/priority.ts'
import { box, worldOf } from './helpers.ts'

const CELL = { x: 0, y: 0, width: 1, height: 1 }

// AC4: lint reports an in-progress or done task once for each critical component that owns one of its modified files.
test.concurrent('a critical change names each in-progress or done task with its critical component, never a task still to do', () => {
  const element = (id: string, kind: C4Kind, parentId: string | null, extra: Partial<ArchitectureElement> = {}): ArchitectureElement => ({
    id, kind, title: id, overview: '', parentId, external: false, code: [], status: 'stable', sourceFilename: `${id}.md`, ...extra,
  })
  const code = (...files: string[]) => files.map(file => ({ scanner: 'typescript', file }))
  const elements = [
    element('shop', 'system', null),
    element('api', 'container', 'shop', { declaredCriticality: 'critical' }),
    // payments inherits critical from its container; catalog overrides it.
    element('payments', 'component', 'api', { code: code('src/pay.ts', 'src/refund.ts') }),
    element('catalog', 'component', 'api', { declaredCriticality: 'normal', code: code('src/catalog.ts') }),
  ]
  const task = (id: string, status: string, ...modifiedFiles: string[]): WorkItem => ({
    id, title: id, status, assignees: [], references: [], modifiedFiles, acceptanceCriteriaCompleted: 0, acceptanceCriteriaCount: 0, updatedAt: '',
  })
  const printed = architectureFindingItems(criticalTaskFindings(elements, {
    statuses: ['To Do', 'In Progress', 'Done'],
    defaultStatus: 'To Do',
    items: [
      task('TASK-1', 'To Do', 'src/pay.ts'),
      task('TASK-2', 'In Progress', 'src/pay.ts', 'src/refund.ts'),
      task('TASK-3', 'Done', 'src/catalog.ts', 'src/pay.ts'),
      task('TASK-4', 'In Progress', 'src/catalog.ts'),
    ],
  }))
  expect(printed).toHaveLength(2)
  expect(printed[0]).toContain('TASK-2')
  expect(printed[1]).toContain('TASK-3')
  for (const item of printed) expect(item).toContain('payments')
})

// AC2: a task's changes list the most critical component first, then the component with the larger change.
test.concurrent('task review files follow their component: critical before normal, then the larger change', () => {
  const component = (id: string, file: string, criticality?: Criticality): AnnotatedElement => ({
    ...box(id, 'component', CELL, { code: [{ scanner: 'typescript', file }] }), ...(criticality === undefined ? {} : { criticality }),
  })
  const world = { flows: [], relationships: [], elements: [component('large', 'large.ts'), component('small', 'small.ts'), component('vital', 'vital.ts', 'critical')] }
  const changed = (file: string, additions: number): TaskFileDiff => ({ file, status: 'modified', additions, deletions: 0, hunks: [], shared: false })
  // The critical component has neither the largest nor the smallest change, so only its level can put it first.
  const ordered = taskReviewFiles([changed('small.ts', 1), changed('large.ts', 9), changed('vital.ts', 2)], world)
  expect(ordered.map(file => file.file)).toEqual(['vital.ts', 'large.ts', 'small.ts'])
})

// AC5: both maps show the mark of a high or critical building beside its title.
test.concurrent('a marked building keeps its mark on the first line of its title in the sheet and in the terminal map', () => {
  const world = worldOf([
    box('shop', 'system', CELL, { children: ['observed:api'] }),
    box('api', 'container', CELL, { parent: 'observed:shop', children: ['observed:word', 'observed:phrase'] }),
    // One long word cannot wrap; the phrase is long enough for the terminal to rewrap it.
    { ...box('word', 'component', CELL, { parent: 'observed:api', title: 'Internationalization' }), criticality: 'critical' as const },
    { ...box('phrase', 'component', CELL, { parent: 'observed:api', title: 'Stock reservation and availability' }), criticality: 'high' as const },
  ])
  const terminal = placeSheet(world, { container: 'observed:api', open: 'all' })
  for (const [id, level, firstWord] of [['word', 'critical', 'Internationalization'], ['phrase', 'high', 'Stock']] as const) {
    const sheetLines = world.sheet.buildings.find(building => building.id === id)!.lines
    const terminalLines = terminal.find(item => item.representationId === `observed:${id}`)!.lines
    for (const lines of [sheetLines, terminalLines]) {
      expect(lines[0]!.startsWith(criticalityMark(level))).toBe(true)
      expect(lines[0]).toContain(firstWord)
    }
  }
})
