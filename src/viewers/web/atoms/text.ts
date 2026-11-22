import type { IconName } from '../../../icons.ts'
import { glyphElement } from '../icons/glyph-element.ts'

/** The details pane shows a record's icon before its title whenever it has one. */
export function paintPaneTitle(titleHost: HTMLHeadingElement, title: string, icon?: IconName | ''): void {
  titleHost.textContent = title
  if (icon) titleHost.prepend(glyphElement(icon, 20))
}

/**
 * A name that stands for an element or a group in a list shows that record's id while the pointer rests on
 * it, as a link to an element does in the stored records. The id is what commands take.
 */
export function showIdOnHover(name: HTMLElement, id: string): void {
  name.title = id
}

export function heading(label: string): HTMLElement {
  const row = document.createElement('h2')
  row.className = 'section'
  row.textContent = label
  return row
}

export function paragraph(className: string, text: string): HTMLElement {
  const row = document.createElement('p')
  row.className = className
  row.textContent = text
  return row
}
