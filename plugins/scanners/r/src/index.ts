import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createScanObservation, type CodeFile, type ScannerPlugin, type ScanRoot, type SourceReference } from '@groma/scanner'
import { Language, Parser, type Node } from 'web-tree-sitter'

const isSource = (file: string) => /\.[Rr]$/.test(file)
let language: Promise<Language> | undefined

/** Each scan owns its parser and trees; only the immutable grammar is shared. */
async function parserForSource(): Promise<Parser> {
  language ??= (async () => {
    await Parser.init({ locateFile: () => fileURLToPath(new URL('../dist/tree-sitter.wasm', import.meta.url)) })
    return Language.load(fileURLToPath(new URL('../dist/tree-sitter-r.wasm', import.meta.url)))
  })()
  const grammar = await language
  const parser = new Parser()
  parser.setLanguage(grammar)
  return parser
}

interface NamedFunction {
  name: string
  line: number
  position: number
}

/** Direct top-level assignments name functions; calls, fields and nested bindings do not. */
function namedFunctions(program: Node): NamedFunction[] {
  return program.namedChildren.flatMap(node => {
    if (node?.type !== 'binary_operator') return []
    const operator = node.childForFieldName('operator')?.text
    if (operator !== '<-' && operator !== '=' && operator !== '<<-') return []
    const name = node.childForFieldName('lhs')
    const value = node.childForFieldName('rhs')
    if (name?.type !== 'identifier' || value?.type !== 'function_definition') return []
    return [{
      name: name.text.startsWith('`') ? name.text.slice(1, -1) : name.text,
      line: name.startPosition.row + 1,
      position: name.startIndex,
    }]
  })
}

async function readFunctions(parser: Parser, root: string, file: string): Promise<NamedFunction[]> {
  const source = await readFile(path.join(root, file), 'utf8')
  const tree = parser.parse(source)
  if (tree === null) throw new Error(`r: Could not parse ${file}.`)
  try {
    if (tree.rootNode.hasError) {
      const error = tree.rootNode.descendantsOfType('ERROR')[0] ?? tree.rootNode
      throw new Error(`R_SYNTAX_ERROR: ${file}:${error.startPosition.row + 1}: unsupported or invalid R syntax.`)
    }
    return namedFunctions(tree.rootNode)
  } finally { tree.delete() }
}

/** DESCRIPTION identifies source membership, never an execution or C4 boundary. */
async function sourceRoots(root: string, files: readonly string[]): Promise<ScanRoot[]> {
  const roots: ScanRoot[] = []
  for (const file of files.filter(file => path.posix.basename(file) === 'DESCRIPTION')) {
    const directory = path.posix.dirname(file)
    const text = await readFile(path.join(root, file), 'utf8')
    const name = /^Package:[ \t]*(\S+)/m.exec(text)?.[1] ?? path.posix.basename(directory === '.' ? root : directory)
    roots.push({ id: directory, kind: 'r-package', name, file })
  }
  if (!roots.some(candidate => candidate.id === '.')) {
    roots.push({ id: '.', kind: 'repository', name: path.basename(root) })
  }
  for (const candidate of roots) {
    if (candidate.id !== '.') candidate.parent = nearestRoot(path.posix.dirname(candidate.id), roots).id
  }
  return roots
}

function nearestRoot(directory: string, roots: readonly ScanRoot[]): ScanRoot {
  for (let current = directory; ; current = path.posix.dirname(current)) {
    const root = roots.find(candidate => candidate.id === current)
    if (root !== undefined) return root
  }
}

async function scan(root: string, files: readonly string[]) {
  const sources = files.filter(isSource)
  if (sources.length === 0) return undefined
  const roots = await sourceRoots(root, files)
  const parser = await parserForSource()
  try {
    const inventory = []
    for (const file of sources) {
      const functions = await readFunctions(parser, root, file)
      inventory.push({
        file, roots: [nearestRoot(path.posix.dirname(file), roots).id],
        symbols: functions.map(item => ({
          id: `${file}#${item.name}@${item.position}`, name: item.name, kind: 'function',
        })),
      })
    }
    return createScanObservation({
      scanner: { id: 'r', technology: 'r', engine: 'tree-sitter-r', engineVersion: '1.3.0' },
      roots, files: inventory,
      diagnostics: [{
        severity: 'info', code: 'R_SYNTAX_ONLY',
        message: 'R source syntax only; package exports, dynamic bindings, calls and runtime boundaries are not resolved.',
      }],
    })
  } finally { parser.delete() }
}

async function readCodeStructure(root: string, references: readonly SourceReference[]): Promise<CodeFile[]> {
  if (references.length === 0) return []
  const parser = await parserForSource()
  try {
    const outline: CodeFile[] = []
    for (const reference of references.filter(reference => isSource(reference.file))) {
      const functions = await readFunctions(parser, root, reference.file)
      if (functions.length) outline.push({
        file: reference.file,
        declarations: functions.map(item => ({
          kind: 'function', name: item.name, line: item.line,
          visibility: 'public', entry: reference.symbols.includes(item.name),
        })),
      })
    }
    return outline
  } finally { parser.delete() }
}

export default {
  id: 'r',
  listSourceFiles: async (_root, _settings, candidates) => candidates.filter(isSource),
  async checkReadiness(_root, _settings, files) {
    if (!files.some(isSource)) throw new Error('r: No selected R source files were found.')
    const parser = await parserForSource()
    parser.delete()
  },
  scan: (root, _settings, files) => scan(root, files),
  readCodeStructure,
} satisfies ScannerPlugin
