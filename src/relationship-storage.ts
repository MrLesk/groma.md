import path from 'node:path'
import { parseMarkdown, parseFrontmatter } from 'comark'
import { buildArchitectureModel } from './architecture-model.ts'
import { readDocument, writeDocument } from './markdown-emitter.ts'
import type { StoredRelationship } from './relationship-markdown.ts'
import type { ArchitectureDocument, CodeReference } from './types.ts'

interface Owner {
  id: string
  sourceFilename: string
  code: readonly CodeReference[]
}

/** Outgoing rows follow their source owner; detached files wait in their current document. */
export function placeRelationships(rows: readonly StoredRelationship[], elements: readonly Owner[]): StoredRelationship[] {
  const owners = new Map(elements.flatMap(element => [
    [element.id, element.sourceFilename] as const,
    ...element.code.map(reference => [reference.file, element.sourceFilename] as const),
  ]))
  return rows.map(row => ({ ...row, document: owners.get(row.source) ?? row.document }))
}

const headings = new Set(['## Relationships', '## Draft relationships', '## Derived relationships'])

/** These sections belong to relationship storage; all other prose and sections stay untouched. */
export function withoutRelationshipSections(source: string): string {
  let relationship = false
  let fence: string | undefined
  const remaining = source.split('\n').filter(line => {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/)
    if (marker) {
      const delimiter = marker[1]!
      if (fence === undefined) fence = delimiter
      else if (delimiter[0] === fence[0] && delimiter.length >= fence.length && marker[2]!.trim() === '') fence = undefined
    } else if (fence === undefined && line.startsWith('## ')) {
      relationship = headings.has(line.trimEnd())
    }
    return !relationship
  }).join('\n').trimEnd()
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

/** Rebuild only a changed document's relationship sections using links relative to that document. */
export function withStoredRelationships(
  source: string,
  filename: string,
  rows: readonly StoredRelationship[],
  concepts: ReadonlyMap<string, string>,
): string {
  const href = (endpoint: string) => path.posix.relative(path.posix.dirname(filename), concepts.get(endpoint) ?? endpoint)
  const sections = new Map<string, string[]>()
  for (const row of rows) {
    const heading = row.authored ? (row.status === 'draft' ? '## Draft relationships' : '## Relationships') : '## Derived relationships'
    const lines = sections.get(heading) ?? []
    lines.push(`| [${row.source}](${href(row.source)}) | [${row.target}](${href(row.target)}) | ${row.description} | ${row.technology} |`)
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
  const concepts = new Map(elements.map(element => [element.id, element.sourceFilename]))
  const writes = new Map<string, string>()
  const replacements = new Map<string, ArchitectureDocument>()
  for (const [filename, rows] of changedRelationshipDocuments(before, after)) {
    const source = withStoredRelationships(await readDocument(repositoryRoot, filename), filename, rows, concepts)
    const tree = await parseMarkdown(source)
    replacements.set(filename, { sourceFilename: filename, body: parseFrontmatter(source).content,
      nodes: tree.nodes, frontmatter: tree.frontmatter } as ArchitectureDocument)
    writes.set(filename, source)
  }
  if (!writes.size) return
  buildArchitectureModel(documents.map(document => replacements.get(document.sourceFilename) ?? document))
  for (const [filename, source] of writes) await writeDocument(repositoryRoot, filename, source)
}
