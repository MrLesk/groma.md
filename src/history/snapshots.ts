import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ArchitectureReadError } from '../architecture-reader.ts'
import { loadAnnotatedArchitecture } from '../core.ts'
import { GromaBusyError } from '../groma-filesystem.ts'
import { loadProjectProfile, type ProjectProfile } from '../project-profile.ts'
import type { AnnotatedArchitectureModel } from '../types.ts'
import type { GitRevision } from './revisions.ts'
import { withGitRevision } from './revisions.ts'
import { compareArchitecture, ownedFiles, type SourceTexts } from './comparison.ts'

/** The architecture of one working tree or commit, with the folder its files are read from. */
export interface Snapshot {
  root: string
  world: AnnotatedArchitectureModel
  project: ProjectProfile
}

/**
 * The architecture reader rejects what a folder holds: no architecture, or one that follows an older Markdown
 * contract. A Git error, a full disk, another operating-system failure or a busy project lock is never this error.
 */
export class UnreadableArchitectureError extends Error {
  constructor(cause: unknown) {
    super(cause instanceof Error ? cause.message : String(cause), { cause })
    this.name = 'UnreadableArchitectureError'
  }
}

/** A working tree stays in place; a commit is read in an isolated temporary archive. */
export function atRevision<T>(root: string, revision: GitRevision | null, read: (root: string) => Promise<T>): Promise<T> {
  return revision === null ? read(root) : withGitRevision(root, revision.id, read)
}

/**
 * A busy project lock or an operating-system failure says nothing about the architecture. The reader wraps a file it
 * could not open; only a missing file there is a missing document, which is a rejected architecture.
 */
function isIoFailure(error: unknown): boolean {
  const failure = error instanceof ArchitectureReadError ? error.cause : error
  if (failure instanceof GromaBusyError) return true
  const system = failure as NodeJS.ErrnoException | undefined
  return system?.syscall !== undefined && system.code !== 'ENOENT'
}

/** Reads the architecture in a folder. Only what the reader rejects is reported as UnreadableArchitectureError. */
export async function readSnapshot(root: string): Promise<Snapshot> {
  try {
    const [world, project] = await Promise.all([loadAnnotatedArchitecture(root), loadProjectProfile(root)])
    if (project === undefined) throw new Error('No Groma architecture in this revision')
    return { root, world, project }
  } catch (error) {
    throw isIoFailure(error) ? error : new UnreadableArchitectureError(error)
  }
}

/** Missing files are meaningful deletions; other read failures remain visible. */
export async function readSourceTexts(root: string, files: string[]): Promise<SourceTexts> {
  return Object.fromEntries(await Promise.all(files.map(async file => {
    try { return [file, await readFile(path.join(root, file), 'utf8')] }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [file, undefined]
      throw error
    }
  })))
}

/**
 * Assembles the comparison of two loaded snapshots; `from` is the revision `before` was read from. Both folders must
 * still exist: each side also reads the files only the other side owns.
 */
export async function compareSnapshots(from: GitRevision | null, before: Snapshot, after: Snapshot) {
  const files = [...new Set([...ownedFiles(before.world), ...ownedFiles(after.world)])]
  const [oldSources, newSources] = await Promise.all([readSourceTexts(before.root, files), readSourceTexts(after.root, files)])
  const { world, components, relationships } = compareArchitecture(before.world, after.world, oldSources, newSources)
  return { project: after.project, world, comparison: { from, components, relationships } }
}

/** Compares two revisions that are read for this call only; each commit's archive is removed afterwards. */
export function readComparison(root: string, from: GitRevision | null, to: GitRevision | null) {
  return atRevision(root, from, beforeRoot => atRevision(root, to, async afterRoot => {
    const [before, after] = await Promise.all([readSnapshot(beforeRoot), readSnapshot(afterRoot)])
    return compareSnapshots(from, before, after)
  }))
}
