import { readFile } from 'node:fs/promises'
import { readPluginConfig, writePluginConfig } from './scanner/modules/config.ts'
import type { PluginInstallOptions, PluginResolutionOptions } from './scanner/modules/inventory.ts'
import { defaultPluginCacheRoot, installPluginPackage, parsePluginSource, resolvePluginPackage, type ResolvedIconPackage } from './scanner/modules/package.ts'
import type { AnnotatedElement } from './types.ts'

/** A pack selected in plugins.json and what this computer has for it. */
export interface IconPackSelection {
  id: string
  source: string
  kind: 'icons'
  status: 'found' | 'missing' | 'blocked'
  message: string
  /** The installed package; absent while the pack is missing or blocked. */
  pack?: ResolvedIconPackage
}

/** One grapheme that is a pictograph, a flag or a keycap; any other icon value is a name for a pack to resolve. */
export function isEmoji(value: string): boolean {
  const segments = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value)]
  return segments.length === 1 && /\p{Extended_Pictographic}|\p{Regional_Indicator}|[0-9#*]\ufe0f?\u20e3/u.test(value)
}

/** Every configured pack in its configured order; a pack that cannot be read is blocked with the reason instead of failing the caller. */
export async function iconPackInventory(root: string, options: PluginResolutionOptions = {}): Promise<IconPackSelection[]> {
  const config = await readPluginConfig(root)
  return Promise.all((config.icons ?? []).map(async (selected): Promise<IconPackSelection> => {
    const base = { ...selected, kind: 'icons' as const }
    try {
      const pack = await resolvePluginPackage(parsePluginSource(root, selected.source), options.cacheRoot ?? defaultPluginCacheRoot(), 'icons')
      if (!pack) return { ...base, status: 'missing', message: '' }
      if (pack.id !== selected.id) throw new Error(`Pack id is ${pack.id}, expected ${selected.id}`)
      return { ...base, status: 'found', message: '', pack }
    } catch (error) {
      return { ...base, status: 'blocked', message: error instanceof Error ? error.message : String(error) }
    }
  }))
}

/** Invalid or missing packs are findings, never a reason to lose the architecture map. */
export async function loadIconCatalog(root: string): Promise<Map<string, string>> {
  const catalog = new Map<string, string>()
  for (const item of await iconPackInventory(root)) {
    for (const [name, file] of Object.entries(item.pack?.icons ?? {})) {
      try {
        const svg = await readFile(file, 'utf8')
        if (!svg.includes('<svg')) continue
        const uri = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
        catalog.set(`${item.id}:${name}`, uri)
        if (!catalog.has(name)) catalog.set(name, uri)
      } catch { /* A missing icon remains unresolved and lint reports it. */ }
    }
  }
  return catalog
}

/**
 * Says how each element's icon is drawn. A pack icon travels as its embedded SVG, so an export needs no
 * installed pack. An emoji stays the text it is, and an unknown name is left unresolved for lint to report.
 */
export async function attachElementIcons(root: string, elements: AnnotatedElement[]): Promise<void> {
  if (!elements.some(element => element.icon)) return
  const catalog = await loadIconCatalog(root)
  for (const element of elements) {
    if (element.icon === undefined) continue
    const uri = catalog.get(element.icon)
    if (uri !== undefined) element.resolvedIcon = { kind: 'image', uri }
    else if (isEmoji(element.icon)) element.resolvedIcon = { kind: 'emoji', text: element.icon }
  }
}

export async function unknownIcons(root: string, elements: readonly { id: string; icon?: string }[]): Promise<string[]> {
  const catalog = await loadIconCatalog(root)
  return elements.filter(element => element.icon && !isEmoji(element.icon) && !catalog.has(element.icon))
    .map(element => `${element.id}: unknown icon "${element.icon}"`)
}

export async function restoreIconPacks(root: string, options: PluginInstallOptions = {}, id?: string): Promise<number> {
  const config = await readPluginConfig(root)
  let count = 0
  for (const selected of (config.icons ?? []).filter(pack => id === undefined || pack.id === id)) {
    const source = parsePluginSource(root, selected.source)
    const installed = await installPluginPackage(source, options.cacheRoot ?? defaultPluginCacheRoot(), options.registry, 'icons')
    if (installed.package.id !== selected.id) throw new Error(`Pack id is ${installed.package.id}, expected ${selected.id}`)
    if (source.kind !== 'local') count++
  }
  return count
}

/** Selects a pack after the ones already configured, which keep answering the names they share with it. */
export async function addIconPack(root: string, id: string, source: string): Promise<void> {
  const config = await readPluginConfig(root)
  if ([...config.scanners, ...config.workSources ?? [], ...config.icons ?? []].some(plugin => plugin.id === id)) {
    throw new Error(`Plugin id already configured: ${id}`)
  }
  await writePluginConfig(root, { ...config, icons: [...config.icons ?? [], { id, source }] })
}

/** Points a configured pack at another source; the pack keeps its place in the order. */
export async function replaceIconPackSource(root: string, id: string, source: string): Promise<void> {
  const config = await readPluginConfig(root)
  await writePluginConfig(root, { ...config, icons: config.icons?.map(pack => pack.id === id ? { id, source } : pack) })
}
