/** An element's tags as one row of chips under a title, for reading. Tags are changed in the Edit form. */
export function tagRow(tags: readonly string[]): HTMLElement {
  const row = document.createElement('div')
  row.className = 'tag-row'
  row.setAttribute('role', 'group')
  row.setAttribute('aria-label', 'Tags')
  const title = document.createElement('span')
  title.className = 'title'
  title.textContent = 'Tags'
  row.append(title)
  for (const tag of tags) {
    const chip = document.createElement('span')
    chip.className = 'tag'
    chip.textContent = tag
    row.append(chip)
  }
  return row
}

export const tagRowCss = `
  #details .tag-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin: 0 0 12px; }
  #details .tag-row .title { margin-right: 6px; }
  /* People type a tag again in commands, so its chip keeps the authored spelling. */
  #details .tag-row .tag {
    border: 1px solid var(--hairline); border-radius: 10px; padding: 2px 8px;
    font-size: 11px; line-height: 16px; color: var(--ink);
  }
`
