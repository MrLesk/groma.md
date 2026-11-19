import type { IconName } from '../../../icons.ts'
import { glyphElement } from '../icons/glyph-element.ts'

/** The details pane shows a record's icon before its title whenever it has one. */
export function paintPaneTitle(titleHost: HTMLHeadingElement, title: string, icon?: IconName | ''): void {
  titleHost.textContent = title
  if (icon) titleHost.prepend(glyphElement(icon, 20))
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
