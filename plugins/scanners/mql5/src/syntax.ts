import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { Language, Parser, type Node, type Tree } from 'web-tree-sitter'
import runtimeWasm from 'web-tree-sitter/web-tree-sitter.wasm' with { type: 'file' }
import { definitions, normalize, scopeChangingMacros, type ScopeChange, type Span } from './preprocessing.ts'
import grammarWasm from '../assets/tree-sitter-mql5.wasm' with { type: 'file' }

export type Syntax = Node
export interface Source { file: string; tree: Tree; opaque: Span[]; uncertainCallers: ScopeChange[]; macros: ReadonlySet<string> }
let language: Promise<Language> | undefined

// Source file imports are absolute paths (including Windows drives); bundled imports are relative URLs.
function asset(file: string): string | URL { return path.isAbsolute(file) ? file : new URL(file, import.meta.url) }

function loadLanguage(): Promise<Language> {
  language ??= (async () => {
    await Parser.init({ wasmBinary: await readFile(asset(runtimeWasm)) })
    return Language.load(await readFile(asset(grammarWasm)))
  })()
  return language
}

export function sourceFiles(files: readonly string[]): string[] {
  return files.filter(file => /\.(mq5|mqh|h)$/.test(file)).sort()
}

/** MetaEditor commonly saves BOM-marked UTF-16; locations refer to the decoded text including its BOM. */
async function sourceText(file: string): Promise<string> {
  const bytes = await readFile(file)
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder('utf-16le', { ignoreBOM: true }).decode(bytes)
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder('utf-16be', { ignoreBOM: true }).decode(bytes)
  return bytes.toString('utf8')
}

function syntaxError(node: Syntax): Syntax | undefined {
  if (node.isError || node.isMissing) return node
  return node.children.filter((child): child is Syntax => child?.hasError === true).map(syntaxError).find(Boolean)
}

/** Each request owns its parser and trees. No file outside the supplied list is read. */
export async function withSources<T>(root: string, files: readonly string[], inspect: (sources: Source[]) => T): Promise<T> {
  const grammar = await loadLanguage()
  const parser = new Parser()
  const sources: Source[] = []
  try {
    parser.setLanguage(grammar)
    const inputs = await Promise.all(sourceFiles(files).map(async file => ({ file, text: await sourceText(path.join(root, file)) })))
    const macros = definitions(inputs.map(input => input.text))
    const macroNames = new Set(macros.keys())
    const uncertainMacros = scopeChangingMacros(macros)
    for (const { file, text } of inputs) {
      const prepared = normalize(text, macros, uncertainMacros, file)
      // A virtual final newline terminates directives at EOF without moving any physical source.
      const tree = parser.parse(`${prepared.text}\n`)
      if (!tree) throw new Error(`MQL5_PARSE_ERROR: ${file}: no syntax tree was produced`)
      sources.push({ file, tree, opaque: prepared.spans, uncertainCallers: prepared.uncertainCallers, macros: macroNames })
      const error = syntaxError(tree.rootNode)
      if (tree.rootNode.hasError) throw new Error(`MQL5_PARSE_ERROR: ${file}:${(error ?? tree.rootNode).startPosition.row + 1}: unsupported or invalid syntax near ${(error ?? tree.rootNode).type}`)
    }
    return inspect(sources)
  } finally {
    for (const source of sources) source.tree.delete()
    parser.delete()
  }
}

export const typeKinds = new Set(['class_specifier', 'struct_specifier', 'interface_specifier', 'enum_specifier'])
export const conditionalKinds = new Set(['preproc_if', 'preproc_ifdef', 'preproc_else', 'preproc_elif', 'preproc_elifdef', 'conditional_declaration_prefix'])
export function field(node: Syntax, name: string): Syntax | undefined { return node.childForFieldName(name) ?? undefined }

export function children(node: Syntax): Syntax[] { return node.namedChildren.filter((child): child is Syntax => child !== null) }

export function touches(source: Source, start: number, end: number): boolean { return source.opaque.some(span => span.start < end && start < span.end) }
