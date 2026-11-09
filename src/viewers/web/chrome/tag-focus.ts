import { selectByTags, tagCounts, tagsInUse, type TagSelection } from '../../../tag-selection.ts'
import type { ArchitectureGraph } from '../../../types.ts'

/** Tags as toggles: a chip is pressed while the map is focused on its tag. */
export function tagChips(
  tags: readonly { tag: string; count?: number }[],
  focused: readonly string[],
  onToggle: (tag: string) => void,
): HTMLDivElement {
  const chips = document.createElement('div')
  chips.className = 'tag-chips'
  for (const { tag, count } of tags) {
    const chip = document.createElement('button')
    chip.type = 'button'
    chip.className = 'tag-chip'
    chip.setAttribute('aria-pressed', String(focused.includes(tag)))
    chip.append(tag)
    if (count !== undefined) {
      const total = document.createElement('span')
      total.className = 'count'
      total.textContent = String(count)
      chip.append(total)
    }
    chip.addEventListener('click', () => onToggle(tag))
    chips.append(chip)
  }
  return chips
}

/**
 * The tags the map is focused on. This control owns that list: the Tags block in the
 * hierarchy pane, the tag chips in the details pane and the URL all read and toggle it here.
 */
export function bindTagFocus(host: HTMLElement, initial: readonly string[], onChange: () => void) {
  let focused = [...initial]
  function toggle(tag: string): void {
    focused = focused.includes(tag) ? focused.filter(item => item !== tag) : [...focused, tag]
    onChange()
  }
  return {
    get tags(): readonly string[] { return focused },
    toggle,
    /** Replaces the focus without notifying, for a view opened from a link. */
    set(tags: readonly string[]): void { focused = [...tags] },
    /** After the world changed: a focused tag no element carries any more leaves the focus. */
    retain(world: ArchitectureGraph): void { focused = tagsInUse(world.elements, focused) },
    /** What the focused tags select in this world; undefined while no tag is focused. */
    matches(world: ArchitectureGraph): TagSelection | undefined {
      return focused.length === 0 ? undefined : selectByTags(world.elements, focused)
    },
    /** Lists the tags this world uses, pressed while focused. */
    paint(world: ArchitectureGraph): void {
      const inUse = tagCounts(world.elements)
      host.hidden = inUse.length === 0
      const title = document.createElement('span')
      title.className = 'title'
      title.textContent = 'Tags'
      host.replaceChildren(title, tagChips(inUse, focused, toggle))
    },
  }
}

export const tagFocusCss = `
  #tags { display: grid; gap: 8px; max-height: 30%; overflow: auto; padding: 12px 16px; border-top: 1px solid var(--hairline); }
  #tags[hidden] { display: none; }
  .tag-chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .tag-chip {
    display: inline-flex; align-items: baseline; gap: 6px; padding: 2px 8px;
    border: 1px solid var(--hairline); border-radius: 10px; font-size: 11px; color: var(--ink);
    transition: color 160ms ease, background 160ms ease, border-color 160ms ease;
  }
  .tag-chip:hover { border-color: var(--ink); }
  .tag-chip[aria-pressed="true"] { border-color: var(--ink); background: var(--ink); color: var(--paper); }
  .tag-chip .count { font-size: 10px; opacity: 0.6; }
  @media (prefers-reduced-motion: reduce) { .tag-chip { transition: none; } }
`
