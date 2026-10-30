import { existsSync } from 'node:fs'
import path from 'node:path'
import { isDeepStrictEqual } from 'node:util'

import { prepareArchitectureFindings, rememberArchitectureFindings } from './architecture-findings.ts'
import { buildArchitectureModel } from './architecture-model.ts'
import { storedConnections } from './relationship-markdown.ts'
import { loadArchitecture } from './architecture-reader.ts'
import { architectureElementPath, isExternalPath } from './architecture-path.ts'
import { GromaFileSystem } from './groma-filesystem.ts'
import { upsertCode } from './markdown-emitter.ts'
import { componentNames, sourceStem } from './scan-component-naming.ts'
import { kebabCase } from './naming.ts'
import { establishDataStores, refreshRuntimeConfiguration } from './scan-runtime.ts'
import { entryPointPlacements } from './scan-entrypoints.ts'
import { completeContainerPlacement } from './curate.ts'
import { sourceUnitGroups } from './scan-source-units.ts'
import { loadProjectProfile } from './project-profile.ts'
import { refreshDerivedRelationships } from './relationship-inference.ts'
import type { ScanFile, ScanObservation, ScanRoot } from '@groma/scanner'
import type {
  C4Kind,
  CodeReference,
  ScanSummary,
} from './types.ts'

import { candidateId, isFree, indexWorld, reserveRecord, writeRecord, createRecord, type World, type WorldRecord } from './scan-world.ts'

function codeFileKey(scanner: string, file: string): string {
  return `${scanner}\0${file}`
}

function refreshedReference(
  reference: CodeReference,
  evidence: ScanFile,
): CodeReference {
  const exact = evidence.symbols.find(symbol => {
    return symbol.id === reference.symbol || symbol.name === reference.symbol
  })
  const symbol = exact ?? (evidence.symbols.length === 1 ? evidence.symbols[0] : undefined)
  return {
    scanner: reference.scanner,
    file: reference.file,
    ...(symbol === undefined ? {} : { symbol: symbol.name }),
  }
}

async function refreshCuratedCode(
  repositoryRoot: string,
  world: World,
  observations: ScanObservation[],
  summary: ScanSummary,
  protectedFiles: ReadonlySet<string>,
): Promise<void> {
  const evidence = new Map<string, ScanFile>()
  const activeScanners = new Set(observations.map(observation => observation.scanner.id))
  for (const observation of observations) {
    for (const file of observation.files) {
      evidence.set(codeFileKey(observation.scanner.id, file.file), file)
    }
  }

  const records = [...new Set(world.byCodeFile.values())]
  for (const record of records) {
    let touched = false
    const code = record.code.flatMap(reference => {
      const found = evidence.get(codeFileKey(reference.scanner, reference.file))
      if (found !== undefined) {
        touched = true
        return [refreshedReference(reference, found)]
      }
      const missing = !protectedFiles.has(reference.file) && activeScanners.has(reference.scanner)
        && !existsSync(path.join(repositoryRoot, reference.file))
      if (missing) touched = true
      return missing ? [] : [reference]
    })
    if (!touched) continue
    const changed = !isDeepStrictEqual(record.code, code)
    record.code = code
    if (changed) await upsertCode(repositoryRoot, record.sourceFilename, record.code)
    if (record.status === 'draft') summary.matched += 1
    else summary.refreshed += 1
  }
}

function onlyRecord(records: WorldRecord[]): WorldRecord | undefined {
  return records.every(record => record === records[0]) ? records[0] : undefined
}

function sourceParents(
  world: World,
  observation: ScanObservation,
  root: ScanRoot,
): WorldRecord[] {
  return observation.files.flatMap(file => {
    if (!file.roots.includes(root.id)) return []
    const owner = world.byCodeFile.get(file.file)
    if (owner?.kind === 'container' || owner?.kind === 'system') return [owner]
    const parent = owner?.parent === undefined ? undefined : world.byId.get(owner.parent ?? '')
    return parent === undefined ? [] : [parent]
  })
}

