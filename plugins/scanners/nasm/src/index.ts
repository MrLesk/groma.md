import path from 'node:path'
import { createScanObservation, type CodeFile, type ScannerPlugin } from '@groma/scanner'
import { evidence } from './evidence.ts'
import { checkTool, configuration, preprocess, sourceFiles } from './preprocess.ts'

export default {
  id: 'nasm',
  listSourceFiles: async (_root, _settings, candidates) => sourceFiles(candidates),
  async checkReadiness(_root, settings, selected) {
    checkTool()
    const { entry } = configuration(settings)
    if (!selected.includes(entry)) throw new Error(`nasm: configure settings.entry; ${entry} is not selected.`)
  },
  async scan(root, settings, selected) {
    const files = sourceFiles(selected)
    if (!files.length) return undefined
    const result = evidence(await preprocess(root, settings, files))
    return createScanObservation({
      scanner: { id: 'nasm', technology: 'NASM x86-64', engine: 'nasm', engineVersion: '3.02' },
      roots: [{ id: 'assembly', kind: 'assembly-unit', name: path.basename(root), file: configuration(settings).entry }],
      files: files.map(file => ({ file, roots: ['assembly'], symbols: result.routines
        .filter(routine => routine.file === file && !routine.local)
        .map(routine => ({ id: routine.id, name: routine.name, kind: 'function' })) })),
      operations: result.routines.map(({ id, file, name, position }) => ({ id, file, name, position })),
      invocations: result.calls,
      diagnostics: [{ severity: 'info', code: 'NASM_SOURCE_SCOPE',
        message: 'One NASM ELF64 configuration. Exported/directly called text labels are routine entries; indirect calls and external providers remain unresolved. Calls do not create map relationships.' }],
    })
  },
  async readCodeStructure(root, references, settings = {}, selected): Promise<CodeFile[]> {
    if (!selected) throw new Error('nasm: source outlines require the host-selected source context.')
    const result = evidence(await preprocess(root, settings, selected))
    return references.flatMap(reference => {
      const declarations = result.routines.filter(routine => routine.file === reference.file && !routine.local)
        .sort((a, b) => a.line - b.line).map(routine => ({
          kind: 'function' as const, name: routine.name, line: routine.line,
          visibility: routine.exported ? 'public' as const : 'internal' as const,
          entry: reference.symbols.includes(routine.name),
        }))
      return declarations.length ? [{ file: reference.file, declarations }] : []
    })
  },
} satisfies ScannerPlugin

