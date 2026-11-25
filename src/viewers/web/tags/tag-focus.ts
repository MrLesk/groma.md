import { selectByTags, tagFocusInUse, type TagFocus, type TagSelection } from '../../../tag-selection.ts'
import { tagCounts } from '../../../tags.ts'
import type { ArchitectureGraph } from '../../../types.ts'
import { chromeButton } from '../atoms/button.ts'
import type { IsoMap } from '../iso/painting/map.ts'
import type { PinLayer } from '../work/pins.ts'
import { bindTagList } from './tag-list.ts'

interface TagFocusSurfaces {
  map: Pick<IsoMap, 'focusTags'>
  pins: Pick<PinLayer, 'recede'>
  hierarchy: { recede(selection: TagSelection | undefined): void }
  flowList: { recede(selection: TagSelection | undefined): void }
}

/** One tag button, shared by the focus bar and the reading pane. */
export function tagChip(label: string, action: () => void): HTMLButtonElement {
  const chip = document.createElement('button')
  chip.type = 'button'
  chip.className = 'tag-chip'
  chip.textContent = label
  chip.addEventListener('click', action)
  return chip
}

function tagsButton(): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'tags-button'
  button.textContent = 'Tags'
  button.title = 'Tags (T)'
  button.insertAdjacentHTML('afterbegin', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M3 3h9l9 9-9 9-9-9Z"/><circle cx="8" cy="8" r="1"/></svg>')
  return button
}

/** A row preview and a click both ask what would happen after the same toggle. */
function toggleFocusedTag(focus: TagFocus, tag: string): TagFocus {
  const focused = focus.focused.includes(tag) ? focus.focused.filter(name => name !== tag) : [...focus.focused, tag]
  return { ...focus, focused, excluded: focus.excluded.filter(name => name !== tag) }
}

function toggleExcludedTag(focus: TagFocus, tag: string): TagFocus {
  const excluded = focus.excluded.includes(tag) ? focus.excluded.filter(name => name !== tag) : [...focus.excluded, tag]
  return { ...focus, excluded, focused: focus.focused.filter(name => name !== tag) }
}

function removableChip(tag: string, excluded: boolean, remove: () => void): HTMLButtonElement {
  const chip = tagChip(excluded ? `not ${tag}` : tag, remove)
  if (!excluded) chip.classList.add('focused')
  chip.setAttribute('aria-label', excluded ? `Stop excluding ${tag}` : `Stop focusing on ${tag}`)
  chip.append(' ×')
  return chip
}

function matchSwitch(choose: (match: TagFocus['match']) => void) {
  const group = document.createElement('div')
  group.className = 'tag-match-switch'
  group.setAttribute('role', 'group')
  group.setAttribute('aria-label', 'Match focused tags')
  const modes = ['any', 'all'] as const
  const buttons = modes.map(mode => {
    const button = chromeButton(mode)
    button.onclick = () => choose(mode)
    group.append(button)
    return { mode, button }
  })
  return {
    group,
    paint(focus: TagFocus): void {
      group.hidden = focus.focused.length < 2
      for (const { button, mode } of buttons) button.setAttribute('aria-pressed', String(focus.match === mode))
    },
  }
}

