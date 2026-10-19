import type { CodeFile, SourceReference } from '@groma/scanner'
import { configuredScannerModules, type FoundScannerModule } from '../../scanner/modules/inventory.ts'
import { importScanner } from '../../scanner/registry.ts'
import { readGromaConfig } from '../../config.ts'
import { configuredSelection, selectedFiles } from '../../scanner/modules/selection.ts'
import { listGitRevisionFiles, withGitRevision } from '../../history/revisions.ts'
import { repositoryListing } from '../../repository-listing.ts'
import type { ArchitectureGraph, CodeReference } from '../../types.ts'
export type { CodeDeclaration, CodeFile, CodeSymbol, CodeVisibility } from '@groma/scanner'

interface OutlineRequest {
  /** The configured scanner that outlines the file. */
  scanner?: string
  reference: SourceReference
}

/**
 * One request per Code file, in Code order. A file several scanners own, such as an Angular source that
 * TypeScript also owns, is outlined once: by the lowest configured scanner id among its links, with the
 * symbols of all its links.
 */
function outlineRequests(code: readonly CodeReference[], scannerIds: ReadonlySet<string>): OutlineRequest[] {
  const requests = new Map<string, OutlineRequest>()
  for (const link of code) {
    const request = requests.get(link.file) ?? { reference: { file: link.file, symbols: [] } }
    const { symbols } = request.reference
    if (link.symbol !== undefined && !symbols.includes(link.symbol)) symbols.push(link.symbol)
    if (scannerIds.has(link.scanner) && (request.scanner === undefined || link.scanner < request.scanner)) {
      request.scanner = link.scanner
    }
    requests.set(link.file, request)
  }
  return [...requests.values()]
}

/** Candidate source inputs for one live or historical outline batch, including parsing metadata. */
export async function outlineSourceFiles(repositoryRoot: string, revision: string | null): Promise<string[]> {
  const config = await readGromaConfig(repositoryRoot)
  if (config.scanners.length === 0) return []
  if (revision !== null) return listGitRevisionFiles(repositoryRoot, revision)
  return repositoryListing(repositoryRoot, config.useGitignore ?? true)
}

/** Ask the configured scanners for the outline of each file in the component's Code, in Code order. */
export async function readCodeStructure(
  repositoryRoot: string,
  world: ArchitectureGraph,
  revision: string | null,
  elementId: string,
): Promise<CodeFile[] | undefined> {
  const sourceFiles = await outlineSourceFiles(repositoryRoot, revision)
  const load = (root: string) => readSnapshotCodeStructure(repositoryRoot, root, world, elementId, sourceFiles)
  return revision === null ? load(repositoryRoot) : withGitRevision(repositoryRoot, revision, load)
}

/** Installed scanners belong to the repository; their source input can be an already-open Git snapshot. */
export async function readSnapshotCodeStructure(
  repositoryRoot: string,
  snapshotRoot: string,
  world: ArchitectureGraph,
  elementId: string,
  sourceFiles: readonly string[],
): Promise<CodeFile[] | undefined> {
  const element = world.elements.find(candidate => (
    candidate.kind === 'component' && candidate.representationId === elementId
  ))
  if (element === undefined) return undefined
  const modules = (await configuredScannerModules(repositoryRoot))
    .filter((module): module is FoundScannerModule => module.status === 'found')
  const requests = outlineRequests(element.code, new Set(modules.map(module => module.id)))
  const order = requests.map(request => request.reference.file)
  const config = await readGromaConfig(repositoryRoot)
  const files = await Promise.all(modules.map(async module => {
    const references = requests.filter(request => request.scanner === module.id).map(request => request.reference)
    if (references.length === 0) return []
    // A scanner that cannot load or outline here, such as one missing its worker, contributes no outline, like one without the hook.
    try {
      const scanner = await importScanner(module.entry, module.id)
      const context = selectedFiles(sourceFiles, configuredSelection(config, module.id))
      return await scanner.readCodeStructure?.(snapshotRoot, references, module.settings, context) ?? []
    } catch {
      return []
    }
  }))
  return files.flat().sort((left, right) => order.indexOf(left.file) - order.indexOf(right.file))
}
