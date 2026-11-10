import { message } from './editable.ts'

export interface InstantChoice {
  /** The value the write receives; '' is the choice that clears the field. */
  value: string
  label: string
  className: string
  /** Fills the button with what the choice looks like. */
  paint(button: HTMLButtonElement): void
}

/**
 * One field of an element as a group of radio buttons under a title. A click applies the choice at once through
 * `choose`, the shared edit write, so the map shows it without a Save step; a refused write is reported in the group.
 */
export function instantChoice(
  className: string,
  title: string,
  choices: readonly InstantChoice[],
  current: string,
  choose: (value: string) => Promise<void>,
): HTMLElement {
  const group = document.createElement('div')
  group.className = `instant-choice ${className}`
  group.setAttribute('role', 'radiogroup')
  group.setAttribute('aria-label', title)
  const heading = document.createElement('span')
  heading.className = 'title'
  heading.textContent = title
  const error = document.createElement('p')
  error.className = 'error'
  error.setAttribute('role', 'status')
  group.append(heading)
  for (const choice of choices) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = choice.className
    button.setAttribute('role', 'radio')
    button.setAttribute('aria-checked', String(choice.value === current))
    button.setAttribute('aria-label', choice.label)
    button.title = choice.label
    choice.paint(button)
    button.addEventListener('click', async () => {
      error.textContent = ''
      try { await choose(choice.value) }
      catch (cause) { error.textContent = message(cause) }
    })
    group.append(button)
  }
  group.append(error)
  return group
}

export const instantChoiceCss = `
  #details .instant-choice { display: flex; flex-wrap: wrap; align-items: center; margin: 0 0 12px; }
  #details .instant-choice .error { flex-basis: 100%; margin: 0; color: var(--highlight-text); }
  #details .instant-choice .error:empty { display: none; }
`