/** Owns the committed focus. The Tags list can preview another focus on the map and its lists until a click commits it. */
export function bindTagFocus(world: ArchitectureGraph, initial: TagFocus, surfaces: TagFocusSurfaces, onCommit: () => void) {
  let focus = initial
  const host = document.getElementById('tag-control')!
  const bar = document.createElement('div')
  bar.className = 'floating-map-bar tag-bar'
  const button = tagsButton()
  const chips = document.createElement('div')
  chips.className = 'focus-chips'
  const focusedChips = document.createElement('span')
  const excludedChips = document.createElement('span')
  const match = matchSwitch(mode => commit({ ...focus, match: mode }))
  chips.append(focusedChips, match.group, excludedChips)
  bar.append(button, chips)
  host.append(bar)
  const list = bindTagList(host, button, {
    toggle, exclude, previewChanged: paintSurfaces,
  })

  function selectionFor(tagFocus: TagFocus): TagSelection | undefined {
    if (tagFocus.focused.length === 0 && tagFocus.excluded.length === 0) return undefined
    return selectByTags(world, tagFocus)
  }

  function committedSelection(): TagSelection | undefined {
    return selectionFor(focus)
  }

  function shownSelection(): TagSelection | undefined {
    const tag = list.previewedTag
    if (tag === undefined) return committedSelection()
    return selectionFor(toggleFocusedTag(focus, tag))
  }

  /** Paints what the focus lights and recedes on the map, task pins, hierarchy rows and flow rows. */
  function paintSurfaces(): void {
    const selection = shownSelection()
    surfaces.map.focusTags(selection)
    surfaces.pins.recede(selection)
    surfaces.hierarchy.recede(selection)
    surfaces.flowList.recede(selection)
  }

  function paintControl(): void {
    // Removing the chip under the keyboard returns focus to Tags. The match switch stays in place.
    if (focusedChips.contains(document.activeElement) || excludedChips.contains(document.activeElement)) button.focus()
    focusedChips.replaceChildren(...focus.focused.map(tag => removableChip(tag, false, () => toggle(tag))))
    excludedChips.replaceChildren(...focus.excluded.map(tag => removableChip(tag, true, () => exclude(tag))))
    match.paint(focus)
    chips.hidden = focus.focused.length === 0 && focus.excluded.length === 0
    list.paintFocus(focus)
  }

  function commit(next: TagFocus): void {
    focus = tagFocusInUse(world, next)
    list.endPreview()
    paintControl()
    onCommit()
  }

  function toggle(tag: string): void { commit(toggleFocusedTag(focus, tag)) }
  function exclude(tag: string): void { commit(toggleExcludedTag(focus, tag)) }

  function setWorld(next: ArchitectureGraph): void {
    world = next
    focus = tagFocusInUse(world, focus)
    const counts = tagCounts(world)
    host.hidden = counts.length === 0
    list.setTags(counts)
    paintControl()
  }
  setWorld(world)

  return {
    get focus(): TagFocus { return focus },
    toggle, committedSelection, paintSurfaces, setWorld,
    open: list.open,
    close: list.close,
    /** A link supplies the whole focus and ends any preview of the previous view. */
    restore(next: TagFocus): void {
      focus = tagFocusInUse(world, next)
      list.close()
      paintControl()
    },
  }
}

/** The Tags bar beside the view switch and the chip look it shares with the details pane. */
export const tagFocusCss = `
  #tag-control { position: relative; min-width: 0; flex: 1; }
  .tag-bar { width: fit-content; max-width: 100%; height: 46px; padding: 5px; gap: 6px; pointer-events: auto; }
  .tags-button {
    flex: none; display: flex; align-items: center; gap: 6px; height: 34px; padding: 0 12px;
    border: 0; border-radius: 20px;
  }
  .tags-button svg { width: 15px; height: 15px; }
  .tags-button::after { content: ''; width: 5px; height: 5px; margin: -2px 2px 0; border: solid var(--muted); border-width: 0 1px 1px 0; transform: rotate(45deg); }
  .tags-button:hover, .tags-button[aria-expanded="true"] { background: var(--hover); }
  /* In a narrow window the chips scroll sideways inside the bar. */
  .focus-chips { display: flex; align-items: center; gap: 6px; min-width: 0; overflow-x: auto; }
  .focus-chips > span { display: contents; }
  .focus-chips[hidden], .tag-match-switch[hidden] { display: none; }
  .tag-chip {
    flex: none; padding: 2px 8px; border: 1px solid var(--hairline); border-radius: 16px;
    font-size: 11px; color: var(--ink);
  }
  .tag-chip:hover { border-color: var(--ink); }
  .focus-chips .tag-chip { height: 28px; padding: 0 9px; border-color: var(--accent); }
  .tag-chip[aria-pressed="true"], .tag-chip.focused { border-color: var(--accent); background: var(--accent); color: var(--on-colour); }
  .tag-match-switch { display: flex; flex: none; border: 1px solid var(--hairline); border-radius: 16px; overflow: hidden; }
  .tag-match-switch button { height: 24px; border: 0; border-radius: 0; padding: 0 8px; background: transparent; color: var(--muted); font-size: 10px; }
  .tag-match-switch [aria-pressed="true"] { background: var(--ink); color: var(--paper); }
  /* #map-toolbar is the container. When the panes leave it little room, the list spans the toolbar. */
  @container (max-width: 520px) {
    #tag-control { position: static; }
  }
  /* At the page's minimum width of 900px the toolbar has 212px. Keep room for the chips to scroll. */
  @container (max-width: 260px) {
    .tag-bar { gap: 3px; padding-inline: 3px; }
    .tags-button { gap: 3px; padding-inline: 4px; }
  }
`
