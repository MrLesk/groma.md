import { expect, test } from 'bun:test'
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { repositoryListing } from '../src/repository-listing.ts'

test.concurrent('an in-tree symlink deduplicates to its target; a symlink leaving the repository, or a dangling one, is not listed', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'groma-listing-'))
  const root = path.join(temporary, 'project')
  await mkdir(path.join(root, 'src'), { recursive: true })
  await writeFile(path.join(root, 'src/main.ts'), 'export {}\n')
  await writeFile(path.join(temporary, 'elsewhere.ts'), 'export {}\n')
  await symlink(path.join(temporary, 'elsewhere.ts'), path.join(root, 'src/leaked.ts'))
  await symlink('absent.ts', path.join(root, 'src/dangling.ts'))
  await symlink('main.ts', path.join(root, 'src/duplicate.ts'))
  const git = Bun.spawn(['git', 'init', '--quiet', root], { stdout: 'ignore', stderr: 'pipe' })
  expect(await git.exited).toBe(0)
  try {
    expect(await repositoryListing(root)).toEqual(['src/main.ts'])
  } finally { await rm(temporary, { recursive: true, force: true }) }
})
