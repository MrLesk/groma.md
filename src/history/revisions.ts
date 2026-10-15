import { execFile, spawn } from 'node:child_process'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

import { loadArchitecture } from '../architecture-reader.ts'
import { annotateArchitecture } from '../core.ts'
import { GromaFileSystem } from '../groma-filesystem.ts'
import { loadProjectProfile } from '../project-profile.ts'

/** Metadata for one exact Git commit. */
export interface GitRevision {
  id: string
  shortId: string
  date: string
  subject: string
  body: string
  tag?: string
}

export interface GromaRevision extends GitRevision {
  compatible: boolean
}

function runGit(arguments_: string[], repositoryRoot: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('git', arguments_, {
      cwd: repositoryRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    const stdout: Buffer[] = []
    let stderr = ''
    child.stdout.on('data', chunk => stdout.push(chunk as Buffer))
    child.stderr.setEncoding('utf8')
    child.stderr.on('data', chunk => {
      stderr += chunk
    })
    child.on('error', reject)
    child.on('close', code => {
      if (code === 0) resolve(Buffer.concat(stdout).toString('utf8'))
      else reject(new Error(stderr.trim() || `git exited ${code}`))
    })
  })
}

/** Resolves the repository's current commit to its full, stable identity. */
export async function currentGitRevision(repositoryRoot: string): Promise<string> {
  return (await runGit(['rev-parse', 'HEAD'], repositoryRoot)).trim()
}

/** Resolves a commit's parent to the full identity used as a comparison base. */
export async function parentGitRevision(
  repositoryRoot: string,
  revisionId: string,
): Promise<string> {
  return (await runGit(['rev-parse', `${revisionId}^`], repositoryRoot)).trim()
}

/** Finds the newest current-branch commit whose subject exactly matches the task convention. */
export async function findGitCommitBySubject(
  repositoryRoot: string,
  subject: string,
): Promise<string | undefined> {
  const output = await runGit(['log', '--format=%H%x00%s%x00'], repositoryRoot)
  const fields = output.split('\0')
  for (let index = 0; index + 1 < fields.length; index += 2) {
    if (fields[index + 1] === subject) return fields[index]!.trimStart()
  }
  return undefined
}

/** Reads one text file at an exact Git revision, or reports that it did not exist. */
export async function readGitText(
  repositoryRoot: string,
  revisionId: string,
  filename: string,
): Promise<string | undefined> {
  try {
    return await runGit(['show', `${revisionId}:${filename}`], repositoryRoot)
  } catch {
    return undefined
  }
}

/** A repository whose branch has no commit yet has no history to offer. */
function hasCommits(repositoryRoot: string): Promise<boolean> {
  return runGit(['rev-parse', '--verify', '--quiet', 'HEAD'], repositoryRoot)
    .then(() => true, () => false)
}

/** Current-branch commits, newest first, without reading architecture or source files. */
export async function listGitRevisions(repositoryRoot: string): Promise<GitRevision[]> {
  return readRevisionLog(repositoryRoot, [])
}

const REVISION_FORMAT = '--format=%H%x00%h%x00%cI%x00%s%x00%b%x00%(decorate:prefix=,suffix=,separator=%x1f,tag=)%x00'

/**
 * Two commits from older to newer, the order every comparison runs in, for an export, which has no history list to
 * read it from: an ancestor before its descendant. Commits on diverging branches keep their order.
 */
export async function olderFirst(repositoryRoot: string, a: GitRevision, b: GitRevision): Promise<[GitRevision, GitRevision]> {
  const base = (await runGit(['merge-base', a.id, b.id], repositoryRoot)).trim()
  return base === b.id ? [b, a] : [a, b]
}

