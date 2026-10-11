import { openGitRevision } from '../../history/revisions.ts'
import { compareSnapshots, readSnapshot, type Snapshot } from '../../history/snapshots.ts'
import type { ArchitectureGraph } from '../../types.ts'
import { readSource } from '../source/read.ts'
import { readSnapshotCodeStructure } from '../source/structure.ts'
import type { WebRevision } from './payload.ts'
import { layOutMap, type MapView } from './runtime.ts'

/**
 * How many commits stay extracted once the requests reading them have finished. Playback needs four: a frame
 * compares the previous commit with the current one, and the browser preloads the next two frames (`preload` in
 * revision/playback.ts).
 */
export const OPEN_ARCHIVES = 4

/** One commit, extracted into a temporary folder and read by the current architecture reader. */
interface Archive extends Snapshot {
  architectureLoadMilliseconds: number
  /** The commit's ordinary map. The first request for it stores it here; a comparison lays out its own map. */
  view?: MapView
  /** Deletes the temporary folder. */
  close(): Promise<void>
}

/** A commit that is open or still being opened. */
interface Entry {
  opened: Promise<Archive>
  /**
   * How many requests are reading the folder right now. Only a folder without readers is deleted to make room: a
   * folder deleted under a reader makes every file look deleted, with no error.
   */
  readers: number
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

  /** Counts one more reader of the commit and starts opening it when it is not open. */
  function hold(revision: WebRevision): Entry {
    let entry = entries.get(revision.id)
    if (entry === undefined) {
      entry = { opened: open(revision), readers: 0 }
      // A commit that failed to open is not kept, so the next request tries again.
      void entry.opened.catch(() => entries.delete(revision.id))
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

  /** The one way to read a commit: runs `read` on the open commit, whose folder exists until `read` settles. */
  async function withArchive<T>(revision: WebRevision, read: (archive: Archive) => T | Promise<T>): Promise<T> {
    const entry = hold(revision)
    try {
      return await read(await entry.opened)
    } finally {
      release(entry)
    }
  }

  /** The commit's ordinary map, laid out once while the commit stays open. */
  function view(revision: WebRevision): Promise<MapView> {
    return withArchive(revision, archive => {
      archive.view ??= layOutMap(archive.world, archive.project, archive.architectureLoadMilliseconds)
      return archive.view
    })
  }

  /** The changes from one commit to a newer one. Both commits stay open until their files have been read. */
  function compare(from: WebRevision, to: WebRevision) {
    return withArchive(from, before => withArchive(to, after => compareSnapshots(from, before, after)))
  }

  function structure(revision: WebRevision, world: ArchitectureGraph, element: string) {
    return withArchive(revision, archive => readSnapshotCodeStructure(repositoryRoot, archive.root, world, element))
  }

  function source(revision: WebRevision, world: ArchitectureGraph, element: string, file: string) {
    // The open folder is read in place: it is passed as the root, and `null` means "do not extract a commit again".
    return withArchive(revision, archive => readSource(archive.root, world, null, element, file))
  }

  /** Deletes every folder, including the ones still being deleted in the background. */
  async function close(): Promise<void> {
    for (const entry of entries.values()) remove(entry)
    entries.clear()
    await Promise.all(removals)
  }

  return { withArchive, view, compare, structure, source, close }
}
