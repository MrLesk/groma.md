import path from 'node:path'
import { createScanObservation, type CodeDeclaration, type CodeFile, type ScannerPlugin } from '@groma/scanner'
import { checkWorker, readEvidence } from './worker.ts'
import { sourceUnits } from './parts.ts'

const sources = (files: readonly string[]) => [...new Set(files.filter(file => file.endsWith('.dart')))].sort()

export default {
  id: 'dart',
  listSourceFiles: async (_root, _settings, files) => sources(files),
  async checkReadiness(_root, _settings, files) {
    if (!sources(files).length) throw new Error('dart: No selected Dart source files were found.')
    await checkWorker()
  },
  async scan(root, _settings, files) {
    const selected = sources(files)
    if (!selected.length) return undefined
    const evidence = await readEvidence(root, selected, files)
    const units = sourceUnits(evidence)
    return createScanObservation({
      scanner: { id: 'dart', technology: 'dart', engine: 'Dart analyzer (source parser)', engineVersion: '14.6.0' },
      roots: [{ id: 'dart-source', kind: 'source-group', name: path.basename(root) }],
      files: evidence.map(file => ({ file: file.file, symbols: file.symbols, roots: ['dart-source'] })),
      sourceUnits: units,
      entryPoints: evidence.filter(file => file.main).map(file => ({
        file: file.file, declaration: file.file, name: 'main',
        files: [...new Set(units.filter(unit => unit.files.includes(file.file)).flatMap(unit => unit.files).concat(file.file))],
      })),
      operations: evidence.flatMap(file => file.operations),
      invocations: evidence.flatMap(file => file.invocations),
      diagnostics: [{ severity: 'info', code: 'DART_SOURCE_SCOPE', message:
        'Source syntax only. Calls remain unresolved. Imports, framework dispatch, HTTP routes, nested functions, accessors, field initializers and duplicate-body comparison are not analyzed. Entry membership includes only the declaring file and explicit selected library parts.' }],
    })
  },
  async readCodeStructure(root, references, _settings, sourceFiles = []) {
    const selected = references.filter(reference => reference.file.endsWith('.dart'))
    if (!selected.length) return []
    const evidence = await readEvidence(root, selected.map(reference => reference.file), sourceFiles)
    return evidence.map((file, index): CodeFile => {
      const symbols = selected[index]!.symbols
      return { file: file.file, declarations: file.declarations.map((declaration): CodeDeclaration => ({
        ...declaration, entry: symbols.includes(declaration.name),
        ...(declaration.kind === 'type' ? { kind: 'type', members: declaration.members.map(member => ({
          ...member, entry: symbols.includes(member.name === declaration.name ? `${member.name}.new` : member.name),
        })) } : { kind: 'function' }),
      })) }
    }).filter(file => file.declarations.length)
  },
} satisfies ScannerPlugin
