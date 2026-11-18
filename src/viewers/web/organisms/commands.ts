import { changedEdit, type EditValues } from '../../../authoring-conflict.ts'
import { tagChanges, type TagsField } from '../tags/tags-field.ts'
import { isTagsField, type ValueField, type WriteEntry } from './write-view.ts'
import type { ComponentWrites, MeaningEdit } from './writes.ts'

/*
 * Every write a pane of the web map offers, one function each. A function only describes its write: the
 * label of its entry, what the button that approves it says, what it asks for, and the writer it calls.
 * `write-view.ts` paints every one of them the same way. A new write is one more function here, added to
 * the entries of the pane or of the Edit view that offers it.
 */

/** Edit checks named values against their opening values. The Tags field supplies its own changes. */
export type EditField = (ValueField & { name: keyof EditValues }) | TagsField

/** Collect the changed values and their originals. Tag additions and removals need no opening values. */
function editChanges(
  fields: readonly EditField[], values: Record<string, string>,
): { changes: MeaningEdit; original: EditValues } {
  const opening: EditValues = {}
  const picked: EditValues = {}
  for (const field of fields) {
    if (isTagsField(field)) continue
    // A choice field nobody picked in has no value: its records differ (mixed) and stay as they are.
    // Do not default it to '': an empty value clears the field on every record.
    if (values[field.name] === undefined) continue
    opening[field.name] = field.value
    picked[field.name] = values[field.name]
  }
  const { original, ...changedValues } = changedEdit(opening, picked)
  const changes = { ...changedValues, ...tagChanges(values) }
  return { changes, original }
}

/**
 * Edit stores the changed fields of one record or several selected elements in one write.
 * A single record can offer its other writes above the fields.
 */
export function editEntry(
  fields: readonly EditField[],
  save: (changes: MeaningEdit, original: EditValues) => Promise<void>,
  others: readonly WriteEntry[] = [],
): WriteEntry {
  return {
    label: 'Edit',
    view: {
      approveLabel: 'Save',
      fields,
      entries: others,
      write: async values => {
        const { changes, original } = editChanges(fields, values)
        if (Object.keys(changes).length > 0) await save(changes, original)
      },
    },
  }
}

/** Accept: a matched ghost or a draft relationship becomes stable through the same accept input as the CLI. */
export function acceptEntry(title: string, accept: () => Promise<void>): WriteEntry {
  return { label: 'Accept', view: { approveLabel: 'Accept', fields: [], question: `Accept ${title}?`, write: accept } }
}

/** Remove: takes the record out of the architecture. */
export function removeEntry(title: string, remove: () => Promise<void>): WriteEntry {
  return { label: 'Remove', view: { approveLabel: 'Remove', fields: [], question: `Remove ${title}?`, write: remove } }
}

/** Group: names several selected components as one group. */
export function groupEntry(group: ComponentWrites['onGroup']): WriteEntry {
  return {
    label: 'Group',
    hint: 'Name these components as one group',
    view: {
      approveLabel: 'Create group',
      fields: [{ name: 'name', label: 'Group name', value: '', required: true }],
      write: values => group(values.name ?? ''),
    },
  }
}

/** Combine: folds several selected components into the one the person picks. */
export function combineEntry(members: readonly { id: string; title: string }[], combine: ComponentWrites['onCombine']): WriteEntry {
  return {
    label: 'Combine',
    hint: 'Fold these components into one of them',
    view: {
      approveLabel: 'Combine',
      fields: [{ name: 'survivor', label: 'Combine into', value: members[0]?.id ?? '', options: members }],
      write: values => combine(values.survivor ?? ''),
    },
  }
}
