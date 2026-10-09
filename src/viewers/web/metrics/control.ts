import { componentMetrics, type CodeHistory, type ComponentMetrics } from '../../../component-metrics.ts'
import type { ArchitectureGraph } from '../../../types.ts'
import { paintMetricDetails } from './details.ts'

type Metric = 'none' | 'commits' | 'committers' | 'cochange' | 'instability'
const labels: Record<Metric, string> = { none: 'None', commits: 'Commits', committers: 'Committers', cochange: 'Co-change', instability: 'Instability' }

interface Options {
  world(): ArchitectureGraph
  generation(): number
  live(): boolean
  repaint(): void
  select(id: string): void
}

function colour(share: number): string {
  const start = [66, 135, 180]
  const end = [233, 153, 66]
  return `rgb(${start.map((value, index) => Math.round(value + (end[index]! - value) * share)).join(',')})`
}

const css = `
  #metric-options { display: grid; gap: 8px; padding: 10px 12px; border-top: 1px solid var(--hairline); }
  #metric-options[hidden] { display: none; }
  #metric-options label { display: grid; gap: 5px; font-size: 12px; }
  #metric-options select, #metric-options input { width: 100%; min-width: 0; color: var(--ink); background: var(--paper); border: 1px solid var(--hairline); border-radius: 3px; padding: 4px; font: inherit; }
  #metric-legend { margin-top: 12px; font-size: 11px; line-height: 1.5; }
  #metric-legend[hidden] { display: none; }
  #metric-legend .metric-scale { height: 8px; margin: 5px 0; background: linear-gradient(to right, rgb(66,135,180), rgb(233,153,66)); border-radius: 2px; }
  #map .building[data-metric] .face { fill: var(--metric-fill) !important; }
  #map .building[data-metric] .left { fill: color-mix(in srgb, var(--metric-fill) 85%, black) !important; }
  #map .building[data-metric] .right { fill: color-mix(in srgb, var(--metric-fill) 93%, black) !important; }
  #map .building[data-metric] .label .text { fill: #071d2b !important; }
  #map .building .metric-outlier { fill: #e39342; stroke: var(--paper); stroke-width: 1px; paint-order: stroke; }
  .code-metrics h2, .code-metrics h3 { font-size: 12px; margin: 16px 0 8px; }
  .code-metrics p { font-size: 12px; }
`

function markOutlier(building: SVGElement, metrics: ComponentMetrics | undefined): void {
  const previous = building.querySelector('.metric-outlier')
  if (!metrics?.outliers.length) { previous?.remove(); return }
  if (previous !== null) return
  const label = building.querySelector('.label')
  const text = label?.querySelector('text')
  if (label === null || label === undefined || text === null || text === undefined) return
  const mark = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  const size = Number(text.getAttribute('font-size'))
  mark.setAttribute('x', String(Number(text.getAttribute('x')) - size))
  mark.setAttribute('y', text.getAttribute('y') ?? '0')
  mark.setAttribute('font-size', String(size * 0.8))
  mark.setAttribute('class', 'metric-outlier')
  mark.setAttribute('aria-label', `Outlier: ${metrics.outliers.join(', ')}`)
  mark.textContent = '▲'
  label.append(mark)
}

/** The live-only overlay owns its request, settings, legend and transient SVG decoration. */
export function createMetricsControl(options: Options) {
  const style = document.createElement('style')
  style.textContent = css
  document.head.append(style)
  const controls = document.createElement('div')
  controls.id = 'metric-options'
  controls.innerHTML = '<label>Colour by<select aria-label="Colour by">'
    + Object.entries(labels).map(([value, label]) => `<option value="${value}">${label}</option>`).join('')
    + '</select></label><label>History window (commits)<input type="number" min="1" step="1" value="500"></label>'
  document.getElementById('settings-options')!.append(controls)
  const select = controls.querySelector('select')!
  const windowInput = controls.querySelector('input')!
  const legend = document.createElement('div')
  legend.id = 'metric-legend'
  legend.hidden = true
  document.getElementById('legend')!.append(legend)
  let measurements = new Map<string, ComponentMetrics>()
  let history: CodeHistory | null = null
  let metric: Metric = 'none'
  let window = 500
  let request = 0
  let loading = false
  let error = ''

  function value(id: string): number {
    if (metric === 'instability') return measurements.get(id)?.instability ?? 0
    const item = history?.components[id]
    if (item === undefined || metric === 'none') return 0
    return metric === 'cochange' ? item.cochange.reduce((total, pair) => total + pair.commits, 0) : item[metric]
  }

  function paint() {
    const enabled = options.live() && history !== null && metric !== 'none'
    const maximum = metric === 'instability' ? 1 : Math.max(0, ...[...measurements.keys()].map(value))
    for (const building of document.querySelectorAll<SVGElement>('#map .building')) {
      const id = building.dataset.id!
      const tinted = enabled && history?.components[id] !== undefined
      building.toggleAttribute('data-metric', tinted)
      if (tinted) building.style.setProperty('--metric-fill', colour(maximum === 0 ? 0 : value(id) / maximum))
      else building.style.removeProperty('--metric-fill')
      markOutlier(building, options.live() ? measurements.get(id) : undefined)
    }
    legend.hidden = metric === 'none' || !options.live()
    if (legend.hidden) return
    if (loading || error || history === null) {
      legend.textContent = loading ? 'Reading code history…' : error || 'No Git history'
      return
    }
    const meaning = metric === 'cochange' ? 'Sum of commits shared with other components' : metric === 'instability' ? 'Outgoing / (incoming + outgoing); isolated = 0' : `Distinct ${labels[metric].toLowerCase()} touching component files`
    legend.replaceChildren()
    const title = document.createElement('div')
    title.textContent = `${labels[metric]} · last ${history.window} commits`
    const scale = document.createElement('div')
    scale.className = 'metric-scale'
    const range = document.createElement('div')
    range.textContent = `0 → ${maximum} · ${meaning}`
    legend.append(title, scale, range)
  }

  function refresh() {
    const currentRequest = ++request
    const generation = options.generation()
    history = null
    error = ''
    measurements = componentMetrics(options.world())
    controls.hidden = !options.live()
    loading = options.live()
    paint()
    if (!options.live()) return
    // Two animation frames and a task put the read after the first rendered frame.
    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(async () => {
      if (request !== currentRequest) return
      try {
        const response = await fetch(`/metrics.json?window=${window}`)
        if (!response.ok) throw new Error(await response.text())
        const result = await response.json() as { generation: number; history: CodeHistory | null }
        if (request !== currentRequest || generation !== options.generation()) return
        if (result.generation !== generation) return
        history = result.history
      } catch (cause) {
        if (request !== currentRequest) return
        error = cause instanceof Error ? cause.message : String(cause)
      }
      loading = false
      paint()
      options.repaint()
    }, 0)))
  }

  select.addEventListener('change', () => { metric = select.value as Metric; paint() })
  windowInput.addEventListener('change', () => {
    if (!windowInput.checkValidity() || !Number.isSafeInteger(windowInput.valueAsNumber)) return
    window = windowInput.valueAsNumber
    refresh()
  })
  return {
    refresh, paint,
    details(host: HTMLElement, id: string) {
      if (options.live()) paintMetricDetails(host, id, options.world(), measurements, history, options.select)
    },
  }
}
