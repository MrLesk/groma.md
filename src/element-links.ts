import { markdownHref, relationshipTargetFilename, sectionOfEachLine } from './architecture-markdown.ts'

/** What a link to an element shows and where it leads. */
export interface LinkedElement {
  id: string
  title: string
  sourceFilename: string
}

/** A title as the text of a Markdown link: the characters that would start or end markup, or a table cell, are escaped. */
function linkText(title: string): string {
  return title.replace(/[\\[\]`*_<|]/g, character => `\\${character}`)
}

/**
 * The link groma writes from one record to an element: the element's title as the text, so a Markdown reader
 * sees the names the map shows, and its id as the link title, which viewers show on hover. groma reads only
 * the target of such a link.
 */
export function elementLink(fromFilename: string, element: LinkedElement): string {
  return `[${linkText(element.title)}](${markdownHref(fromFilename, element.sourceFilename)} "${element.id}")`
}

/** An inline Markdown link whose text holds no further brackets: [text](target) or [text](target "title"). */
const inlineLink = /\[(?:\\.|[^[\]\\])*\]\(\s*<?((?:[^()\s<>]|\([^()\s<>]*\))+)>?(?:\s+(?:"[^"]*"|'[^']*'|\([^()]*\)))?\s*\)/g

/**
 * Writes again, in the given sections of a record, each inline link that leads to the document of one of
 * these elements, so it shows that element's title and id as they are now. The sections are the ones groma
 * keeps in that kind of record: relationshipSections, stepsSection or membersSection. Links to anything
 * else, the other cells of a row, every other section and all prose stay as written.
 */
export function withElementLinks(
  source: string,
  sourceFilename: string,
  sections: ReadonlySet<string>,
  byDocument: ReadonlyMap<string, LinkedElement>,
): string {
  const lines = source.split('\n')
  const sectionOf = sectionOfEachLine(lines)
  return lines.map((line, index) => {
    if (!sections.has(sectionOf[index] ?? '')) return line
    return line.replace(inlineLink, (link, target: string) => {
      const element = byDocument.get(relationshipTargetFilename(sourceFilename, target) ?? '')
      return element === undefined ? link : elementLink(sourceFilename, element)
    })
  }).join('\n')
}

/** The elements by the document each one is stored in, as withElementLinks takes them. */
export function elementsByDocument(elements: readonly LinkedElement[]): Map<string, LinkedElement> {
  return new Map(elements.map(element => [element.sourceFilename, element]))
}
