import { parseTags } from '../../../tags.ts'
import { message } from './editable.ts'

export interface TagRowOptions {
  /** The element the tags belong to. */
  elementId: string
  /** Every tag the architecture uses, offered while a new one is typed. */
  known: readonly string[]
  /** Present on a live map: stores the element's complete new list at once. */
  onTags?: (tags: string[]) => Promise<void>
  /** Text to put back in the Add tag field with the caret, from `typedTag`. */
  typing?: string
}

/**
 * What the person is typing in this element's Add tag field, or undefined while the caret is elsewhere.
 * Storing a tag repaints the pane and replaces the row, so the pane reads this before a repaint and hands
 * it to the new row: the caret stays, and several tags can be typed one after another.
 */
export function typedTag(host: Element, elementId: string): string | undefined {
  const field = host.querySelector<HTMLInputElement>('.tag-row .tag-add')
  if (field === null || field !== document.activeElement) return undefined
  return field.closest<HTMLElement>('.tag-row')!.dataset.elementId === elementId ? field.value : undefined
}

function removeButton(tag: string): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'tag-remove'
  button.textContent = '×'
  button.setAttribute('aria-label', `Remove tag ${tag}`)
  return button
}

/** The field a new tag is typed in, with the tags other elements already use as its suggestions. */
function addField(suggestions: readonly string[]): { field: HTMLInputElement; list: HTMLDataListElement } {
  const field = document.createElement('input')
  field.className = 'tag-add'
  field.placeholder = 'Add tag'
  field.setAttribute('aria-label', 'Add tag')
  field.setAttribute('list', 'known-tags')
  const list = document.createElement('datalist')
  list.id = 'known-tags'
  for (const tag of suggestions) list.append(new Option(tag))
  return { field, list }
}

/**
 * An element's tags as one row of chips under a title. On a live map each chip can be removed and a new tag
 * typed. Every change is stored at once through `onTags`, the shared edit write, as a color or an icon is;
 * a refused write is reported in the row.
 */
export function tagRow(tags: readonly string[], options: TagRowOptions): HTMLElement {
  const { known, onTags, typing } = options
  const row = document.createElement('div')
  row.className = 'tag-row'
  row.dataset.elementId = options.elementId
  row.setAttribute('role', 'group')
  row.setAttribute('aria-label', 'Tags')
  const title = document.createElement('span')
  title.className = 'title'
  title.textContent = 'Tags'
  const error = document.createElement('p')
  error.className = 'error'
  error.setAttribute('role', 'status')
  row.append(title)

  /** One write at a time: the next change starts from the list that write leaves. */
  let storing = false
  async function store(next: string[]): Promise<void> {
    if (storing) return
    storing = true
    error.textContent = ''
    try { await onTags!(next) }
    catch (cause) { error.textContent = message(cause) }
    finally { storing = false }
  }

  for (const tag of tags) {
    const chip = document.createElement('span')
    chip.className = 'tag'
    const name = document.createElement('span')
    name.className = 'tag-name'
    name.textContent = tag
    chip.append(name)
    if (onTags !== undefined) {
      const remove = removeButton(tag)
      remove.addEventListener('click', () => void store(tags.filter(item => item !== tag)))
      chip.append(remove)
    }
    row.append(chip)
  }

  if (onTags !== undefined) {
    const { field, list } = addField(known.filter(tag => !tags.includes(tag)))
    field.addEventListener('keydown', event => {
      if (event.key !== 'Enter') return
      event.preventDefault()
      const added = parseTags(field.value).filter(tag => !tags.includes(tag))
      field.value = ''
      if (added.length > 0) void store([...tags, ...added])
    })
    row.append(field, list)
    if (typing !== undefined) {
      field.value = typing
      queueMicrotask(() => field.focus())
    }
  }
  row.append(error)
  return row
}

export const tagRowCss = `
  #details .tag-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin: 0 0 12px; }
  #details .tag-row .title { margin-right: 6px; }
  /* People type a tag again in commands, so its chip keeps the authored spelling. */
  #details .tag-row .tag {
    display: inline-flex; align-items: center; border: 1px solid var(--hairline); border-radius: 10px;
    font-size: 11px; line-height: 16px; color: var(--ink);
  }
  #details .tag-name { padding: 2px 8px; }
  #details .tag-remove {
    margin-left: -6px; padding: 2px 7px 2px 3px; border: 0; line-height: 16px; opacity: 0.45;
    transition: opacity 160ms ease;
  }
  #details .tag-remove:hover, #details .tag-remove:focus-visible { opacity: 1; }
  #details .tag-add {
    width: 11ch; padding: 2px 8px; border: 1px dashed var(--hairline); border-radius: 10px;
    background: transparent; color: var(--ink); font: inherit; font-size: 11px; line-height: 16px;
    transition: width 160ms ease, border-color 160ms ease;
  }
  #details .tag-add:focus { width: 18ch; border-style: solid; border-color: var(--ink); outline: none; }
  #details .tag-row .error { flex-basis: 100%; margin: 0; color: var(--highlight-text); }
  #details .tag-row .error:empty { display: none; }
  @media (prefers-reduced-motion: reduce) { #details .tag-remove, #details .tag-add { transition: none; } }
`
