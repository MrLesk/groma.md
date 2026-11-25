import { subscribe } from '@parcel/watcher'
import type { AsyncSubscription } from '@parcel/watcher'
import { AsyncLocalStorage } from 'node:async_hooks'
import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import type { Dirent } from 'node:fs'
import {
  mkdir,
  open,
  readdir,
  readFile,
  realpath,
  rename,
  stat,
  unlink,
  writeFile,
} from 'node:fs/promises'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

type AccessMode = 'read' | 'write'
const access = new AsyncLocalStorage<ReadonlyMap<string, AccessMode>>()
const LOCK_TIMEOUT_MS = 5000
const LOCK_FILENAME = '.groma.lock'
const STATE_DIRECTORY = '.groma-state'

export class GromaBusyError extends Error {
  readonly code = 'groma_busy'
  readonly timeoutMs: number

  constructor(timeoutMs: number) {
    super(`Groma is busy. The project did not become available within ${timeoutMs} ms.`)
    this.timeoutMs = timeoutMs
  }
}

async function waitForProject(deadline: number, timeoutMs: number): Promise<void> {
  const remaining = deadline - performance.now()
  if (remaining <= 0) throw new GromaBusyError(timeoutMs)
  await delay(Math.min(25, remaining))
}

async function acquire(filename: string, timeoutMs: number): Promise<() => Promise<void>> {
  const deadline = performance.now() + timeoutMs
  for (;;) {
    try {
      const lock = await open(filename, 'wx')
      return async () => { await lock.close(); await unlink(filename) }
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code
      // Windows can deny creation while the previous lock is pending deletion.
      if (code !== 'EEXIST' && !(process.platform === 'win32' && code === 'EPERM')) throw error
      await waitForProject(deadline, timeoutMs)
    }
  }
}

async function replaceFile(filename: string, source: string): Promise<void> {
  const temporary = `${filename}.${randomUUID()}.tmp`
  try {
    await writeFile(temporary, source, { flag: 'wx' })
    await rename(temporary, filename)
  } finally {
    await unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error })
  }
}

function revisionFile(root: string): string {
  return path.join(root, STATE_DIRECTORY, 'write-revision')
}

