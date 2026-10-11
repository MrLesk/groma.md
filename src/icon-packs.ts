import { readFile } from 'node:fs/promises'
import { readScannerConfig, writeScannerConfig } from './scanner/modules/config.ts'
import { defaultScannerCacheRoot, installScannerPackage, parseScannerSource, resolveScannerPackage } from './scanner/modules/package.ts'
import type { ScannerInstallOptions } from './scanner/modules/inventory.ts'
import type { AnnotatedElement } from './types.ts'

/** One grapheme that is a pictograph, a flag or a keycap; any other icon value is a name for a pack to resolve. */
export function isEmoji(value: string): boolean {
  const segments = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value)]
  return segments.length === 1 && /\p{Extended_Pictographic}|\p{Regional_Indicator}|[0-9#*]\ufe0f?\u20e3/u.test(value)
}

export async function iconPackInventory(root: string, options: ScannerInstallOptions = {}) {
  const config = await readScannerConfig(root)
  return Promise.all((config.icons ?? []).map(async selected => {
    try {
      const pack = await resolveScannerPackage(parseScannerSource(root, selected.source), options.cacheRoot, 'icons')
      if (pack && pack.id !== selected.id) throw new Error(`Pack id is ${pack.id}, expected ${selected.id}`)
      return { ...selected, kind: 'icons' as const, status: pack ? 'found' : 'missing', message: '', pack }
    } catch (error) {
      return { ...selected, kind: 'icons' as const, status: 'blocked', message: error instanceof Error ? error.message : String(error), pack: undefined }
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

export async function restoreIconPacks(root: string, options: ScannerInstallOptions = {}, id?: string): Promise<number> {
  const config = await readScannerConfig(root)
  let count = 0
  for (const selected of (config.icons ?? []).filter(pack => id === undefined || pack.id === id)) {
    const source = parseScannerSource(root, selected.source)
    const installed = await installScannerPackage(source, options.cacheRoot ?? defaultScannerCacheRoot(), options.registry, 'icons')
    if (installed.package.id !== selected.id) throw new Error(`Pack id is ${installed.package.id}, expected ${selected.id}`)
    if (source.kind !== 'local') count++
  }
  return count
}

export async function saveIconPack(root: string, id: string, source: string, replacing = false): Promise<void> {
  const config = await readScannerConfig(root)
  if (!replacing && (config.icons ?? []).some(pack => pack.id === id)) throw new Error(`Icon pack already configured: ${id}`)
  if (config.scanners.some(pack => pack.id === id) || config.workSources?.some(pack => pack.id === id)) throw new Error(`Plugin id already configured: ${id}`)
  const icons = [...config.icons ?? []]
  const index = icons.findIndex(pack => pack.id === id)
  if (index < 0) icons.push({ id, source })
  else icons[index] = { id, source }
  await writeScannerConfig(root, { ...config, icons })
}
