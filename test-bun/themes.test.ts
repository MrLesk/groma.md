import { expect, test } from 'bun:test'
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { loadThemes } from '../src/themes/configured.ts'
import { AUTO_THEME, shownTheme } from '../src/themes/definition.ts'
import { cloneTheme, disableTheme, enableTheme } from '../src/themes/management.ts'
import { renderPage } from '../src/viewers/web/page.ts'
import type { WebBootPayload } from '../src/viewers/web/payload.ts'

const fixture = path.resolve(import.meta.dir, '../test/fixtures/empty-project')

async function project(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'groma-themes-'))
  await cp(fixture, root, { recursive: true })
  return root
}

test.concurrent('a cloned theme with one changed value loads beside the bundled themes, and an incomplete theme file fails', async () => {
  const root = await project()
  try {
    const cloned = await cloneTheme(root, 'dark', 'midnight')
    const file = path.join(root, cloned.source!)
    const definition = JSON.parse(await readFile(file, 'utf8'))
    definition.palette.paper = '#0B1020'
    await writeFile(file, JSON.stringify(definition))
    await disableTheme(root, 'blueprint')

    const themes = await loadThemes(root)
    expect(themes.map(theme => theme.id)).toEqual(['light', 'dark', 'midnight'])
    expect(themes[2]!.palette.paper).toBe('#0B1020')
    expect(themes[2]!.palette.ink).toBe(themes[1]!.palette.ink)

    // A theme taken out of the picker keeps its file, and a later clone of the same id must not replace it.
    await disableTheme(root, 'midnight')
    await expect(cloneTheme(root, 'dark', 'midnight')).rejects.toThrow('already exists')
    expect(JSON.parse(await readFile(file, 'utf8')).palette.paper).toBe('#0B1020')
    await expect(cloneTheme(root, 'dark', 'auto')).rejects.toThrow()

    await enableTheme(root, cloned)
    delete definition.palette.ink
    await writeFile(file, JSON.stringify(definition))
    await expect(loadThemes(root)).rejects.toThrow('palette.ink')
  } finally { await rm(root, { recursive: true, force: true }) }
})

test.concurrent('the picker offers exactly the enabled themes, and Auto shows the first one of each appearance', async () => {
  const root = await project()
  try {
    await cloneTheme(root, 'dark', 'midnight')
    await disableTheme(root, 'dark')
    const themes = await loadThemes(root)
    const page = renderPage({
      project: { title: 'Shop' }, world: { elements: [], relationships: [], flows: [] }, work: { items: [] }, pins: [],
      revisions: [], revision: null, delivery: { kind: 'live' }, themes,
    } as unknown as WebBootPayload)
    const offered = [...page.matchAll(/class="[^"]*theme-option[^"]*"[^>]*data-theme-mode="([^"]+)"/g)].map(match => match[1])
    expect(offered).toEqual([AUTO_THEME, 'light', 'blueprint', 'midnight'])
    expect(shownTheme(AUTO_THEME, themes, false).id).toBe('light')
    expect(shownTheme(AUTO_THEME, themes, true).id).toBe('blueprint')
  } finally { await rm(root, { recursive: true, force: true }) }
})
