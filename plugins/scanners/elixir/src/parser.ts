import { readFile } from 'node:fs/promises'
import { Language, Parser, type Node } from 'web-tree-sitter'

/** The grammar release this package bundles; it is also the observation's engine version. */
export const grammarVersion = '0.3.5'

let language: Promise<Language> | undefined

export function elixirLanguage(): Promise<Language> {
  language ??= (async () => {
    await Parser.init({ wasmBinary: await readFile(new URL('../dist/web-tree-sitter.wasm', import.meta.url)) })
    return Language.load(await readFile(new URL('../dist/tree-sitter-elixir.wasm', import.meta.url)))
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

/**
 * Parse one file and hand its syntax tree to `inspect`. The tree is freed when `inspect` returns, so
 * `inspect` must copy every fact it needs out of the nodes. The web parser indexes JavaScript strings
 * in UTF-16, which is the unit observation positions use.
 */
export async function parseElixir<T>(file: string, source: string, inspect: (root: Node) => T): Promise<T> {
  // Loading the language also initializes the parser runtime, so it comes first.
  const loaded = await elixirLanguage()
  const parser = new Parser()
  parser.setLanguage(loaded)
  const tree = parser.parse(source)
  try {
    if (!tree) throw new Error(`elixir: ${file}: parser produced no syntax tree`)
    const error = syntaxError(tree.rootNode)
    if (error) {
      throw new Error(`elixir: ${file}:${error.startPosition.row + 1}:${error.startPosition.column + 1}: `
        + `invalid or unsupported Elixir syntax (tree-sitter-elixir ${grammarVersion}).`)
    }
    return inspect(tree.rootNode)
  } finally {
    tree?.delete()
    parser.delete()
  }
}
