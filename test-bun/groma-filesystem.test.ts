import { expect, test } from 'bun:test'
import { mkdir, mkdtemp, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { GromaFileSystem } from '../src/groma-filesystem.ts'

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'groma-filesystem-'))
  await mkdir(path.join(root, 'groma/systems/service'), { recursive: true })
  await writeFile(
    path.join(root, 'groma/systems/service/api.md'),
    '---\nid: api\n---\nprevious full content\n',
  )
  return root
}

test.concurrent('write replaces the target completely and leaves no temp files behind', async () => {
  const root = await fixture()
  try {
    const filesystem = GromaFileSystem.open(root)
    const updated = '---\nid: api\n---\nreplacement content that is much longer than before\n'
    await filesystem.write('systems/service/api.md', updated)
    expect(await readFile(path.join(root, 'groma/systems/service/api.md'), 'utf8')).toBe(updated)
    expect(await readdir(path.join(root, 'groma/systems/service'))).toEqual(['api.md'])
  } finally { await rm(root, { recursive: true, force: true }) }
})

test.concurrent('a failed replacement preserves existing content and cleans up its temp file', async () => {
  const root = await fixture()
  try {
    const filesystem = GromaFileSystem.open(root)
    const target = path.join(root, 'groma/systems/service/api.md')
    const original = await readFile(target, 'utf8')
    const saved = path.join(root, 'previous.md')
    await rename(target, saved)
    // Replacing a non-empty directory fails on every host, after the temp write succeeds.
    await mkdir(target)
    await rename(saved, path.join(target, 'previous.md'))
    await expect(filesystem.write('systems/service/api.md', 'interrupted')).rejects.toThrow()
    expect(await readdir(path.dirname(target))).toEqual(['api.md'])
    expect(await readFile(path.join(target, 'previous.md'), 'utf8')).toBe(original)
  } finally { await rm(root, { recursive: true, force: true }) }
})
