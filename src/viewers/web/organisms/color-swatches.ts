import { COLOR_NAMES } from '../../../colors.ts'
import type { Choice } from './choice-field.ts'

export const colorSwatchesCss = `
  #details .choice-field .color-swatch {
    width: 20px; height: 20px; border: 1px solid var(--hairline); border-radius: 50%;
    background: color-mix(in srgb, var(--swatch) 60%, var(--paper));
    transition: transform 160ms ease, box-shadow 160ms ease;
  }
  #details .choice-field .color-swatch.none { background: linear-gradient(135deg, transparent 46%, var(--muted) 46% 54%, transparent 54%); }
  #details .choice-field .color-swatch:hover { transform: scale(1.15); }
  #details .choice-field .color-swatch:has(:checked) { box-shadow: 0 0 0 2px var(--paper), 0 0 0 3px var(--ink); }
  @media (prefers-reduced-motion: reduce) { #details .choice-field .color-swatch { transition: none; } }
`

/** The choices of the Color field of an edit form: no color, then every named color in the current theme's values. */
export function colorChoices(): Choice[] {
  return [
    { value: '', label: 'No color', className: 'color-swatch none', paint: () => {} },
    ...COLOR_NAMES.map(name => ({
      value: name,
      label: name,
      className: 'color-swatch',
      paint: (swatch: HTMLElement) => swatch.style.setProperty('--swatch', `var(--color-${name})`),
    })),
  ]
}
