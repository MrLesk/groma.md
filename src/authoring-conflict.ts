/** Values from the start of a web edit session. CLI commands overwrite the latest fields. */
export type EditValues = Partial<Record<'title' | 'description' | 'overview' | 'technology' | 'criticality' | 'parent', string>>

/** Both web forms send only changed fields, each paired with its value when editing began. */
export function changedEdit(original: EditValues, values: EditValues): EditValues & { original: EditValues } {
  const changed = (Object.keys(values) as (keyof EditValues)[]).filter(field => values[field] !== original[field])
  return {
    ...Object.fromEntries(changed.map(field => [field, values[field]])),
    original: Object.fromEntries(changed.map(field => [field, original[field] ?? ''])),
  }
}

export interface FieldConflict {
  field: string
  original: string
  current: string
  proposed: string
}

export class EditConflict extends Error {
  readonly code = 'edit_conflict'
  readonly conflicts: FieldConflict[]

  constructor(conflicts: FieldConflict[]) {
    super(conflicts.map(({ field, original, current, proposed }) =>
      `${field} changed: original ${JSON.stringify(original)}, current ${JSON.stringify(current)}, proposed ${JSON.stringify(proposed)}.`).join('\n'))
    this.conflicts = conflicts
  }
}

/** Check all changed fields before writing any. Unrelated changes and an already-applied value are safe. */
export function checkEdit(original: EditValues | undefined, current: EditValues, proposed: EditValues): void {
  if (original === undefined) return
  const conflicts: FieldConflict[] = []
  for (const field of Object.keys(original) as (keyof EditValues)[]) {
    const before = original[field]
    const next = proposed[field]
    if (typeof before !== 'string' || typeof next !== 'string') throw new Error(`Invalid original value for ${field}`)
    const now = current[field] ?? ''
    // Overview writers trim surrounding whitespace; other field text is preserved.
    const saved = field === 'overview' ? next.trim() : next
    if (now !== before && now !== saved) conflicts.push({ field, original: before, current: now, proposed: next })
  }
  if (conflicts.length) throw new EditConflict(conflicts)
}
