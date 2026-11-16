import { changedEdit, type EditValues } from '../../../authoring-conflict.ts'
import { choiceField, type Choice } from './choice-field.ts'
import { tagsField } from './tags-field.ts'

export const editableCss = `
  /* A write entry is a button of a reading pane that opens a view where the person can write. */
  #details .write-entry, #details .edit-form button { border: 1px solid var(--hairline); border-radius: 6px;
    padding: 6px 12px; background: transparent; color: var(--ink); font: inherit; cursor: pointer; }
  #details .edit-entry { position: absolute; top: 12px; right: 92px; height: 32px; }
  #details:has(.edit-entry) > .meta { padding-right: 140px; }
  #details .write-entry:hover, #details .edit-form button:hover { background: var(--hover); }
  #details .edit-form { display: grid; gap: 14px; }
  #details .edit-form label { display: grid; gap: 5px; font-size: 12px; }
  #details .edit-form input, #details .edit-form textarea, #details .edit-form select {
    box-sizing: border-box; width: 100%; border: 1px solid var(--hairline); border-radius: 4px; padding: 7px;
    color: var(--ink); background: color-mix(in srgb, var(--paper) 35%, transparent); font: inherit;
  }
  #details .edit-form textarea { min-height: 140px; resize: vertical; }
  #details .edit-form :is(input, textarea, select):focus { outline: 2px solid var(--highlight); }
  /* Save and Cancel stay at the bottom of the pane, across its padding, while a taller form scrolls under them. */
  #details .edit-form .actions {
    position: sticky; bottom: -22px; display: flex; justify-content: flex-end; gap: 8px;
    margin: 12px -24px -22px; padding: 12px 24px 14px;
    border-top: 1px solid var(--hairline); background: var(--chrome-surface); backdrop-filter: blur(14px);
  }
  /* Without fields there is nothing to scroll under the bar: Cancel stands plainly under the commands. */
  #details .edit-form.no-fields .actions { position: static; margin: 0; padding: 0; border-top: 0; background: none; backdrop-filter: none; }
  /* An Edit view stacks its commands, the line that reports on them, and its fields. */
  #details .edit-view { display: grid; gap: 14px; outline: none; }
  /* While Save or a command writes, the view waits: its fields and commands are inert and dimmed. */
  #details .edit-view > * { transition: opacity 160ms ease; }
  #details .edit-view[data-writing] > * { opacity: 0.5; }
  #details .edit-view .error { margin: 0; color: var(--highlight-text); }
  #details .edit-view .error:empty { display: none; }
`

export function message(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause)
}

/** One field of an edit form. Its name is a value the edit conflict check knows, so no form field escapes it. */
export interface EditField {
  name: keyof EditValues
  label: string
  value: string
  multiline?: boolean
  required?: boolean
  options?: readonly { id: string; title: string }[]
  /** Makes this a tags field: the tags already in use, offered while a tag is typed. */
  suggestions?: readonly string[]
  /** Makes this a choice field: the fixed set its value is picked from. */
  choices?: readonly Choice[]
}

/** What the Edit view of one selection holds. */
export interface EditView {
  /**
   * The record's fields, and the writer Save calls with the changed ones. Left out by a view that holds
   * only a command, as the views of several selected components do.
   */
  form?: {
    fields: EditField[]
    save: (changes: Record<string, string>, original: EditValues) => Promise<void>
  }
  /**
   * Paints the commands above the fields: the writes that are not field changes. The controls are in
   * `commands.ts`; each one takes `run` and hands its write to it.
   */
  paintCommands: (box: HTMLElement, run: RunCommand) => void
}

/**
 * Runs one command of an Edit view. A command acts on the saved record, so `run` refuses while the form
 * holds unsaved changes. Otherwise it writes once and returns the pane to reading. It never rejects: the
 * view shows a refusal or a failed write itself.
 */
export type RunCommand = (write: () => Promise<void>) => Promise<void>

/** A repaint of the same selection keeps its open Edit view. Another selection replaces it. */
export function isEditing(host: HTMLElement, key: string): boolean {
  return host.querySelector<HTMLElement>('.edit-view')?.dataset.editKey === key
}

/** The event an Edit view sends up the pane right after Save stored its form, before the view closes. */
export const EDIT_SAVED = 'edit-saved'

/** The key of the open Edit view and the values its form holds, saved or not. Undefined while the pane is reading. */
export function pendingEdit(host: HTMLElement): { key: string; values: Record<string, string> } | undefined {
  const form = host.querySelector<HTMLFormElement>('.edit-form')
  const key = form?.closest<HTMLElement>('[data-edit-key]')?.dataset.editKey
  if (form === null || key === undefined) return undefined
  return { key, values: Object.fromEntries([...new FormData(form)].map(([name, value]) => [name, String(value)])) }
}

/**
 * The Edit button of a record's pane: the only control of that pane that leads to writing. It switches the
 * pane from reading to the record's Edit view.
 */
export function editButton(host: HTMLElement, key: string, view: EditView, read: () => void): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = 'Edit'
  button.className = 'write-entry edit-entry'
  button.addEventListener('click', () => openEditView(host, key, view, read))
  return button
}

