import path from 'node:path'
import { createScanObservation, type ScannerPlugin } from '@groma/scanner'
import { declarations, outline } from './declarations.ts'
import { evidence } from './evidence.ts'
import { sourceFiles, withSources } from './syntax.ts'

export default {
  id: 'mql5',
  listSourceFiles: async (_root, _settings, files) => sourceFiles(files),
  async checkReadiness(_root, _settings, files) {
    if (!sourceFiles(files).length) throw new Error('MQL5_SOURCE_MISSING: No selected .mq5, .mqh or .h source files.')
  },
  async scan(root, _settings, selected) {
    const files = sourceFiles(selected)
    if (!files.length) return undefined
    return withSources(root, files, sources => {
      const parsed = sources.map(declarations)
      const facts = parsed.map(evidence)
      return createScanObservation({
        scanner: { id: 'mql5', technology: 'MQL5', engine: 'tree-sitter-mql5', engineVersion: 'dfbd597792789c5e5083078e5dda77c26b7ecd67+groma.5' },
        roots: [{ id: 'mql5-source', kind: 'source-group', name: path.basename(root) }],
        files: parsed.map(file => ({ file: file.source.file, roots: ['mql5-source'], symbols: file.symbols })),
        operations: facts.flatMap(file => file.operations), invocations: facts.flatMap(file => file.invocations),
        entryPoints: facts.flatMap(file => file.entryPoints),
        diagnostics: [...facts.flatMap(file => file.diagnostics), { severity: 'info', code: 'MQL5_SOURCE_SCOPE',
          message: 'Experimental source analysis. Selected macro syntax and conditional branches remain opaque; generated APIs, binary imports, inherited members and project compilation are not analyzed. Calls remain unresolved; no trading code executes. Event membership includes only its declaring file.' }],
      })
    })
  },
  async readCodeStructure(root, references, _settings = {}, selected?: readonly string[]) {
    const files = selected ? [...new Set([...selected, ...references.map(reference => reference.file)])] : references.map(reference => reference.file)
    return withSources(root, files, sources => {
      const parsed = sources.map(declarations)
      return references.flatMap(reference => {
        const source = parsed.find(file => file.source.file === reference.file)
        const result = source ? outline(source, parsed, reference.symbols) : []
        return result.length ? [{ file: reference.file, declarations: result }] : []
      })
    })
  },
} satisfies ScannerPlugin
