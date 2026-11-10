import { ICON_NAMES, type IconName } from '../../../icons.ts'
import { glyphElement } from '../icons/glyph-element.ts'
import { message } from './editable.ts'

export const iconPickerCss = `
  #details .icon-picker { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; margin: 0 0 12px; }
  #details .icon-picker .title { flex-basis: 100%; margin-bottom: 2px; }
  #details .icon-choice {
    display: grid; place-items: center; width: 28px; height: 28px; padding: 0;
    border: 1px solid transparent; border-radius: 6px; color: var(--muted);
    transition: color 160ms ease, background 160ms ease, border-color 160ms ease;
  }
  #details .icon-choice.none::before { content: ''; width: 14px; height: 1px; background: currentColor; transform: rotate(-45deg); }
  #details .icon-choice:hover { color: var(--ink); background: var(--hover); }
  #details .icon-choice[aria-checked="true"] { color: var(--ink); border-color: var(--ink); }
  #details .icon-picker .error { flex-basis: 100%; margin: 0; color: var(--highlight-text); }
  #details .icon-picker .error:empty { display: none; }
  @media (prefers-reduced-motion: reduce) { #details .icon-choice { transition: none; } }
`

/**
 * The element's icon as one grid of choices: no icon, then every named icon as its flat glyph.
 * A click applies the choice at once through the shared edit write, so the map shows it without a Save step.
 */
export function iconPicker(current: string, choose: (icon: string) => Promise<void>): HTMLElement {
  const grid = document.createElement('div')
  grid.className = 'icon-picker'
  grid.setAttribute('role', 'radiogroup')
  grid.setAttribute('aria-label', 'Icon')
  const title = document.createElement('span')
  title.className = 'title'
  title.textContent = 'Icon'
  const error = document.createElement('p')
  error.className = 'error'
  error.setAttribute('role', 'status')
  grid.append(title)
  const choices: ('' | IconName)[] = ['', ...ICON_NAMES]
  for (const name of choices) {
    const choice = document.createElement('button')
    choice.type = 'button'
    choice.className = name === '' ? 'icon-choice none' : 'icon-choice'
    choice.setAttribute('role', 'radio')
    choice.setAttribute('aria-checked', String(name === current))
    choice.setAttribute('aria-label', name === '' ? 'No icon' : name)
    choice.title = name === '' ? 'No icon' : name
    if (name !== '') choice.append(glyphElement(name, 18))
    choice.addEventListener('click', async () => {
      error.textContent = ''
      try { await choose(name) }
      catch (cause) { error.textContent = message(cause) }
    })
    grid.append(choice)
  }
  grid.append(error)
  return grid
}
