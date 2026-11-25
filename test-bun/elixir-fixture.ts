import { expect } from 'bun:test'
import { cp, mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { HttpEndpointSegment, ScanObservation, ScannerPlugin } from '@groma/scanner'
import { scannerFiles } from '../src/scanner/modules/selection.ts'

const fixtures = path.resolve(import.meta.dir, '../test/fixtures')

/** One scanner package built for a test, and the fixture files Groma would hand it. */
export interface BuiltScanner {
  artifact: string
  scanner: ScannerPlugin
  selected: string[]
}

/**
 * Run `use` on a fresh copy of one fixture: a Git repository with an empty architecture, and each
 * scanner package built beside it, as a repository that configures those scanners together would
 * have them. Each call owns its temporary directory and removes it afterwards.
 */
export async function withFixture<Id extends string>(fixture: string, builds: Record<Id, (destination: string) => Promise<void>>,
  use: (root: string, scanners: Record<Id, BuiltScanner>) => Promise<void>): Promise<void> {
  const temporary = await mkdtemp(path.join(os.tmpdir(), `groma-${fixture}-`))
  try {
    const root = path.join(temporary, 'project')
    await cp(path.join(fixtures, 'empty-project'), root, { recursive: true })
    await cp(path.join(fixtures, fixture), root, { recursive: true })
    const git = Bun.spawn(['git', 'init', '--quiet', root], { stdout: 'ignore', stderr: 'pipe' })
    expect(await git.exited, await new Response(git.stderr).text()).toBe(0)
    const scanners = {} as Record<Id, BuiltScanner>
    for (const id of Object.keys(builds) as Id[]) {
      const artifact = path.join(temporary, id)
      await builds[id](artifact)
      const manifest = JSON.parse(await readFile(path.join(artifact, 'package.json'), 'utf8'))
      const scanner = (await import(pathToFileURL(path.join(artifact, manifest.groma.scanner.entry)).href)).default as ScannerPlugin
      scanners[id] = { artifact, scanner, selected: await scannerFiles(root, manifest.groma.scanner) }
    }
    await use(root, scanners)
  } finally { await rm(temporary, { recursive: true, force: true }) }
}

/** What one built scanner observes in the fixture copy. */
export async function observe(root: string, built: BuiltScanner): Promise<ScanObservation> {
  return (await built.scanner.scan(root, {}, built.selected))!
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
