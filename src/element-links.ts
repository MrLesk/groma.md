import { inlineLinkTarget, markdownHref, relationshipTargetFilename, sectionOfEachLine } from './architecture-markdown.ts'

/** What a link to an element shows and where it leads. */
export interface LinkedElement {
  id: string
  title: string
  sourceFilename: string
}

/**
 * A title as the text of a Markdown link, on one line: white space is collapsed, and the characters that
 * would start or end markup, or a table cell, are escaped.
 */
function linkText(title: string): string {
  return title.trim().replace(/\s+/g, ' ').replace(/[\\[\]`*_<|]/g, character => `\\${character}`)
}

/**
 * The link groma writes from one record to an element: the element's title as the text, so a Markdown reader
 * sees the names the map shows, and its id as the link title, which viewers show on hover. groma reads only
 * the target of such a link.
 */
export function elementLink(fromFilename: string, element: LinkedElement): string {
  return `[${linkText(element.title)}](${markdownHref(fromFilename, element.sourceFilename)} "${element.id}")`
}

/** An inline Markdown link whose text holds no brackets of its own: [text](target) or [text](target "title"). */
const inlineLink = new RegExp(String.raw`\[(?:\\.|[^[\]\\])*\]${inlineLinkTarget}`, 'g')

/**
 * Splits a line of a kept section into the part that names elements and the rest. A list item names one
 * member. In a table row the first two cells name the ends, a relationship's Source and Target or a step's
 * From and To, and the cells after them are the author's text. Any other line is the author's text.
 */
function endsAndRest(line: string): [ends: string, rest: string] {
  const text = line.trimStart()
  if (text.startsWith('- ')) return [line, '']
  if (!text.startsWith('|')) return ['', line]
  const cells = line.split(/(?<!\\)\|/)
  return [cells.slice(0, 3).join('|'), cells.slice(3).map(cell => `|${cell}`).join('')]
}

/**
 * Writes again, in the given sections of a record, each inline link that names one of these elements as a
 * member or as an end of a row, so it shows that element's title and id as they are now. The sections are
 * the ones groma keeps in that kind of record: relationshipSections, stepsSection or membersSection.
 * Links to anything else, the other cells of a row, every other section and all prose stay as written.
 * A new title or id reaches the stored records through relinkElement in edit.ts, which calls this.
 */
export function withElementLinks(
  source: string,
  sourceFilename: string,
  sections: ReadonlySet<string>,
  elements: readonly LinkedElement[],
): string {
  const byDocument = new Map(elements.map(element => [element.sourceFilename, element]))
  const lines = source.split('\n')
  const sectionOf = sectionOfEachLine(lines)
  return lines.map((line, index) => {
    if (!sections.has(sectionOf[index] ?? '')) return line
    const [ends, rest] = endsAndRest(line)
    return ends.replace(inlineLink, (link, target: string) => {
      const element = byDocument.get(relationshipTargetFilename(sourceFilename, target) ?? '')
      return element === undefined ? link : elementLink(sourceFilename, element)
    }) + rest
  }).join('\n')
}
