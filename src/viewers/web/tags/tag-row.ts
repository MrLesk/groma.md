import { tagChip } from './tag-focus.ts'

/**
 * A record's own tags as a row of chips in its reading pane. Pressing a chip toggles the map's focus.
 * To change the tags on an element, use its Edit form.
 */
export function tagRow(tags: readonly string[], focused: readonly string[], onToggle: (tag: string) => void): HTMLElement {
  const row = document.createElement('div')
  row.className = 'tag-row'
  row.setAttribute('role', 'group')
  row.setAttribute('aria-label', 'Tags')
  const title = document.createElement('span')
  title.className = 'title'
  title.textContent = 'Tags'
  row.append(title)
  for (const tag of tags) {
    const chip = tagChip(tag, () => onToggle(tag))
    chip.setAttribute('aria-pressed', String(focused.includes(tag)))
    row.append(chip)
  }
  return row
}

/** Tag chips in the reading pane wrap beside their label. */
export const tagRowCss = `
  #details .tag-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin: 0 0 12px; }
  #details .tag-row .title { margin-right: 6px; }
`
