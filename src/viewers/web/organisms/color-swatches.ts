import { COLOR_NAMES } from '../../../colors.ts'
import { instantChoice } from './instant-choice.ts'

export const colorSwatchesCss = `
  #details .color-swatches { gap: 8px; }
  #details .color-swatches .title { margin-right: 4px; }
  #details .color-swatch {
    width: 18px; height: 18px; padding: 0; border: 1px solid var(--hairline); border-radius: 50%;
    background: color-mix(in srgb, var(--swatch) 60%, var(--paper));
    transition: transform 160ms ease, box-shadow 160ms ease;
  }
  #details .color-swatch.none { background: linear-gradient(135deg, transparent 46%, var(--muted) 46% 54%, transparent 54%); }
  #details .color-swatch:hover { transform: scale(1.15); }
  #details .color-swatch[aria-checked="true"] { box-shadow: 0 0 0 2px var(--paper), 0 0 0 3px var(--ink); }
  @media (prefers-reduced-motion: reduce) { #details .color-swatch { transition: none; } }
`

/** The element's color as one row of choices: no color, then every named color in the current theme's values. */
export function colorSwatches(current: string, choose: (color: string) => Promise<void>): HTMLElement {
  return instantChoice('color-swatches', 'Color', [
    { value: '', label: 'No color', className: 'color-swatch none', paint: () => {} },
    ...COLOR_NAMES.map(name => ({
      value: name,
      label: name,
      className: 'color-swatch',
      paint: (swatch: HTMLButtonElement) => swatch.style.setProperty('--swatch', `var(--color-${name})`),
    })),
  ], current, choose)
}