async function readRevision(filename: string): Promise<string | undefined> {
  try {
    return await readFile(filename, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
}

/** Advance the revision under the exclusive lock before changing project files. */
async function markWrite(root: string): Promise<void> {
  const filename = revisionFile(root)
  const state = path.dirname(filename)
  await mkdir(state, { recursive: true })
  const ignore = path.join(state, '.gitignore')
  if (!existsSync(ignore)) await writeFile(ignore, '*\n', { flag: 'wx' })
  const revision = BigInt(await readRevision(filename) ?? '0') + 1n
  await replaceFile(filename, revision.toString())
}

async function lockExists(filename: string): Promise<boolean> {
  try {
    await stat(filename)
    return true
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    return false
  }
}

async function readConsistently<T>(root: string, operation: () => Promise<T>, timeoutMs: number): Promise<T> {
  const lock = path.join(root, LOCK_FILENAME)
  const filename = revisionFile(root)
  const deadline = performance.now() + timeoutMs
  for (;;) {
    // Read the revision before checking the lock, and check the lock before rereading the revision.
    const revision = await readRevision(filename)
    if (!await lockExists(lock)) {
      const result = await operation().then(
        value => ({ ok: true as const, value }),
        error => ({ ok: false as const, error }),
      )
      if (!await lockExists(lock) && revision === await readRevision(filename)) {
        if (!result.ok) throw result.error
        return result.value
      }
    }
    await waitForProject(deadline, timeoutMs)
  }
}

export const gromaDirectories = ['groma', '.groma'] as const

/** The one sentence every command prints when the repository has no Groma directory. */
export const NOT_INITIALIZED = 'Groma is not initialized here. Run groma init.'

export type GromaDirectory = typeof gromaDirectories[number]

function isGromaDirectory(value: string): value is GromaDirectory {
  return gromaDirectories.includes(value as GromaDirectory)
}

function selectedDirectory(repositoryRoot: string): GromaDirectory | undefined {
  const found = gromaDirectories.filter(directory => {
    return existsSync(path.join(repositoryRoot, directory))
  })
  if (found.length > 1) {
    throw new Error('Both groma/ and .groma/ exist; keep one Groma directory')
  }
  return found[0]
}

export class GromaFileSystem {
  readonly repositoryRoot: string
  readonly directory: GromaDirectory

  private constructor(repositoryRoot: string, directory: GromaDirectory) {
    this.repositoryRoot = path.resolve(repositoryRoot)
    this.directory = directory
  }

  static find(repositoryRoot: string): GromaFileSystem | undefined {
    const root = path.resolve(repositoryRoot)
    const directory = selectedDirectory(root)
    if (directory === undefined) return undefined
    return new GromaFileSystem(root, directory)
  }

  static open(repositoryRoot: string): GromaFileSystem {
    const filesystem = GromaFileSystem.find(repositoryRoot)
    if (filesystem === undefined) {
      throw new Error(NOT_INITIALIZED)
    }
    return filesystem
  }

  static initialize(
    repositoryRoot: string,
    requestedDirectory?: string,
  ): GromaFileSystem {
    const root = path.resolve(repositoryRoot)
    const existing = selectedDirectory(root)
    if (existing !== undefined) {
      if (requestedDirectory !== undefined && requestedDirectory !== existing) {
        throw new Error(`Groma already uses ${existing}/`)
      }
      return new GromaFileSystem(root, existing)
    }
    if (requestedDirectory === undefined || !isGromaDirectory(requestedDirectory)) {
      throw new Error('Groma directory must be groma or .groma')
    }
    return new GromaFileSystem(root, requestedDirectory)
  }

  sourceFilename(relative = ''): string {
    return relative === ''
      ? this.directory
      : path.posix.join(this.directory, relative)
  }

  relative(sourceFilename: string): string {
    if (sourceFilename === this.directory) return ''
    const prefix = `${this.directory}/`
    if (!sourceFilename.startsWith(prefix)) {
      throw new Error(`${sourceFilename} is outside ${this.directory}/`)
    }
    return sourceFilename.slice(prefix.length)
  }

  absolute(relative = ''): string {
    return path.join(this.repositoryRoot, this.directory, ...relative.split('/'))
  }

  /** Protect a full write, including the reads that decide what it changes. */
  withAccess<T>(operation: () => Promise<T>, timeoutMs = LOCK_TIMEOUT_MS): Promise<T> {
    return this.withProjectAccess('write', operation, timeoutMs)
  }

  /** Retry a read if a writer overlapped it. Nested reads share the outer scope. */
  withRead<T>(operation: (underWriteLock: boolean) => Promise<T>, timeoutMs = LOCK_TIMEOUT_MS): Promise<T> {
    return this.withProjectAccess('read', operation, timeoutMs)
  }

  private async withProjectAccess<T>(
    mode: AccessMode,
    operation: (underWriteLock: boolean) => Promise<T>,
    timeoutMs: number,
  ): Promise<T> {
    const held = access.getStore()
    const absolute = this.absolute()
    let root = absolute
    if (!held?.has(absolute)) {
      if (mode === 'write') await mkdir(absolute, { recursive: true })
      root = await realpath(absolute)
    }

    const existing = held?.get(root)
    if (existing !== undefined) {
      if (mode === 'write' && existing === 'read') throw new Error('Groma writes require a write operation.')
      return operation(existing === 'write')
    }

    const scope = new Map<string, AccessMode>([...held ?? [], [root, mode], [absolute, mode]])
    const run = async () => access.run(scope, () => operation(mode === 'write'))
    if (mode === 'read') return readConsistently(root, run, timeoutMs)

    const release = await acquire(path.join(root, LOCK_FILENAME), timeoutMs)
    try {
      await markWrite(root)
      return await run()
    } finally {
      await release()
    }
  }

  exists(relative = ''): boolean {
    return existsSync(this.absolute(relative))
  }

  async list(relative: string): Promise<Dirent[]> {
    const entries = await readdir(this.absolute(relative), { withFileTypes: true })
    return relative === '' ? entries.filter(entry => entry.name !== STATE_DIRECTORY) : entries
  }

  read(relative: string): Promise<string> {
    return this.withRead(() => readFile(this.absolute(relative), 'utf8'))
  }

  readSource(sourceFilename: string): Promise<string> {
    return this.read(this.relative(sourceFilename))
  }

  async write(relative: string, source: string): Promise<void> {
    await this.withAccess(async () => {
      const addsIndexEntry = relative !== 'index.md' && relative.endsWith('.md')
        && !this.exists(relative.split('/')[0]!)
      const filename = this.absolute(relative)
      await mkdir(path.dirname(filename), { recursive: true })
      await replaceFile(filename, source)
      if (addsIndexEntry) await this.refreshIndex()
    })
  }

  writeSource(sourceFilename: string, source: string): Promise<void> {
    return this.write(this.relative(sourceFilename), source)
  }

  async removeSource(sourceFilename: string): Promise<void> {
    await this.withAccess(async () => {
      const relative = this.relative(sourceFilename)
      await unlink(this.absolute(relative))
      if (!relative.includes('/') && relative.endsWith('.md')) await this.refreshIndex()
    })
  }

  /** OKF navigation lists this directory, not the nested C4 architecture. */
  async refreshIndex(): Promise<void> {
    return this.withAccess(() => this.writeIndex())
  }

  private async writeIndex(): Promise<void> {
    const entries = (await this.list(''))
      .filter(entry => entry.isDirectory() || (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'index.md'))
      .map(entry => `${entry.name}${entry.isDirectory() ? '/' : ''}`)
      .sort()
    const links = entries.map(name => {
      const label = name.replace(/[\\[\]]/g, '\\$&')
      const href = name.split('/').map(encodeURIComponent).join('/')
      return `- [${label}](<${href}>)`
    })
    const source = `---\nokf_version: "0.2"\n---\n\n# Contents\n\n${links.join('\n')}\n`
    if (this.exists('index.md') && await this.read('index.md') === source) return
    await this.write('index.md', source)
  }

  async watch(listener: (filename: string) => void): Promise<AsyncSubscription> {
    const root = await realpath(this.absolute(''))
    return subscribe(root, (error, events) => {
      if (error) throw error
      for (const event of events) {
        if (path.basename(event.path) === LOCK_FILENAME || event.path.endsWith('.tmp')) continue
        const relative = path.relative(root, event.path).split(path.sep)
        if (relative[0] === STATE_DIRECTORY) continue
        listener(relative.join('/'))
      }
    })
  }
}
