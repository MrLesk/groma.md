import { expect, test } from 'bun:test'
import { cp, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { loadAnnotatedArchitecture } from '../src/core.ts'
import { criticalityLevels, type Criticality } from '../src/criticality.ts'
import { sheetScene } from '../src/sheet/scene.ts'
import { viewerTheme } from '../src/viewers/tui/atoms/theme.ts'
import { detailsLines } from '../src/viewers/tui/panes/details.ts'

/**
 * The details pane of the fixture component that has a relationship, at the ordinary 28 content columns.
 * Each test loads its own copy of the fixture, which other tests copy and edit at the same time.
 */
async function detailsOf() {
  const root = await mkdtemp(path.join(tmpdir(), 'groma-tui-criticality-'))
  await cp(path.resolve(import.meta.dir, '../test/fixtures/edit'), root, { recursive: true })
  const architecture = await loadAnnotatedArchitecture(root).finally(() => rm(root, { recursive: true, force: true }))
  const world = { ...architecture, sheet: sheetScene(architecture) }
  const relationship = world.relationships[0]!
  const element = world.elements.find(element => element.representationId === relationship.source)!
  const pane = (level: Criticality, actionCursor?: string) => {
    element.criticality = level
    return detailsLines(viewerTheme(), element, world, 28, 'what', undefined, actionCursor, undefined)
  }
  return { pane, relationship }
}

// AC5: the pane names the effective level on one line that fits its width; normal, the default, has no line.
test.concurrent('terminal details name every level except normal on one line that fits 28 columns', async () => {
  const { pane } = await detailsOf()
  for (const level of criticalityLevels) {
    const naming = pane(level).lines.map(line => line.map(chunk => chunk.text).join('')).filter(line => line.endsWith(` ${level}`))
    expect(naming).toHaveLength(level === 'normal' ? 0 : 1)
    for (const line of naming) expect(line.length).toBeLessThanOrEqual(28)
  }
})

test.concurrent('the details cursor rests on the same row with and without the level line', async () => {
  const { pane, relationship } = await detailsOf()
  const cursorRow = (level: Criticality) => {
    const { lines, cursor } = pane(level, relationship.id)
    return lines[cursor!]
  }
  const withoutLevelLine = cursorRow('normal')
  expect(withoutLevelLine).toBeDefined()
  expect(cursorRow('critical')).toEqual(withoutLevelLine)
})
