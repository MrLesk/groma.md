import { formatTags, parseTags } from '../../../tags.ts'
import type { TagCount } from '../../../tag-selection.ts'

/*
 * The names of the field's two hidden controls. They are the names the edit input uses for tag changes
 * (`addTags`, `removeTags` in src/markdown-emitter.ts), so what the form sends needs no translation.
 */
const ADDED_CONTROL = 'addTags'
const REMOVED_CONTROL = 'removeTags'

/** The tag changes a form with a Tags field asks for on Save. A list nobody changed has no entry. */
export function tagChanges(values: Record<string, string>): { addTags?: string; removeTags?: string } {
  const addTags = values[ADDED_CONTROL]
  const removeTags = values[REMOVED_CONTROL]
  return {
    ...(addTags ? { addTags } : {}),
    ...(removeTags ? { removeTags } : {}),
  }
}

/** The Tags field opens on the tags its records carry and offers other tags in use. */
export interface TagsField {
  label: string
  /** Each tag a record carries, with the number of records that carry it. */
  carried: readonly TagCount[]
  recordCount: number
  suggestions: readonly string[]
}

/** What the person changed since the field opened: the tags every record gains and the tags every record loses. */
interface PendingTags {
  added: Set<string>
  removed: Set<string>
}

/** How many tags already in use the field offers at once; typing narrows them. */
const OFFERED = 8

/**
 * The chips the field shows, each with the number of records that will carry its tag: a carried tag keeps
 * its count until it is given to all records or taken from all. A count below `recordCount` is a partial chip.
 */
function chipCounts(carried: ReadonlyMap<string, number>, recordCount: number, pending: PendingTags): Map<string, number> {
  const counts = new Map(carried)
  for (const tag of pending.removed) counts.delete(tag)
  for (const tag of pending.added) counts.set(tag, recordCount)
  return counts
}

function hiddenControl(name: string): HTMLInputElement {
  const control = document.createElement('input')
  control.type = 'hidden'
  control.name = name
  return control
}

/** A partial chip gives its tag to every record when the person presses its name. */
function partialTag(tag: string, count: number, recordCount: number, give: () => void): HTMLButtonElement {
  const name = document.createElement('button')
  name.type = 'button'
  name.className = 'tag-name'
  name.setAttribute('aria-label', `Add tag ${tag} to all ${recordCount}`)
  name.addEventListener('click', give)
  const number = document.createElement('span')
  number.className = 'tag-count'
  number.textContent = `${count} of ${recordCount}`
  name.append(tag, number)
  return name
}

/**
 * The Tags field of a write view, for one record or for several: one box that holds the carried tags as
 * chips and the text being typed. Enter or a comma turns the typed text into a chip, Backspace in the empty
 * text takes the last chip off, and the tags already in use are offered under the box. A tag only some
 * records carry is a partial chip that reads how many; pressing its name gives it to all. Nothing is stored
 * here: the field keeps what the person changed in `pending` and publishes it through two hidden controls,
 * which the form sends when Save is pressed (`tagChanges` reads them back).
 */
