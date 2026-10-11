import { readFile } from 'node:fs/promises'
import { readPluginConfig } from './scanner/modules/config.ts'
import { parsePluginSource, resolvePluginPackage, type PluginResolutionOptions, type ResolvedIconPackage } from './scanner/modules/package.ts'
import type { AnnotatedElement, ResolvedIcon } from './types.ts'

interface IconPackSelectionFields {
  id: string
  source: string
  kind: 'icons'
  message: string
}

/** A pack selected in plugins.json as it stands on this computer. The package is there exactly when the pack is found. */
export type IconPackSelection =
  | IconPackSelectionFields & { status: 'found'; pack: ResolvedIconPackage }
  | IconPackSelectionFields & { status: 'missing' | 'blocked' }

/**
 * Every configured pack, in its configured order, with what this computer has of it. A pack that cannot be used
 * (another id than configured, a manifest error, a declared icon without its SVG file) is blocked with the reason
 * instead of failing the caller, so the map still opens; the plugin settings and `groma plugin list` show it.
 */
export async function iconPackInventory(root: string, options: PluginResolutionOptions = {}): Promise<IconPackSelection[]> {
  const config = await readPluginConfig(root)
  return Promise.all(config.icons.map(async (selected): Promise<IconPackSelection> => {
    const base = { ...selected, kind: 'icons' as const }
    try {
      const pack = await resolvePluginPackage(parsePluginSource(root, selected.source), options, 'icons')
      if (!pack) return { ...base, status: 'missing', message: '' }
      if (pack.id !== selected.id) throw new Error(`Configured icon pack ${selected.id} resolves to ${pack.id}`)
      return { ...base, status: 'found', message: '', pack }
    } catch (error) {
      return { ...base, status: 'blocked', message: error instanceof Error ? error.message : String(error) }
    }
  }))
}

/**
 * The icons of the found packs as SVG data URIs: each under `pack:name`, and under its bare name for the first
 * configured pack that has it. A missing or blocked pack adds nothing, so its names stop resolving and
 * `groma lint` lists the elements that use them.
 */
async function loadIconCatalog(root: string): Promise<Map<string, string>> {
  const catalog = new Map<string, string>()
  for (const selected of await iconPackInventory(root)) {
    if (selected.status !== 'found') continue
    for (const [name, file] of Object.entries(selected.pack.icons)) {
      const uri = `data:image/svg+xml;base64,${(await readFile(file)).toString('base64')}`
      catalog.set(`${selected.id}:${name}`, uri)
      if (!catalog.has(name)) catalog.set(name, uri)
    }
  }
  return catalog
}

/** One grapheme that is a pictograph, a flag or a keycap. */
function isEmoji(value: string): boolean {
  const segments = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value)]
  return segments.length === 1 && /\p{Extended_Pictographic}|\p{Regional_Indicator}|[0-9#*]️?⃣/u.test(value)
}

/** What an icon value means: a pack icon when a pack has that name, else an emoji, else nothing a viewer can draw. */
function resolveIcon(catalog: ReadonlyMap<string, string>, icon: string): ResolvedIcon | undefined {
  const uri = catalog.get(icon)
  if (uri !== undefined) return { kind: 'image', uri }
  return isEmoji(icon) ? { kind: 'emoji', text: icon } : undefined
}

/**
 * Says how each element's icon is drawn. A pack icon travels as its embedded SVG, so an export needs no
 * installed pack. An emoji stays the text it is, and an unknown name is left unresolved for lint to report.
 */
export async function attachElementIcons(root: string, elements: AnnotatedElement[]): Promise<void> {
  if (!elements.some(element => element.icon)) return
  const catalog = await loadIconCatalog(root)
  for (const element of elements) {
    const resolved = element.icon ? resolveIcon(catalog, element.icon) : undefined
    if (resolved !== undefined) element.resolvedIcon = resolved
  }
}

/** One lint line for each element whose icon neither a found pack nor the emoji rule resolves. */
export async function unknownIcons(root: string, elements: readonly { id: string; icon?: string }[]): Promise<string[]> {
  const catalog = await loadIconCatalog(root)
  return elements.filter(element => element.icon && resolveIcon(catalog, element.icon) === undefined)
    .map(element => `${element.id}: unknown icon "${element.icon}"`)
}
