import { factRow } from '../atoms/fact-row.ts'
import { tagChip } from './tag-focus.ts'

/**
 * A record's own tags as a row of chips in its reading pane. Pressing a chip toggles the map's focus.
 * To change the tags on an element, use its Edit form.
 */
export function tagRow(tags: readonly string[], focused: readonly string[], onToggle: (tag: string) => void): HTMLElement {
  const chips = tags.map(tag => {
    const chip = tagChip(tag, () => onToggle(tag))
    chip.setAttribute('aria-pressed', String(focused.includes(tag)))
    return chip
  })
  return factRow('Tags', chips)
}