function systemFor(world: World, container?: WorldRecord): WorldRecord | undefined {
  if (container?.kind === 'system') return container
  if (container?.parent === undefined || container.parent === null) return undefined
  const system = world.byId.get(container.parent)
  return system?.kind === 'system' ? system : undefined
}

/** Conflicting containers can establish their common system, never a winning container. */
function commonParent(world: World, parents: WorldRecord[]): WorldRecord | undefined {
  return onlyRecord(parents) ?? onlyRecord(parents.flatMap(parent => systemFor(world, parent) ?? []))
}

function internalSystems(world: World): WorldRecord[] {
  return [...world.byId.values()].filter(record => record.kind === 'system' && !isExternalPath(record.sourceFilename))
}

/** The record availableId named for this name and parent: its candidates up to the first free one. */
function existingChild(
  world: World,
  kind: C4Kind,
  name: string,
  parent?: WorldRecord,
): WorldRecord | undefined {
  for (let index = 0; ; index += 1) {
    const id = candidateId(name, parent, index)
    if (isFree(world, id)) return undefined
    const record = world.byId.get(id)
    if (record?.kind === kind && record.parent === parent?.id) return record
  }
}

async function attachReference(
  repositoryRoot: string,
  world: World,
  record: WorldRecord,
  reference: CodeReference,
): Promise<void> {
  record.code = [...record.code, reference].sort((left, right) => {
    return `${left.file}\0${left.scanner}`.localeCompare(`${right.file}\0${right.scanner}`)
  })
  world.byCodeFile.set(reference.file, record)
  await upsertCode(repositoryRoot, record.sourceFilename, record.code)
}

async function createInitialSystem(
  repositoryRoot: string,
  world: World,
  observations: ScanObservation[],
  summary: ScanSummary,
): Promise<void> {
  if (internalSystems(world).length > 0 || !observations.some(observation => observation.files.length > 0)) return
  // loadArchitecture has already validated the required project profile.
  const project = (await loadProjectProfile(repositoryRoot))!
  await createRecord(repositoryRoot, world, { kind: 'system', name: project.title })
  summary.created += 1
}

function scanReference(
  observation: ScanObservation,
  file: ScanFile,
): CodeReference {
  const symbol = file.symbols.length === 1 ? file.symbols[0]?.name : undefined
  return {
    scanner: observation.scanner.id,
    file: file.file,
    ...(symbol === undefined ? {} : { symbol }),
  }
}

interface FileCandidate {
  file: string
  parents: WorldRecord[]
  references: CodeReference[]
  owner?: WorldRecord
}

function associateCandidates(
  candidates: Map<string, FileCandidate>,
  observations: ScanObservation[],
  world: World,
) {
  const { units, diagnostics } = sourceUnitGroups(observations, world.byCodeFile)
  for (const { unit, owner } of units) {
    const members = unit.files.map(file => candidates.get(file))
    const primary = candidates.get(unit.primary)
    if (!primary || members.some(member => member === undefined)) continue
    const references = members.flatMap(member => member!.references)
    for (const file of unit.files) candidates.delete(file)
    candidates.set(unit.primary, { ...primary, parents: members.flatMap(member => member!.parents), references, owner })
  }
  return diagnostics
}

function collectFiles(
  candidates: Map<string, FileCandidate>,
  observation: ScanObservation,
  placements: Map<string, WorldRecord[]>,
): void {
  for (const file of observation.files) {
    const candidate = candidates.get(file.file) ?? { file: file.file, parents: [], references: [] }
    candidate.parents.push(...file.roots.flatMap(id => placements.get(id) ?? []))
    const reference = scanReference(observation, file)
    if (!candidate.references.some(item => item.scanner === reference.scanner)) candidate.references.push(reference)
    candidates.set(file.file, candidate)
  }
}

