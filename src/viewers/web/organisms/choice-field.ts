/** One choice of a choice field. */
export interface Choice {
  /** The value the form sends; '' is the choice that clears the field. */
  value: string
  label: string
  className: string
  /** Fills the choice with what it looks like. */
  paint(choice: HTMLElement): void
}

/**
 * A field of an edit form whose value is picked from a fixed set, such as a color. Every choice is a radio
 * button named `name`, so the form sends the pick when Save is pressed. Picking stores nothing.
 */
export function choiceField(name: string, label: string, value: string, choices: readonly Choice[]): HTMLElement {
  const field = document.createElement('div')
  field.className = 'choice-field'
  field.setAttribute('role', 'radiogroup')
  field.setAttribute('aria-label', label)
  const title = document.createElement('span')
  title.className = 'field-title'
  title.textContent = label
  const row = document.createElement('div')
  row.className = 'choices'
  for (const choice of choices) {
    const option = document.createElement('label')
    option.className = choice.className
    option.title = choice.label
    const radio = document.createElement('input')
    radio.type = 'radio'
    radio.name = name
    radio.value = choice.value
    radio.checked = choice.value === value
    radio.setAttribute('aria-label', choice.label)
    option.append(radio)
    choice.paint(option)
    row.append(option)
  }
  field.append(title, row)
  return field
}

export const choiceFieldCss = `
  #details .choice-field { display: grid; gap: 6px; font-size: 12px; }
  #details .choice-field .choices { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
  #details .choice-field .choices label { position: relative; display: grid; place-items: center; cursor: pointer; }
  /* The radio button stays focusable but unseen: its label shows the choice. */
  #details .choice-field .choices input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; padding: 0; border: 0; opacity: 0; cursor: pointer; }
  #details .choice-field .choices label:has(:focus-visible) { outline: 2px solid var(--highlight); outline-offset: 2px; }
`
