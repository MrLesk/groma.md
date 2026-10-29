import { architectureIcons, type ArchitectureIcon } from '../../../architecture-icons.ts'
import { createSettingsDialog } from '../atoms/settings-dialog.ts'
import { iconPreview, matchingArchitectureIcons } from '../organisms/icon-catalog.ts'

export const iconLibraryCss = `
  #icon-library { width: min(900px, calc(100vw - 48px)); }
  #icon-library .icon-library-search { box-sizing: border-box; width: 100%; padding: 10px 12px;
    border: 1px solid var(--hairline); border-radius: var(--control-radius); background: transparent; color: var(--ink); font: inherit; }
  #icon-library .icon-library-content { display: grid; grid-template-columns: minmax(0, 1fr) 220px; gap: 24px; }
  #icon-library .icon-library-results { overflow: auto; padding: 2px 12px 2px 2px; }
  #icon-library .icon-category + .icon-category { margin-top: 22px; }
  #icon-library .icon-category h2 { margin: 0 0 10px; color: var(--muted); font-size: 12px; font-weight: 400; }
  #icon-library .icon-library-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(88px, 1fr)); gap: 6px; }
  #icon-library .icon-choice { display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 9px; min-height: 80px; padding: 10px 4px; border: 1px solid transparent; border-radius: var(--control-radius);
    color: var(--ink); background: transparent; font: inherit; font-size: 11px; cursor: pointer; }
  #icon-library .icon-choice:hover { background: var(--hover); }
  #icon-library .icon-choice[aria-pressed="true"] { border-color: var(--highlight); background: var(--hover); }
  #icon-library :is(button, input):focus-visible { outline: 2px solid var(--highlight); outline-offset: 2px; }
  #icon-library .icon-choice svg { width: 32px; height: 32px; }
  #icon-library .icon-library-preview { display: flex; flex-direction: column; align-items: center; justify-content: center;
    align-self: start; gap: 16px; min-height: 280px; padding: 24px 12px; border: 1px solid var(--hairline);
    border-radius: var(--chrome-radius); background: color-mix(in srgb, var(--ink) 2%, transparent); text-align: center; }
  #icon-library .icon-library-preview svg { width: 96px; height: 96px; margin-bottom: 8px; }
  #icon-library .icon-library-preview h2 { margin: 0; font-size: 16px; font-weight: 500; }
  #icon-library .icon-library-preview code { font-size: 12px; color: var(--muted); user-select: all; }
  #icon-library .icon-library-preview button { border: 1px solid var(--hairline); }
  #icon-library .icon-library-empty { color: var(--muted); font-size: 13px; }
  @media (max-width: 640px) {
    #icon-library { width: calc(100vw - 16px); }
    #icon-library .icon-library-content { display: flex; flex-direction: column-reverse; gap: 16px; }
    #icon-library .icon-library-results { flex: 1; min-height: 0; padding-right: 4px; }
    #icon-library .icon-library-preview { display: grid; grid-template-columns: 56px minmax(0, 1fr); align-self: stretch;
      min-height: 0; padding: 12px; gap: 6px 16px; text-align: left; }
    #icon-library .icon-library-preview svg { grid-row: 1 / 4; width: 56px; height: 56px; margin: 0; }
    #icon-library .icon-library-preview button { justify-self: start; }
  }
`

/** Info browses the embedded family; selecting here never edits the architecture. */
export function createIconLibrary(): void {
  const info = document.getElementById('credits') as HTMLDetailsElement
  const opener = info.querySelector('summary')!
  const popup = createSettingsDialog('icon-library', 'Icon library',
    '<input class="icon-library-search" type="search" aria-label="Search icons" placeholder="Search icons">'
    + '<section class="icon-library-content"><div class="icon-library-results"></div>'
    + '<aside class="icon-library-preview" aria-label="Selected icon"></aside></section>')
  const search = popup.dialog.querySelector<HTMLInputElement>('.icon-library-search')!
  const results = popup.dialog.querySelector<HTMLElement>('.icon-library-results')!
  const preview = popup.dialog.querySelector<HTMLElement>('.icon-library-preview')!
  let selected = architectureIcons[0]!
  const title = document.createElement('h2')
  const identifier = document.createElement('code')
  const copy = document.createElement('button')
  copy.className = 'chrome-button'
  copy.type = 'button'
  copy.setAttribute('aria-live', 'polite')
  const choices = new Map<string, HTMLButtonElement>()

  function select(icon: ArchitectureIcon): void {
    selected = icon
    title.textContent = icon.label
    identifier.textContent = icon.id
    copy.textContent = 'Copy ID'
    preview.replaceChildren(iconPreview(icon), title, identifier, copy)
    for (const [id, button] of choices) button.setAttribute('aria-pressed', String(id === icon.id))
  }
  for (const category of [...new Set(architectureIcons.map(icon => icon.category))]) {
    const section = document.createElement('section')
    section.className = 'icon-category'
    const heading = document.createElement('h2')
    heading.textContent = category
    const grid = document.createElement('div')
    grid.className = 'icon-library-grid'
    for (const icon of architectureIcons.filter(icon => icon.category === category)) {
      const button = document.createElement('button')
      button.className = 'icon-choice'
      button.type = 'button'
      button.append(iconPreview(icon), icon.label)
      button.addEventListener('click', () => select(icon))
      choices.set(icon.id, button)
      grid.append(button)
    }
    section.append(heading, grid)
    results.append(section)
  }
  const empty = document.createElement('p')
  empty.className = 'icon-library-empty'
  empty.textContent = 'No icons found'
  empty.setAttribute('role', 'status')
  empty.hidden = true
  results.append(empty)
  select(selected)

  search.addEventListener('input', () => {
    const matches = matchingArchitectureIcons(search.value)
    const ids = new Set(matches.map(icon => icon.id))
    for (const [id, button] of choices) button.hidden = !ids.has(id)
    for (const section of results.querySelectorAll<HTMLElement>('.icon-category')) {
      section.hidden = !section.querySelector('button:not([hidden])')
    }
    empty.hidden = matches.length > 0
    preview.hidden = matches.length === 0
    if (!ids.has(selected.id) && matches[0]) select(matches[0])
    results.scrollTop = 0
  })
  copy.addEventListener('click', async () => {
    const id = selected.id
    try {
      await navigator.clipboard.writeText(id)
      if (selected.id === id) copy.textContent = 'Copied'
    } catch {
      if (selected.id === id) copy.textContent = 'Copy failed'
    }
  })
  document.getElementById('icon-library-open')!.addEventListener('click', () => {
    info.open = false
    popup.open(opener)
    search.focus()
  })
}
