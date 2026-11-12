import { isReservedDocument } from './architecture-path.ts'

export function kebabCase(name: string): string {
  return name.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}\p{M}]*/gu)?.join('-') ?? ''
}

/** Architecture identities use the same Unicode word format that new names receive. */
export function isArchitectureId(id: string): boolean {
  return id !== '' && id === kebabCase(id)
}

export function displayName(kebab: string): string {
  const words = kebab.split('-').filter(Boolean)
  if (words.length === 0) return kebab
  const [first, ...rest] = words
  return [first[0].toUpperCase() + first.slice(1), ...rest].join(' ')
}

/** The text a flag must carry; a missing or blank value names the flag. */
export function requireText(value: string | undefined, flag: string): string {
  if (value === undefined || value.trim().length === 0) throw new Error(`${flag} is required`)
  return value
}

/** IDs no element may take: a reserved document name, or the word the CLI reads as a relation address. */
export function isReservedId(id: string): boolean {
  return isReservedDocument(`${id}.md`) || id === 'relation'
}
