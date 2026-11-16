import { formatTags, parseTags } from '../../../tags.ts'

/**
 * The Tags field of an edit form. The record's tags are chips, each with a button that takes it off the
 * list, and a tag typed in the Add tag field joins the list on Enter. Nothing is stored here: the hidden
 * control named `name` holds the pending list as the comma-separated text every edit uses, and the form
 * sends it when Save is pressed.
 */
export function tagsField(name: string, label: string, value: string, suggestions: readonly string[]): HTMLElement {
  const field = document.createElement('div')
  field.className = 'tags-field'
  field.setAttribute('role', 'group')
  field.setAttribute('aria-label', label)
  const title = document.createElement('span')
  title.textContent = label
  const chips = document.createElement('div')
  chips.className = 'pending-tags'
  const pending = document.createElement('input')
  pending.type = 'hidden'
  pending.name = name
  const add = document.createElement('input')
  add.placeholder = 'Add tag'
  add.setAttribute('aria-label', 'Add tag')
  const offered = document.createElement('datalist')
  offered.id = `${name}-suggestions`
  add.setAttribute('list', offered.id)
  field.append(title, chips, add, offered, pending)

  let tags = parseTags(value)
  /** Text still in the Add tag field counts, so Save keeps a tag that was typed without Enter. */
  const pendingTags = (): string[] => parseTags([...tags, add.value].join(','))

  function chip(tag: string): HTMLElement {
    const item = document.createElement('span')
    item.className = 'tag'
    const remove = document.createElement('button')
    remove.type = 'button'
    remove.className = 'tag-remove'
    remove.textContent = '×'
    remove.setAttribute('aria-label', `Remove tag ${tag}`)
    remove.addEventListener('click', () => {
      tags = tags.filter(kept => kept !== tag)
      paint()
    })
    item.append(tag, remove)
    return item
  }

  function paint(): void {
    chips.replaceChildren(...tags.map(chip))
    offered.replaceChildren(...suggestions.filter(tag => !tags.includes(tag)).map(tag => new Option(tag)))
    pending.value = formatTags(pendingTags())
  }

  add.addEventListener('input', () => { pending.value = formatTags(pendingTags()) })
  add.addEventListener('keydown', event => {
    // Enter on a typed tag adds it. Enter in the empty field saves the form, as in its other fields.
    if (event.key !== 'Enter' || add.value.trim() === '') return
    event.preventDefault()
    tags = pendingTags()
    add.value = ''
    paint()
  })
  paint()
  return field
}

export const tagsFieldCss = `
  #details .tags-field { display: grid; gap: 5px; font-size: 12px; }
  #details .tags-field .pending-tags { display: flex; flex-wrap: wrap; gap: 6px; }
  #details .tags-field .pending-tags:empty { display: none; }
  /* People type a tag again in commands, so its chip keeps the authored spelling. */
  #details .tags-field .tag {
    display: inline-flex; align-items: center; border: 1px solid var(--hairline); border-radius: 10px;
    padding-left: 8px; font-size: 11px; line-height: 20px; color: var(--ink);
  }
  #details .tags-field .tag-remove {
    border: 0; border-radius: 10px; padding: 0 7px 0 4px; background: transparent; color: inherit;
    line-height: 20px; opacity: 0.45; transition: opacity 160ms ease;
  }
  #details .tags-field .tag-remove:hover, #details .tags-field .tag-remove:focus-visible { background: transparent; opacity: 1; }
  @media (prefers-reduced-motion: reduce) { #details .tags-field .tag-remove { transition: none; } }
`
