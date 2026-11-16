import { changedEdit, type EditValues } from '../../../authoring-conflict.ts'
import { choiceField, type Choice } from './choice-field.ts'
import { tagsField } from './tags-field.ts'

export const editableCss = `
  #details .edit-entry, #details .edit-form button { border: 1px solid var(--hairline); border-radius: 6px;
    padding: 6px 12px; background: transparent; color: var(--ink); font: inherit; cursor: pointer; }
  #details .edit-entry { position: absolute; top: 12px; right: 92px; height: 32px; }
  #details:has(.edit-entry) > .meta { padding-right: 140px; }
  #details .edit-entry:hover, #details .edit-form button:hover { background: var(--hover); }
  #details .edit-form button:disabled { opacity: 0.5; cursor: default; }
  #details .edit-form { display: grid; gap: 14px; }
  #details .edit-form label { display: grid; gap: 5px; font-size: 12px; }
  #details .edit-form input, #details .edit-form textarea, #details .edit-form select {
    box-sizing: border-box; width: 100%; border: 1px solid var(--hairline); border-radius: 4px; padding: 7px;
    color: var(--ink); background: color-mix(in srgb, var(--paper) 35%, transparent); font: inherit;
  }
  #details .edit-form textarea { min-height: 140px; resize: vertical; }
  #details .edit-form :is(input, textarea, select):focus { outline: 2px solid var(--highlight); }
  #details .edit-form .actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
  #details .edit-form .error { margin: 0; color: var(--highlight-text); }
  #details .edit-form .error:empty { display: none; }
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

/** A repaint of the same selection keeps its unsaved form. Another selection replaces it. */
export function isEditing(host: HTMLElement, key: string): boolean {
  return host.querySelector<HTMLFormElement>('.edit-form')?.dataset.editKey === key
}

/** The key of the open Edit form and the values it holds, saved or not. Undefined while the pane is reading. */
export function pendingEdit(host: HTMLElement): { key: string; values: Record<string, string> } | undefined {
  const form = host.querySelector<HTMLFormElement>('.edit-form')
  const key = form?.closest<HTMLElement>('[data-edit-key]')?.dataset.editKey
  if (form === null || key === undefined) return undefined
  return { key, values: Object.fromEntries([...new FormData(form)].map(([name, value]) => [name, String(value)])) }
}

/**
 * One explicit edit session, the only place a record's fields change in the web map. Picking and typing in
 * the form store nothing: only Save calls the shared writer, and Cancel and Escape leave saved data alone.
 */
export function editButton(
  host: HTMLElement,
  key: string,
  fields: EditField[],
  save: (changes: Record<string, string>, original: EditValues) => Promise<void>,
  read: () => void,
): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = 'Edit'
  button.className = 'edit-entry'
  button.addEventListener('click', () => {
    const form = document.createElement('form')
    form.className = 'edit-form'
    form.dataset.editKey = key
    for (const field of fields) form.append(editField(field))
    const error = document.createElement('p')
    error.className = 'error'
    error.setAttribute('role', 'status')
    const actions = document.createElement('div')
    actions.className = 'actions'
    const cancel = document.createElement('button')
    cancel.type = 'button'
    cancel.textContent = 'Cancel'
    const submit = document.createElement('button')
    submit.type = 'submit'
    submit.textContent = 'Save'
    const close = (): void => { form.remove(); read() }
    cancel.addEventListener('click', close)
    form.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      if (!submit.disabled) close()
    })
    form.addEventListener('submit', async event => {
      event.preventDefault()
      const values = new FormData(form)
      const { original, ...changes } = changedEdit(
        Object.fromEntries(fields.map(field => [field.name, field.value])),
        Object.fromEntries(fields.map(field => [field.name, String(values.get(field.name) ?? '')])),
      )
      if (Object.keys(changes).length === 0) { close(); return }
      submit.disabled = cancel.disabled = true
      error.textContent = ''
      try { await save(changes, original); close() }
      catch (cause) { error.textContent = message(cause) }
      finally { submit.disabled = cancel.disabled = false }
    })
    actions.append(cancel, submit)
    form.append(error, actions)
    host.querySelector('.tabs')!.replaceChildren()
    host.querySelector('.body')!.replaceChildren(form)
    form.querySelector<HTMLElement>('input, textarea, select')?.focus()
  })
  return button
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
