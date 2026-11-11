import { expect } from 'bun:test'
import { cp, mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { HttpEndpointSegment, ScanObservation, ScannerPlugin } from '@groma/scanner'
import { scannerFiles } from '../src/scanner/modules/selection.ts'

/** A built scanner package and what it observed in the fixture copy. */
export interface FixtureScan {
  scanner: ScannerPlugin
  observation: ScanObservation
}

/**
 * Copy one fixture into a fresh Git repository, build each scanner package beside it, and scan the
 * copy with each package, as a repository that configures those scanners together would. Each call
 * owns its temporary directory.
 */
export async function scanFixture(fixture: string, builds: Record<string, (destination: string) => Promise<void>>,
  inspect: (scans: Record<string, FixtureScan>, root: string) => Promise<void>): Promise<void> {
  const temporary = await mkdtemp(path.join(os.tmpdir(), `groma-${fixture}-`))
  try {
    const root = path.join(temporary, 'project')
    await cp(path.resolve(import.meta.dir, '../test/fixtures', fixture), root, { recursive: true })
    const git = Bun.spawn(['git', 'init', '--quiet', root], { stdout: 'ignore', stderr: 'pipe' })
    expect(await git.exited, await new Response(git.stderr).text()).toBe(0)
    const scans: Record<string, FixtureScan> = {}
    for (const [id, build] of Object.entries(builds)) {
      const artifact = path.join(temporary, id)
      await build(artifact)
      const manifest = JSON.parse(await readFile(path.join(artifact, 'package.json'), 'utf8'))
      const scanner = (await import(pathToFileURL(path.join(artifact, manifest.groma.scanner.entry)).href)).default as ScannerPlugin
      scans[id] = { scanner, observation: (await scanner.scan(root, {}, await scannerFiles(root, manifest.groma.scanner)))! }
    }
    await inspect(scans, root)
  } finally { await rm(temporary, { recursive: true, force: true }) }
}

/** `!` marks a constrained segment and `?` an optional one, as in the relationship rule's own examples. */
function segmentText(segment: HttpEndpointSegment): string {
  if (segment.kind === 'literal') return segment.value
  return `${segment.kind === 'parameter' ? ':' : '*'}${segment.name}${segment.optional ? '?' : ''}${segment.constrained ? '!' : ''}`
}

/** Each endpoint as `[position, method, path, handler operation name]`, in reported order. */
export function endpointRows(observation: ScanObservation): unknown[][] {
  const names = new Map(observation.operations!.map(operation => [operation.id, operation.name]))
  return observation.httpEndpoints!.map(endpoint => [
    endpoint.order!.position, endpoint.method, `/${endpoint.path.map(segmentText).join('/')}`, names.get(endpoint.operation),
  ])
}

/** The path of a blocker under `prefix`: any remainder, also none, that the scanner could not read. */
export const blocked = (prefix: string) => `${prefix}/*unresolved?!`
