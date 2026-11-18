import type { TagCount, TagFocus } from '../../../tag-selection.ts'
import { bindPopover } from '../atoms/popover.ts'

interface TagListActions {
  toggle(tag: string): void
  exclude(tag: string): void
  previewChanged(): void
}

interface TagListRow {
  tag: string
  row: HTMLElement
  choice: HTMLButtonElement
  exclude: HTMLButtonElement
}

function tagListRow({ tag, count }: TagCount, index: number, actions: TagListActions): TagListRow {
  const row = document.createElement('div')
  row.id = `tag-option-${index}`
  row.className = 'tag-option'
  row.setAttribute('role', 'group')
  row.setAttribute('aria-label', `${tag}, ${count} ${count === 1 ? 'element' : 'elements'}`)
  const choice = document.createElement('button')
  choice.type = 'button'
  choice.className = 'tag-choice'
  choice.textContent = tag
  const exclude = document.createElement('button')
  exclude.type = 'button'
  exclude.className = 'tag-not'
  exclude.textContent = 'not'
  exclude.setAttribute('aria-label', `Exclude ${tag}`)
  const total = document.createElement('span')
  total.className = 'tag-count'
  total.textContent = String(count)
  row.append(choice, exclude, total)
  // The choice button is stretched over the whole row (see `.tag-choice::after`), so a click on the name
  // or the count toggles the tag. Any other button of the row stands above it and only does its own action.
  choice.addEventListener('click', () => actions.toggle(tag))
  exclude.addEventListener('click', () => actions.exclude(tag))
  return { tag, row, choice, exclude }
}

function findField(): HTMLInputElement {
  const find = document.createElement('input')
  find.type = 'search'
  find.placeholder = 'Find a tag'
  find.setAttribute('aria-label', find.placeholder)
  find.autocomplete = 'off'
  return find
}

/** The list owns its keyboard highlight. The find field keeps focus while the arrow keys move it. */
export function bindTagList(host: HTMLElement, button: HTMLButtonElement, actions: TagListActions) {
  const panel = document.createElement('div')
  panel.id = 'tag-list'
  panel.className = 'anchored-popover animated'
  panel.hidden = true
  const find = findField()
  const choices = document.createElement('div')
  choices.id = 'tag-options'
  choices.setAttribute('role', 'group')
  find.setAttribute('aria-controls', choices.id)
  panel.append(find, choices)
  host.append(panel)
  button.setAttribute('aria-controls', panel.id)
  button.setAttribute('aria-expanded', 'false')

  let open = false
  let rows: TagListRow[] = []
  /*
   * Two things can point at a row, and each has one variable:
   * - `highlighted` is the keyboard's row. The arrow keys and Tab set it; typing in the find field, leaving
   *   the find field and closing the list clear it. Enter toggles it.
   * - `previewed` is the tag the map previews: the row under the pointer, or the highlighted row. Every
   *   change goes through `preview`, which tells the map. A click or Enter ends the preview (the owner of
   *   the focus calls `endPreview`), so the map shows what was just kept and not what toggling the same
   *   row again would undo.
   */
  let highlighted: TagListRow | undefined
  let previewed: string | undefined

  function preview(tag: string | undefined): void {
    if (tag === previewed) return
    previewed = tag
    actions.previewChanged()
  }

  function highlight(option: TagListRow | undefined): void {
    // The pointer may be previewing another row. Clearing the highlight ends only the highlight's own preview.
    const previewedHighlight = highlighted !== undefined && previewed === highlighted.tag
    highlighted?.row.classList.remove('highlighted')
    highlighted = option
    if (option === undefined) {
      find.removeAttribute('aria-activedescendant')
      if (previewedHighlight) preview(undefined)
    } else {
      option.row.classList.add('highlighted')
      find.setAttribute('aria-activedescendant', option.row.id)
      preview(option.tag)
    }
  }

  function watchRow(tagCount: TagCount, index: number): TagListRow {
    const option = tagListRow(tagCount, index, actions)
    const { row, tag } = option
    row.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'touch') preview(tag)
    })
    row.addEventListener('pointerleave', () => {
      if (previewed === tag) preview(highlighted?.tag)
    })
    row.addEventListener('focusin', event => {
      // Tab into a row moves the keyboard highlight there. A pointer click also focuses a button, and must not.
      if (event.target instanceof Element && event.target.matches(':focus-visible')) highlight(option)
    })
    row.addEventListener('focusout', event => {
      if (!row.contains(event.relatedTarget as Node | null)) highlight(undefined)
    })
    return option
  }

  /** Marks each row as focused, excluded or neither. */
  function paintFocus(focus: TagFocus): void {
    for (const { tag, choice, exclude } of rows) {
      choice.setAttribute('aria-pressed', String(focus.focused.includes(tag)))
      exclude.setAttribute('aria-pressed', String(focus.excluded.includes(tag)))
    }
  }

  function matchingRows(): TagListRow[] {
    const query = find.value.trim().toLowerCase()
    return rows.filter(({ tag }) => tag.toLowerCase().includes(query))
  }

  function filterRows(): void {
    highlight(undefined)
    const visible = new Set(matchingRows())
    for (const option of rows) option.row.hidden = !visible.has(option)
    choices.scrollTop = 0
  }

  function openList(): void {
    if (rows.length === 0) return
    open = true
    panel.hidden = false
    button.setAttribute('aria-expanded', 'true')
    find.focus()
  }

  function closeList(): void {
    if (!open) return
    open = false
    panel.hidden = true
    button.setAttribute('aria-expanded', 'false')
    preview(undefined)
    find.value = ''
    filterRows()
  }

  function moveHighlight(direction: number): void {
    const visible = matchingRows()
    if (visible.length === 0) return
    const current = highlighted === undefined ? -1 : visible.indexOf(highlighted)
    let next = current + direction
    if (next < 0) next = visible.length - 1
    if (next >= visible.length) next = 0
    const option = visible[next]!
    find.focus()
    highlight(option)
    option.row.scrollIntoView({ block: 'nearest' })
  }

  function toggleHighlighted(target: EventTarget | null): boolean {
    if (target !== find || highlighted === undefined) return false
    actions.toggle(highlighted.tag)
    return true
  }

  function closeFromKeyboard(): void {
    closeList()
    button.focus()
  }

  function runListKey(event: KeyboardEvent): boolean {
    switch (event.key) {
      case 'ArrowDown':
        moveHighlight(1)
        return true
      case 'ArrowUp':
        moveHighlight(-1)
        return true
      case 'Enter':
        return toggleHighlighted(event.target)
      case 'Escape':
        closeFromKeyboard()
        return true
      default:
        return false
    }
  }

  function listKey(event: KeyboardEvent): void {
    if (!open) return
    const handled = runListKey(event)
    if (!handled) return
    event.preventDefault()
    event.stopImmediatePropagation()
  }

  button.addEventListener('click', () => {
    if (open) closeList()
    else openList()
  })
  find.addEventListener('input', filterRows)
  find.addEventListener('blur', () => highlight(undefined))
  // Clicking the count or the panel background can leave the page body holding keyboard focus.
  document.addEventListener('keydown', listKey, true)
  host.addEventListener('focusout', event => {
    if (event.relatedTarget instanceof Node && !host.contains(event.relatedTarget)) closeList()
  })
  bindPopover(host, { dismiss: closeList })

  return {
    open: openList,
    close: closeList,
    get previewedTag() { return previewed },
    endPreview: () => preview(undefined),
    paintFocus,
    /** Only a new architecture replaces rows. A focus change leaves the current row usable. */
    setTags(counts: readonly TagCount[]): void {
      if (counts.length === 0) closeList()
      rows = counts.map(watchRow)
      choices.replaceChildren(...rows.map(option => option.row))
      filterRows()
    },
  }
}

