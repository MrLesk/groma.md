import { COLOR_NAMES } from '../../../colors.ts'
import { message } from './editable.ts'

export const colorSwatchesCss = `
  #details .color-swatches { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 0 0 12px; }
  #details .color-swatches .title { margin-right: 4px; }
  #details .color-swatch {
    width: 18px; height: 18px; padding: 0; border: 1px solid var(--hairline); border-radius: 50%;
    background: color-mix(in srgb, var(--swatch) 60%, var(--paper));
    transition: transform 160ms ease, box-shadow 160ms ease;
  }
  #details .color-swatch.none { background: linear-gradient(135deg, transparent 46%, var(--muted) 46% 54%, transparent 54%); }
  #details .color-swatch:hover { transform: scale(1.15); }
  #details .color-swatch[aria-checked="true"] { box-shadow: 0 0 0 2px var(--paper), 0 0 0 3px var(--ink); }
  #details .color-swatches .error { flex-basis: 100%; margin: 0; color: var(--highlight-text); }
  #details .color-swatches .error:empty { display: none; }
  @media (prefers-reduced-motion: reduce) { #details .color-swatch { transition: none; } }
`

/**
 * The element's color as one row of choices: no color, then every named color in the current theme's values.
 * A click applies the choice at once through the shared edit write, so the map shows it without a Save step.
 */
export function colorSwatches(current: string, choose: (color: string) => Promise<void>): HTMLElement {
  const row = document.createElement('div')
  row.className = 'color-swatches'
  row.setAttribute('role', 'radiogroup')
  row.setAttribute('aria-label', 'Color')
  const title = document.createElement('span')
  title.className = 'title'
  title.textContent = 'Color'
  const error = document.createElement('p')
  error.className = 'error'
  error.setAttribute('role', 'status')
  row.append(title)
  for (const name of ['', ...COLOR_NAMES]) {
    const swatch = document.createElement('button')
    swatch.type = 'button'
    swatch.className = name === '' ? 'color-swatch none' : 'color-swatch'
    swatch.setAttribute('role', 'radio')
    swatch.setAttribute('aria-checked', String(name === current))
    swatch.setAttribute('aria-label', name === '' ? 'No color' : name)
    swatch.title = name === '' ? 'No color' : name
    if (name !== '') swatch.style.setProperty('--swatch', `var(--color-${name})`)
    swatch.addEventListener('click', async () => {
      error.textContent = ''
      try { await choose(name) }
      catch (cause) { error.textContent = message(cause) }
    })
    row.append(swatch)
  }
  row.append(error)
  return row
}
