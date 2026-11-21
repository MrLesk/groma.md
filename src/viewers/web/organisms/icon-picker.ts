import { ICON_KINDS } from '../../../icons.ts'
import { glyphElement } from '../icons/glyph-element.ts'
import type { Choice } from './choice-field.ts'

export const iconPickerCss = `
  /* An icon keeps the map's icon look in every state. The color of a choice only draws the stroke of "No icon". */
  #details .choice-field .icon-choice {
    width: 28px; height: 28px; border: 1px solid transparent; border-radius: 6px; color: var(--muted);
    transition: color 160ms ease, background 160ms ease, border-color 160ms ease;
  }
  #details .choice-field .icon-choice.none::before { content: ''; width: 14px; height: 1px; background: currentColor; transform: rotate(-45deg); }
  #details .choice-field .icon-choice:hover { color: var(--ink); background: var(--hover); }
  #details .choice-field .icon-choice:has(:checked) { color: var(--ink); border-color: var(--ink); }
  @media (prefers-reduced-motion: reduce) { #details .choice-field .icon-choice { transition: none; } }
`

/** The choices of the Icon field of an edit form: no icon, then every named icon as its plan, under the name of its kind. */
export function iconChoices(): Choice[] {
  return [
    { value: '', label: 'No icon', className: 'icon-choice none', paint: () => {} },
    ...Object.entries(ICON_KINDS).flatMap(([kind, names]) => names.map(name => ({
      value: name,
      label: name,
      heading: kind,
      className: 'icon-choice',
      paint: (choice: HTMLElement) => choice.append(glyphElement(name, 18)),
    }))),
  ]
}
