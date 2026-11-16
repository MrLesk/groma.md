import { approvalBar } from '../atoms/write-form.ts'
import { choiceField, type Choice } from './choice-field.ts'
import { tagsField } from './tags-field.ts'

/*
 * The one way a pane of the web map writes. A reading pane offers each write as a write entry: a button
 * that opens the write's view and stores nothing. The view shows what the write needs, then the approval
 * bar the whole web map shares (`atoms/write-form.ts`): Cancel and the approving button. Only that
 * button writes. Every write of a pane is described as data (`commands.ts`) and painted here, so no write
 * has a layout or an approval step of its own. A pane's code can only hand its entries to
 * `paintWriteEntries`: it cannot open a view or build one itself.
 */

export const writeViewCss = `
  /* A write entry is a button that opens a write view. It looks like the buttons of the approval bar. */
  #details .write-entry {
    border: 1px solid var(--hairline); border-radius: 6px; padding: 6px 12px;
    background: transparent; color: var(--ink); white-space: nowrap; transition: background 160ms ease;
  }
  #details .write-entry:hover { background: var(--hover); }
  #details .write-entries { display: flex; flex-wrap: wrap; gap: 8px; }
  /* The entries of a reading pane stand in its header, before the pane's own controls. */
  #details .write-entries.of-pane { position: absolute; top: 12px; right: 92px; }
  #details .write-entries.of-pane .write-entry { height: 32px; padding-block: 0; }
  /* The line above the title keeps clear of them: of one entry, or of two. */
  #details:has(.write-entries.of-pane) > .meta { padding-right: 140px; }
  #details:has(.write-entries.of-pane > :nth-child(2)) > .meta { padding-right: 250px; }

  /*
   * An open write view fills the pane in three parts: the pane's header, the fields, and the approval bar.
   * Only the fields scroll, between the other two. The pane itself does not scroll then, so it keeps no
   * room for a scrollbar and the bar runs from one edge of the pane to the other. That room
   * (--details-gutter, measured by the shell) becomes padding, so nothing in the header moves.
   */
  #details:has(.write-view) {
    display: flex; flex-direction: column; overflow: hidden; scrollbar-gutter: auto;
    padding-right: calc(24px + var(--details-gutter, 0px));
  }
  #details:has(.write-view) > :is(.meta, h1) { flex-shrink: 0; }
  #details:has(.write-view) > .body, #details .write-view, #details .write-form {
    flex: 1 1 0; min-height: 0; display: flex; flex-direction: column;
  }
  #details .write-view { gap: 14px; outline: none; }
  /*
   * The fields scroll in this box. It reaches the pane's right edge, so its scrollbar stands where the
   * pane's own would, and it leaves a little room around the fields for their focus rings.
   */
  #details .write-fields {
    flex: 1 1 0; min-height: 0; display: flex; flex-direction: column; gap: 14px;
    overflow: hidden auto; scrollbar-gutter: stable;
    margin: -2px calc(-24px - var(--details-gutter, 0px)) 0 -4px; padding: 2px 24px 16px 4px;
  }
  #details .write-fields > * { flex-shrink: 0; }
  /* A pane has the room for a long text, so its text area starts taller and can be dragged taller still. */
  #details .write-form textarea { height: auto; min-height: 140px; resize: vertical; }
  #details .write-view .question { margin: 0; line-height: 1.5; overflow-wrap: anywhere; }
  /* The line under the record's other writes, for one that cannot open yet. */
  #details .write-view > .error { margin: 0; color: var(--highlight-text); }
  #details .write-view > .error:empty { display: none; }
  /* In a pane the approval bar is the pane's footer: it spans the pane from edge to edge, across its padding. */
  #details .approval-bar {
    flex: none; margin: 0 calc(-24px - var(--details-gutter, 0px)) -22px -24px;
    padding: 12px calc(24px + var(--details-gutter, 0px)) 14px 24px;
    border-top: 1px solid var(--hairline); background: color-mix(in srgb, var(--paper) 94%, transparent);
  }
  /* While the write is in flight the record's other writes wait with the form. */
  #details .write-view .write-entries { transition: opacity 160ms ease; }
  #details .write-view .write-entries[inert] { opacity: 0.5; }
  @media (prefers-reduced-motion: reduce) {
    #details .write-entry, #details .write-view .write-entries { transition: none; }
  }
`

/** One thing a write view asks the person for. Its kind follows from which optional part it carries. */
export interface WriteField {
  /** The key of this field's value in what `WriteView.write` receives. */
  name: string
  label: string
  /** The value the field starts with. */
  value: string
  multiline?: boolean
  required?: boolean
  /** Makes this a select: the records its value is picked from. */
  options?: readonly { id: string; title: string }[]
  /** Makes this a tags field: the tags already in use, offered while a tag is typed. */
  suggestions?: readonly string[]
  /** Makes this a choice field: the fixed set its value is picked from. */
  choices?: readonly Choice[]
}

/** One write a pane offers: what it asks the person for, and the button that approves it. */
export interface WriteView {
  /**
   * What the button that approves the write says: Save, unless another word tells better what happens
   * (Accept, Remove, Create group). No other control of the view writes.
   */
  approveLabel: string
  /** What the write needs from the person, in the order shown. A write that needs nothing has none. */
  fields: readonly WriteField[]
  /** What a write without fields is about to do, shown where the fields would be: "Remove Billing?". */
  question?: string
  /** Stores the write. Called once the approving button is pressed, with the value of every field by name. */
  write: (values: Record<string, string>) => Promise<void>
  /** The other writes of the same record, offered above the fields. Each opens its own view in place of this one. */
  entries?: readonly WriteEntry[]
}

