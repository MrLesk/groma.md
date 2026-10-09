import { outlierLine, type CodeHistory, type ComponentMetrics } from '../../../component-metrics.ts'
import type { ArchitectureGraph } from '../../../types.ts'

/** Live measurements stay outside the authored description and published detail model. */
export function paintMetricDetails(
  host: HTMLElement,
  id: string,
  world: ArchitectureGraph,
  measurements: Map<string, ComponentMetrics>,
  history: CodeHistory | null,
  select: (id: string) => void,
): void {
  host.querySelector('.code-metrics')?.remove()
  const metrics = measurements.get(id)
  if (metrics === undefined) return
  const section = document.createElement('section')
  section.className = 'code-metrics'
  const line = (text: string) => {
    const p = document.createElement('p')
    p.textContent = text
    section.append(p)
  }
  const outlier = outlierLine(metrics)
  if (outlier !== undefined) line(outlier)
  const changes = history?.components[id]
  if (changes !== undefined) {
    const title = document.createElement('h2')
    title.textContent = 'Code metrics'
    section.prepend(title)
    line(`${changes.commits} commits · ${changes.committers} committers · last ${history!.window} commits`)
    line(`Instability: ${metrics.instability.toFixed(2)} · ${metrics.connections} connections`)
    line(`Co-change: ${changes.cochange.reduce((total, pair) => total + pair.commits, 0)} shared commits`)
    if (changes.cochange.length > 0) {
      const heading = document.createElement('h3')
      heading.textContent = 'Top co-changing components'
      section.append(heading)
      const list = document.createElement('ul')
      for (const pair of changes.cochange.slice(0, 5)) {
        const peer = world.elements.find(element => element.id === pair.id)
        const related = world.relationships.some(edge =>
          (edge.source === id && edge.target === pair.id) || (edge.target === id && edge.source === pair.id))
        const item = document.createElement('li')
        const button = document.createElement('button')
        button.type = 'button'
        button.className = 'link'
        button.textContent = `${peer?.title ?? pair.id} · ${pair.commits}${related ? '' : ' · no relationship'}`
        button.addEventListener('click', () => select(pair.id))
        item.append(button)
        list.append(item)
      }
      section.append(list)
    }
  }
  if (section.childElementCount > 0) host.querySelector('.body')?.append(section)
}
