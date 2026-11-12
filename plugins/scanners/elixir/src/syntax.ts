import type { Node } from 'web-tree-sitter'

/*
 * Small readers over the tree-sitter-elixir syntax tree. Elixir writes definitions, DSL entries and
 * ordinary calls the same way, as a call: `name arg, key: value do ... end`. These helpers read the
 * parts of such a call and decode literals. They never evaluate code: a value that is not written as
 * a literal reads as undefined.
 */

/** The name of a call whose target is a bare identifier, such as `def`, `scope` or `get`. */
export function callName(node: Node): string | undefined {
  if (node.type !== 'call') return undefined
  const target = node.childForFieldName('target')
  return target?.type === 'identifier' ? target.text : undefined
}

function argumentNodes(node: Node): Node[] {
  const list = node.namedChildren.find(child => child.type === 'arguments')
  return list?.namedChildren.filter(child => child.type !== 'comment') ?? []
}

/** How many arguments a call is written with; trailing `key: value` options are one argument. */
export function argumentCount(node: Node): number {
  return argumentNodes(node).length
}

/** The arguments written before any trailing `key: value` options. */
export function positional(node: Node): Node[] {
  return argumentNodes(node).filter(argument => argument.type !== 'keywords')
}

function keywordKey(pair: Node): string | undefined {
  const key = pair.childForFieldName('key')
  if (key?.type === 'keyword') return key.text.trim().replace(/:$/, '')
  if (key?.type === 'quoted_keyword') return plainContent(key)
  return undefined
}

/** The pairs of a `keywords` node by key; undefined when a key is computed or written twice. */
export function keywordPairs(keywords: Node | undefined): Map<string, Node> | undefined {
  const pairs = new Map<string, Node>()
  for (const pair of keywords?.namedChildren ?? []) {
    if (pair.type === 'comment') continue
    const key = keywordKey(pair)
    const value = pair.childForFieldName('value')
    if (key === undefined || !value || pairs.has(key)) return undefined
    pairs.set(key, value)
  }
  return pairs
}

/** The trailing `key: value` options of a call; empty when it has none, undefined when unreadable. */
export function options(node: Node): Map<string, Node> | undefined {
  return keywordPairs(argumentNodes(node).find(argument => argument.type === 'keywords'))
}

/** The statements of a `do ... end` block, without comments. */
export function statements(block: Node): Node[] {
  return block.namedChildren.filter(child => child.type !== 'comment')
}

/**
 * The body a call is given: the statements of its `do ... end` block, or the one expression of the
 * `, do: expression` form. Undefined when the call has no body.
 */
export function body(node: Node): Node[] | undefined {
  const block = node.namedChildren.find(child => child.type === 'do_block')
  if (block) return statements(block)
  const inline = options(node)?.get('do')
  return inline ? [inline] : undefined
}

/** The text of a quoted node that holds no interpolation and no escape sequence. */
function plainContent(node: Node): string | undefined {
  const parts = node.namedChildren
  return parts.every(part => part.type === 'quoted_content') ? parts.map(part => part.text).join('') : undefined
}

export function stringLiteral(node: Node | undefined): string | undefined {
  return node?.type === 'string' ? plainContent(node) : undefined
}

/** `:name` or `:"quoted name"`, without the colon. */
export function atomLiteral(node: Node | undefined): string | undefined {
  if (node?.type === 'atom') return node.text.slice(1)
  return node?.type === 'quoted_atom' ? plainContent(node) : undefined
}

export function booleanLiteral(node: Node | undefined): boolean | undefined {
  return node?.type === 'boolean' ? node.text === 'true' : undefined
}

/** The elements of a list literal, without comments; a trailing keyword part stays one `keywords` node. */
export function listItems(node: Node | undefined): Node[] | undefined {
  return node?.type === 'list' ? node.namedChildren.filter(child => child.type !== 'comment') : undefined
}

function literalList(node: Node | undefined, read: (item: Node) => string | undefined): string[] | undefined {
  const values = listItems(node)?.map(read)
  return values?.every(value => value !== undefined) ? values as string[] : undefined
}

export function atomList(node: Node | undefined): string[] | undefined {
  return literalList(node, atomLiteral)
}

export function stringList(node: Node | undefined): string[] | undefined {
  return literalList(node, stringLiteral)
}

/** The operator text of a binary expression, such as `when`, `++` or `|>`. */
export function operator(node: Node): string | undefined {
  return node.type === 'binary_operator' ? node.childForFieldName('operator')?.text : undefined
}

export function lineOf(node: Node): number {
  return node.startPosition.row + 1
}

/** Observation-local id of a declaration: its file and UTF-16 start offset. */
export function declarationId(file: string, node: Node): string {
  return `${file}:${node.startIndex}`
}
