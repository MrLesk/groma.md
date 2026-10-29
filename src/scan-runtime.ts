import path from 'node:path'
import type { ScanObservation } from '@groma/scanner'
import { createRecord, type World, type WorldRecord } from './scan-world.ts'
import { isExternalPath } from './architecture-path.ts'
import { readDocument, writeDocument } from './markdown-emitter.ts'
import type { RelationshipConnection, ScanSummary } from './types.ts'

function boundary(world: World, file: string, kind: 'system' | 'container'): WorldRecord | undefined {
  let record = world.byCodeFile.get(file)
  while (record && record.kind !== kind) record = world.byId.get(record.parent ?? '')
  return record
}

/** A declared store owns its configuration source; established source ownership always wins. */
export async function establishDataStores(
  root: string, world: World, observations: readonly ScanObservation[], summary: ScanSummary,
): Promise<void> {
  const systems = [...world.byId.values()].filter(record => record.kind === 'system' && !isExternalPath(record.sourceFilename))
  for (const observation of observations) for (const store of observation.dataStores ?? []) {
    if (world.byCodeFile.has(store.file)) continue
    const parent = boundary(world, store.entry, 'system') ?? (systems.length === 1 ? systems[0] : undefined)
    if (!parent) continue
    await createRecord(root, world, { kind: 'container', name: `${store.technology} (${store.environment})`, parent,
      technology: store.technology, code: [{ scanner: observation.scanner.id, file: store.file }] })
    summary.created += 1
  }
}

const heading = '## Derived runtime configuration'

function withoutRuntimeSection(source: string): string {
  const start = source.indexOf(`\n${heading}\n`)
  if (start < 0) return source
  const end = source.indexOf('\n## ', start + heading.length + 2)
  return source.slice(0, start) + (end < 0 ? '' : source.slice(end))
}

function sourceLink(record: WorldRecord, file: string): string {
  return `[${file}](${path.posix.relative(path.posix.dirname(record.sourceFilename), file)})`
}

function storageConfiguration(world: World, observations: readonly ScanObservation[]): [WorldRecord, string][] {
  return observations.flatMap(observation => (observation.dataStores ?? []).flatMap(store => {
    const owner = world.byCodeFile.get(store.file)
    if (owner?.kind !== 'container') return []
    const roles = store.databases.map(database => `${database.role}: \`${database.name}\``).join(', ')
    return [[owner, `- ${store.environment}: ${store.technology} logical databases: ${roles}. Configuration: ${sourceLink(owner, store.file)}.`] as [WorldRecord, string]]
  }))
}

function hostedConfiguration(world: World, observations: readonly ScanObservation[]): [WorldRecord, string][] {
  return observations.flatMap(observation => (observation.hostedServices ?? []).flatMap(service => {
    const owner = boundary(world, service.entry, 'container')
    if (!owner) return []
    return [[owner, `- ${service.environment}: ${service.name} hosted through ${service.host}. Configuration: ${service.declarations.map(file => sourceLink(owner, file)).join(', ')}.`] as [WorldRecord, string]]
  }))
}

function configurationSections(world: World, observations: readonly ScanObservation[]): Map<WorldRecord, string[]> {
  const sections = new Map<WorldRecord, string[]>()
  const runtimeObservers = observations.filter(observation => observation.hostedServices !== undefined)
  for (const entry of runtimeObservers.flatMap(observation => observation.entryPoints ?? [])) {
    const application = boundary(world, entry.file, 'container')
    if (application) sections.set(application, [])
  }
  for (const [owner, line] of [...storageConfiguration(world, observations), ...hostedConfiguration(world, observations)]) {
    sections.set(owner, [...sections.get(owner) ?? [], line])
  }
  return sections
}

/** Only this derived section is refreshed; titles, descriptions, prose and other sections remain authored. */
export async function refreshRuntimeConfiguration(root: string, world: World, observations: readonly ScanObservation[]): Promise<void> {
  const sections = configurationSections(world, observations)
  for (const [record, lines] of sections) {
    const before = await readDocument(root, record.sourceFilename)
    const content = withoutRuntimeSection(before)
    if (!lines.length && content === before) continue
    const section = lines.length ? `\n\n${heading}\n\nIntended configuration; live deployment is not verified.\n\n${[...new Set(lines)].sort().join('\n')}` : ''
    const after = `${content.trimEnd()}${section}\n`
    if (after !== before) await writeDocument(root, record.sourceFilename, after)
  }
}

export function configuredStorageRelationships(
  observations: readonly ScanObservation[], owners: ReadonlyMap<string, string>,
): RelationshipConnection[] {
  return observations.flatMap(observation => (observation.dataStores ?? []).flatMap(store => {
    if (!owners.has(store.entry) || !owners.has(store.file) || owners.get(store.entry) === owners.get(store.file)) return []
    return [{ source: store.entry, target: store.file,
      description: `Uses configured ${store.technology} storage (${store.environment})`,
      technology: observation.scanner.id, status: 'stable' as const, authored: false }]
  }))
}
