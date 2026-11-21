/** One choice of a choice field. */
export interface Choice {
  /** The value the form sends; '' is the choice that clears the field. */
  value: string
  label: string
  /** The look of the choice in a row of choices. The clearing choice of a long field is a word and needs none. */
  className: string
  /** The heading the choice is listed under. Choices with headings make a long field: see choiceField. */
  heading?: string
  /** Fills the choice with what it looks like. */
  paint(choice: HTMLElement): void
}

/**
 * A field of an edit form whose value is picked from a fixed set, such as a color. Every choice is a radio
 * button named `name`, so the form sends the pick when Save is pressed. Picking stores nothing. The title
 * names the pick beside the field's label.
 *
 * Choices that name a heading make a long field, such as the icons. A long field starts with a switch of two
 * parts: the choice that clears the field ("No icon") and the list ("Icon"). The list stands under a box that
 * filters it, and both show only while Icon is on, so the form stays short until the person asks for the list.
 * For records that differ neither part is on. A long field needs the clearing choice, and each of its other
 * choices needs a heading.
 */
export function choiceField(name: string, label: string, value: string | undefined, choices: readonly Choice[]): HTMLElement {
  const field = document.createElement('div')
  field.className = 'choice-field'
  field.setAttribute('role', 'radiogroup')
  field.setAttribute('aria-label', label)
  const title = document.createElement('span')
  title.className = 'field-title'
  title.textContent = label
  const pick = document.createElement('span')
  pick.className = 'pick'
  title.append(pick)
  field.append(title)
  const listed = choices.filter(choice => choice.heading !== undefined)
  if (listed.length === 0) {
    appendRows(field, name, choices, value)
  } else {
    const list = document.createElement('div')
    list.className = 'choice-list'
    list.append(filterBox(list, label))
    appendRows(list, name, listed, value)
    field.append(listSwitch(name, label, choices.find(choice => choice.value === '')!, value, list), list)
  }
  const namePick = (): void => { pick.textContent = pickedLabel(field, value) }
  field.addEventListener('change', namePick)
  namePick()
  return field
}

/**
 * What the title says about the pick: its label, and nothing for the choice that clears the field. While
 * nothing is picked it says "mixed" for records that differ (they have no shared `value`) and nothing for a
 * record whose list was turned on without a pick yet.
 */
function pickedLabel(field: HTMLElement, value: string | undefined): string {
  const picked = field.querySelector<HTMLInputElement>('input[type="radio"]:checked')
  if (picked === null) return value === undefined ? 'mixed' : ''
  return picked.value === '' ? '' : picked.getAttribute('aria-label')!
}

/** Adds the choices to `host`: one row per heading, in the order the headings first appear. The choices without a heading share one row. */
function appendRows(host: HTMLElement, name: string, choices: readonly Choice[], value: string | undefined): void {
  const rows = new Map<string | undefined, HTMLElement>()
  for (const choice of choices) {
    if (!rows.has(choice.heading)) rows.set(choice.heading, choiceRow(host, choice.heading))
    rows.get(choice.heading)!.append(choiceOption(name, choice, value))
  }
}

/** Adds a section to `host`, a row of choices under its heading when it has one, and returns the row. */
function choiceRow(host: HTMLElement, heading: string | undefined): HTMLElement {
  const section = document.createElement('div')
  section.className = 'choice-section'
  if (heading !== undefined) {
    const title = document.createElement('span')
    title.className = 'field-title choice-heading'
    title.textContent = heading
    section.append(title)
  }
  const row = document.createElement('div')
  row.className = 'choices'
  section.append(row)
  host.append(section)
  return row
}

/** The radio button that holds a choice's value. */
function choiceRadio(name: string, choice: Choice, value: string | undefined): HTMLInputElement {
  const radio = document.createElement('input')
  radio.type = 'radio'
  radio.name = name
  radio.value = choice.value
  radio.checked = choice.value === value
  radio.setAttribute('aria-label', choice.label)
  return radio
}

/** One choice of a row: a label that shows it, around its radio button. */
function choiceOption(name: string, choice: Choice, value: string | undefined): HTMLElement {
  const option = document.createElement('label')
  option.className = choice.className
  option.title = choice.label
  option.dataset.heading = choice.heading ?? ''
  option.append(choiceRadio(name, choice, value))
  choice.paint(option)
  return option
}

/**
 * The switch of a long field: the clearing choice as a word around its radio button, then a button named like
 * the field that turns the list on. The switch has one state, whether the list is on. The button holds it as its
 * pressed state (`aria-pressed`), and the stylesheet shows the list and lights the button from that. The list is
 * on from the start when the records share a pick from it. Pressing the button turns it on and picks the stored
 * value again, or nothing when the records have none in common; picking the clearing choice turns it off.
 */
