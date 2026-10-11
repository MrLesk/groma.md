import path from 'node:path'

import type {
  ArchitectureDocument,
  MarkdownElement,
  MarkdownNode,
} from './types.ts'

type InvalidMarkdown = (code: string, sourceFilename: string, message: string) => never

/**
 * Where Comark, the parser behind the architecture reader, reads inline syntax in text. Each match gets a
 * backslash; all other punctuation is stored as written, so documents stay ordinary Markdown.
 * Block syntax at the start of a line, such as "# " or "- ", is not covered.
 * Guarded by "relationship text is stored as written and read back unchanged" in test-bun/source-relationships.test.ts.
 */
const markdownSyntax = new RegExp([
  // Escape, code, emphasis, link or span, HTML, strikethrough, attributes, table cell.
  /[\\`*[<~{|]/,
  // Emphasis. An underscore between two letters or digits, as in user_id, never starts it and stays plain.
  /(?<![a-zA-Z\d])_|_(?![a-zA-Z\d])/,
  // A character reference such as &amp; or &#35;. Any other ampersand, as in "Auth & billing", stays plain.
  /&(?=#?[a-zA-Z\d]+;)/,
  // An inline component such as :icon. Comark accepts one only at the start of the text or after a space, *, _
  // or [, and its name starts with a letter or $. The colon of /users/:id or "note: text" fits neither and stays plain.
  /(?<=^|[\s*_[]):(?=[a-zA-Z$])/,
  // The colon of an address such as https://example.com. Unescaped, Comark links the address and copies it
  // without reading the backslashes added above.
  /:(?=\/\/)/,
].map(rule => rule.source).join('|'), 'g')

/**
 * Literal text as Markdown that the reader shows unchanged. Pass text, never Markdown: formatting would be
 * stored as visible characters, and escaping twice adds visible backslashes. Line breaks are kept, which
 * suits prose paragraphs.
 */
export function escapeMarkdownText(text: string): string {
  return text.replaceAll(markdownSyntax, '\\$&')
}

/** The same for one table cell. A line break would end the row, so the text continues after a space. */
export function escapeTableCell(text: string): string {
  return escapeMarkdownText(text).replaceAll(/\s*[\r\n]\s*/g, ' ')
}

export function nodeText(node: MarkdownNode | undefined): string {
  if (typeof node === 'string') return node
  if (!Array.isArray(node)) return ''
  return (node.slice(2) as MarkdownNode[]).map(nodeText).join('')
}

export function collectNodes(
  node: MarkdownNode | MarkdownNode[] | undefined,
  tag: string,
  collected: MarkdownElement[] = [],
): MarkdownElement[] {
  if (!Array.isArray(node)) return collected
  const values = node as unknown[]
  const isAstNode = typeof values[0] === 'string'
  if (isAstNode && node[0] === tag) collected.push(node as MarkdownElement)
  const children = (isAstNode ? values.slice(2) : values) as MarkdownNode[]
  for (const child of children) collectNodes(child, tag, collected)
  return collected
}

export function elementOverview(
  document: ArchitectureDocument,
  invalid: InvalidMarkdown,
): string {
  if (collectNodes(document.nodes, 'h1').length > 0) {
    invalid(
      'INVALID_ELEMENT',
      document.sourceFilename,
      'body must not duplicate title with a level-one heading',
    )
  }
  const paragraphs: string[] = []
  for (const node of document.nodes) {
    if (!Array.isArray(node) || node[0] !== 'p') break
    const paragraph = nodeText(node).trim()
    if (paragraph.length === 0) break
    paragraphs.push(paragraph)
  }
  const overview = paragraphs.join('\n\n')
  return overview
}

export function tableHeaderNames(table: MarkdownElement): string[] {
  const headerRow = collectNodes(table, 'tr')[0]
  const cells = headerRow?.slice(2).filter(child => {
    return Array.isArray(child) && child[0] === 'th'
  }) as MarkdownElement[] | undefined
  return (cells ?? []).map(cell => nodeText(cell).trim())
}

export function relationshipTargetFilename(sourceFilename: string, href: unknown): string | null {
  if (typeof href !== 'string') return null
  let decodedHref: string
  try {
    decodedHref = decodeURIComponent(href.split('#', 1)[0])
  } catch {
    return null
  }
  if (
    decodedHref.length === 0
    || path.posix.isAbsolute(decodedHref)
    || /^[a-z][a-z\d+.-]*:/i.test(decodedHref)
  ) return null
  return path.posix.normalize(path.posix.join(path.posix.dirname(sourceFilename), decodedHref))
}
