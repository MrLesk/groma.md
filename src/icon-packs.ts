import { readFile } from 'node:fs/promises'
import { readScannerConfig, writeScannerConfig } from './scanner/modules/config.ts'
import { defaultScannerCacheRoot, installScannerPackage, parseScannerSource, resolveScannerPackage } from './scanner/modules/package.ts'
import type { ScannerInstallOptions } from './scanner/modules/inventory.ts'
import type { AnnotatedElement } from './types.ts'

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
      return { ...selected, kind: 'icons' as const, status: 'blocked', message: String(error), pack: undefined }
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

async function emojiSvg(emoji: string): Promise<string | undefined> {
  const characters = emoji.includes('\u200d') ? [...emoji] : [...emoji].filter(char => char !== '\ufe0f')
  const code = characters.map(char => char.codePointAt(0)!.toString(16)).join('-')
  try {
    const response = await fetch(`https://cdn.jsdelivr.net/gh/jdecked/twemoji@v16.0.1/assets/svg/${code}.svg`)
    if (!response.ok) return undefined
    const svg = await response.text()
    return svg.includes('<svg') ? `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}` : undefined
  } catch { return undefined }
}

/** Resolve each unique icon once and embed its SVG so exports need no fonts or network. */
export async function attachElementIcons(root: string, elements: AnnotatedElement[]): Promise<void> {
  if (!elements.some(element => element.icon)) return
  const catalog = await loadIconCatalog(root)
  await Promise.all([...new Set(elements.flatMap(element => element.icon ? [element.icon] : []))].map(async name => {
    if (!catalog.has(name) && isEmoji(name)) {
      const uri = await emojiSvg(name)
      if (uri) catalog.set(name, uri)
    }
  }))
  for (const element of elements) if (element.icon) element.iconSvg = catalog.get(element.icon)
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
  await writeScannerConfig(root, { ...config, icons: [...(config.icons ?? []).filter(pack => pack.id !== id), { id, source }] })
}
