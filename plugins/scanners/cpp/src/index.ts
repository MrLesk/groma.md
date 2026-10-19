import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { createScanObservation, type ScannerPlugin } from '@groma/scanner'
import { cppDeclarations } from './declarations.ts'
import { cppOutline, type CppFile } from './outline.ts'
import { cppMacros, validateMacros } from './macros.ts'
import { parseCpp } from './syntax.ts'

function sourceFiles(files: readonly string[]): string[] {
  return [...new Set(files)].filter(file => /\.(cpp|cc|cxx|C|hpp|hh|hxx|h|ipp|tpp)$/.test(file)).sort()
}

async function readSources(root: string, files: readonly string[]): Promise<CppFile[]> {
  const parsed: { file: string; tree: Awaited<ReturnType<typeof parseCpp>> }[] = []
  try {
    for (const file of sourceFiles(files)) {
      parsed.push({ file, tree: await parseCpp(file, await readFile(path.join(root, file), 'utf8')) })
    }
    const macros = await cppMacros(parsed.map(source => source.tree.rootNode))
    return parsed.map(({ file, tree }) => {
      validateMacros(file, tree.rootNode, macros)
      return { file, ...cppDeclarations(file, tree.rootNode, macros) }
    })
  } finally { for (const { tree } of parsed) tree.delete() }

}

export default {
  id: 'cpp',
  listSourceFiles: async (_root, _settings, files) => sourceFiles(files),
  async checkReadiness(root, _settings, files) {
    if (!sourceFiles(files).length) throw new Error('cpp: No selected C++ source files.')
    await readSources(root, files)
  },
  async readCodeStructure(root, references, _settings = {}, sourceContext = []) {
    return cppOutline(await readSources(root, [...sourceContext, ...references.map(reference => reference.file)]), references)
  },
  async scan(root, _settings, files) {
    const sources = await readSources(root, files)
    if (!sources.length) return undefined
    return createScanObservation({
      scanner: { id: 'cpp', technology: 'cpp', engine: 'tree-sitter-cpp', engineVersion: '0.23.4-groma.3' },
      roots: [{ id: 'cpp-source', kind: 'source-group', name: path.basename(root) }],
      files: sources.map(source => ({ file: source.file, roots: ['cpp-source'], symbols: [
        ...source.types.filter(type => type.topLevel).map(type => ({ id: `${source.file}:${type.position}`, name: type.name, kind: 'type' })),
        ...source.functions.filter(fn => fn.topLevel).map(fn => ({ id: `${source.file}:${fn.position}:${fn.name}`, name: fn.name, kind: 'function' })),
      ] })),
      operations: sources.flatMap(source => source.functions.flatMap(fn => fn.operation ? [fn.operation] : [])),
      invocations: sources.flatMap(source => source.invocations),
      diagnostics: [
        ...sources.flatMap(source => source.uncertainties.map(issue => ({ severity: 'warning', code: 'CPP_MACRO_SCOPE', file: source.file, line: issue.line, message: `${issue.name}: ${issue.reason}` }))),
        { severity: 'info', code: 'CPP_SOURCE_SCOPE', message: 'C++ source syntax only. Includes and macros are not expanded; no build, overload or type analysis is performed. Call targets, implicit construction, lambdas without a top-level name, execution units and duplicate-body comparison remain unsupported. Separate method outlines require selected declarations with unambiguous access.' },
        ...sources.filter(source => source.macroUses.length).map(source => ({ severity: 'info', code: 'CPP_MACRO_SOURCE', file: source.file,
          message: `Selected-source macros are parsed without expansion: ${source.macroUses.join(', ')}. Generated members and macro arguments are not treated as runtime calls; unproven outline access is omitted.` })),
        ...sources.filter(source => source.conditional).map(source => ({ severity: 'info', code: 'CPP_CONDITIONAL_SOURCE', file: source.file,
          message: 'Conditional preprocessing is not evaluated. Declarations and calls from every parsed branch are source possibilities, not one compiled configuration.' })),
      ],
    })
  },
} satisfies ScannerPlugin
