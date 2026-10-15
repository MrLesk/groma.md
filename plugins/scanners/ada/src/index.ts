import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { createScanObservation, type ScannerPlugin } from '@groma/scanner'
import { outline, packageSourceUnits, sourceDeclarations } from './declarations.ts'
import { operationEvidence } from './evidence.ts'
import { adaLanguage, grammarRevision, readSyntax } from './syntax.ts'

const sources = (files: readonly string[]) => [...new Set(files.filter(file => /\.(ads|adb)$/.test(file)))].sort()

async function readSources(root: string, files: readonly string[]) {
  return Promise.all(sources(files).map(async file => readSyntax(file, await readFile(path.join(root, file), 'utf8'), tree => ({
    file, ...sourceDeclarations(tree), ...operationEvidence(file, tree),
  }))))
}

export default {
  id: 'ada',
  listSourceFiles: async (_root, _settings, files) => sources(files),
  async checkReadiness(_root, _settings, files) {
    if (!sources(files).length) throw new Error('ada: No selected Ada source files were found.')
    await adaLanguage()
  },
  async readCodeStructure(root, references, _settings = {}, sourceFiles = []) {
    const files = sources([...sourceFiles, ...references.map(reference => reference.file)])
    const context = await Promise.all(files.map(async file => readSyntax(file, await readFile(path.join(root, file), 'utf8'),
      tree => ({ file, ...sourceDeclarations(tree) }))))
    return references.flatMap(reference => {
      const source = context.find(source => source.file === reference.file)
      const declarations = source ? outline(source, reference.symbols, context) : []
      return declarations.length ? [{ file: reference.file, declarations }] : []
    })
  },
  async scan(root, _settings, files) {
    if (!sources(files).length) return undefined
    const parsed = await readSources(root, files)
    return createScanObservation({
      scanner: { id: 'ada', technology: 'ada', engine: 'tree-sitter-ada', engineVersion: grammarRevision },
      roots: [{ id: 'ada-source', kind: 'source-group', name: path.basename(root) }],
      files: parsed.map(source => ({ file: source.file, roots: ['ada-source'], symbols: source.declarations.map(item => ({
        id: `${source.file}:${item.position}`, name: item.name, kind: item.kind,
      })) })),
      sourceUnits: packageSourceUnits(parsed),
      operations: parsed.flatMap(source => source.operations),
      invocations: parsed.flatMap(source => source.invocations),
      diagnostics: [{ severity: 'info', code: 'ADA_SOURCE_SCOPE', message:
        'Ada syntax inventory and package declarations only. Procedure calls remain unresolved. Function expressions, task/entry dispatch, build entry points and duplicate-body comparison are not analyzed. Package-body outline members require a selected matching specification.' }],
    })
  },
} satisfies ScannerPlugin
