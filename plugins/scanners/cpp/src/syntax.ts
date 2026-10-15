import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { Language, Parser, type Node, type Tree } from 'web-tree-sitter'
import runtime from 'web-tree-sitter/web-tree-sitter.wasm' with { type: 'file' }
import grammar from '../grammar/tree-sitter-cpp.wasm' with { type: 'file' }

export type Syntax = Node
let language: Promise<Language> | undefined

function assetLocation(asset: string): string | URL {
  return path.isAbsolute(asset) ? asset : new URL(asset, import.meta.url)
}

/** Bun copies these two file imports into the package; parsing never fetches assets. */
async function cppLanguage(): Promise<Language> {
  await Parser.init({ wasmBinary: await readFile(assetLocation(runtime)) })
  return Language.load(await readFile(assetLocation(grammar)))
}

/** Parse an internal syntax probe without turning its nodes into source evidence. */
export async function cppTree(source: string): Promise<Tree> {
  language ??= cppLanguage()
  const cpp = await language
  const parser = new Parser()
  try {
    parser.setLanguage(cpp)
    const tree = parser.parse(source)
    if (!tree) throw new Error('cpp: Parser returned no syntax tree.')
    return tree
  } finally { parser.delete() }
}

export async function parseCpp(file: string, source: string): Promise<Tree> {
  const tree = await cppTree(source)
  if (!tree.rootNode.hasError) return tree
  const error = firstError(tree.rootNode)
  const message = `cpp: ${file}:${error.startPosition.row + 1}:${error.startPosition.column + 1}: unsupported or invalid C++ syntax near ${JSON.stringify(error.text.slice(0, 80))}. Source macros are not expanded.`
  tree.delete()
  throw new Error(message)
}

function firstError(node: Syntax): Syntax {
  if (node.isError || node.isMissing) return node
  const child = node.children.find(child => child.hasError || child.isMissing)
  return child ? firstError(child) : node
}

export function field(node: Syntax, name: string): Syntax | undefined {
  return node.childForFieldName(name) ?? undefined
}

/** Declarator wrappers express pointers/references. A pointer variable is not a function. */
export function functionName(node: Syntax): Syntax | undefined {
  let current: Syntax | undefined = node
  while (current) {
    if (current.type === 'operator_cast') return current
    if (current.type === 'qualified_identifier') return functionName(field(current, 'name')!) ? current : undefined
    const next: Syntax | null | undefined = field(current, 'declarator') ?? current.namedChildren[0]
    if (current.type === 'function_declarator' && next && named(next)) return next
    if (!['function_declarator', 'pointer_declarator', 'reference_declarator', 'parenthesized_declarator'].includes(current.type)) return undefined
    current = next ?? undefined
  }
}

function named(node: Syntax): boolean {
  return ['identifier', 'field_identifier', 'qualified_identifier', 'destructor_name', 'operator_name', 'template_function'].includes(node.type)
}

function operatorName(node: Syntax): string {
  const tokens = node.children.filter(child => child.type !== 'comment').slice(1).map(child => child.text).join('')
  return `operator${/^[a-z_]/.test(tokens) ? ' ' : ''}${tokens}`
}

function targetTokens(node: Syntax, end: number): string[] {
  if (node.startIndex >= end || node.type === 'comment') return []
  return node.childCount ? node.children.flatMap(child => targetTokens(child, end)) : [node.text]
}

function conversionName(node: Syntax): string {
  const parameters = field(node, 'declarator')!.descendantsOfType('parameter_list')[0]!
  const tokens = targetTokens(node, parameters.startIndex).slice(1)
  const target = tokens.reduce((text, token) => text
    + (/[\p{ID_Continue}]$/u.test(text) && /^[\p{ID_Continue}]/u.test(token) ? ' ' : '') + token, '')
  return `operator ${target}`
}

/** Keep qualification separate from the physical source name and its line. */
export function nameParts(node: Syntax): { name: string; qualifier: string[]; line: number } {
  if (node.type === 'qualified_identifier') {
    const nested = nameParts(field(node, 'name')!)
    const scope = field(node, 'scope')
    return { ...nested, qualifier: [...(scope ? [scope.text] : []), ...nested.qualifier] }
  }
  const name = node.type === 'operator_cast' ? conversionName(node) : node.type === 'operator_name' ? operatorName(node) : node.text
  return { name, qualifier: [], line: node.startPosition.row + 1 }
}

export const typeKinds = new Set(['class_specifier', 'struct_specifier', 'union_specifier', 'enum_specifier'])
export const conditionalKinds = new Set([
  'preproc_if', 'preproc_ifdef', 'preproc_elif', 'preproc_else',
  'preproc_if_binary_tail', 'preproc_else_binary_tail', 'preproc_if_function_header', 'preproc_else_function_header',
  'preproc_if_expression', 'preproc_else_expression', 'preproc_if_initializer', 'preproc_else_initializer',
  'preproc_if_attribute', 'preproc_else_attribute', 'preproc_if_empty', 'preproc_else_empty',
  'preproc_if_list', 'preproc_else_list', 'preproc_if_string', 'preproc_else_string',
  'preproc_if_constructor', 'preproc_else_constructor', 'preproc_if_type', 'preproc_else_type',
  'preproc_if_call_tail', 'preproc_else_call_tail', 'conditional_if_statement',
  'conditional_try_statement', 'conditional_linkage_specification',
])
