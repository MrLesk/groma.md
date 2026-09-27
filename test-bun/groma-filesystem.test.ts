import { expect, test } from 'bun:test'
import { chmod, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
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

test('write replaces the target completely and leaves no temp files behind', async () => {
  const root = await fixture()
  try {
    const filesystem = GromaFileSystem.open(root)
    const updated = '---\nid: api\n---\nreplacement content that is much longer than before\n'
    await filesystem.write('systems/service/api.md', updated)
    expect(await readFile(path.join(root, 'groma/systems/service/api.md'), 'utf8')).toBe(updated)
    expect(await readdir(path.join(root, 'groma/systems/service'))).toEqual(['api.md'])
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('a failed write keeps the previous full content and cleans up its temp file', async () => {
  const root = await fixture()
  try {
    const filesystem = GromaFileSystem.open(root)
    const target = path.join(root, 'groma/systems/service/api.md')
    // The directory loses write permission, so the temp write cannot complete.
    await chmod(path.join(root, 'groma/systems/service'), 0o500)
    try {
      await expect(filesystem.write('systems/service/api.md', 'interrupted')).rejects.toThrow()
    } finally {
      await chmod(path.join(root, 'groma/systems/service'), 0o700)
    }
    expect(await readdir(path.join(root, 'groma/systems/service'))).toEqual(['api.md'])
    expect(await readFile(target, 'utf8')).toContain('previous full content')
  } finally { await rm(root, { recursive: true, force: true }) }
})
