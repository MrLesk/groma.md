import groma from '../../../package.json'
import type { PluginKind } from './package.ts'

export interface PublishedPlugin {
  name: string
  version: string
  os?: string[]
  cpu?: string[]
  groma?: { icons?: { id?: string; icons?: Record<string, string> }; workSource?: { id?: string; entry?: string; compatibility?: { groma?: string } }; scanner?: { id?: string; entry?: string; discovery?: { compatibility?: { groma?: string } } } }
}

export function isNpmPackageName(value: string): boolean {
  return /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/.test(value)
}

function supports(values: string[] | undefined, current: string): boolean {
  if (!values) return true
  return !values.includes(`!${current}`)
    && (values.includes(current) || values.includes('any') || values.every(value => value.startsWith('!')))
}

/**
 * What a release declares for the wanted kind, or for the kind it is when any will do: its id, whether it has what
 * makes it usable (an entry to run, or icons to draw) and its required groma.md range.
 */
function declaration(item: PublishedPlugin, kind?: PluginKind): { id?: string; usable: boolean; requires?: string } | undefined {
  const wanted = (candidate: PluginKind) => kind === undefined || kind === candidate
  const { scanner, workSource, icons } = item.groma ?? {}
  if (scanner && wanted('scanner')) return { id: scanner.id, usable: Boolean(scanner.entry), requires: scanner.discovery?.compatibility?.groma }
  if (workSource && wanted('workSource')) return { id: workSource.id, usable: Boolean(workSource.entry), requires: workSource.compatibility?.groma }
  if (icons && wanted('icons')) return { id: icons.id, usable: icons.icons !== undefined }
  return undefined
}

/**
 * The newest stable release of a kind that this groma.md version and computer can run; without a kind, any plugin
 * release. Language versions never select releases; a scanner validates its projects.
 */
export function selectPublishedPlugin(
  name: string,
  versions: Record<string, PublishedPlugin>,
  kind?: PluginKind,
  host = { groma: groma.version, os: process.platform as string, cpu: process.arch as string },
): PublishedPlugin {
  const requirement = (item: PublishedPlugin) => declaration(item, kind)?.requires
  const releases = Object.values(versions).filter(item => {
    const declared = declaration(item, kind)
    return item.name === name && declared?.id && declared.usable && Bun.semver.satisfies(item.version, '*')
  }).sort((a, b) => Bun.semver.order(b.version, a.version))
  if (!releases.length) throw new Error(`${name}: no published stable release. Ask the plugin author to publish one, then retry.`)
  const platform = releases.filter(item => supports(item.os, host.os) && supports(item.cpu, host.cpu))
  if (!platform.length) throw new Error(`${name}: no published release supports ${host.os}/${host.cpu}. Ask the plugin author for a build for this computer.`)
  const selected = platform.find(item => {
    const required = requirement(item)
    return !required || Bun.semver.satisfies(host.groma, required)
  })
  if (!selected) {
    const required = requirement(platform[0]!)
    throw new Error(`${name}: requires Groma ${required}; this computer has ${host.groma}. Update Groma, then retry.`)
  }
  return selected
}

export async function readPublishedPlugins(name: string, registry = process.env.npm_config_registry ?? 'https://registry.npmjs.org'): Promise<Record<string, PublishedPlugin>> {
  let response: Response
  try { response = await fetch(`${registry.replace(/\/$/, '')}/${encodeURIComponent(name)}`, { headers: { accept: 'application/json' } }) }
  catch { throw new Error(`${name}: could not reach the package registry. Check your connection and retry.`) }
  if (response.status === 404) throw new Error(`${name}: package is not published in this registry. Check its name or ask the plugin author to publish it.`)
  if (!response.ok) throw new Error(`${name}: package registry returned HTTP ${response.status}. Check registry access and retry.`)
  const metadata = await response.json() as { versions?: Record<string, PublishedPlugin> }
  return metadata.versions ?? {}
}

export async function publishedPluginSource(name: string, registry?: string, kind?: PluginKind): Promise<string> {
  const release = selectPublishedPlugin(name, await readPublishedPlugins(name, registry), kind)
  return `${release.name}@${release.version}`
}
