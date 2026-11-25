import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

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

/** The tracked source paths at an exact revision, including metadata without an architecture owner. */
export async function listGitRevisionFiles(repositoryRoot: string, revisionId: string): Promise<string[]> {
  return (await runGit(['ls-tree', '-r', '--name-only', '-z', revisionId], repositoryRoot)).split('\0').filter(Boolean)
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
  // Bound simultaneous snapshot writing and Markdown parsing during startup.
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

/** One file of a revision snapshot: the path Git records, and the identity and byte length of its stored content. */
interface SnapshotFile {
  path: string
  objectId: string
  size: number
}

/** The files a revision records under `paths`, or all of its files when no path is given. */
async function listSnapshotFiles(repositoryRoot: string, revisionId: string, paths: string[]): Promise<SnapshotFile[]> {
  // Git prints `<mode> <type> <object id> <size>\t<path>` per file. With -z the path is verbatim and a NUL ends it.
  const entries = await runGit(['ls-tree', '-r', '-l', '-z', revisionId, '--', ...paths], repositoryRoot)
  return entries.split('\0').filter(Boolean).flatMap(entry => {
    const tab = entry.indexOf('\t')
    const [, type, objectId, size] = entry.slice(0, tab).split(/ +/)
    // A submodule is recorded as a commit of another repository, so it has no content here.
    return type === 'blob' ? [{ path: entry.slice(tab + 1), objectId: objectId!, size: Number(size) }] : []
  })
}

/** Regroups a byte stream into consecutive blocks of the given lengths. A stream that ends early yields fewer blocks. */
async function* splitByLength(stream: AsyncIterable<Uint8Array>, lengths: number[]): AsyncGenerator<Buffer> {
  if (lengths.length === 0) return
  let index = 0
  let block = Buffer.alloc(lengths[index]!)
  let filled = 0
  for await (const chunk of stream) {
    let offset = 0
    while (offset < chunk.length) {
      const part = chunk.subarray(offset, offset + block.length - filled)
      block.set(part, filled)
      filled += part.length
      offset += part.length
      if (filled === block.length) {
        yield block
        index += 1
        if (index === lengths.length) return
        block = Buffer.alloc(lengths[index]!)
        filled = 0
      }
    }
  }
}

/** Where a recorded path lands in a snapshot. A path that leaves the snapshot is refused, as Git refuses to check it out. */
function snapshotLocation(snapshotRoot: string, file: string): string {
  const location = path.join(snapshotRoot, file)
  if (!location.startsWith(snapshotRoot + path.sep)) throw new Error(`invalid path '${file}'`)
  return location
}

/**
 * Writes the files into the empty directory `snapshotRoot`. Git hands over each path as text and each content as
 * stored, and Groma writes the file itself, so no archive tool, locale or line-ending setting takes part. A symbolic
 * link is written as Git stores it: a file holding the link's target.
 */
async function writeSnapshotFiles(repositoryRoot: string, files: SnapshotFile[], snapshotRoot: string): Promise<void> {
  const directories = new Set(files.map(file => path.dirname(snapshotLocation(snapshotRoot, file.path))))
  for (const directory of directories) await mkdir(directory, { recursive: true })
  // `git cat-file --batch` answers each object id, in order, with this header line, the content, and a line feed.
  const header = (file: SnapshotFile) => `${file.objectId} blob ${file.size}\n`
  // The listing gave every size, so the length of each answer is known before it arrives.
  const answerLengths = files.map(file => header(file).length + file.size + 1)
  // Not `runGit`: it gives Git no input and decodes its output as text, and file content here is raw bytes.
  const child = Bun.spawn(['git', 'cat-file', '--batch'], {
    cwd: repositoryRoot,
    stdin: Buffer.from(files.map(file => `${file.objectId}\n`).join('')),
    stdout: 'pipe',
    stderr: 'pipe',
  })
  try {
    let written = 0
    for await (const answer of splitByLength(child.stdout, answerLengths)) {
      const file = files[written]!
      const expected = header(file)
      if (answer.toString('latin1', 0, expected.length) !== expected) {
        throw new Error(`Git has no content for ${file.path}`)
      }
      const content = answer.subarray(expected.length, expected.length + file.size)
      await writeFile(snapshotLocation(snapshotRoot, file.path), content)
      written += 1
    }
    if (written < files.length) {
      throw new Error((await new Response(child.stderr).text()).trim() || 'git cat-file ended early')
    }
  } finally {
    // Git has already finished unless writing stopped early.
    child.kill()
  }
}

/**
 * Opens a revision as a temporary directory and always removes it afterwards. The directory holds each requested file
 * under the exact path Git records, with its committed bytes, on every system. The repository itself is only read.
 */
async function withGitTree<T>(
  repositoryRoot: string,
  revisionId: string,
  paths: string[],
  load: (snapshotRoot: string) => Promise<T>,
): Promise<T> {
  const snapshotRoot = await mkdtemp(path.join(tmpdir(), 'groma-revision-'))
  try {
    const files = await listSnapshotFiles(repositoryRoot, revisionId, paths)
    await writeSnapshotFiles(repositoryRoot, files, snapshotRoot)
    return await load(snapshotRoot)
  } finally {
    await rm(snapshotRoot, { recursive: true, force: true })
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
