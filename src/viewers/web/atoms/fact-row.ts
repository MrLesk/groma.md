/**
 * One titled row of a reading pane: a small title, then what it names, such as the tags of a record or the
 * group a component is in. The content wraps beside the title.
 */
export function factRow(title: string, content: readonly HTMLElement[]): HTMLElement {
  const row = document.createElement('div')
  row.className = 'fact-row'
  row.setAttribute('role', 'group')
  row.setAttribute('aria-label', title)
  const label = document.createElement('span')
  label.className = 'title'
  label.textContent = title
  row.append(label, ...content)
  return row
}

export const factRowCss = `
  #details .fact-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin: 0 0 12px; }
  #details .fact-row .title { margin-right: 6px; }
`