function errorLine(): HTMLElement {
  const line = document.createElement('p')
  line.className = 'error'
  line.setAttribute('role', 'status')
  return line
}

/**
 * Lets the writes of one Edit view run one at a time. `run` starts a write unless another is still in
 * flight, and tells `onWriting` when writing starts and when it settles. It resolves to `'ignored'` for a
 * write that did not start and to `'done'` after one that succeeded, and rejects with a failed write's error.
 */
export function oneWriteAtATime(onWriting: (writing: boolean) => void) {
  let writing = false
  return {
    get writing(): boolean { return writing },
    async run(write: () => Promise<void>): Promise<'done' | 'ignored'> {
      if (writing) return 'ignored'
      writing = true
      onWriting(true)
      try {
        await write()
        return 'done'
      } finally {
        writing = false
        onWriting(false)
      }
    },
  }
}

/**
 * Opens one explicit edit session, the only place the web map changes the architecture from a pane. Its
 * commands stand above its fields. Picking and typing store nothing: only Save and a command call a
 * writer, and Cancel and Escape leave saved data alone. A pane opens it from a write entry: Edit on a
 * record, or the button of one command on several selected components.
 */
export function openEditView(host: HTMLElement, key: string, { form: edited, paintCommands }: EditView, read: () => void): void {
  const fields = edited?.fields ?? []
  const view = document.createElement('div')
  view.className = 'edit-view'
  view.dataset.editKey = key
  // Focusable, so the view can hold the focus, and with it Escape, while a write is in flight.
  view.tabIndex = -1
  const commands = document.createElement('div')
  commands.className = 'commands'
  const commandError = errorLine()
  const form = document.createElement('form')
  form.className = 'edit-form'
  // Without fields there is nothing to save: the form only holds Cancel.
  form.classList.toggle('no-fields', fields.length === 0)
  for (const field of fields) form.append(editField(field))
  const saveError = errorLine()
  const actions = document.createElement('div')
  actions.className = 'actions'
  const cancel = document.createElement('button')
  cancel.type = 'button'
  cancel.textContent = 'Cancel'
  const submit = document.createElement('button')
  submit.type = 'submit'
  submit.textContent = 'Save'
  submit.hidden = fields.length === 0
  actions.append(cancel, submit)
  form.append(saveError, actions)
  view.append(commands, commandError, form)

  const close = (): void => { view.remove(); read() }
  /** The fields whose value in the form differs from the saved one, with the saved values as `original`. */
  const changedFields = (): { changes: EditValues; original: EditValues } => {
    const values = new FormData(form)
    const { original, ...changes } = changedEdit(
      Object.fromEntries(fields.map(field => [field.name, field.value])),
      Object.fromEntries(fields.map(field => [field.name, String(values.get(field.name) ?? '')])),
    )
    return { changes, original }
  }
  const hasChanges = (): boolean => Object.keys(changedFields().changes).length > 0

  /**
   * Save and the commands write through this one guard. While one of them writes, the fields and the
   * commands are inert and the view holds the focus: nothing else starts, nothing typed is lost, and
   * Cancel and Escape wait.
   */
  const writes = oneWriteAtATime(writing => {
    view.toggleAttribute('data-writing', writing)
    commands.inert = form.inert = writing
    if (writing) view.focus()
  })
  /** Runs one write and closes the view. A failed write leaves the view as it was, with its message in `report`. */
  const write = async (report: HTMLElement, action: () => Promise<void>): Promise<void> => {
    const focused = document.activeElement
    report.textContent = ''
    try {
      if (await writes.run(action) === 'done') close()
    } catch (cause) {
      report.textContent = message(cause)
      if (focused instanceof HTMLElement) focused.focus()
    }
  }

  paintCommands(commands, async command => {
    if (hasChanges()) { commandError.textContent = 'Save or cancel your changes first.'; return }
    await write(commandError, command)
  })

  cancel.addEventListener('click', close)
  view.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return
    event.preventDefault()
    event.stopPropagation()
    if (!writes.writing) close()
  })
  form.addEventListener('submit', async event => {
    event.preventDefault()
    if (edited === undefined || !hasChanges()) { close(); return }
    const { changes, original } = changedFields()
    await write(saveError, async () => {
      await edited.save(changes, original)
      // Says on the pane that the form's values are now stored, while the form can still be read.
      view.dispatchEvent(new CustomEvent(EDIT_SAVED, { bubbles: true }))
    })
  })
  host.querySelector('.tabs')!.replaceChildren()
  host.querySelector('.body')!.replaceChildren(view)
  view.querySelector<HTMLElement>('input, textarea, select')?.focus()
}

function editField(field: EditField): HTMLElement {
  if (field.suggestions !== undefined) return tagsField(field.name, field.label, field.value, field.suggestions)
  if (field.choices !== undefined) return choiceField(field.name, field.label, field.value, field.choices)
  const label = document.createElement('label')
  label.textContent = field.label
  const input = field.options !== undefined ? document.createElement('select')
    : field.multiline ? document.createElement('textarea') : document.createElement('input')
  if (input instanceof HTMLSelectElement) {
    for (const option of field.options ?? []) input.add(new Option(option.title, option.id))
  }
  input.name = field.name
  input.value = field.value
  input.required = field.required === true
  label.append(input)
  return label
}
