import path from 'node:path'

import type {
  ArchitectureDocument,
  MarkdownElement,
  MarkdownNode,
} from './types.ts'

type InvalidMarkdown = (code: string, sourceFilename: string, message: string) => never

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

/**
 * The target of an inline Markdown link with its optional title, as the source of a pattern: it matches
 * "(target)" and "(target "title")". Its two groups are the target and the title with the space before it.
 * A rename (curate-rename.ts) and the element links (element-links.ts) both find links with it, so a
 * change here reaches both.
 */
export const inlineLinkTarget = String.raw`\(\s*<?((?:[^()\s<>]|\([^()\s<>]*\))+)>?((?:\s+(?:"[^"]*"|'[^']*'|\([^()]*\)))?)\s*\)`

/**
 * The level-two section each line of a Markdown source belongs to: the heading line, such as "## Steps",
 * that opened it, or undefined above the first one. A heading inside fenced code opens no section.
 */
export function sectionOfEachLine(lines: readonly string[]): (string | undefined)[] {
  let section: string | undefined
  let fence: string | undefined
  return lines.map(line => {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/)
    if (marker) {
      const delimiter = marker[1]!
      if (fence === undefined) fence = delimiter
      else if (delimiter[0] === fence[0] && delimiter.length >= fence.length && marker[2]!.trim() === '') fence = undefined
    } else if (fence === undefined && line.startsWith('## ')) {
      section = line.trimEnd()
    }
    return section
  })
}

/** The relative link target that leads from one document to another, escaped for a Markdown link. */
export function markdownHref(fromFilename: string, toFilename: string): string {
  return path.posix.relative(path.posix.dirname(fromFilename), toFilename)
    .split('/').map(encodeURIComponent).join('/').replaceAll('(', '%28').replaceAll(')', '%29')
}
