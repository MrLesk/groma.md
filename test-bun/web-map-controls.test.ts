import { expect, test } from 'bun:test'
import { loadAnnotatedArchitecture } from '../src/core.ts'
import { sheetScene } from '../src/sheet/scene.ts'
import { bindC4Filter, type MapFilter } from '../src/viewers/web/chrome/c4-filter.ts'
import { readMapControls, readSavedMapControls, saveMapControls } from '../src/viewers/web/chrome/map-view.ts'
import { createMapMotion, presentScene } from '../src/viewers/web/iso/view-motion/presentation.ts'
import { readView, writeView } from '../src/viewers/web/url.ts'
import { viewerFixtureRoot } from './helpers.ts'

function storage() {
  const values = new Map<string, string>()
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value) } }
}

test.concurrent('saved controls restore the last projection and filters when the URL omits them', () => {
  const saved = storage()
  expect(readSavedMapControls(saved)).toEqual({ mapView: 'iso', hiddenFilters: new Set() })
  for (const mapView of ['2d', 'layers', 'iso'] as const) {
    const controls = { mapView, hiddenFilters: new Set<MapFilter>(['container', 'relationship']) }
    saveMapControls(controls, saved)
    expect(readMapControls(new URLSearchParams(), readSavedMapControls(saved))).toEqual(controls)
  }
})

test.concurrent('explicit URL controls override saved choices independently, including all-visible filters', () => {
  const saved = { mapView: 'layers' as const, hiddenFilters: new Set<MapFilter>(['component']) }
  expect(readMapControls(new URLSearchParams('view=2d'), saved)).toEqual({ ...saved, mapView: '2d' })
  expect(readMapControls(new URLSearchParams('hide=container,relationship'), saved)).toEqual({
    mapView: 'layers', hiddenFilters: new Set(['container', 'relationship']),
  })
  expect(readMapControls(new URLSearchParams('view=iso&hide='), saved)).toEqual({
    mapView: 'iso', hiddenFilters: new Set(),
  })
})

test.concurrent('shared projections and filters override different browser preferences without changing the selected content', async () => {
  const world = await loadAnnotatedArchitecture(viewerFixtureRoot)
  const component = world.elements.find(element => element.kind === 'component')!
  const filters: MapFilter[] = ['actor', 'system', 'container', 'component', 'relationship']
  const recipient = { mapView: 'layers' as const, hiddenFilters: new Set(filters) }
  for (const mapView of ['iso', '2d', 'layers'] as const) {
    for (const hidden of [[], ...filters.map(filter => [filter]), ['container', 'relationship'] as MapFilter[], filters]) {
      const hiddenFilters = new Set(hidden)
      const controls = { mapView, hiddenFilters }
      const url = new URL(`https://example.test/?component=${component.id}&tab=how&theme=dark`)
      const state = { ...readView(url, world, []), ...controls }
      url.search = writeView(state, world, [], url.pathname)
      expect(url.searchParams.get('view')).toBe(mapView)
      expect(url.searchParams.has('hide')).toBe(true)
      const opened = readView(url, world, [], [], 'auto', undefined, recipient)
      expect(opened).toEqual(state)
    }
  }
})

test.concurrent('restored filter buttons and clicks drive the same visible scene and saved configuration', async () => {
  const world = await loadAnnotatedArchitecture(viewerFixtureRoot)
  const scene = presentScene(sheetScene(world), undefined, createMapMotion().pose)
  const buttons = new Map<string, { pressed?: string; click?: () => void; setAttribute(name: string, value: string): void; addEventListener(name: string, listener: () => void): void }>()
  const host = {
    querySelector(selector: string) {
      const name = selector.match(/data-filter="([^"]+)"/)![1]!
      if (!buttons.has(name)) buttons.set(name, {
        setAttribute(_name, value) { this.pressed = value },
        addEventListener(_name, listener) { this.click = listener },
      })
      return buttons.get(name)
    },
  } as unknown as HTMLElement
  const saved = storage()
  const filter = bindC4Filter(host, new Set(['relationship']), () => {
    saveMapControls({ mapView: '2d', hiddenFilters: filter.hidden }, saved)
  })
  expect(filter.project(scene).routes).toEqual([])
  expect(buttons.get('relationship')?.pressed).toBe('false')
  buttons.get('relationship')!.click!()
  expect(filter.project(scene).routes).toEqual(scene.routes)
  expect(readSavedMapControls(saved)).toEqual({ mapView: '2d', hiddenFilters: new Set() })
  filter.setHidden(new Set(['container']))
  expect(filter.project(scene).slabs).toEqual([])
  expect(buttons.get('container')?.pressed).toBe('false')
})
