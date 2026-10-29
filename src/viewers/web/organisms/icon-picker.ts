import { architectureIcon, architectureIcons, ARCHITECTURE_ICON_VIEWBOX, type ArchitectureIcon } from '../../../architecture-icons.ts'

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
  #details .icon-picker input { position: absolute; width: 1px; height: 1px; padding: 0; border: 0;
    opacity: 0; overflow: hidden; }
  #details .icon-picker svg { width: 24px; height: 24px; flex: none; fill: none; stroke: currentColor;
    stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
  #details .icon-picker .icon-wash { fill: currentColor; stroke: none; fill-opacity: 0.14; }
  #details .icon-picker .icon-shade { fill: currentColor; stroke: none; fill-opacity: 0.18; }
  #details .icon-picker .icon-none { flex-direction: row; justify-content: flex-start; min-height: 36px; padding: 5px 8px;
    font-size: 12px; gap: 10px; }
`

function preview(icon: ArchitectureIcon | undefined): SVGSVGElement {
  const namespace = 'http://www.w3.org/2000/svg'
  const image = document.createElementNS(namespace, 'svg')
  image.setAttribute('viewBox', `0 0 ${ARCHITECTURE_ICON_VIEWBOX} ${ARCHITECTURE_ICON_VIEWBOX}`)
  image.setAttribute('aria-hidden', 'true')
  for (const drawing of icon?.paths ?? [{ d: 'M5 5 19 19M19 5 5 19', tone: 'line' }]) {
    const path = document.createElementNS(namespace, 'path')
    path.setAttribute('d', drawing.d)
    path.setAttribute('class', `icon-${drawing.tone}`)
    image.append(path)
  }
  return image
}

/** Native radios keep selection, keyboard navigation and form values in one place. */
export function iconPicker(name: string, label: string, value: string): HTMLFieldSetElement {
  const field = document.createElement('fieldset')
  field.className = 'icon-picker'
  const legend = document.createElement('legend')
  legend.textContent = label
  const disclosure = document.createElement('details')
  const summary = document.createElement('summary')
  const selected = architectureIcon(value)
  summary.append(preview(selected), selected?.label ?? 'None')
  const options = document.createElement('div')
  options.className = 'icon-options'
  options.append(choice(name, undefined, value))
  for (const category of [...new Set(architectureIcons.map(icon => icon.category))]) {
    const title = document.createElement('h3')
    title.textContent = category
    const grid = document.createElement('div')
    grid.className = 'icon-grid'
    for (const icon of architectureIcons.filter(icon => icon.category === category)) grid.append(choice(name, icon, value))
    options.append(title, grid)
  }
  options.addEventListener('change', event => {
    const radio = event.target as HTMLInputElement
    const icon = architectureIcon(radio.value)
    summary.replaceChildren(preview(icon), icon?.label ?? 'None')
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
  label.append(radio, preview(icon), icon?.label ?? 'None')
  return label
}
