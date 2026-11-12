import { ICON_NAMES } from '../../../icons.ts'
import { glyphElement } from '../icons/glyph-element.ts'
import { instantChoice } from './instant-choice.ts'

export const iconPickerCss = `
  #details .icon-picker { gap: 4px; }
  #details .icon-picker .title { flex-basis: 100%; margin-bottom: 2px; }
  #details .icon-choice {
    display: grid; place-items: center; width: 28px; height: 28px; padding: 0;
    border: 1px solid transparent; border-radius: 6px; color: var(--muted);
    transition: color 160ms ease, background 160ms ease, border-color 160ms ease;
  }
  #details .icon-choice.none::before { content: ''; width: 14px; height: 1px; background: currentColor; transform: rotate(-45deg); }
  #details .icon-choice:hover { color: var(--ink); background: var(--hover); }
  #details .icon-choice[aria-checked="true"] { color: var(--ink); border-color: var(--ink); }
  @media (prefers-reduced-motion: reduce) { #details .icon-choice { transition: none; } }
`

/** The element's icon as one grid of choices: no icon, then every named icon as its flat glyph. */
export function iconPicker(current: string, choose: (icon: string) => Promise<void>): HTMLElement {
  return instantChoice('icon-picker', 'Icon', [
    { value: '', label: 'No icon', className: 'icon-choice none', paint: () => {} },
    ...ICON_NAMES.map(name => ({
      value: name,
      label: name,
      className: 'icon-choice',
      paint: (choice: HTMLButtonElement) => choice.append(glyphElement(name, 18)),
    })),
  ], current, choose)
}