function listSwitch(name: string, label: string, clear: Choice, value: string | undefined, list: HTMLElement): HTMLElement {
  const row = document.createElement('div')
  row.className = 'choice-switch'
  const off = document.createElement('label')
  const clearing = choiceRadio(name, clear, value)
  off.append(clearing, clear.label)
  const on = document.createElement('button')
  on.type = 'button'
  on.textContent = label
  const stored = [...list.querySelectorAll<HTMLInputElement>('input[type="radio"]')].find(radio => radio.value === value)
  const showList = (shown: boolean): void => on.setAttribute('aria-pressed', String(shown))
  showList(stored !== undefined)
  clearing.addEventListener('change', () => showList(false))
  on.addEventListener('click', () => {
    if (on.getAttribute('aria-pressed') === 'true') return
    if (stored === undefined) clearing.checked = false
    else stored.checked = true
    showList(true)
    // A script that changes a radio button fires no event; the title and the map's preview listen for these two.
    for (const type of ['input', 'change']) on.dispatchEvent(new Event(type, { bubbles: true }))
  })
  row.append(off, on)
  return row
}

/**
 * The box that filters the choices of a list: a choice stays while its label or its heading contains the
 * typed text. A choice that is filtered away keeps its radio button, so a pick is still sent.
 * The box has no name, so the form does not send what is typed in it.
 */
function filterBox(list: HTMLElement, label: string): HTMLInputElement {
  const filter = document.createElement('input')
  filter.type = 'search'
  filter.placeholder = 'Filter'
  filter.setAttribute('aria-label', `Filter the choices of ${label}`)
  filter.autocomplete = 'off'
  filter.addEventListener('input', () => {
    const typed = filter.value.trim().toLowerCase()
    for (const option of list.querySelectorAll<HTMLElement>('.choices label')) {
      option.hidden = ![option.title, option.dataset.heading!].some(text => text.toLowerCase().includes(typed))
    }
  })
  // Enter in a box of a form presses Save. While text is typed here the person is still looking for a
  // choice, so Enter does nothing. Enter in the empty box saves the form, as in its other fields.
  filter.addEventListener('keydown', event => {
    if (event.key === 'Enter' && filter.value !== '') event.preventDefault()
  })
  return filter
}

/** Shared radio choices, their headings, the switch of a long field and the pick named in the title. */
export const choiceFieldCss = `
  #details .choice-field { display: grid; gap: 6px; font-size: 12px; }
  #details .choice-field .pick { color: var(--ink); font-size: 12px; text-transform: none; letter-spacing: normal; }
  #details .choice-field .pick:not(:empty)::before { content: ' · '; }
  /* Nothing is picked while the records differ: the title says "mixed", and says it quietly. */
  #details .choice-field:not(:has(input[type="radio"]:checked)) .pick { color: var(--muted); }
  #details .choice-field .choice-section { display: grid; gap: 6px; }
  /* A heading has the look of a field's title (field-title), and stands a little apart from the section before it. */
  #details .choice-field .choice-heading { margin-top: 8px; }
  #details .choice-field .choices { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
  #details .choice-field .choices label { position: relative; display: grid; place-items: center; cursor: pointer; }
  /* A choice the filter took away, and a section that has no choice left. */
  #details .choice-field .choices label[hidden] { display: none; }
  #details .choice-field .choice-section:not(:has(label:not([hidden]))) { display: none; }
  /* The radio button stays focusable but unseen: its label shows the choice. */
  #details .choice-field :is(.choices, .choice-switch) input {
    position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; padding: 0; border: 0; opacity: 0; cursor: pointer;
  }
  #details .choice-field :is(.choices, .choice-switch) label:has(:focus-visible) { outline: 2px solid var(--highlight); outline-offset: 2px; }

  /* The switch of a long field: two parts with the look of a button, the one that is on in ink. */
  #details .choice-field .choice-switch { display: flex; gap: 6px; }
  #details .choice-field .choice-switch :is(label, button) {
    position: relative; display: block; border: 1px solid var(--hairline); border-radius: 6px; padding: 6px 12px;
    background: transparent; color: var(--muted); font: inherit; font-size: 12px; letter-spacing: normal; text-transform: none;
    white-space: nowrap; cursor: pointer; transition: color 160ms ease, background 160ms ease, border-color 160ms ease;
  }
  #details .choice-field .choice-switch :is(label, button):hover { color: var(--ink); background: var(--hover); }
  /* The clearing choice is on while it is picked, and the list while its button is pressed. */
  #details .choice-field .choice-switch label:has(:checked),
  #details .choice-field .choice-switch button[aria-pressed="true"] { color: var(--ink); border-color: var(--ink); }
  #details .choice-field .choice-list { display: grid; gap: 6px; transition: opacity 160ms ease, translate 160ms ease; }
  #details .choice-field .choice-switch:not(:has(button[aria-pressed="true"])) + .choice-list { display: none; }
  @starting-style { #details .choice-field .choice-list { opacity: 0; translate: 0 -4px; } }
  @media (prefers-reduced-motion: reduce) {
    #details .choice-field .choice-switch :is(label, button), #details .choice-field .choice-list { transition: none; }
  }
`
