import groma from '../../../package.json'

export interface PublishedScanner {
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

/** Language versions never select releases; the scanner validates its projects. */
export function selectPublishedScanner(
  name: string,
  versions: Record<string, PublishedScanner>,
  host = { groma: groma.version, os: process.platform as string, cpu: process.arch as string },
  kind: 'scanner' | 'workSource' | 'any' = 'scanner',
): PublishedScanner {
  const metadata = (item: PublishedScanner) => kind === 'any' ? item.groma?.scanner ?? item.groma?.workSource : item.groma?.[kind]
  const requirement = (item: PublishedScanner) => item.groma?.workSource?.compatibility?.groma ?? item.groma?.scanner?.discovery?.compatibility?.groma
  const releases = Object.values(versions).filter(item => item.name === name
    && metadata(item)?.id && metadata(item)?.entry && Bun.semver.satisfies(item.version, '*'))
    .sort((a, b) => Bun.semver.order(b.version, a.version))
  if (!releases.length) throw new Error(`${name}: no published stable scanner release. Ask the plugin author to publish one, then retry.`)
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

export async function readPublishedScanners(name: string, registry = process.env.npm_config_registry ?? 'https://registry.npmjs.org'): Promise<Record<string, PublishedScanner>> {
  let response: Response
  try { response = await fetch(`${registry.replace(/\/$/, '')}/${encodeURIComponent(name)}`, { headers: { accept: 'application/json' } }) }
  catch { throw new Error(`${name}: could not reach the package registry. Check your connection and retry.`) }
  if (response.status === 404) throw new Error(`${name}: package is not published in this registry. Check its name or ask the plugin author to publish it.`)
  if (!response.ok) throw new Error(`${name}: package registry returned HTTP ${response.status}. Check registry access and retry.`)
  const metadata = await response.json() as { versions?: Record<string, PublishedScanner> }
  return metadata.versions ?? {}
}

export async function publishedScannerSource(name: string, registry?: string, kind: 'scanner' | 'workSource' | 'any' = 'scanner'): Promise<string> {
  const release = selectPublishedScanner(name, await readPublishedScanners(name, registry), undefined, kind)
  return `${release.name}@${release.version}`
}
