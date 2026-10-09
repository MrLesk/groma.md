import { accentColour } from '../../../element-appearance.ts'
import type { AnnotatedElement } from '../../../types.ts'

/** Authored colour counts are separate from the live metric scale. */
export function paintColourLegend(host: HTMLElement, elements: readonly AnnotatedElement[]): void {
  let legend = host.querySelector<HTMLElement>('#colour-legend')
  if (!legend) {
    legend = document.createElement('aside')
    legend.id = 'colour-legend'
    legend.setAttribute('aria-label', 'Architecture colours')
    legend.style.cssText = 'display:flex;gap:8px 12px;flex-wrap:wrap;margin-top:12px;font-size:12px'
    host.append(legend)
  }
  const counts = new Map<string, number>()
  for (const element of elements) if (element.colour) counts.set(element.colour, (counts.get(element.colour) ?? 0) + 1)
  legend.replaceChildren()
  legend.style.display = counts.size ? 'flex' : 'none'
  for (const [colour, count] of [...counts].sort(([a], [b]) => a.localeCompare(b))) {
    const row = document.createElement('span')
    const swatch = document.createElement('i')
    swatch.style.cssText = `display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px;background:${accentColour(colour)}`
    row.append(swatch, `${colour} ${count}`)
    legend.append(row)
  }
}
