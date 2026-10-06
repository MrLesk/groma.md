import { expect, test } from 'bun:test'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import javascript from '../plugins/scanners/javascript/src/index.ts'

test.concurrent('one malformed manifest is skipped with a diagnostic while a sibling still declares its entry', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'groma-manifest-'))
  const root = path.join(temporary, 'project')
  await mkdir(path.join(root, 'good/src'), { recursive: true })
  await mkdir(path.join(root, 'broken'), { recursive: true })
  await writeFile(path.join(root, 'good/package.json'), JSON.stringify({ name: 'good', scripts: { start: 'node src/app.js' } }))
  await writeFile(path.join(root, 'good/src/app.js'), 'export const app = 1\n')
  await writeFile(path.join(root, 'broken/package.json'), '{"name": "broken",')
  await writeFile(path.join(root, 'broken/index.js'), 'export const index = 1\n')
  const files = ['good/package.json', 'good/src/app.js', 'broken/package.json', 'broken/index.js']
  try {
    const scan = (await javascript.scan(root, {}, files))!
    expect(scan.entryPoints?.map(entry => entry.declaration)).toContain('good/package.json')
    const unreadable = scan.diagnostics.filter(diagnostic => diagnostic.code === 'javascript-unreadable-manifest')
    expect(unreadable).toEqual([expect.objectContaining({ file: 'broken/package.json' })])
  } finally { await rm(temporary, { recursive: true, force: true }) }
})