function requirePlacement(file: string, parent: WorldRecord | undefined): WorldRecord {
  if (parent === undefined) throw new Error(`Cannot determine a system for ${file}; existing systems do not establish its ownership`)
  return parent
}

async function reconcileFiles(
  repositoryRoot: string,
  world: World,
  candidates: Map<string, FileCandidate>,
  entryMemberFiles: ReadonlySet<string>,
  summary: ScanSummary,
): Promise<WorldRecord[]> {
  const unowned: Array<FileCandidate & { parent: WorldRecord }> = []
  for (const candidate of [...candidates.values()].sort((a, b) => a.file.localeCompare(b.file))) {
    const parent = commonParent(world, candidate.parents)
    const named = existingChild(world, 'component', sourceStem(candidate.file), parent)
    const draft = named?.status === 'draft' && named.code.length === 0 ? named : undefined
    const owner = candidate.owner ?? world.byCodeFile.get(candidate.file) ?? draft
    if (owner === undefined) {
      // New execution members need entry inference, not a helper's inherited container.
      const initialParent = candidate.references.some(reference => entryMemberFiles.has(reference.file))
        ? systemFor(world, parent) : parent
      unowned.push({ ...candidate, parent: requirePlacement(candidate.file, initialParent) })
      continue
    }
    if (owner === draft) summary.matched += 1
    await attachMissingReferences(repositoryRoot, world, owner, candidate.references)
  }
  const names = componentNames(unowned.map(candidate => ({
    file: candidate.file, parent: candidate.parent.id,
  })), new Set([...world.byId.values()].flatMap(record => [record.id, kebabCase(record.title)])))
  return unowned.map(candidate => reserveRecord(repositoryRoot, world, {
    kind: 'component', ...names.get(candidate.file)!, parent: candidate.parent,
    code: candidate.references.sort((a, b) => a.scanner.localeCompare(b.scanner)),
  }))
}

async function attachMissingReferences(repositoryRoot: string, world: World, owner: WorldRecord, references: CodeReference[]) {
  for (const reference of references) {
    if (!owner.code.some(item => item.file === reference.file && item.scanner === reference.scanner)) {
      await attachReference(repositoryRoot, world, owner, reference)
    }
  }
}

function sourceRootGroups(observation: ScanObservation): Map<ScanRoot, ScanRoot[]> {
  const byId = new Map(observation.roots.map(root => [root.id, root]))
  const memberships = new Set(observation.files.flatMap(file => file.roots))
  const groups = new Map<ScanRoot, ScanRoot[]>()
  for (const root of observation.roots.filter(root => memberships.has(root.id))) {
    let top = root
    while (top.parent !== undefined) top = byId.get(top.parent)!
    const members = groups.get(top) ?? []
    members.push(root)
    groups.set(top, members)
  }
  return groups
}

function namedPlacement(world: World, root: ScanRoot, system: WorldRecord | undefined): WorldRecord[] {
  if (system === undefined) return []
  return [existingChild(world, 'container', root.name, system) ?? system]
}

function observationPlacements(world: World, observation: ScanObservation): Map<string, WorldRecord[]> {
  const placements = new Map<string, WorldRecord[]>()
  for (const [top, roots] of sourceRootGroups(observation)) {
    const parents = new Map(roots.map(root => [root.id, sourceParents(world, observation, root)]))
    const systems = [...parents.values()].flat().flatMap(parent => systemFor(world, parent) ?? [])
    const system = systems.length > 0 ? onlyRecord(systems)
      : existingChild(world, 'system', top.name) ?? onlyRecord(internalSystems(world))
    for (const root of roots) {
      // Source groups can reuse an established boundary, but cannot establish a new one.
      const known = parents.get(root.id)!
      placements.set(root.id, known.length > 0 ? known : namedPlacement(world, root, system))
    }
  }
  return placements
}

