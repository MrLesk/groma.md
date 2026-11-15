import { tagChips } from '../chrome/tag-focus.ts'

/**
 * An element's tags as one row of chips under a title, for reading. Pressing a chip focuses the map on its
 * tag, or ends that focus: that changes the view, never the architecture. Tags are changed in the Edit form.
 */
export function tagRow(tags: readonly string[], focused: readonly string[], onToggle: (tag: string) => void): HTMLElement {
  const row = document.createElement('div')
  row.className = 'tag-row'
  row.setAttribute('role', 'group')
  row.setAttribute('aria-label', 'Tags')
  const title = document.createElement('span')
  title.className = 'title'
  title.textContent = 'Tags'
  row.append(title, tagChips(tags.map(tag => ({ tag })), focused, onToggle))
  return row
}

export const tagRowCss = `
  #details .tag-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 12px; margin: 0 0 12px; }
`
