import { expect, test } from 'bun:test'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { API } from 'typescript/unstable/async'
import { typescriptProjects } from '../plugins/scanners/typescript/src/projects.ts'

test.concurrent('a dangling project reference is reported and the scan completes; an out-of-tree one is not followed', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'groma-ts-references-'))
  const root = path.join(temporary, 'project')
  const outside = path.join(temporary, 'outside')
  await mkdir(path.join(root, 'src'), { recursive: true })
  await mkdir(outside, { recursive: true })
  await writeFile(path.join(outside, 'tsconfig.json'), JSON.stringify({ files: [] }))
  await writeFile(path.join(root, 'src/app.ts'), 'export const app = 1\n')
  await writeFile(path.join(root, 'tsconfig.json'), JSON.stringify({
    files: ['src/app.ts'], references: [{ path: './missing/tsconfig.json' }, { path: '../outside/tsconfig.json' }],
  }))
  const api = new API({ cwd: root })
  try {
    const { projects, diagnostics } = await typescriptProjects(api, root, ['src/app.ts'], ['tsconfig.json'])
    expect(projects.map(project => project.key)).toEqual([path.join(root, 'tsconfig.json')])
    expect(diagnostics.filter(diagnostic => diagnostic.code === 'typescript-missing-project-reference'))
      .toEqual([expect.objectContaining({ file: 'tsconfig.json' })])
    expect(diagnostics.some(diagnostic => diagnostic.file?.startsWith('..'))).toBe(false)
  } finally { await rm(temporary, { recursive: true, force: true }) }
})