/** A button that opens a write view and stores nothing itself. */
export interface WriteEntry {
  label: string
  /** Shown on hover, for a label that needs a few more words. */
  hint?: string
  view: WriteView
}

/** A repaint of the same selection keeps its open write view. Another selection replaces it. */
export function isWriteViewOpen(host: HTMLElement, key: string): boolean {
  return host.querySelector<HTMLElement>('.write-view')?.dataset.writeKey === key
}

/** The event a write view sends up the pane right after its write was stored, before the view closes. */
export const WRITE_STORED = 'write-stored'

/** The key of the open write view and the values its fields hold, stored or not. Undefined while the pane is reading. */
export function pendingValues(host: HTMLElement): { key: string; values: Record<string, string> } | undefined {
  const form = host.querySelector<HTMLFormElement>('.write-form')
  const key = form?.closest<HTMLElement>('[data-write-key]')?.dataset.writeKey
  if (form === null || key === undefined) return undefined
  return { key, values: formValues(form) }
}

function formValues(form: HTMLFormElement): Record<string, string> {
  return Object.fromEntries([...new FormData(form)].map(([name, value]) => [name, String(value)]))
}

/** The buttons for `entries`. A click opens that entry's view unless `refusal` returns why it cannot open now. */
function entryRow(
  host: HTMLElement, key: string, entries: readonly WriteEntry[], read: () => void, refusal: () => string | undefined,
): { row: HTMLElement; error: HTMLElement } {
  const row = document.createElement('div')
  row.className = 'write-entries'
  const error = errorLine()
  for (const entry of entries) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'write-entry'
    button.textContent = entry.label
    if (entry.hint !== undefined) button.title = entry.hint
    button.addEventListener('click', () => {
      const refused = refusal()
      if (refused === undefined) openWriteView(host, key, entry.view, read)
      else error.textContent = refused
    })
    row.append(button)
  }
  return { row, error }
}

/**
 * Paints the write entries of a reading pane in the pane's header: Edit for a record, Group and Combine
 * for several selected components. They are the pane's only controls that lead to writing. `key` names
 * what the pane shows, and `read` paints the pane's reading view again once a view closes.
 */
export function paintWriteEntries(host: HTMLElement, key: string, entries: readonly WriteEntry[], read: () => void): void {
  const { row } = entryRow(host, key, entries, read, () => undefined)
  row.classList.add('of-pane')
  // First in the body, so the keyboard reaches the entries before what the pane reads.
  host.querySelector('.body')!.prepend(row)
}

function errorLine(): HTMLElement {
  const line = document.createElement('p')
  line.className = 'error'
  line.setAttribute('role', 'status')
  return line
}

/**
 * Switches the pane from reading to one write view, the only place a pane changes the architecture.
 * From top to bottom the view holds the record's other writes, the fields or the question, and the
 * approval bar as the pane's footer. Picking and typing store nothing. The approving button calls `write` once and returns
 * the pane to reading; a failed write leaves the view as it was, with the failure's message in the bar.
 * Cancel and Escape return to reading without writing.
 */
function openWriteView(host: HTMLElement, key: string, { approveLabel, fields, question, write, entries = [] }: WriteView, read: () => void): void {
  const view = document.createElement('div')
  view.className = 'write-view'
  view.dataset.writeKey = key
  // Focusable, so it can hold the focus while its form is inert.
  view.tabIndex = -1
  const form = document.createElement('form')
  form.className = 'write-form'
  // The fields scroll in their own box, so the approval bar under them stays in place as the pane's footer.
  const fieldsBox = document.createElement('div')
  fieldsBox.className = 'write-fields'
  if (question !== undefined) {
    const line = document.createElement('p')
    line.className = 'question'
    line.textContent = question
    fieldsBox.append(line)
  }
  for (const field of fields) fieldsBox.append(fieldControl(field))
  form.append(fieldsBox)
  /**
   * What the fields hold as the view opens. The record's other writes act on the stored record, so their
   * entries open only while the fields still hold this.
   */
  const opened = JSON.stringify(formValues(form))
  const others = entryRow(host, key, entries, read,
    () => JSON.stringify(formValues(form)) === opened ? undefined : `${approveLabel} or cancel your changes first.`)
  if (entries.length > 0) view.append(others.row, others.error)
  view.append(form)

  // While the write is in flight the record's other writes wait too, and the view holds the focus, and with it Escape.
  const approval = approvalBar(approveLabel, writing => {
    others.row.inert = writing
    if (writing) view.focus()
  })
  form.append(approval.bar)

  const close = (): void => { view.remove(); read() }
  approval.cancel.addEventListener('click', close)
  view.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return
    event.preventDefault()
    event.stopPropagation()
    if (!approval.writing) close()
  })
  form.addEventListener('submit', async event => {
    event.preventDefault()
    others.error.textContent = ''
    const outcome = await approval.approve(async () => {
      await write(formValues(form))
      // Says on the pane that the view's values are now stored, while they can still be read from it.
      view.dispatchEvent(new CustomEvent(WRITE_STORED, { bubbles: true }))
    })
    if (outcome === 'stored') close()
  })

  host.querySelector('.tabs')!.replaceChildren()
  host.querySelector('.body')!.replaceChildren(view)
  // The first field takes the focus. A write without fields puts it on the approving button, so Enter approves.
  ;(view.querySelector<HTMLElement>('.write-form :is(input:not([type="hidden"]), textarea, select)') ?? approval.approveButton).focus()
}

function fieldControl(field: WriteField): HTMLElement {
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