async function placeEntries(repositoryRoot: string, world: World, observations: ScanObservation[], summary: ScanSummary, pending: WorldRecord[]): Promise<void> {
  const parents = new Map<string, string>()
  const newIds = new Set(pending.map(record => record.id))
  for (const placement of entryPointPlacements(world, observations)) {
    const container = placement.container ?? await createRecord(repositoryRoot, world, {
      kind: 'container', name: placement.name, parent: placement.system,
    })
    if (!placement.container) summary.created += 1
    for (const component of placement.components) {
      if (!newIds.has(component.id)) { parents.set(component.id, container.id); continue }
      component.parent = container.id
      component.sourceFilename = architectureElementPath({
        root: GromaFileSystem.open(repositoryRoot).sourceFilename(), kind: component.kind, id: component.id,
        parentSourceFilename: container.sourceFilename,
      })
    }
  }
  for (let offset = 0; offset < pending.length; offset += 16) {
    await Promise.all(pending.slice(offset, offset + 16).map(record => writeRecord(repositoryRoot, record)))
  }
  summary.created += pending.length
  await completeContainerPlacement(repositoryRoot, parents)
}

export async function reconcileScanObservations(
  repositoryRoot: string,
  observations: ScanObservation[],
): Promise<ScanSummary> {
  return GromaFileSystem.open(repositoryRoot).withAccess(async () => {
    const summary: ScanSummary = { created: 0, refreshed: 0, matched: 0 }
    if (!observations.length) return summary
    const records = await loadArchitecture(repositoryRoot)
    const model = buildArchitectureModel(records.documents)
    const connections = storedConnections(records.documents, model.elements, (_code, file, message) => {
      throw new Error(`${file}: ${message}`)
    })
    const active = new Set(observations.map(observation => observation.scanner.id))
    // Derived technology lists the contributing scanner IDs. Incomplete evidence cannot replace that pair.
    const retained = connections.filter(row => !row.authored && row.technology.split(', ').some(id => !active.has(id)))
    const protectedFiles = new Set([...retained, ...connections.filter(row => row.authored)]
      .flatMap(row => [row.source, row.target]))
    const world = indexWorld(records)
    const findingsJob = prepareArchitectureFindings(observations)
    try {
      const diagnostics = observations.flatMap(observation => observation.diagnostics.map(diagnostic => ({
        scanner: observation.scanner, diagnostic,
      })))
      if (diagnostics.length > 0) summary.scannerDiagnostics = diagnostics
      await refreshCuratedCode(repositoryRoot, world, observations, summary, protectedFiles)
      await createInitialSystem(repositoryRoot, world, observations, summary)
      await establishDataStores(repositoryRoot, world, observations, summary)
      const candidates = new Map<string, FileCandidate>()
      for (const observation of observations) {
        const placements = observationPlacements(world, observation)
        collectFiles(candidates, observation, placements)
      }
      const unitConflicts = associateCandidates(candidates, observations, world)
      const entryMemberFiles = new Set(observations.flatMap(observation => observation.entryPoints?.flatMap(entry => entry.files) ?? []))
      const pending = await reconcileFiles(repositoryRoot, world, candidates, entryMemberFiles, summary)
      await placeEntries(repositoryRoot, world, observations, summary, pending)
      await refreshRuntimeConfiguration(repositoryRoot, indexWorld(await loadArchitecture(repositoryRoot)), observations)
      const owners = new Map([...world.byId.values()].flatMap(record => record.code.map(reference => [reference.file, record.id] as const)))
      const conflicts = [...unitConflicts, ...await refreshDerivedRelationships(repositoryRoot, observations)]
      if (conflicts.length > 0) summary.evidenceConflicts = conflicts
      const findings = await findingsJob.complete(owners)
      rememberArchitectureFindings(repositoryRoot, findings)
      if (findings.length > 0) summary.findings = findings.length
      return summary
    } finally {
      await findingsJob.close()
    }
  })
}
