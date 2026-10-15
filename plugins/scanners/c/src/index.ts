import path from 'node:path'
import { createScanObservation, type CodeDeclaration, type CodeFile, type ScannerPlugin } from '@groma/scanner'
import { prepareParser, readSources } from './parser.ts'

const isSource = (file: string) => file.endsWith('.c') || file.endsWith('.h')
const sources = (files: readonly string[]) => [...new Set(files.filter(isSource))].sort()

export default {
  id: 'c',
  listSourceFiles: async (_root, _settings, candidates) => sources(candidates),
  async checkReadiness(_root, _settings, files) {
    if (!files.some(isSource)) throw new Error('c: No selected C source files were found.')
    await prepareParser()
  },
  async readCodeStructure(root, references, _settings, selected): Promise<CodeFile[]> {
    const files = sources(selected ?? references.map(reference => reference.file))
    const parsed = new Map((await readSources(root, files)).map(source => [source.file, source]))
    const result: CodeFile[] = []
    for (const reference of references.filter(reference => isSource(reference.file))) {
      const source = parsed.get(reference.file)
      if (!source) continue
      const declarations: CodeDeclaration[] = []
      for (const item of source.declarations) {
        if (!item.visibility) continue
        const common = { name: item.name, line: item.line, visibility: item.visibility,
          entry: reference.symbols.includes(item.name) }
        declarations.push(item.kind === 'type' ? { ...common, kind: 'type', members: [] } : { ...common, kind: 'function' })
      }
      if (declarations.length) result.push({ file: reference.file, declarations })
    }
    return result
  },
  async scan(root, _settings, selected) {
    const files = sources(selected)
    if (!files.length) return undefined
    const parsed = await readSources(root, files)
    return createScanObservation({
      scanner: { id: 'c', technology: 'c', engine: 'tree-sitter-c', engineVersion: '0.24.1' },
      roots: [{ id: 'c-source', kind: 'source-group', name: path.basename(root) }],
      files: parsed.map(source => ({ file: source.file, roots: ['c-source'], symbols: source.declarations.map(item => ({
        id: `${source.file}:${item.position}:${item.name}`, name: item.name, kind: item.kind,
      })) })),
      operations: parsed.flatMap(source => source.operations), invocations: parsed.flatMap(source => source.calls),
      diagnostics: [...parsed.flatMap(source => source.diagnostics), { severity: 'info', code: 'C_SOURCE_SCOPE',
        message: 'C source syntax only. Selected macro definitions establish syntax and modifier shape, not active expansions. Includes and macros are not expanded, conditional branches are not selected, and call targets and execution membership remain unresolved.' }],
    })
  },
} satisfies ScannerPlugin
