import { changedEdit, type EditValues } from '../../../authoring-conflict.ts'
import type { WriteEntry, WriteField } from './write-view.ts'
import type { SelectionWrites } from './writes.ts'

/*
 * Every write a pane of the web map offers, one function each. A function only describes its write: the
 * label of its entry, the verb that approves it, what it asks for, and the writer it calls. `write-view.ts`
 * paints every one of them the same way. A new write is one more function here, added to the entries of
 * the pane or of the Edit view that offers it.
 */

/** One field of a record's Edit form. Its name is a value the edit conflict check knows, so no field escapes it. */
export type EditField = WriteField & { name: keyof EditValues }

/**
 * Edit: every field a person can set on a record, stored by Save as one `groma edit` of the fields that
 * changed. `others` are the record's other writes, offered above the fields.
 */
export function editEntry(
  fields: readonly EditField[],
  save: (changes: EditValues, original: EditValues) => Promise<void>,
  others: readonly WriteEntry[],
): WriteEntry {
  return {
    label: 'Edit',
    view: {
      verb: 'Save',
      fields,
      entries: others,
      write: async values => {
        const { original, ...changes } = changedEdit(
          Object.fromEntries(fields.map(field => [field.name, field.value])),
          Object.fromEntries(fields.map(field => [field.name, values[field.name] ?? ''])),
        )
        if (Object.keys(changes).length > 0) await save(changes, original)
      },
    },
  }
}

/** Accept: a matched ghost or a draft relationship becomes stable through the same accept input as the CLI. */
export function acceptEntry(title: string, accept: () => Promise<void>): WriteEntry {
  return { label: 'Accept', view: { verb: 'Accept', fields: [], question: `Accept ${title}?`, write: accept } }
}

/** Remove: takes the record out of the architecture. */
export function removeEntry(title: string, remove: () => Promise<void>): WriteEntry {
  return { label: 'Remove', view: { verb: 'Remove', fields: [], question: `Remove ${title}?`, write: remove } }
}

/** Group: names several selected components as one group. */
export function groupEntry(group: SelectionWrites['onGroup']): WriteEntry {
  return {
    label: 'Group',
    hint: 'Name these components as one group',
    view: {
      verb: 'Group',
      fields: [{ name: 'name', label: 'Group name', value: '', required: true }],
      write: values => group(values.name ?? ''),
    },
  }
}

/** Combine: folds several selected components into the one the person picks. */
export function combineEntry(members: SelectionWrites['members'], combine: SelectionWrites['onCombine']): WriteEntry {
  return {
    label: 'Combine',
    hint: 'Fold these components into one of them',
    view: {
      verb: 'Combine',
      fields: [{ name: 'survivor', label: 'Combine into', value: members[0]?.id ?? '', options: members }],
      write: values => combine(values.survivor ?? ''),
    },
  }
}
