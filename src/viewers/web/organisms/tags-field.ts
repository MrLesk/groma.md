import { formatTags, parseTags } from '../../../tags.ts'

/** How many tags already in use the field offers at once; typing narrows them. */
const OFFERED = 8

/**
 * The Tags field of an edit form: one box that holds the record's tags as chips and the text being typed.
 * Enter or a comma turns the typed text into a chip, Backspace in the empty text takes the last chip off,
 * and the tags already in use are offered under the box, narrowed by what is typed. Nothing is stored
 * here: the hidden control named `name` holds the pending list as the comma-separated text every edit
 * uses, and the form sends it when Save is pressed.
 */
export function tagsField(name: string, label: string, value: string, suggestions: readonly string[]): HTMLElement {
  const field = document.createElement('div')
  field.className = 'tags-field'
  field.setAttribute('role', 'group')
  field.setAttribute('aria-label', label)
  const title = document.createElement('span')
  title.textContent = label
  const box = document.createElement('div')
  box.className = 'tag-box'
  const add = document.createElement('input')
  add.placeholder = 'Add tag'
  add.setAttribute('aria-label', 'Add tag')
  add.autocomplete = 'off'
  const offered = document.createElement('div')
  offered.className = 'tag-suggestions'
  const pending = document.createElement('input')
  pending.type = 'hidden'
  pending.name = name
  field.append(title, box, offered, pending)

  let tags = parseTags(value)
  /** Text still being typed counts, so Save keeps a tag that was typed without Enter. */
  const pendingTags = (): string[] => parseTags([...tags, add.value].join(','))

  function chip(tag: string, added: boolean): HTMLElement {
    const item = document.createElement('span')
    item.className = added ? 'tag added' : 'tag'
    const remove = document.createElement('button')
    remove.type = 'button'
    remove.className = 'tag-remove'
    remove.textContent = '×'
    remove.setAttribute('aria-label', `Remove tag ${tag}`)
    remove.addEventListener('click', () => {
      tags = tags.filter(kept => kept !== tag)
      paint()
      add.focus()
    })
    item.append(tag, remove)
    return item
  }

  function suggestion(tag: string): HTMLElement {
    const offer = document.createElement('button')
    offer.type = 'button'
    offer.className = 'tag-suggestion'
    offer.textContent = tag
    offer.setAttribute('aria-label', `Add tag ${tag}`)
    offer.addEventListener('click', () => {
      add.value = ''
      commit([...tags, tag])
      add.focus()
    })
    return offer
  }

  /** The tags in use that the record does not carry yet and that contain the typed text. */
  function paintSuggestions(): void {
    const typed = add.value.trim().toLowerCase()
    const open = suggestions.filter(tag => !tags.includes(tag) && tag.toLowerCase().includes(typed))
    offered.replaceChildren(...open.slice(0, OFFERED).map(suggestion))
  }

  /** Repaints the chips; `added` are the tags that just joined, which fade in. */
  function paint(added: readonly string[] = []): void {
    box.replaceChildren(...tags.map(tag => chip(tag, added.includes(tag))), add)
    pending.value = formatTags(pendingTags())
    paintSuggestions()
  }

  function commit(next: string[]): void {
    const before = tags
    tags = parseTags(next.join(','))
    paint(tags.filter(tag => !before.includes(tag)))
  }

  // A click anywhere in the box types into it, as in any input.
  box.addEventListener('click', event => { if (event.target === box) add.focus() })
  add.addEventListener('input', () => {
    // Pasted or typed commas end a tag each; the text after the last comma stays in the field.
    const parts = add.value.split(',')
    if (parts.length > 1) {
      add.value = parts.pop()!
      commit([...tags, ...parts])
      return
    }
    pending.value = formatTags(pendingTags())
    paintSuggestions()
  })
  add.addEventListener('keydown', event => {
    if (event.key === 'Backspace' && add.value === '' && tags.length > 0) {
      commit(tags.slice(0, -1))
      return
    }
    // Enter on typed text adds it. Enter in the empty field saves the form, as in its other fields.
    if (event.key !== 'Enter' || add.value.trim() === '') return
    event.preventDefault()
    const typed = add.value
    add.value = ''
    commit([...tags, typed])
  })
  paint()
  return field
}

export const tagsFieldCss = `
  #details .tags-field { display: grid; gap: 5px; font-size: 12px; }
  /* The chips and the text being typed share one box that reads as a single input. */
  #details .tags-field .tag-box {
    display: flex; flex-wrap: wrap; align-items: center; gap: 5px; box-sizing: border-box; min-height: 32px;
    border: 1px solid var(--hairline); border-radius: 4px; padding: 4px 6px; cursor: text;
    background: color-mix(in srgb, var(--paper) 35%, transparent);
  }
  #details .tags-field .tag-box:focus-within { outline: 2px solid var(--highlight); }
  /* People type a tag again in commands, so its chip keeps the authored spelling. */
  #details .tags-field .tag {
    display: inline-flex; align-items: center; border-radius: 10px; padding-left: 8px; cursor: default;
    background: color-mix(in srgb, var(--ink) 9%, transparent); font-size: 11px; line-height: 22px; color: var(--ink);
  }
  #details .tags-field .tag.added { animation: tag-added 160ms ease; }
  #details .tags-field .tag-remove {
    border: 0; border-radius: 10px; padding: 0 7px 0 4px; background: transparent; color: inherit;
    line-height: 22px; opacity: 0.45; transition: opacity 160ms ease;
  }
  #details .tags-field .tag-remove:hover, #details .tags-field .tag-remove:focus-visible { background: transparent; opacity: 1; }
  #details .edit-form .tags-field .tag-box input {
    flex: 1 1 72px; width: auto; min-width: 72px; border: 0; border-radius: 0; padding: 0 2px;
    background: transparent; line-height: 22px;
  }
  #details .edit-form .tags-field .tag-box input:focus { outline: none; }
  #details .tags-field .tag-suggestions { display: flex; flex-wrap: wrap; gap: 5px; }
  #details .tags-field .tag-suggestions:empty { display: none; }
  #details .tags-field .tag-suggestion {
    border: 1px dashed var(--hairline); border-radius: 10px; padding: 0 8px; background: transparent;
    font-size: 11px; line-height: 20px; color: var(--muted);
    transition: color 160ms ease, border-color 160ms ease;
  }
  #details .tags-field .tag-suggestion::before { content: '+ '; opacity: 0.6; }
  #details .tags-field .tag-suggestion:hover, #details .tags-field .tag-suggestion:focus-visible {
    border-style: solid; border-color: var(--ink); background: transparent; color: var(--ink);
  }
  @keyframes tag-added { from { opacity: 0; transform: scale(0.85); } }
  @media (prefers-reduced-motion: reduce) {
    #details .tags-field .tag.added { animation: none; }
    #details .tags-field .tag-remove, #details .tags-field .tag-suggestion { transition: none; }
  }
`
