import { componentMetrics, outlierLine } from '../../../component-metrics.ts'
import type { CodeHistory } from '../../../history/code-history.ts'
import type { ArchitectureGraph } from '../../../types.ts'
import { heading, paragraph } from '../atoms/text.ts'

/** "1 commit", "2 commits". */
function counted(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`
}

/** Live measurements stay outside the authored description and published detail model. */
export function paintMetricDetails(
  host: HTMLElement,
  id: string,
  world: ArchitectureGraph,
  codeHistory: CodeHistory | null,
  select: (id: string) => void,
): void {
  host.querySelector('.code-metrics')?.remove()
  const metrics = componentMetrics(world).get(id)
  if (metrics === undefined) return
  const section = document.createElement('section')
  section.className = 'code-metrics'
  const outlier = outlierLine(metrics)
  if (outlier !== undefined) section.append(paragraph('', outlier))
  const changes = codeHistory?.components[id]
  if (codeHistory !== null && changes !== undefined) {
    section.prepend(heading('Code metrics'))
    section.append(
      paragraph('', `${counted(changes.commits, 'commit')} · ${counted(changes.committers, 'committer')} · last ${codeHistory.window} commits`),
      paragraph('', `Instability: ${metrics.instability.toFixed(2)} · ${counted(metrics.connections, 'connection')}`),
      paragraph('', `Co-change: ${counted(changes.cochange, 'shared commit')}`),
    )
    if (changes.peers.length > 0) {
      const list = document.createElement('ul')
      for (const peer of changes.peers.slice(0, 5)) {
        const element = world.elements.find(candidate => candidate.id === peer.id)
        const related = world.relationships.some(edge =>
          (edge.source === id && edge.target === peer.id) || (edge.target === id && edge.source === peer.id))
        const item = document.createElement('li')
        const button = document.createElement('button')
        button.type = 'button'
        button.className = 'link'
        button.textContent = `${element?.title ?? peer.id} · ${peer.commits}${related ? '' : ' · no relationship'}`
        button.addEventListener('click', () => select(peer.id))
        item.append(button)
        list.append(item)
      }
      section.append(heading('Top co-changing components'), list)
    }
  }
  if (section.childElementCount > 0) host.querySelector('.body')?.append(section)
}
