import { compareArchitecture, ownedFiles } from '../../../history/comparison.ts'
import { openGitRevision } from '../../../history/revisions.ts'
import { readSnapshot, readSourceTexts } from '../../../history/snapshots.ts'
import { measuredSheetScene } from '../../../sheet/scene.ts'
import type { ArchitectureGraph } from '../../../types.ts'
import { readSource } from '../../source/read.ts'
import { readSnapshotCodeStructure } from '../../source/structure.ts'
import type { WebMapPayload, WebRevision } from '../payload.ts'

/** Historical architecture is immutable: share each in-flight read for the lifetime of the web session. */
export function createRevisionHistory(repositoryRoot: string) {
  const snapshots = new Map<string, ReturnType<typeof read>>()

  async function read(revision: WebRevision) {
    const started = performance.now()
    const archive = await openGitRevision(repositoryRoot, revision.id)
    try {
      const model = await readSnapshot(archive.root)
      const sources = await readSourceTexts(archive.root, ownedFiles(model.world))
      return { ...archive, ...model, sources, architectureLoadMilliseconds: performance.now() - started,
        view: undefined as Pick<WebMapPayload, 'project' | 'world' | 'sheet' | 'timings'> | undefined }
    } catch (error) {
      await archive.close()
      throw error
    }
  }

  function snapshot(revision: WebRevision) {
    let pending = snapshots.get(revision.id)
    if (pending === undefined) {
      pending = read(revision)
      snapshots.set(revision.id, pending)
    }
    return pending
  }

  /** Comparisons and compatibility checks need the model; only an ordinary view needs this layout. */
  async function view(revision: WebRevision) {
    const stored = await snapshot(revision)
    if (stored.view === undefined) {
      const sheet = measuredSheetScene(stored.world)
      stored.view = { project: stored.project, world: stored.world, sheet: sheet.scene,
        timings: { architectureLoadMilliseconds: stored.architectureLoadMilliseconds, ...sheet.timings,
          totalMilliseconds: stored.architectureLoadMilliseconds + sheet.timings.placementMilliseconds + sheet.timings.routingMilliseconds } }
    }
    return stored.view
  }

  // A comparison also needs files that were present but not owned on the other side.
  async function sourcesAt(revision: WebRevision, files: string[]) {
    const stored = await snapshot(revision)
    const missing = files.filter(file => !Object.hasOwn(stored.sources, file))
    Object.assign(stored.sources, await readSourceTexts(stored.root, missing))
    return stored.sources
  }

  async function structure(revision: WebRevision, world: ArchitectureGraph, element: string) {
    const stored = await snapshot(revision)
    return readSnapshotCodeStructure(repositoryRoot, stored.root, world, element)
  }

  async function source(revision: WebRevision, world: ArchitectureGraph, element: string, file: string) {
    const stored = await snapshot(revision)
    return readSource(stored.root, world, null, element, file)
  }

  async function compare(from: WebRevision, to: WebRevision) {
    const [before, after] = await Promise.all([snapshot(from), snapshot(to)])
    const files = [...new Set([...ownedFiles(before.world), ...ownedFiles(after.world)])]
    const [oldSources, newSources] = await Promise.all([sourcesAt(from, files), sourcesAt(to, files)])
    const { world, components, relationships } = compareArchitecture(before.world, after.world, oldSources, newSources)
    return { project: after.project, world, comparison: { from, components, relationships } }
  }

  /** Git's newest-first list defines the same ordering as the revision picker, never commit timestamps. */
  async function range(revisions: WebRevision[], from: string, to: string): Promise<WebRevision[]> {
    const start = revisions.findIndex(revision => revision.id === from)
    const end = revisions.findIndex(revision => revision.id === to)
    if (end < 0 || start <= end) throw new Error('Choose an older start commit and a newer end commit')
    const ordered = revisions.slice(end, start + 1).reverse()
    const compatible: WebRevision[] = []
    for (const revision of ordered) {
      try {
        await snapshot(revision)
        compatible.push(revision)
      } catch {
        // An older Markdown contract is not a frame the current reader can play.
      }
    }
    if (compatible[0]?.id !== from || compatible.at(-1)?.id !== to) {
      throw new Error('Both playback endpoints must have readable Groma architecture')
    }
    return compatible
  }

  async function close(): Promise<void> {
    await Promise.all([...snapshots.values()].map(pending => pending.then(stored => stored.close(), () => {})))
  }

  return { view, compare, range, structure, source, close }
}
