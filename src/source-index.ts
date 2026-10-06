/** Exact source ownership from the filesystem delivery's repository-relative code references. */
interface SourceElement {
  id: string
  code: readonly { file: string }[]
}

interface SourceIndex<T> {
  /** File to element ID, shared with scanner evidence analysis. */
  byFile: ReadonlyMap<string, string>
  owner(file: string): T | undefined
  resolve(reference: string): T | undefined
}

const indices = new WeakMap<readonly SourceElement[], SourceIndex<SourceElement>>()

/**
 * One derived index per loaded elements snapshot, released with that snapshot.
 * Ownership changes replace the elements array; task-only updates reuse it.
 * Mutable scanner reconciliation owns its separate map. No IO or path normalization belongs here.
 */
export function sourceIndex<T extends SourceElement>(elements: readonly T[]): Readonly<SourceIndex<T>> {
  const existing = indices.get(elements)
  // The array identity also fixes the element type stored in this index.
  if (existing) return existing as SourceIndex<T>
  const byId = new Map(elements.map(element => [element.id, element]))
  const byFile = new Map<string, string>()
  for (const element of elements) {
    for (const reference of element.code) {
      const owner = byFile.get(reference.file)
      if (owner !== undefined && owner !== element.id) throw new Error(`source file "${reference.file}" has more than one owner`)
      byFile.set(reference.file, element.id)
    }
  }
  const owner = (file: string): T | undefined => {
    const id = byFile.get(file)
    return id === undefined ? undefined : byId.get(id)
  }
  const index: SourceIndex<T> = { byFile, owner, resolve: reference => byId.get(reference) ?? owner(reference) }
  indices.set(elements, index)
  return index
}
