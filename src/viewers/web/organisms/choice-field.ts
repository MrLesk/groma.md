/** One choice of a choice field. */
export interface Choice {
  /** The value the form sends; '' is the choice that clears the field. */
  value: string
  label: string
  className: string
  /** The heading the choice is listed under. A field whose choices have headings also has a box that filters them. */
  heading?: string
  /** Fills the choice with what it looks like. */
  paint(choice: HTMLElement): void
}

/**
 * A field of an edit form whose value is picked from a fixed set, such as a color. Every choice is a radio
 * button named `name`, so the form sends the pick when Save is pressed. Picking stores nothing. The title
 * names the pick beside the field's label. Choices that name a heading stand under it, and a box above them
 * filters them.
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
  if (choices.some(choice => choice.heading !== undefined)) field.append(filterBox(field, label))
  // One row per heading, in the order the headings first appear. The choices without a heading share one row.
  const rows = new Map<string | undefined, HTMLElement>()
  for (const choice of choices) {
    if (!rows.has(choice.heading)) rows.set(choice.heading, choiceRow(field, choice.heading))
    rows.get(choice.heading)!.append(choiceOption(name, choice, value))
  }
  const namePick = (): void => { pick.textContent = pickedLabel(field) }
  field.addEventListener('change', namePick)
  namePick()
  return field
}

/** What the title says about the pick: its label, nothing for the choice that clears the field, and "mixed" while nothing is picked because the records differ. */
function pickedLabel(field: HTMLElement): string {
  const picked = field.querySelector<HTMLInputElement>('.choices input:checked')
  if (picked === null) return 'mixed'
  return picked.value === '' ? '' : picked.getAttribute('aria-label')!
}

/** Adds a section to the field, a row of choices under its heading when it has one, and returns the row. */
function choiceRow(field: HTMLElement, heading: string | undefined): HTMLElement {
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
  field.append(section)
  return row
}

/** One choice: a label that shows it, around the radio button that holds its value. */
function choiceOption(name: string, choice: Choice, value: string | undefined): HTMLElement {
  const option = document.createElement('label')
  option.className = choice.className
  option.title = choice.label
  option.dataset.heading = choice.heading ?? ''
  const radio = document.createElement('input')
  radio.type = 'radio'
  radio.name = name
  radio.value = choice.value
  radio.checked = choice.value === value
  radio.setAttribute('aria-label', choice.label)
  option.append(radio)
  choice.paint(option)
  return option
}

/**
 * The box that filters the choices of a field: a choice stays while its label or its heading contains the
 * typed text. A choice that is filtered away keeps its radio button, so a pick is still sent.
 * The box has no name, so the form does not send what is typed in it.
 */
function filterBox(field: HTMLElement, label: string): HTMLInputElement {
  const filter = document.createElement('input')
  filter.type = 'search'
  filter.placeholder = 'Filter'
  filter.setAttribute('aria-label', `Filter the choices of ${label}`)
  filter.autocomplete = 'off'
  filter.addEventListener('input', () => {
    const typed = filter.value.trim().toLowerCase()
    for (const option of field.querySelectorAll<HTMLElement>('.choices label')) {
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

/** Shared radio choices, their headings and the pick named in the title. */
export const choiceFieldCss = `
  #details .choice-field { display: grid; gap: 6px; font-size: 12px; }
  #details .choice-field .pick { color: var(--ink); font-size: 12px; text-transform: none; letter-spacing: normal; }
  #details .choice-field .pick:not(:empty)::before { content: ' · '; }
  /* Nothing is picked while the records differ: the title says "mixed", and says it quietly. */
  #details .choice-field:not(:has(.choices :checked)) .pick { color: var(--muted); }
  #details .choice-field .choice-section { display: grid; gap: 6px; }
  /* A heading has the look of a field's title (field-title), and stands a little apart from the section before it. */
  #details .choice-field .choice-heading { margin-top: 8px; }
  #details .choice-field .choices { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
  #details .choice-field .choices label { position: relative; display: grid; place-items: center; cursor: pointer; }
  /* A choice the filter took away, and a section that has no choice left. */
  #details .choice-field .choices label[hidden] { display: none; }
  #details .choice-field .choice-section:not(:has(label:not([hidden]))) { display: none; }
  /* The radio button stays focusable but unseen: its label shows the choice. */
  #details .choice-field .choices input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; padding: 0; border: 0; opacity: 0; cursor: pointer; }
  #details .choice-field .choices label:has(:focus-visible) { outline: 2px solid var(--highlight); outline-offset: 2px; }
`
