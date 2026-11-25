import { expect, test } from 'bun:test'
import { mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { repositoryFile, watchObservations } from '../src/scanner/source-watch.ts'

// Creating symlinks needs developer mode or administrator rights on Windows, where the watcher reports names
// relative to the root and never relates an absolute path.
test.skipIf(process.platform === 'win32').concurrent('a change reported under another spelling of the repository path names the same repository file, and a path outside the repository names none', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'groma-source-spelling-'))
  try {
    await mkdir(path.join(directory, 'repository', 'src'), { recursive: true })
    const root = await realpath(path.join(directory, 'repository'))
    const otherSpelling = path.join(directory, 'link')
    await symlink(root, otherSpelling)

    expect(repositoryFile(root, path.join(otherSpelling, 'src', 'changed.ts'))).toBe('src/changed.ts')
    // A removed folder is no longer on disk; the removal of its files is still a change to report.
    expect(repositoryFile(root, path.join(otherSpelling, 'removed', 'gone.ts'))).toBe('removed/gone.ts')
    expect(repositoryFile(root, path.join(directory, 'outside.ts'))).toBeUndefined()
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test.concurrent('an edit during the initial scan is collected after the initial batch', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'groma-source-start-'))
  const file = path.join(root, 'source.fixture')
  const batches: string[] = []
  let scans = 0
  let folded = 0
  let changedFiles: readonly string[] | undefined
  const complete = Promise.withResolvers<void>()
  let watcher: Awaited<ReturnType<typeof watchObservations>> | undefined
  try {
    await writeFile(file, 'before')
    watcher = await watchObservations(root, {
      scannerIds: ['fixture'],
      useGitignore: true,
      watchesFile: file => file === 'source.fixture',
      readersOfFile: async () => ({ readers: [], failures: [] }),
      async collectObservations(_root, files) {
        // The next scan must wait until the previous batch has been applied.
        expect(scans).toBe(folded)
        scans++
        batches.push(await readFile(file, 'utf8'))
        if (scans === 1) await writeFile(file, 'after')
        else changedFiles = files
        return { observations: [], failures: [] }
      },
    }, {
      scan: true,
      onObservations() {
        folded++
        if (folded === 2) complete.resolve()
      },
      onError: complete.reject,
    })
    await complete.promise
    expect(batches).toEqual(['before', 'after'])
    expect(changedFiles).toEqual(['source.fixture'])
  } finally {
    await watcher?.close()
    await rm(root, { recursive: true, force: true })
  }
})
