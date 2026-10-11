import { accentColour, accentColours } from '../../../element-appearance.ts'
import type { AnnotatedElement } from '../../../types.ts'

export const colourLegendCss = `
  #colour-legend { display: flex; flex-wrap: wrap; gap: 4px 16px; margin-top: 8px; }
  #colour-legend:empty { display: none; }
  #colour-legend i { flex: none; width: 8px; height: 8px; border-radius: 50%; background: var(--element-colour); }
`

/**
 * The accent colours in use, each once however its elements spell it: a name and its hex are one colour.
 * `colour` is the lower-case hex; `label` is the colour's name, or the hex again when it has none.
 */
export function colourCounts(
  elements: readonly Pick<AnnotatedElement, 'colour'>[],
): { colour: string; label: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const element of elements) {
    const colour = accentColour(element.colour)
    if (colour !== undefined) counts.set(colour, (counts.get(colour) ?? 0) + 1)
  }
  const nameOf = (colour: string) => Object.keys(accentColours).find(name => accentColours[name] === colour)
  return [...counts]
    .map(([colour, count]) => ({ colour, label: nameOf(colour) ?? colour, count }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

/** Fills the page's colour legend; with no accent colour in use it stays empty, and the stylesheet hides it. */
export function paintColourLegend(host: HTMLElement, elements: readonly AnnotatedElement[]): void {
  host.replaceChildren(...colourCounts(elements).map(({ colour, label, count }) => {
    const row = document.createElement('span')
    const swatch = document.createElement('i')
    swatch.style.setProperty('--element-colour', colour)
    row.append(swatch, `${label} ${count}`)
    return row
  }))
}
