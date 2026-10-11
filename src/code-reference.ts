import path from 'node:path'

import type { C4Kind, CodeReference } from './types.ts'

type InvalidReference = (message: string) => never

/**
 * Whether `file` is spelled as a path from the repository root: not absolute and without a `..` segment.
 * A reader joins such a path to the root, so any other spelling could open a file the repository does not hold.
 * The rule is the spelling, not where the path ends: `src/../a.ts` is refused as well.
 */
export function isRepositoryRelativePath(file: string): boolean {
  // Windows rules also count a leading `/` as absolute, so one call covers both path styles.
  return !path.win32.isAbsolute(file) && !file.split(/[\\/]/).includes('..')
}

function requiredString(
  record: Record<string, unknown>,
  field: 'scanner' | 'file',
  index: number,
  invalid: InvalidReference,
): string {
  const value = record[field]
  if (typeof value !== 'string' || value.length === 0) {
    invalid(`code[${index}] requires ${field}`)
  }
  return value as string
}

function referenceOf(
  value: unknown,
  index: number,
  invalid: InvalidReference,
): CodeReference {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    invalid(`code[${index}] must be a mapping`)
  }
  const record = value as Record<string, unknown>
  const unknownFields = Object.keys(record).filter(field => {
    return !['scanner', 'file', 'symbol'].includes(field)
  })
  if (unknownFields.length > 0) {
    invalid(`code[${index}] has unsupported field(s): ${unknownFields.join(', ')}`)
  }
  if (record.symbol !== undefined && typeof record.symbol !== 'string') {
    invalid(`code[${index}] symbol must be a string`)
  }
  const scanner = requiredString(record, 'scanner', index, invalid)
  const file = requiredString(record, 'file', index, invalid)
  if (!isRepositoryRelativePath(file)) invalid(`code[${index}] file must be a repository-relative path without a ".." segment`)
  return {
    scanner,
    file,
    ...(typeof record.symbol === 'string' ? { symbol: record.symbol } : {}),
  }
}

export function codeReferencesOf(
  code: unknown,
  kind: C4Kind,
  invalid: InvalidReference,
): CodeReference[] {
  if (code === undefined) return []
  if (kind !== 'component') invalid('only a component can declare code')
  if (!Array.isArray(code)) invalid('code must be a list')
  return (code as unknown[]).map((reference, index) => referenceOf(reference, index, invalid))
}
