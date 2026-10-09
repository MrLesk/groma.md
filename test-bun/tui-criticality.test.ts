import { expect, test } from 'bun:test'
import { createTestRenderer } from '@opentui/core/testing'
import { loadAnnotatedArchitecture } from '../src/core.ts'
import { criticalityLevels } from '../src/criticality.ts'
import { sheetScene } from '../src/sheet/scene.ts'
import { viewerTheme } from '../src/viewers/tui/atoms/theme.ts'
import { detailsLines } from '../src/viewers/tui/panes/details.ts'
import { mountScreen } from '../src/viewers/tui/panes/screen.ts'

// AC5: the ordinary fixed-width details pane must show the complete effective level.
test.concurrent('terminal details keep every criticality level readable at 28 content columns', async () => {
  const architecture = await loadAnnotatedArchitecture(new URL('../test/fixtures/edit/', import.meta.url).pathname)
  const world = { ...architecture, sheet: sheetScene(architecture) }
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
      expect(details).toContain(level)
    }
  } finally {
    screen.destroy()
    setup.renderer.destroy()
  }
})
