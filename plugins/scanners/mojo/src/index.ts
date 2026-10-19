import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { createScanObservation, type CodeFile, type ScannerPlugin } from '@groma/scanner'
import { mojoLanguage, parseMojo } from './parser.ts'
import { analyzeMojo } from './source.ts'

const isSource = (file: string) => file.endsWith('.mojo') || file.endsWith('.🔥')

async function readSource(root: string, file: string, entries: readonly string[] = []) {
  return parseMojo(file, await readFile(path.join(root, file), 'utf8'), node => analyzeMojo(node, file, entries))
}

export default {
  id: 'mojo',
  listSourceFiles: async (_root, _settings, candidates) => candidates.filter(isSource),
  async checkReadiness(_root, _settings, files) {
    if (!files.some(isSource)) throw new Error('mojo: No selected Mojo source files were found.')
    await mojoLanguage()
  },
  async scan(root, _settings, selected) {
    const sources = [...new Set(selected.filter(isSource))].sort()
    if (!sources.length) return undefined
    const parsed = []
    for (const file of sources) parsed.push({ file, source: await readSource(root, file) })
    return createScanObservation({
      scanner: { id: 'mojo', technology: 'Mojo', engine: 'tree-sitter-mojo', engineVersion: 'e5905c4+groma1' },
      roots: [{ id: 'mojo', kind: 'source-set', name: path.basename(root) }],
      files: parsed.map(({ file, source }) => ({ file, roots: ['mojo'], symbols: source.symbols })),
      entryPoints: parsed.filter(({ source }) => source.main).map(({ file }) => ({
        file, declaration: file, name: 'main', files: [file],
      })),
      operations: parsed.flatMap(({ source }) => source.operations),
      invocations: parsed.flatMap(({ source }) => source.invocations),
      diagnostics: [{ severity: 'info', code: 'MOJO_SOURCE_SCOPE',
        message: 'Modern Mojo declarations and unresolved syntax calls only. No overload, trait, import or compile-time specialization resolution. Bracket contents, lambda/generator bodies, compile-time statements and declaration headers are not attributed to enclosing runtime operations. main entries contain only their own file.' }],
    })
  },
  async readCodeStructure(root, references): Promise<CodeFile[]> {
    const files = []
    for (const reference of references) {
      if (!isSource(reference.file)) continue
      const { declarations } = await readSource(root, reference.file, reference.symbols)
      if (declarations.length) files.push({ file: reference.file, declarations })
    }
    return files
  },
} satisfies ScannerPlugin
