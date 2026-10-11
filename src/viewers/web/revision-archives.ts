import { openGitRevision } from '../../history/revisions.ts'
import { compareSnapshots, readSnapshot, type Snapshot } from '../../history/snapshots.ts'
import { measuredSheetScene } from '../../sheet/scene.ts'
import type { ArchitectureGraph } from '../../types.ts'
import { readSource } from '../source/read.ts'
import { readSnapshotCodeStructure } from '../source/structure.ts'
import type { WebMapPayload, WebRevision } from './payload.ts'

/**
 * How many commits stay extracted once the requests reading them have finished. Playback needs four: a frame
 * compares the previous commit with the current one, and the browser preloads the next two frames.
 */
const OPEN_ARCHIVES = 4

type SnapshotView = Pick<WebMapPayload, 'project' | 'world' | 'sheet' | 'timings'>

/** One commit, extracted into a temporary folder and read by the current architecture reader. */
interface Archive extends Snapshot {
  architectureLoadMilliseconds: number
  /** The commit's ordinary map. The first request for it stores it here; a comparison lays out its own map. */
  view?: SnapshotView
  /** Deletes the temporary folder. */
  close(): Promise<void>
}

/** A commit that is open or still being opened. */
interface Entry {
  opened: Promise<Archive>
  /** How many requests are reading the folder right now. Only a folder without readers is deleted to make room. */
  readers: number
}

function layOut(archive: Archive): SnapshotView {
  const sheet = measuredSheetScene(archive.world)
  return { project: archive.project, world: archive.world, sheet: sheet.scene,
    timings: { architectureLoadMilliseconds: archive.architectureLoadMilliseconds, ...sheet.timings,
      totalMilliseconds: archive.architectureLoadMilliseconds + sheet.timings.placementMilliseconds + sheet.timings.routingMilliseconds } }
}

/**
 * Runs in the web host, never in the browser. Opening a commit extracts the whole repository at that commit into a
 * temporary folder, so every commit a person browses or plays costs disk space and memory. Only the OPEN_ARCHIVES
 * most recently used commits therefore stay open. The browser keeps the frames it has received (revision/playback.ts),
 * so replaying a range does not ask for them again.
 */
export function createRevisionArchives(repositoryRoot: string) {
  /** By commit id, least recently used first. */
  const entries = new Map<string, Entry>()
  /** Folders being deleted; `close` waits for them. */
  const removals = new Set<Promise<void>>()

  async function open(revision: WebRevision): Promise<Archive> {
    const started = performance.now()
    const { root, close } = await openGitRevision(repositoryRoot, revision.id)
    try {
      return { ...await readSnapshot(root), close, architectureLoadMilliseconds: performance.now() - started }
    } catch (error) {
      await close()
      throw error
    }
  }

  /** Deletes the folder in the background, so the request that needed the room does not wait for it. */
  function remove(entry: Entry): void {
    // A commit that failed to open has already deleted its folder.
    const removal = entry.opened.then(archive => archive.close(), () => {})
    removals.add(removal)
    // A deletion that fails stays in the set, so `close` reports it.
    void removal.then(() => removals.delete(removal), () => {})
  }

  /**
   * Counts one more reader of the commit and starts opening it when it is not open. Every `hold` needs one `release`;
   * use `withArchive`, which pairs them, unless two commits must be open at the same time.
   */
  function hold(revision: WebRevision): Entry {
    let entry = entries.get(revision.id)
    if (entry === undefined) {
      const opening: Entry = { opened: open(revision), readers: 0 }
      // A commit that failed to open is not kept, so the next request tries again.
      void opening.opened.catch(() => { if (entries.get(revision.id) === opening) entries.delete(revision.id) })
      entry = opening
    }
    // Inserting again moves the commit to the most recently used end.
    entries.delete(revision.id)
    entries.set(revision.id, entry)
    entry.readers++
    return entry
  }

  /** Ends one `hold`, then closes the least recently used commits nobody is reading until OPEN_ARCHIVES remain. */
  function release(held: Entry): void {
    held.readers--
    for (const [id, entry] of entries) {
      if (entries.size <= OPEN_ARCHIVES) return
      if (entry.readers > 0) continue
      entries.delete(id)
      remove(entry)
    }
  }

  /** Runs `read` on the open commit; its folder exists until `read` settles. */
  async function withArchive<T>(revision: WebRevision, read: (archive: Archive) => T | Promise<T>): Promise<T> {
    const entry = hold(revision)
    try {
      return await read(await entry.opened)
    } finally {
      release(entry)
    }
  }

  /** The commit's ordinary map, laid out once while the commit stays open. */
  function view(revision: WebRevision): Promise<SnapshotView> {
    return withArchive(revision, archive => {
      archive.view ??= layOut(archive)
      return archive.view
    })
  }

  /** The changes from one commit to a newer one. Both are opened at the same time and held until their files are read. */
  async function compare(from: WebRevision, to: WebRevision) {
    const older = hold(from)
    const newer = hold(to)
    try {
      return await compareSnapshots(from, await older.opened, await newer.opened)
    } finally {
      release(older)
      release(newer)
    }
  }

  function structure(revision: WebRevision, world: ArchitectureGraph, element: string) {
    return withArchive(revision, archive => readSnapshotCodeStructure(repositoryRoot, archive.root, world, element))
  }

  function source(revision: WebRevision, world: ArchitectureGraph, element: string, file: string) {
    return withArchive(revision, archive => readSource(archive.root, world, null, element, file))
  }

  /** Rejects unless the commit can be opened and the current reader can read its architecture. */
  function requireReadable(revision: WebRevision): Promise<void> {
    return withArchive(revision, () => {})
  }

  /** Deletes every folder, including the ones still being deleted in the background. */
  async function close(): Promise<void> {
    for (const entry of entries.values()) remove(entry)
    entries.clear()
    await Promise.all(removals)
  }

  return { view, compare, structure, source, requireReadable, close }
}
