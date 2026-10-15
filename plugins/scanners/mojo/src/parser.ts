import { readFile } from 'node:fs/promises'
import { Language, Parser, type Node } from 'web-tree-sitter'

let language: Promise<Language> | undefined

/** Load only package-owned assets. Scanning never downloads or executes project tools. */
export function mojoLanguage(): Promise<Language> {
  language ??= (async () => {
    await Parser.init({ wasmBinary: await readFile(new URL('../dist/web-tree-sitter.wasm', import.meta.url)) })
    return Language.load(await readFile(new URL('../dist/tree-sitter-mojo.wasm', import.meta.url)))
  })()
  return language
}

function syntaxError(node: Node): Node | undefined {
  if (node.isError || node.isMissing) return node
  for (const child of node.children) {
    if (!child.hasError && !child.isMissing) continue
    const error = syntaxError(child)
    if (error) return error
  }
  return undefined
}

/** Tree-sitter's web API indexes JavaScript strings in UTF-16, as the evidence contract requires. */
export async function parseMojo<T>(file: string, source: string, inspect: (root: Node) => T): Promise<T> {
  const loaded = await mojoLanguage()
  const parser = new Parser()
  parser.setLanguage(loaded)
  const tree = parser.parse(source)
  try {
    if (!tree) throw new Error(`mojo: ${file}: parser produced no syntax tree`)
    const error = syntaxError(tree.rootNode)
    if (error) {
      throw new Error(`mojo: ${file}:${error.startPosition.row + 1}:${error.startPosition.column + 1}: syntax is invalid or unsupported by the pinned Mojo grammar e5905c4+groma1 (modern def syntax; legacy fn is unsupported).`)
    }
    return inspect(tree.rootNode)
  } finally {
    tree?.delete()
    parser.delete()
  }
}
