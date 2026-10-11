import { expect, test } from 'bun:test'
import { createTestRenderer } from '@opentui/core/testing'
import { loadAnnotatedArchitecture } from '../src/core.ts'
import { criticalityLevels, type Criticality } from '../src/criticality.ts'
import { sheetScene } from '../src/sheet/scene.ts'
import { viewerTheme } from '../src/viewers/tui/atoms/theme.ts'
import { detailsLines } from '../src/viewers/tui/panes/details.ts'
import { mountScreen } from '../src/viewers/tui/panes/screen.ts'

async function fixtureWorld() {
  const architecture = await loadAnnotatedArchitecture(new URL('../test/fixtures/edit/', import.meta.url).pathname)
  return { ...architecture, sheet: sheetScene(architecture) }
}

// AC5: the ordinary fixed-width details pane shows the complete effective level; normal, the default, has no line.
test.concurrent('terminal details show every level except normal, readable at 28 content columns', async () => {
  const world = await fixtureWorld()
  const element = world.elements.find(element => element.kind === 'component')!
  const setup = await createTestRenderer({ width: 180, height: 30 })
  const theme = viewerTheme()
  const screen = mountScreen(setup.renderer, theme, {
    onMapResize() {}, onHierarchyRow() {}, onMapCell() {}, onMapPan() {},
  })
  try {
    for (const level of criticalityLevels) {
      element.criticality = level
      screen.apply({
        layout: { map: true, hierarchy: false, details: true, detailsWidth: 32, mapWidth: 146 },
        focus: 'architecture', footer: '', stats: undefined, hierarchy: undefined, legend: undefined, recap: undefined,
        details: { title: element.title, titleColor: theme.foreground, tab: 0, scroll: 0,
          lines: detailsLines(theme, element, world, 28, 'what', undefined, undefined, undefined) },
      })
      await setup.flush()
      const details = setup.captureCharFrame().split('\n').map(row => row.slice(-32)).join('\n')
      expect(details.includes(level)).toBe(level !== 'normal')
    }
  } finally {
    screen.destroy()
    setup.renderer.destroy()
  }
})

test.concurrent('the details cursor rests on the same row with and without the level line', async () => {
  const world = await fixtureWorld()
  const relationship = world.relationships[0]!
  const element = world.elements.find(element => element.representationId === relationship.source)!
  const cursorRow = (level: Criticality) => {
    element.criticality = level
    const pane = detailsLines(viewerTheme(), element, world, 28, 'what', undefined, relationship.id, undefined)
    return pane.lines[pane.cursor!]
  }
  const withoutLevelLine = cursorRow('normal')
  expect(withoutLevelLine).toBeDefined()
  expect(cursorRow('critical')).toEqual(withoutLevelLine)
})
