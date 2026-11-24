import { expect, spyOn, test } from 'bun:test'
import { mkdir, mkdtemp, rm, truncate, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { API } from 'typescript/async'

import manifest from '../plugins/scanners/typescript/package.json'
import { scanTypeScriptSource } from '../plugins/scanners/typescript/src/scan.ts'
import { largestProgramSource } from '../plugins/scanners/typescript/src/source-analysis.ts'
import { scannerFiles } from '../src/scanner/modules/selection.ts'

/** One byte more source than one program may hold on this machine. */
const tooLarge = () => Math.floor(largestProgramSource()) + 1

async function repository(files: Record<string, string>): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'groma-ts-memory-'))
  for (const [file, text] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(root, file)), { recursive: true })
    await writeFile(path.join(root, file), text)
  }
  expect(await Bun.spawn(['git', 'init', '--quiet'], { cwd: root }).exited).toBe(0)
  return root
}

/** The message the scan of `root` fails with, or undefined when it succeeds. */
async function failure(root: string): Promise<string | undefined> {
  const files = await scannerFiles(root, manifest.groma.scanner)
  return scanTypeScriptSource(root, files).then(() => undefined, (error: Error) => error.message)
}

test.concurrent('a project whose own files need more memory than a scan may take is never compiled', async () => {
  const root = await repository({ 'tsconfig.json': JSON.stringify({ include: ['src'] }), 'src/huge.ts': '' })
  // The scan stops before anything reads the file, so only its size matters and nothing is written for it.
  await truncate(path.join(root, 'src/huge.ts'), tooLarge())
  const created = spyOn(API.prototype, 'createProgram')
  try {
    expect(await failure(root)).toContain('memory')
    // Other tests compile their own programs at the same time: only this repository's count.
    expect(created.mock.calls.filter(([roots]) => JSON.stringify(roots).includes(path.basename(root)))).toEqual([])
  } finally {
    created.mockRestore()
    await rm(root, { recursive: true, force: true })
  }
})

test.concurrent('a project that needs too much memory only with the files it imports fails once the compiler has added them', async () => {
  const root = await repository({
    'app/tsconfig.json': JSON.stringify({ compilerOptions: { module: 'ESNext', moduleResolution: 'Bundler' }, files: ['main.ts'] }),
    'app/main.ts': "import '../shared/padding'\n",
  })
  // The compiler reads this file, so its text is real: spaces alone are an empty module.
  await mkdir(path.join(root, 'shared'))
  await writeFile(path.join(root, 'shared/padding.ts'), Buffer.alloc(tooLarge(), ' '))
  try {
    const message = await failure(root)
    expect(message).toContain('memory')
    // The importing project is the one named: the padding on its own is a file outside every config.
    expect(message).toContain('app/tsconfig.json')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
