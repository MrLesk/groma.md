import { parseMarkdown, parseFrontmatter } from 'comark'
import { markdownHref, sectionOfEachLine } from './architecture-markdown.ts'
import { buildArchitectureModel } from './architecture-model.ts'
import { elementLink, type LinkedElement } from './element-links.ts'
import { sourceIndex } from './source-index.ts'
import { readDocument, writeDocument } from './markdown-emitter.ts'
import type { StoredRelationship } from './relationship-markdown.ts'
import type { ArchitectureDocument, CodeReference } from './types.ts'

interface Owner extends LinkedElement {
  code: readonly CodeReference[]
}

/** Outgoing rows follow their source owner; detached files wait in their current document. */
export function placeRelationships(rows: readonly StoredRelationship[], elements: readonly Owner[]): StoredRelationship[] {
  const index = sourceIndex(elements)
  return rows.map(row => ({ ...row, document: index.resolve(row.source)?.sourceFilename ?? row.document }))
}

/** The headings of the sections of an element document that hold its relationship rows, by who owns the rows. */
const AUTHORED = '## Relationships'
const DRAFTED = '## Draft relationships'
const DERIVED = '## Derived relationships'

/** The sections of an element document whose rows and element links groma keeps. */
export const relationshipSections: ReadonlySet<string> = new Set([AUTHORED, DRAFTED, DERIVED])

/** These sections belong to relationship storage; all other prose and sections stay untouched. */
export function withoutRelationshipSections(source: string): string {
  const lines = source.split('\n')
  const sections = sectionOfEachLine(lines)
  const remaining = lines.filter((_line, index) => !relationshipSections.has(sections[index] ?? '')).join('\n').trimEnd()
  return `${remaining}\n`
}

function rowKey({ document: _document, ...row }: StoredRelationship): string {
  return JSON.stringify([row.source, row.target, row.description, row.technology, row.status, row.authored])
}

function byDocument(rows: readonly StoredRelationship[]): Map<string, StoredRelationship[]> {
  const result = new Map<string, StoredRelationship[]>()
  for (const row of rows) {
    const group = result.get(row.document) ?? []
    group.push(row)
    result.set(row.document, group)
  }
  return result
}

/** One pass groups the rows. Only documents whose claims changed need to be read or written. */
export function changedRelationshipDocuments(
  before: readonly StoredRelationship[],
  after: readonly StoredRelationship[],
): Map<string, StoredRelationship[]> {
  const previous = byDocument(before), next = byDocument(after)
  const changed = new Map<string, StoredRelationship[]>()
  for (const filename of new Set([...previous.keys(), ...next.keys()])) {
    const old = previous.get(filename) ?? [], rows = next.get(filename) ?? []
    const keys = new Set(old.map(rowKey))
    if (old.length !== rows.length || rows.some(row => !keys.has(rowKey(row)))) changed.set(filename, rows)
  }
  return changed
}

/**
 * Rebuild only a changed document's relationship sections using links relative to that document.
 * An endpoint that names an element is written as elementLink writes it; one that names a source file
 * shows its path.
 */
export function withStoredRelationships(
  source: string,
  filename: string,
  rows: readonly StoredRelationship[],
  elementsById: ReadonlyMap<string, LinkedElement>,
): string {
  const link = (endpoint: string): string => {
    const element = elementsById.get(endpoint)
    return element === undefined ? `[${endpoint}](${markdownHref(filename, endpoint)})` : elementLink(filename, element)
  }
  const tableText = (text: string): string => text.replace(/(?<!\\)\|/g, '\\|')
  const sections = new Map<string, string[]>()
  for (const row of rows) {
    const heading = row.authored ? (row.status === 'draft' ? DRAFTED : AUTHORED) : DERIVED
    const lines = sections.get(heading) ?? []
    lines.push(`| ${link(row.source)} | ${link(row.target)} | ${tableText(row.description)} | ${tableText(row.technology)} |`)
    sections.set(heading, lines)
  }
  const tables = [...sections].map(([heading, lines]) =>
    `${heading}\n\n| Source | Target | Description | Technology |\n| --- | --- | --- | --- |\n${lines.join('\n')}`)
  return `${[withoutRelationshipSections(source).trimEnd(), ...tables].join('\n\n')}\n`
}

/** Validate the final set together, then save each affected document once. */
export async function saveRelationships(
  repositoryRoot: string,
  documents: readonly ArchitectureDocument[],
  elements: readonly Owner[],
  before: readonly StoredRelationship[],
  after: readonly StoredRelationship[],
): Promise<void> {
  const elementsById = new Map(elements.map(element => [element.id, element]))
  const writes = new Map<string, string>()
  const replacements = new Map<string, ArchitectureDocument>()
  for (const [filename, rows] of changedRelationshipDocuments(before, after)) {
    const source = withStoredRelationships(await readDocument(repositoryRoot, filename), filename, rows, elementsById)
    const tree = await parseMarkdown(source)
    replacements.set(filename, { sourceFilename: filename, body: parseFrontmatter(source).content,
      nodes: tree.nodes, frontmatter: tree.frontmatter } as ArchitectureDocument)
    writes.set(filename, source)
  }
  if (!writes.size) return
  buildArchitectureModel(documents.map(document => replacements.get(document.sourceFilename) ?? document))
  for (const [filename, source] of writes) await writeDocument(repositoryRoot, filename, source)
}
