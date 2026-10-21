import groma from '../../../package.json'
import { readPublishedRelease } from './package-manager.ts'

export interface PublishedScanner {
  name: string
  version: string
  os?: string[]
  cpu?: string[]
  groma?: { scanner?: { id?: string; entry?: string; discovery?: { compatibility?: { groma?: string } } } }
}

function supports(values: string[] | undefined, current: string): boolean {
  if (!values) return true
  return !values.includes(`!${current}`)
    && (values.includes(current) || values.includes('any') || values.every(value => value.startsWith('!')))
}

/**
 * The stable releases of a package, newest first. One registry read returns one release, so each further release is
 * read only when the caller reaches it: a caller that stops at the newest release costs one read.
 */
async function* stableReleases(name: string, registry?: string, signal?: AbortSignal): AsyncGenerator<PublishedScanner> {
  const latest = await readPublishedRelease<PublishedScanner>(name, { registry, signal })
  if (!latest) return
  const newestFirst = latest.versions.filter(version => Bun.semver.satisfies(version, '*'))
    .sort((a, b) => Bun.semver.order(b, a))
  for (const version of newestFirst) {
    // The first read already returned the registry's latest release, which is usually the newest stable one.
    const release = version === latest.version ? latest : await readPublishedRelease<PublishedScanner>(name, { version, registry, signal })
    if (release) yield release
  }
}

/**
 * The newest stable release that supports this computer and this Groma version.
 * Language versions never select releases; the scanner validates its projects.
 */
export async function selectPublishedScanner(
  name: string,
  registry?: string,
  host = { groma: groma.version, os: process.platform as string, cpu: process.arch as string },
  signal?: AbortSignal,
): Promise<PublishedScanner> {
  let published = false
  let supportsComputer = false
  let newestRequirement: string | undefined
  for await (const release of stableReleases(name, registry, signal)) {
    if (!release.groma?.scanner?.id || !release.groma.scanner.entry) continue
    published = true
    if (!supports(release.os, host.os) || !supports(release.cpu, host.cpu)) continue
    supportsComputer = true
    const required = release.groma.scanner.discovery?.compatibility?.groma
    if (!required || Bun.semver.satisfies(host.groma, required)) return release
    newestRequirement ??= required
  }
  if (!published) throw new Error(`${name}: no published stable scanner release. Ask the plugin author to publish one, then retry.`)
  if (!supportsComputer) throw new Error(`${name}: no published release supports ${host.os}/${host.cpu}. Ask the plugin author for a build for this computer.`)
  throw new Error(`${name}: requires Groma ${newestRequirement}; this computer has ${host.groma}. Update Groma, then retry.`)
}

export async function publishedScannerSource(name: string, registry?: string, signal?: AbortSignal): Promise<string> {
  const release = await selectPublishedScanner(name, registry, undefined, signal)
  return `${name}@${release.version}`
}