/** The searchable panel and the three states of a tag row. */
export const tagListCss = `
  #tag-list {
    left: 0; right: auto; width: min(340px, 100%); padding: 12px;
    max-height: min(460px, calc(100dvh - var(--chrome-inset, 0px) - 144px));
    background: var(--paper); pointer-events: auto;
  }
  #tag-list:not([hidden]) { display: flex; flex-direction: column; gap: 8px; }
  #tag-list input {
    flex: none; width: 100%; height: 38px; padding: 0 10px; border: 1px solid var(--hairline);
    border-radius: var(--control-radius); background: transparent; color: var(--ink); font: inherit;
  }
  #tag-list input:focus-visible { outline: 1px solid var(--highlight); outline-offset: -1px; }
  #tag-options { overflow-y: auto; }
  .tag-option { position: relative; display: flex; align-items: center; gap: 6px; padding: 0 10px; border-radius: var(--control-radius); cursor: pointer; }
  .tag-option[hidden] { display: none; }
  .tag-option:hover, .tag-option.highlighted { background: var(--hover); }
  .tag-choice {
    flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: left;
    height: 32px; padding: 0; border: 0;
  }
  .tag-choice::before {
    content: ''; display: inline-block; width: 8px; height: 8px; margin-right: 10px;
    border: 1px solid var(--muted); border-radius: 50%;
  }
  /* Stretches the choice over its row, so the whole row toggles the tag without a listener on the row. */
  .tag-choice::after { content: ''; position: absolute; inset: 0; }
  .tag-choice[aria-pressed="true"]::before { background: var(--accent); border-color: var(--accent); }
  .tag-option:has(.tag-not[aria-pressed="true"]) .tag-choice::before {
    border-color: var(--accent); background: linear-gradient(135deg, transparent 40%, var(--accent) 45% 55%, transparent 60%);
  }
  .tag-not { position: relative; z-index: 1; visibility: hidden; border: 0; border-radius: var(--control-radius); color: var(--muted); font-size: 11px; }
  .tag-option:hover .tag-not, .tag-option.highlighted .tag-not, .tag-option:focus-within .tag-not { visibility: visible; }
  .tag-not:hover, .tag-not[aria-pressed="true"] { color: var(--accent-text); }
  .tag-count { min-width: 2ch; color: var(--muted); font-size: 10px; text-align: right; }
  @media (hover: none) { .tag-not { visibility: visible; } }
`
