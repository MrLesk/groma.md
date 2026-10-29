import { architectureIcon, architectureIcons, type ArchitectureIcon } from '../../../architecture-icons.ts'
import { iconPreview, matchingArchitectureIcons } from './icon-catalog.ts'

export const iconPickerCss = `
  #details .icon-picker { min-width: 0; margin: 0; padding: 0; border: 0; }
  #details .icon-picker legend { padding: 0 0 5px; font-size: 12px; }
  #details .icon-picker details { border: 1px solid var(--hairline); border-radius: 6px; }
  #details .icon-picker summary { display: flex; align-items: center; gap: 10px; padding: 8px 10px;
    color: var(--ink); cursor: pointer; list-style: none; }
  #details .icon-picker summary::-webkit-details-marker { display: none; }
  #details .icon-picker summary::after { content: '+'; margin-left: auto; color: var(--muted); }
  #details .icon-picker details[open] summary::after { content: '−'; }
  #details .icon-picker summary:focus-visible { outline: 2px solid var(--highlight); outline-offset: 2px; }
  #details .icon-picker summary:hover { background: var(--hover); }
  #details .icon-picker .icon-options { padding: 0 8px 8px; }
  #details .icon-picker h3 { margin: 12px 2px 6px; color: var(--muted); font-size: 11px; font-weight: 500; }
  #details .icon-picker .icon-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(65px, 1fr)); gap: 5px; }
  #details .icon-picker label { position: relative; display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 5px; min-height: 62px; padding: 5px 3px; box-sizing: border-box;
    border: 1px solid transparent; border-radius: 5px; color: var(--ink); text-align: center;
    font-size: 10px; line-height: 1.2; cursor: pointer; }
  #details .icon-picker label:hover { background: var(--hover); }
  #details .icon-picker label:has(:checked) { border-color: var(--highlight); background: var(--hover); }
  #details .icon-picker label:has(:focus-visible) { outline: 2px solid var(--highlight); outline-offset: 2px; }
  #details .icon-picker input[type="radio"] { position: absolute; width: 1px; height: 1px; padding: 0; border: 0;
    opacity: 0; overflow: hidden; }
  #details .icon-picker input[type="search"] { margin: 8px 0; }
  #details .icon-picker [hidden] { display: none !important; }
  #details .icon-picker .icon-empty { margin: 12px 2px; color: var(--muted); font-size: 12px; }
  #details .icon-picker .icon-none { flex-direction: row; justify-content: flex-start; min-height: 36px; padding: 5px 8px;
    font-size: 12px; gap: 10px; }
`

/** Native radios keep selection, keyboard navigation and form values in one place. */
export function iconPicker(name: string, label: string, value: string): HTMLFieldSetElement {
  const field = document.createElement('fieldset')
  field.className = 'icon-picker'
  const legend = document.createElement('legend')
  legend.textContent = label
  const disclosure = document.createElement('details')
  const summary = document.createElement('summary')
  const selected = architectureIcon(value)
  summary.append(iconPreview(selected), selected?.label ?? 'None')
  const options = document.createElement('div')
  options.className = 'icon-options'
  const search = document.createElement('input')
  search.type = 'search'
  search.placeholder = 'Search icons'
  search.setAttribute('aria-label', 'Search icons')
  search.addEventListener('keydown', event => { if (event.key === 'Enter') event.preventDefault() })
  options.append(search, choice(name, undefined, value))
  for (const category of [...new Set(architectureIcons.map(icon => icon.category))]) {
    const section = document.createElement('section')
    const title = document.createElement('h3')
    title.textContent = category
    const grid = document.createElement('div')
    grid.className = 'icon-grid'
    for (const icon of architectureIcons.filter(icon => icon.category === category)) grid.append(choice(name, icon, value))
    section.append(title, grid)
    options.append(section)
  }
  const empty = document.createElement('p')
  empty.className = 'icon-empty'
  empty.textContent = 'No icons found'
  empty.setAttribute('role', 'status')
  empty.hidden = true
  options.append(empty)
  search.addEventListener('input', () => {
    const matches = new Set(matchingArchitectureIcons(search.value).map(icon => icon.id))
    for (const section of options.querySelectorAll('section')) {
      let visible = false
      for (const option of section.querySelectorAll('label')) {
        option.hidden = !matches.has(option.querySelector('input')!.value)
        visible ||= !option.hidden
      }
      section.hidden = !visible
    }
    empty.hidden = matches.size > 0
  })
  options.addEventListener('change', event => {
    const radio = event.target as HTMLInputElement
    if (radio.type !== 'radio') return
    const icon = architectureIcon(radio.value)
    summary.replaceChildren(iconPreview(icon), icon?.label ?? 'None')
  })
  disclosure.append(summary, options)
  field.append(legend, disclosure)
  return field
}

function choice(name: string, icon: ArchitectureIcon | undefined, value: string): HTMLLabelElement {
  const label = document.createElement('label')
  if (icon === undefined) label.className = 'icon-none'
  const radio = document.createElement('input')
  radio.type = 'radio'
  radio.name = name
  radio.value = icon?.id ?? ''
  radio.checked = radio.value === value
  label.append(radio, iconPreview(icon), icon?.label ?? 'None')
  return label
}
