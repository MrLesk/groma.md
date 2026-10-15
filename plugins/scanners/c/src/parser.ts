import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Language, Parser, type Tree } from 'web-tree-sitter'
import { collectMacros } from './macros.ts'
import { analyzeTree, type CSource } from './source.ts'

const asset = (name: string) => fileURLToPath(new URL(`../dist/${name}`, import.meta.url))
let language: Promise<Language> | undefined

/** Only scanner-owned WASM is loaded; target includes and build files are never opened. */
export function prepareParser(): Promise<Language> {
  language ??= Parser.init({ locateFile: () => asset('web-tree-sitter.wasm') })
    .then(() => Language.load(asset('tree-sitter-c.wasm')))
  return language
}

async function readUtf8(root: string, file: string): Promise<string> {
  const bytes = await readFile(path.join(root, file))
  try { return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes) }
  catch { throw new Error(`c: ${file} is not valid UTF-8 source.`) }
}

/** The selected trees supply macro evidence before either scans or outlines extract declarations. */
export async function readSources(root: string, files: readonly string[]): Promise<CSource[]> {
  const grammar = await prepareParser()
  const parser = new Parser()
  const trees: { file: string; tree: Tree }[] = []
  try {
    parser.setLanguage(grammar)
    for (const file of files) {
      const tree = parser.parse(await readUtf8(root, file))
      if (!tree) throw new Error(`c: The parser produced no syntax tree for ${file}.`)
      trees.push({ file, tree })
    }
    const macros = collectMacros(trees.map(item => item.tree.rootNode), parser)
    return trees.map(({ file, tree }) => analyzeTree(file, tree.rootNode, macros))
  } finally {
    for (const { tree } of trees) tree.delete()
    parser.delete()
  }
}
