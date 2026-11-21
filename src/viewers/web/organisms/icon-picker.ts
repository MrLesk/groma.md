import { ICON_KINDS } from '../../../icons.ts'
import { glyphElement } from '../icons/glyph-element.ts'
import type { Choice } from './choice-field.ts'

export const iconPickerCss = `
  /* An icon keeps the map's icon look in every state. */
  #details .choice-field .icon-choice {
    width: 28px; height: 28px; border: 1px solid transparent; border-radius: 6px;
    transition: background 160ms ease, border-color 160ms ease;
  }
  #details .choice-field .icon-choice:hover { background: var(--hover); }
  #details .choice-field .icon-choice:has(:checked) { border-color: var(--ink); }
  @media (prefers-reduced-motion: reduce) { #details .choice-field .icon-choice { transition: none; } }
`

/**
 * The choices of the Icon field of an edit form: no icon, then every named icon as it looks from above, under
 * the name of its kind. The headings make the field a long one, so it shows "No icon" and "Icon" and lists the icons only
 * while Icon is on (choiceField).
 */
export function iconChoices(): Choice[] {
  return [
    { value: '', label: 'No icon', className: '', paint: () => {} },
    ...Object.entries(ICON_KINDS).flatMap(([kind, names]) => names.map(name => ({
      value: name,
      label: name,
      heading: kind,
      className: 'icon-choice',
      paint: (choice: HTMLElement) => choice.append(glyphElement(name, 18)),
    }))),
  ]
}
