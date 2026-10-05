import { expect, test } from 'bun:test'
import { parseMarkdown } from 'comark'
import { cp, mkdtemp, readFile, rename, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { collectNodes } from '../src/architecture-markdown.ts'
import { loadArchitecture } from '../src/architecture-reader.ts'
import { writes } from '../src/authoring.ts'
import { GromaFileSystem, gromaDirectories } from '../src/groma-filesystem.ts'
import { initializeGroma } from '../src/initialize.ts'
import { removeDocument, writeDocument } from '../src/markdown-emitter.ts'
import type { MarkdownNode } from '../src/types.ts'

async function indexLinks(filesystem: GromaFileSystem): Promise<string[]> {
  const document = await parseMarkdown(await filesystem.read('index.md'))
  const nodes = document.nodes as MarkdownNode[]
  expect(document.frontmatter).toEqual({ okf_version: '0.2' })
  expect(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].some(tag => collectNodes(nodes, tag).length > 0)).toBe(true)
  return collectNodes(nodes, 'a').map(link => String(link[1].href)).sort()
}

for (const directory of gromaDirectories) {
  test.concurrent(`initialization gives a new ${directory} bundle a navigable index`, async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'bundle-index-'))
    try {
      await initializeGroma(root, { directory, projectName: 'Field notes' })
      const filesystem = GromaFileSystem.open(root)
      expect(await indexLinks(filesystem)).toEqual(['project.md'])
      await initializeGroma(root)
      expect(await indexLinks(filesystem)).toEqual(['project.md'])
    } finally { await rm(root, { recursive: true, force: true }) }
  })

  test.concurrent(`${directory} index follows immediate bundle contents through authoring`, async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'bundle-index-'))
    try {
      await cp(path.resolve(import.meta.dir, '../test/fixtures/empty-project'), root, { recursive: true })
      if (directory !== 'groma') await rename(path.join(root, 'groma'), path.join(root, directory))
      await initializeGroma(root)
      const filesystem = GromaFileSystem.open(root)
      const source = '---\ntype: Note\n---\n\nExplains an operating decision.\n'
      await writeDocument(root, filesystem.sourceFilename('decisions.md'), source)
      await writeDocument(root, filesystem.sourceFilename('guides/operations.md'), source)
      await filesystem.write('scanners.json', '{}\n')
      const actor = await writes.add(root, { thing: 'actor', name: 'Operator', overview: 'Runs the service.' })
      expect(await indexLinks(filesystem)).toEqual(['actors/', 'decisions.md', 'guides/', 'project.md'])
      const index = await filesystem.read('index.md')
      await writeDocument(root, filesystem.sourceFilename('guides/nested/details.md'), source)
      expect(await filesystem.read('index.md')).toBe(index)
      await removeDocument(root, filesystem.sourceFilename('decisions.md'))
      await writes.remove(root, { id: actor })
      expect(await indexLinks(filesystem)).toEqual(['actors/', 'guides/', 'project.md'])
      expect((await loadArchitecture(root)).documents).toEqual([])
      expect(await readFile(filesystem.absolute('guides/operations.md'), 'utf8')).toBe(source)
    } finally { await rm(root, { recursive: true, force: true }) }
  })
}
