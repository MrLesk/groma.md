import path from 'node:path'
import type { ScanSourceUnit } from '@groma/scanner'
import type { FileEvidence } from './worker.ts'

/** Resolve a literal relative source URI; package URIs need a package model we do not read. */
function relativeFile(file: string, uri: string): string | undefined {
  const parsed = new URL(uri, `file:///${file}`)
  if (parsed.protocol !== 'file:' || parsed.host || parsed.search || parsed.hash || uri.startsWith('/')) return undefined
  return decodeURIComponent(parsed.pathname).slice(1)
}

function declaresLibrary(part: FileEvidence, library: FileEvidence): boolean {
  if (part.partOfUri !== null) return relativeFile(part.file, part.partOfUri) === library.file
  return part.partOfName !== null && part.partOfName === library.library
}

/** Both the library's `part` and the part's `part of` must agree; ordinary imports never group files. */
export function sourceUnits(evidence: FileEvidence[]): ScanSourceUnit[] {
  const files = new Map(evidence.map(file => [file.file, file]))
  return evidence.filter(file => !file.isPart).flatMap(library => {
    const parts = library.parts.flatMap(uri => {
      if (uri === null) return []
      const file = relativeFile(library.file, uri)
      const part = file === undefined ? undefined : files.get(path.posix.normalize(file))
      return part && declaresLibrary(part, library) ? [part.file] : []
    })
    return parts.length ? [{ primary: library.file, files: [library.file, ...new Set(parts)] }] : []
  })
}
