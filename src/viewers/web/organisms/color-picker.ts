const swatches = [
  { name: 'Sage', value: '#5B9A7C' },
  { name: 'Teal', value: '#2B9A9D' },
  { name: 'Blue', value: '#4D82C8' },
  { name: 'Violet', value: '#8875C5' },
  { name: 'Rose', value: '#BD7393' },
  { name: 'Coral', value: '#C87966' },
  { name: 'Amber', value: '#B69445' },
  { name: 'Slate', value: '#748798' },
]

export const colorPickerCss = `
  #details .color-picker { min-width: 0; margin: 0; padding: 0; border: 0; }
  #details .color-picker legend { padding: 0 0 5px; font-size: 12px; }
  #details .color-picker .color-options { display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 6px; }
  #details .color-picker .color-options button { display: grid; place-items: center; min-height: 34px; padding: 4px;
    border: 1px solid var(--hairline); border-radius: 5px; }
  #details .color-picker .color-options button[aria-pressed=true] { border-color: var(--highlight); background: var(--hover); }
  #details .color-picker button:focus-visible { outline: 2px solid var(--highlight); outline-offset: 2px; }
  #details .color-picker .color-options .color-automatic { grid-column: 1 / -1; justify-items: start; padding: 7px 10px; }
  #details .color-picker .color-swatch { width: 18px; height: 18px; border-radius: 50%;
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ink) 12%, transparent); }
  #details .color-picker .color-custom { display: flex; gap: 8px; align-items: center; margin-top: 8px; }
  #details .color-picker .color-custom input[type=color] { flex: none; width: 36px; height: 34px; padding: 3px; cursor: pointer; }
  #details .color-picker .color-custom input[type=text] { min-width: 0; flex: 1; height: 34px; }
`

/** The hex input is the sole submitted value; the other controls only help choose it. */
export function colorPicker(name: string, label: string, value: string): HTMLFieldSetElement {
  const field = document.createElement('fieldset')
  field.className = 'color-picker'
  const legend = document.createElement('legend')
  legend.textContent = label
  const options = document.createElement('div')
  options.className = 'color-options'
  const custom = document.createElement('div')
  custom.className = 'color-custom'
  const picker = document.createElement('input')
  picker.type = 'color'
  picker.setAttribute('aria-label', 'Custom color')
  picker.title = 'Custom color'
  picker.value = value || '#748798'
  const hex = document.createElement('input')
  hex.type = 'text'
  hex.name = name
  hex.value = value
  hex.setAttribute('aria-label', 'Custom color hex')
  hex.placeholder = '#RRGGBB'
  hex.pattern = '#[0-9a-fA-F]{6}'
  hex.maxLength = 7
  hex.spellcheck = false
  hex.autocomplete = 'off'
  const choices = [{ name: 'Automatic', value: '' }, ...swatches]
  const buttons = choices.map(choice => colorChoice(choice.name, choice.value, () => {
    hex.value = choice.value
    refresh()
  }))
  function refresh(): void {
    const current = hex.value.toUpperCase()
    for (const [index, button] of buttons.entries()) button.setAttribute('aria-pressed', String(choices[index]!.value === current))
    if (hex.validity.valid && current !== '') picker.value = current
  }
  hex.addEventListener('input', refresh)
  picker.addEventListener('input', () => {
    hex.value = picker.value.toUpperCase()
    refresh()
  })
  refresh()
  options.append(...buttons)
  custom.append(picker, hex)
  field.append(legend, options, custom)
  return field
}

function colorChoice(label: string, value: string, choose: () => void): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.setAttribute('aria-label', label)
  button.title = value === '' ? label : `${label} ${value}`
  if (value === '') {
    button.className = 'color-automatic'
    button.textContent = label
  } else {
    const swatch = document.createElement('span')
    swatch.className = 'color-swatch'
    swatch.style.background = value
    swatch.setAttribute('aria-hidden', 'true')
    button.append(swatch)
  }
  button.addEventListener('click', choose)
  return button
}