/** Resolves an explicit export reference, including a commit outside the current branch. */
export async function readGitRevision(repositoryRoot: string, reference: string): Promise<GitRevision> {
  const id = (await runGit(['rev-parse', '--verify', '--end-of-options', `${reference}^{commit}`], repositoryRoot)).trim()
  const output = await runGit(['log', '-1', '--decorate-refs=refs/tags/*', REVISION_FORMAT, id, '--'], repositoryRoot)
  return parseRevisions(output)[0]!
}

async function readRevisionLog(repositoryRoot: string, paths: string[]): Promise<GitRevision[]> {
  if (!await hasCommits(repositoryRoot)) return []
  const output = await runGit([
    'log',
    '--decorate-refs=refs/tags/*',
    REVISION_FORMAT,
    '--', ...paths,
  ], repositoryRoot)
  return parseRevisions(output)
}

function parseRevisions(output: string): GitRevision[] {
  const fields = output.split('\0')
  const revisions: GitRevision[] = []
  for (let index = 0; index + 5 < fields.length; index += 6) {
    const id = fields[index]!.trimStart()
    if (id === '') continue
    const tags = fields[index + 5]!.split('\x1f').map(tag => tag.trim()).filter(Boolean).sort()
    revisions.push({
      id,
      shortId: fields[index + 1]!,
      date: fields[index + 2]!,
      subject: fields[index + 3]!,
      body: fields[index + 4]!.trim(),
      ...(tags[0] === undefined ? {} : { tag: tags[0] }),
    })
  }
  return revisions
}

/** Current-branch Groma revisions, including commits the current reader cannot open. */
export async function listGromaRevisions(repositoryRoot: string): Promise<GromaRevision[]> {
  const revisions = await readRevisionLog(repositoryRoot, [GromaFileSystem.open(repositoryRoot).directory])
  const result: GromaRevision[] = []
  // Bound simultaneous archive extraction and Markdown parsing during startup.
  for (let index = 0; index < revisions.length; index += 4) {
    result.push(...await Promise.all(revisions.slice(index, index + 4).map(async revision => ({
      ...revision,
      compatible: await withGitGromaRevision(repositoryRoot, revision.id, async snapshotRoot => {
        try {
          if (await loadProjectProfile(snapshotRoot) === undefined) return false
          annotateArchitecture(await loadArchitecture(snapshotRoot))
          return true
        } catch {
          return false
        }
      }),
    }))))
  }
  return result
}

async function withGitTree<T>(
  repositoryRoot: string,
  revisionId: string,
  paths: string[],
  load: (snapshotRoot: string) => Promise<T>,
): Promise<T> {
  const temporaryRoot = await mkdtemp(path.join(tmpdir(), 'groma-revision-'))
  const snapshotRoot = path.join(temporaryRoot, 'tree')
  try {
    await mkdir(snapshotRoot)
    await runGit([
      '-c', 'core.autocrlf=false', 'archive', '--format=tar',
      '--output', path.join(temporaryRoot, 'archive.tar'), revisionId, ...paths,
    ], repositoryRoot)
    // A complete file avoids a broken pipe when tar stops reading archive padding.
    // Keep tar's path relative: GNU tar treats Windows drive letters as remote hosts.
    await promisify(execFile)('tar', ['-xf', '../archive.tar'], { cwd: snapshotRoot })
    return await load(snapshotRoot)
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true })
  }
}

/** Loads through a complete, temporary repository snapshot and always removes it afterwards. */
export function withGitRevision<T>(
  repositoryRoot: string,
  revisionId: string,
  load: (snapshotRoot: string) => Promise<T>,
): Promise<T> {
  return withGitTree(repositoryRoot, revisionId, [], load)
}

/** Loads only a commit's Groma Markdown tree for current-contract validation. */
export function withGitGromaRevision<T>(
  repositoryRoot: string,
  revisionId: string,
  load: (snapshotRoot: string) => Promise<T>,
): Promise<T> {
  return withGitTree(
    repositoryRoot,
    revisionId,
    [GromaFileSystem.open(repositoryRoot).directory],
    load,
  )
}
