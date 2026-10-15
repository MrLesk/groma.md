import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { Language, Parser, type Node } from 'web-tree-sitter'
import runtimeWasm from 'web-tree-sitter/web-tree-sitter.wasm' with { type: 'file' }
import grammarWasm from '../assets/tree-sitter-ada.wasm' with { type: 'file' }

export type { Node } from 'web-tree-sitter'
export const grammarRevision = 'a45fd9c65a791cbe7d146e85a53fbe43a6d52a61+groma.1'
let language: Promise<Language> | undefined

// Bun source imports are absolute host paths; bundled file imports are relative to this module.
function assetPath(file: string): string | URL {
  return path.isAbsolute(file) ? file : new URL(file, import.meta.url)
}

/** The same in-process parser serves source development and the standalone package. */
export function adaLanguage(): Promise<Language> {
  language ??= (async () => {
    await Parser.init({ wasmBinary: await readFile(assetPath(runtimeWasm)) })
    return Language.load(await readFile(assetPath(grammarWasm)))
  })()
  return language
}

function invalidNode(node: Node): Node | undefined {
  if (node.type === 'ERROR' || node.isMissing || node.type.startsWith('gnatprep_')) return node
  for (const child of node.children) {
    const invalid = invalidNode(child)
    if (invalid) return invalid
  }
}

/** Consume each tree before releasing its WASM memory. No parser nodes escape this callback. */
export async function readSyntax<T>(file: string, source: string, consume: (root: Node) => T): Promise<T> {
  const grammar = await adaLanguage()
  const parser = new Parser()
  parser.setLanguage(grammar)
  try {
    const tree = parser.parse(source)
    if (!tree) throw new Error(`ada: Cannot parse ${file}`)
    try {
      const invalid = invalidNode(tree.rootNode)
      if (invalid) throw new Error(`ada: ${file}:${invalid.startPosition.row + 1}:${invalid.startPosition.column + 1}: ${
        invalid.type.startsWith('gnatprep_') ? 'GNAT preprocessing requires an unsupported source configuration' : 'Unsupported or invalid Ada syntax'}`)
      return consume(tree.rootNode)
    } finally { tree.delete() }
  } finally { parser.delete() }
}

export function nameNode(node: Node): Node | undefined {
  return node.childForFieldName('name') ?? node.namedChildren.find(child => child.type === 'identifier')
}

export function specification(node: Node): Node | undefined {
  return node.namedChildren.find(child => child.type === 'procedure_specification' || child.type === 'function_specification')
}

/** Ada identifiers are case-insensitive; punctuation in expanded names remains significant. */
export function identity(name: string): string { return name.replace(/\s+/g, '').toLowerCase() }