export function tagsField({ label, carried, recordCount, suggestions }: TagsField): HTMLElement {
  const carriedCounts = new Map(carried.map(({ tag, count }) => [tag, count]))
  const pending: PendingTags = { added: new Set(), removed: new Set() }
  const field = document.createElement('div')
  field.className = 'tags-field'
  field.setAttribute('role', 'group')
  field.setAttribute('aria-label', label)
  const title = document.createElement('span')
  title.className = 'field-title'
  title.textContent = label
  const box = document.createElement('div')
  box.className = 'tag-box'
  const chips = document.createElement('span')
  chips.className = 'tag-chips'
  const typing = document.createElement('input')
  typing.placeholder = 'Add tag'
  typing.setAttribute('aria-label', 'Add tag')
  typing.autocomplete = 'off'
  const offered = document.createElement('div')
  offered.className = 'tag-suggestions'
  const addedControl = hiddenControl(ADDED_CONTROL)
  const removedControl = hiddenControl(REMOVED_CONTROL)
  box.append(chips, typing)
  field.append(title, box, offered, addedControl, removedControl)

  const shownChips = (): Map<string, number> => chipCounts(carriedCounts, recordCount, pending)

  /** Marks one tag as wanted on every record. A tag all of them carry already needs no change. */
  function markForAll(tag: string, tags: PendingTags): void {
    tags.removed.delete(tag)
    if (carriedCounts.get(tag) !== recordCount) tags.added.add(tag)
  }

  /** Writes the pending changes to the hidden controls. Text still being typed counts, so Save keeps a tag typed without Enter. */
  function publish(): void {
    const withTyped: PendingTags = { added: new Set(pending.added), removed: new Set(pending.removed) }
    for (const tag of parseTags(typing.value)) markForAll(tag, withTyped)
    addedControl.value = formatTags([...withTyped.added])
    removedControl.value = formatTags([...withTyped.removed])
  }

  /** Gives these tags to every record and repaints; the chips that just became full fade in. */
  function addToAll(tags: readonly string[]): void {
    const before = shownChips()
    for (const tag of tags) markForAll(tag, pending)
    paint(tags.filter(tag => before.get(tag) !== recordCount))
    typing.focus()
  }

  function removeFromAll(tag: string): void {
    // Clicking × after typing the chip's name must also clear the text that Save would add.
    if (typing.value.trim() === tag) typing.value = ''
    pending.added.delete(tag)
    if (carriedCounts.has(tag)) pending.removed.add(tag)
    paint()
    typing.focus()
  }

  function chip(tag: string, count: number, justAdded: boolean): HTMLElement {
    const chip = document.createElement('span')
    chip.className = 'tag'
    if (justAdded) chip.classList.add('added')
    if (count < recordCount) {
      chip.classList.add('partial')
      chip.append(partialTag(tag, count, recordCount, () => addToAll([tag])))
    } else chip.append(tag)
    const remove = document.createElement('button')
    remove.type = 'button'
    remove.className = 'tag-remove'
    remove.textContent = '×'
    remove.setAttribute('aria-label', `Remove tag ${tag}`)
    remove.addEventListener('click', () => removeFromAll(tag))
    chip.append(remove)
    return chip
  }

  function suggestion(tag: string): HTMLElement {
    const offer = document.createElement('button')
    offer.type = 'button'
    offer.className = 'tag-suggestion'
    offer.textContent = tag
    offer.setAttribute('aria-label', `Add tag ${tag}`)
    offer.addEventListener('click', () => {
      typing.value = ''
      addToAll([tag])
    })
    return offer
  }

  /** Offer matching tags in use that have no chip in the box. */
  function paintSuggestions(shown: ReadonlyMap<string, number>): void {
    const typed = typing.value.trim().toLowerCase()
    const open = suggestions.filter(tag => !shown.has(tag) && tag.toLowerCase().includes(typed))
    offered.replaceChildren(...open.slice(0, OFFERED).map(suggestion))
  }

  function paint(justAdded: readonly string[] = []): void {
    const shown = shownChips()
    chips.replaceChildren(...Array.from(shown, ([tag, count]) => chip(tag, count, justAdded.includes(tag))))
    publish()
    paintSuggestions(shown)
  }

  // A click anywhere in the box types into it, as in any input.
  box.addEventListener('click', event => { if (event.target === box) typing.focus() })
  typing.addEventListener('input', () => {
    // Pasted or typed commas end a tag each; the text after the last comma stays in the field.
    const comma = typing.value.lastIndexOf(',')
    if (comma >= 0) {
      const tags = parseTags(typing.value.slice(0, comma))
      typing.value = typing.value.slice(comma + 1)
      addToAll(tags)
      return
    }
    publish()
    paintSuggestions(shownChips())
  })
  typing.addEventListener('keydown', event => {
    if (event.key === 'Backspace' && typing.value === '') {
      const last = [...shownChips().keys()].at(-1)
      if (last !== undefined) removeFromAll(last)
      return
    }
    // Enter on typed text adds it. Enter in the empty field saves the form, as in its other fields.
    if (event.key !== 'Enter' || typing.value.trim() === '') return
    event.preventDefault()
    const typed = typing.value
    typing.value = ''
    addToAll(parseTags(typed))
  })
  paint()
  return field
}

/** The Tags box, its full and partial chips, and the suggestions below it. */
export const tagsFieldCss = `
  #details .tags-field { display: grid; gap: 6px; font-size: 12px; }
  /* The chips and the text being typed share one box that reads as a single input. */
  #details .tags-field .tag-box {
    display: flex; flex-wrap: wrap; align-items: center; gap: 5px; box-sizing: border-box; min-height: 38px;
    border: 1px solid var(--hairline); border-radius: 6px; padding: 7px 8px; cursor: text;
    background: color-mix(in srgb, var(--paper) 72%, transparent);
  }
  #details .tags-field .tag-box:focus-within { outline: 2px solid var(--highlight); outline-offset: -1px; }
  #details .tags-field .tag-chips { display: contents; }
  /* People type a tag again in commands, so its chip keeps the authored spelling. */
  #details .tags-field .tag {
    display: inline-flex; align-items: center; border-radius: 10px; padding-left: 8px; cursor: default;
    background: color-mix(in srgb, var(--ink) 9%, transparent); font-size: 11px; line-height: 22px; color: var(--ink);
  }
  #details .tags-field .tag.added { animation: tag-added 160ms ease; }
  #details .tags-field .tag.partial {
    border: 1px dashed color-mix(in srgb, var(--ink) 35%, transparent); background: transparent; line-height: 20px;
  }
  #details .tags-field .tag-name { border: 0; padding: 0; background: transparent; color: inherit; font: inherit; }
  #details .tags-field .tag-name:hover { text-decoration: underline; }
  #details .tags-field .tag-count { margin-left: 6px; color: var(--muted); font-size: 10px; }
  #details .tags-field .tag-remove {
    border: 0; border-radius: 10px; padding: 0 7px 0 4px; background: transparent; color: inherit;
    line-height: 22px; opacity: 0.45; transition: opacity 160ms ease;
  }
  #details .tags-field .tag-remove:hover, #details .tags-field .tag-remove:focus-visible { background: transparent; opacity: 1; }
  #details .write-form .tags-field .tag-box input {
    flex: 1 1 72px; width: auto; min-width: 72px; border: 0; border-radius: 0; padding: 0 2px;
    background: transparent; line-height: 22px;
  }
  #details .write-form .tags-field .tag-box input:focus { outline: none; }
  #details .tags-field .tag-suggestions { display: flex; flex-wrap: wrap; gap: 5px; }
  #details .tags-field .tag-suggestions:empty { display: none; }
  #details .tags-field .tag-suggestion {
    border: 1px dashed color-mix(in srgb, var(--ink) 35%, transparent); border-radius: 10px; padding: 0 8px;
    background: transparent; font-size: 11px; line-height: 20px; color: color-mix(in srgb, var(--ink) 75%, transparent);
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
