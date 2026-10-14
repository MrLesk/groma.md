import groma from '../../../package.json'
import type { PluginKind } from './package.ts'
import { readPublishedRelease } from './package-manager.ts'

export interface PublishedPlugin {
  name: string
  version: string
  os?: string[]
  cpu?: string[]
  groma?: { workSource?: { id?: string; entry?: string; compatibility?: { groma?: string } }; scanner?: { id?: string; entry?: string; discovery?: { compatibility?: { groma?: string } } } }
}

export function isNpmPackageName(value: string): boolean {
  return /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/.test(value)
}

function supports(values: string[] | undefined, current: string): boolean {
  if (!values) return true
  return !values.includes(`!${current}`)
    && (values.includes(current) || values.includes('any') || values.every(value => value.startsWith('!')))
}

/** What a release declares for the wanted kind, or for the kind it is when any will do: its id, entry and required groma.md range. */
function declaration(item: PublishedPlugin, kind?: PluginKind): { id?: string; entry?: string; requires?: string } | undefined {
  const scanner = kind === 'workSource' ? undefined : item.groma?.scanner
  if (scanner) return { id: scanner.id, entry: scanner.entry, requires: scanner.discovery?.compatibility?.groma }
  const workSource = kind === 'scanner' ? undefined : item.groma?.workSource
  return workSource && { id: workSource.id, entry: workSource.entry, requires: workSource.compatibility?.groma }
}

/**
 * The stable releases of a package, newest first. One registry read returns one release, so each further release is
 * read only when the caller reaches it: a caller that stops at the newest release costs one read.
 */
async function* stableReleases(name: string, registry?: string): AsyncGenerator<PublishedPlugin> {
  const latest = await readPublishedRelease<PublishedPlugin>(name, { registry })
  if (!latest) return
  const newestFirst = latest.versions.filter(version => Bun.semver.satisfies(version, '*'))
    .sort((a, b) => Bun.semver.order(b, a))
  for (const version of newestFirst) {
    // The first read already returned the registry's latest release, which is usually the newest stable one.
    const release = version === latest.version ? latest : await readPublishedRelease<PublishedPlugin>(name, { version, registry })
    if (release) yield release
  }
}

/**
 * The newest stable release of a kind that this groma.md version and computer can run; without a kind, any plugin
 * release. Language versions never select releases; a scanner validates its projects.
 */
export async function selectPublishedPlugin(
  name: string,
  registry?: string,
  kind?: PluginKind,
  host = { groma: groma.version, os: process.platform as string, cpu: process.arch as string },
): Promise<PublishedPlugin> {
  let published = false
  let supportsComputer = false
  let newestRequirement: string | undefined
  for await (const release of stableReleases(name, registry)) {
    const declared = declaration(release, kind)
    if (!declared?.id || !declared.entry) continue
    published = true
    if (!supports(release.os, host.os) || !supports(release.cpu, host.cpu)) continue
    supportsComputer = true
    if (!declared.requires || Bun.semver.satisfies(host.groma, declared.requires)) return release
    newestRequirement ??= declared.requires
  }
  if (!published) throw new Error(`${name}: no published stable release. Ask the plugin author to publish one, then retry.`)
  if (!supportsComputer) throw new Error(`${name}: no published release supports ${host.os}/${host.cpu}. Ask the plugin author for a build for this computer.`)
  throw new Error(`${name}: requires Groma ${newestRequirement}; this computer has ${host.groma}. Update Groma, then retry.`)
}

export async function publishedPluginSource(name: string, registry?: string, kind?: PluginKind): Promise<string> {
  const release = await selectPublishedPlugin(name, registry, kind)
  return `${name}@${release.version}`
}
