import { changedEdit, type EditValues } from '../../../authoring-conflict.ts'
import { carriedTags, knownTags } from '../../../tags.ts'
import type { AnnotatedGroup, ArchitectureFlow, ArchitectureGraph } from '../../../types.ts'
import { tagChanges, type TagsField } from '../tags/tags-field.ts'
import { colorChoices } from './color-swatches.ts'
import { iconChoices } from './icon-picker.ts'
import { isTagsField, type ValueField, type WriteEntry } from './write-view.ts'
import type { ComponentWrites, FlowWrites, GroupWrites, MeaningEdit, PaneWrites } from './writes.ts'

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

/** Adds a virtual component inside the container whose pane is open. Once it is stored the pane shows the new component. */
export function addComponentEntry(add: NonNullable<PaneWrites['onAddComponent']>): WriteEntry {
  return {
    label: 'Add component',
    view: {
      approveLabel: 'Add',
      fields: [
        { name: 'name', label: 'Name', value: '', required: true },
        { name: 'description', label: 'Description', value: '' },
        { name: 'overview', label: 'Overview', value: '', required: true, multiline: true },
      ],
      write: ({ name = '', description, overview = '' }) => add({ name, description: description || undefined, overview }),
    },
  }
}

/** Accept: a matched ghost or a draft relationship becomes stable through the same accept input as the CLI. */
export function acceptEntry(title: string, accept: () => Promise<void>): WriteEntry {
  return { label: 'Accept', view: { approveLabel: 'Accept', fields: [], question: `Accept ${title}?`, write: accept } }
}

/**
 * Remove: takes the record out of the architecture. `whatStays` is said after the question where a person
 * could fear losing more than the record, as with the components of a group.
 */
export function removeEntry(title: string, remove: () => Promise<void>, whatStays?: string): WriteEntry {
  const question = whatStays === undefined ? `Remove ${title}?` : `Remove ${title}? ${whatStays}`
  return { label: 'Remove', view: { approveLabel: 'Remove', fields: [], question, write: remove } }
}

/** The wording and tag fields that both a group and a flow accept. */
type WordingField = (ValueField & { name: 'title' | 'description' | 'overview' }) | TagsField

/**
 * The fields a group and a flow share, in the order their Edit views show them: wording, then tags.
 * A new editable field of both is one entry here.
 */
function wordingAndTagFields(
  record: AnnotatedGroup | ArchitectureFlow, world: ArchitectureGraph, { overviewRequired }: { overviewRequired: boolean },
): WordingField[] {
  return [
    { name: 'title', label: 'Title', value: record.title, required: true },
    { name: 'description', label: 'Description', value: record.description ?? '' },
    { name: 'overview', label: 'Overview', value: record.overview, multiline: true, required: overviewRequired },
    { label: 'Tags', carried: carriedTags([record]), recordCount: 1, suggestions: knownTags(world) },
  ]
}

/** A shared empty value selects "none". Different values leave every radio button unchecked. */
function sharedChoice(values: readonly (string | undefined)[]): string | undefined {
  const first = values[0] ?? ''
  return values.every(value => (value ?? '') === first) ? first : undefined
}

/** Color and Icon for a group or one or more elements. Each field opens with the value the records share. */
export function colorAndIconFields(records: readonly { color?: string; icon?: string }[]): EditField[] {
  return [
    { name: 'color', label: 'Color', value: sharedChoice(records.map(record => record.color)), choices: colorChoices() },
    { name: 'icon', label: 'Icon', value: sharedChoice(records.map(record => record.icon)), choices: iconChoices() },
  ]
}

/** Edit of a group's wording, tags and appearance. Remove above the fields deletes the group and leaves its members. */
export function groupEditEntry(group: AnnotatedGroup, world: ArchitectureGraph, writes: GroupWrites): WriteEntry {
  const others = writes.onRemove === undefined ? [] : [removeEntry(group.title, writes.onRemove, 'Its components stay.')]
  const fields = [...wordingAndTagFields(group, world, { overviewRequired: false }), ...colorAndIconFields([group])]
  return editEntry(fields, writes.onEdit, others)
}

/** Edit of a flow: its wording and tags. A flow cannot lose its overview. */
export function flowEditEntry(flow: ArchitectureFlow, world: ArchitectureGraph, writes: FlowWrites): WriteEntry {
  return editEntry(wordingAndTagFields(flow, world, { overviewRequired: true }), writes.onEdit)
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
