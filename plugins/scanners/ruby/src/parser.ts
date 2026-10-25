import { readFile } from 'node:fs/promises'
import { Language, Parser, type Node } from 'web-tree-sitter'

let language: Promise<Language> | undefined

export function rubyLanguage(): Promise<Language> {
  language ??= (async () => {
    await Parser.init({ wasmBinary: await readFile(new URL('../dist/web-tree-sitter.wasm', import.meta.url)) })
    return Language.load(await readFile(new URL('../dist/tree-sitter-ruby.wasm', import.meta.url)))
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

/** The web parser indexes JavaScript strings in UTF-16, matching observation positions. */
export async function parseRuby<T>(file: string, source: string, inspect: (root: Node) => T): Promise<T> {
  const language = await rubyLanguage()
  const parser = new Parser()
  parser.setLanguage(language)
  const tree = parser.parse(source)
  try {
    if (!tree) throw new Error(`ruby: ${file}: parser produced no syntax tree`)
    const error = syntaxError(tree.rootNode)
    if (error) throw new Error(`ruby: ${file}:${error.startPosition.row + 1}:${error.startPosition.column + 1}: invalid or unsupported Ruby syntax (tree-sitter-ruby 0.23.1).`)
    return inspect(tree.rootNode)
  } finally {
    tree?.delete()
    parser.delete()
  }
}

