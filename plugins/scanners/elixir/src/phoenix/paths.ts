import type { HttpEndpointSegment } from '@groma/scanner'
import type { Node } from 'web-tree-sitter'
import { pathText } from '../../../http-url.ts'
import { stringLiteral } from '../syntax.ts'

/*
 * Phoenix path patterns, as Plug.Router.Utils reads them: segments between slashes, where a segment
 * is literal text, `:name`, `*name`, or literal text around one `:name`.
 */

/** One `:name` or `*name` with optional literal text before it and, for `:name`, after it. */
const dynamicSegment = /^([^:*\\]*)([:*])([a-z_][A-Za-z0-9_]*)([^:*\\]*)$/

function segment(text: string, last: boolean): HttpEndpointSegment | undefined {
  if (!/[:*\\]/.test(text)) return pathText.test(text) ? { kind: 'literal', value: text } : undefined
  const [, before, marker, name, after] = dynamicSegment.exec(text) ?? []
  if (!name) return undefined
  if (marker === ':') {
    // Text around the parameter, as in `v:version` or `:id.json`, accepts only some segments.
    return before || after ? { kind: 'parameter', name, constrained: true } : { kind: 'parameter', name }
  }
  // A glob takes the remaining segments, also none. Phoenix allows it only at the end and without a suffix.
  if (!last || after) return undefined
  return before ? { kind: 'catch-all', name, optional: true, constrained: true } : { kind: 'catch-all', name, optional: true }
}

/** The segments a literal path pattern states; undefined when the text is not a pattern Phoenix accepts. */
export function routeSegments(pattern: string | undefined): HttpEndpointSegment[] | undefined {
  if (pattern === undefined) return undefined
  const parts = pattern.split('/').filter(part => part !== '')
  const segments = parts.map((part, index) => segment(part, index === parts.length - 1))
  return segments.every(found => found !== undefined) ? segments as HttpEndpointSegment[] : undefined
}

/**
 * The whole literal segments a path argument states before anything computed or unreadable. For
 * `"/reports/#{name}"` that is `reports`; for a path that is not a string it is nothing.
 */
export function readablePrefix(pattern: Node | undefined): HttpEndpointSegment[] {
  const first = pattern?.type === 'string' ? pattern.namedChildren[0] : undefined
  const complete = stringLiteral(pattern)
  // Text before an interpolation may stop inside a segment, so only what precedes its last slash counts.
  const known = complete ?? (first?.type === 'quoted_content' ? first.text.slice(0, first.text.lastIndexOf('/') + 1) : '')
  const literals: HttpEndpointSegment[] = []
  for (const part of known.split('/').filter(text => text !== '')) {
    const found = segment(part, false)
    if (found?.kind !== 'literal') break
    literals.push(found)
  }
  return literals
}

/**
 * The path of a route the scanner sees but cannot read or bind to a handler: the literal segments
 * it starts with, then any remainder. Core derives no row to it and none for a request it could take first.
 */
export function blockerPath(known: readonly HttpEndpointSegment[]): HttpEndpointSegment[] {
  const firstOther = known.findIndex(found => found.kind !== 'literal')
  return [...(firstOther < 0 ? known : known.slice(0, firstOther)),
    { kind: 'catch-all', name: 'unresolved', optional: true, constrained: true }]
}
