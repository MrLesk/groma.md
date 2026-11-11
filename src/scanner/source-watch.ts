import { subscribe } from '@parcel/watcher'
import { once } from 'node:events'
import { statSync, watch } from 'node:fs'
import { realpath } from 'node:fs/promises'
import path from 'node:path'

import { gromaDirectories } from '../groma-filesystem.ts'
import type { ScannerRegistry, ScanBatch, ScanEvent } from './registry.ts'

const SETTLE_MS = 150

/** Top-level folders no scan reads: Git's and Groma's own, and node_modules while Git's ignore rules apply. */
function skippedRoots(useGitignore: boolean): Set<string> {
  return new Set(['.git', ...gromaDirectories, ...(useGitignore ? ['node_modules'] : [])])
}

/** Whether a relative path leads out of the directory it starts from. A name such as `..notes` stays inside. */
function leavesDirectory(relative: string): boolean {
  return relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)
}

/**
 * Whether two paths lead to one directory, such as a directory and a symlink to it. The file system identifies a
 * directory by its device and inode numbers, whatever path leads there; `bigint` reads those numbers exactly.
 */
function sameDirectory(onePath: string, otherPath: string): boolean {
  try {
    const one = statSync(onePath, { bigint: true })
    const other = statSync(otherPath, { bigint: true })
    return one.dev === other.dev && one.ino === other.ino
  } catch {
    // A directory removed together with its files leads nowhere.
    return false
  }
}

/**
 * The nearest directory above an event path that is another spelling of the root, such as a symlink to it.
 * Only directories are looked up, never the changed file: a removed file is not on disk and is still a change.
 */
function otherRootSpelling(root: string, eventPath: string): string | undefined {
  let directory = path.dirname(eventPath)
  while (!sameDirectory(directory, root)) {
    const parent = path.dirname(directory)
    // The top of the file system: no directory above the event path is the repository root.
    if (parent === directory) return undefined
    directory = parent
  }
  return directory
}

/**
 * The repository file a watcher event is about: its path relative to the root with `/` separators, or undefined when
 * the event is not about a file inside the repository. This is the only place an absolute event path becomes a
 * repository file, so nothing that receives one has to check where it lies.
 *
 * An operating system can report a change under another spelling of the root than the one being watched. Such a path
 * is related to the spelling it uses, so it names the same file. A path under `root` as given never reads the disk.
 */
export function repositoryFile(root: string, eventPath: string): string | undefined {
  let relative = path.relative(root, eventPath)
  if (leavesDirectory(relative)) {
    const spelling = otherRootSpelling(root, eventPath)
    if (spelling === undefined) return undefined
    relative = path.relative(spelling, eventPath)
  }
  // The root directory itself is not a file.
  return relative === '' ? undefined : relative.split(path.sep).join('/')
}

/** Subscribes to changes below the root. The listener receives repository files only: see `repositoryFile`. */
async function subscribeSources(root: string, skipped: Set<string>, listener: (error: Error | null, files: string[]) => void) {
  if (process.platform !== 'win32') {
    return subscribe(root, (error, events) => {
      listener(error, events.map(event => repositoryFile(root, event.path)).filter(file => file !== undefined))
    }, { ignore: [...skipped] })
  }

  // Bun's Windows fs.watch registers ReadDirectoryChangesW before returning.
  // Parcel can return before its queued registration runs, losing the first edit.
  // fs.watch names each change relative to the watched root, so its names are repository files already.
  const watcher = watch(root, { recursive: true }, (_event, filename) => {
    // A change without a name, or with an empty one, names no file.
    if (!filename) return
    const file = filename.split(path.sep).join('/')
    if (!skipped.has(file.split('/')[0]!)) listener(null, [file])
  })
  watcher.on('error', error => listener(error, []))
  return {
    async unsubscribe() {
      const closed = once(watcher, 'close')
      watcher.close()
      await closed
    },
  }
}

/** Owns source watching and emits evidence; architecture storage belongs to the caller. */
export async function watchObservations(
  repositoryRoot: string,
  registry: ScannerRegistry,
  options: {
    scan?: boolean
    onScan?: (event: ScanEvent) => void
    watchesFile?: (file: string) => boolean
    onObservations: (batch: ScanBatch, files: string[]) => void | Promise<void>
    onError?: (error: unknown) => void | Promise<void>
  },
): Promise<{ close(): Promise<void> }> {
  const root = await realpath(repositoryRoot)
  const changed = new Set<string>()
  let timer: ReturnType<typeof setTimeout> | undefined
  let running = false
  let closed = false
  let active = Promise.resolve()

  function launch(): void {
    active = run()
  }

  async function run(): Promise<void> {
    if (closed) return
    running = true
    const files = [...changed]
    changed.clear()
    try {
      const observations = await registry.collectObservations(root, files, options.onScan)
      if (!closed) await options.onObservations(observations, files)
    } catch (error) {
      if (!closed) await options.onError?.(error)
    } finally {
      running = false
      if (changed.size && !closed && timer === undefined) launch()
    }
  }

  function schedule(): void {
    clearTimeout(timer)
    timer = setTimeout(() => {
      timer = undefined
      if (!running && !closed) launch()
    }, SETTLE_MS)
  }

  const watcher = await subscribeSources(root, skippedRoots(registry.useGitignore), (error, files) => {
    if (closed) return
    if (error) {
      options.onError?.(error)
      return
    }
    const relevant = files.filter(file => registry.watchesFile(file) || options.watchesFile?.(file))
    if (!relevant.length) return
    for (const file of relevant) changed.add(file)
    schedule()
  })

  // Subscribe before the first scan so edits during startup enter the same queue.
  if (options.scan) {
    launch()
    await active
  }

  return {
    async close() {
      if (closed) return
      closed = true
      clearTimeout(timer)
      await watcher.unsubscribe()
      await active
    },
  }
}
