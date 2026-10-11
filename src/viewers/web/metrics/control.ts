import { componentMetrics, type CodeHistory, type ComponentMetrics } from '../../../component-metrics.ts'
import type { ArchitectureGraph } from '../../../types.ts'
import { mixColour } from '../atoms/theme.ts'
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

/** The two ends of the tint scale, the same in every theme: blue for the lowest value, orange for the highest. */
const SCALE_LOW = '#4287b4'
const SCALE_HIGH = '#e99942'
/** Label ink on a tinted roof: the scale's blue darkened until it reads on every tint in every theme. */
const TINTED_LABEL = mixColour(SCALE_LOW, '#000000', 0.85)

export const metricsCss = `
  #metric-options { display: grid; gap: 8px; padding: 10px 12px; border-top: 1px solid var(--hairline); }
  #metric-options[hidden] { display: none; }
  #metric-options label { display: grid; gap: 5px; font-size: 12px; }
  #metric-options select, #metric-options input { width: 100%; min-width: 0; color: var(--ink); background: var(--paper); border: 1px solid var(--hairline); border-radius: 3px; padding: 4px; font: inherit; }
  /* The page lays every div inside #legend out as a row of kind marks ("#legend div" in page.ts). The metric legend
     stacks its lines instead, so the legend and its lines are blocks; the two IDs outrank that rule. */
  #legend #metric-legend, #legend #metric-legend div { display: block; }
  #legend #metric-legend[hidden] { display: none; }
  #metric-legend { margin-top: 12px; font-size: 11px; line-height: 1.5; }
  #metric-legend .metric-scale { height: 8px; margin: 5px 0; background: linear-gradient(to right, ${SCALE_LOW}, ${SCALE_HIGH}); border-radius: 2px; }
  /* The attribute makes these outrank the level tints "#map .building .top", ".left" and ".right" in
     iso/painting/style.ts. */
  #map .building[data-metric] .face { fill: var(--metric-fill); }
  #map .building[data-metric] .face.left { fill: color-mix(in srgb, var(--metric-fill) 85%, black); }
  #map .building[data-metric] .face.right { fill: color-mix(in srgb, var(--metric-fill) 93%, black); }
  /* !important beats the more specific "#map .building.component:is(.selected, .lit) > .label .text" in
     iso/painting/style.ts, so the name of a selected or lit building still reads on its tint. */
  #map .building[data-metric] .label .text { fill: ${TINTED_LABEL} !important; }
  #map .building .metric-outlier { fill: ${SCALE_HIGH}; stroke: var(--paper); stroke-width: 1px; paint-order: stroke; }
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

/**
 * Runs `task` once the browser has painted the frame that is pending now, so reading history never delays the map.
 * The first frame callback runs before that paint and the second after it; the timeout then leaves the frame
 * callback, so `task` does not run inside a frame.
 */
function afterNextPaint(task: () => void): void {
  requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(task, 0)))
}

/** The live-only overlay owns its request, settings, legend and transient SVG decoration. */
export function createMetricsControl(options: Options) {
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
  let measurements: ReadonlyMap<string, ComponentMetrics> = new Map()
  let codeHistory: CodeHistory | null = null
  let metric: Metric = 'none'
  let historyWindow = 500
  let request = 0
  let loading = false
  let error = ''

  function value(id: string): number {
    if (metric === 'instability') return measurements.get(id)?.instability ?? 0
    const item = codeHistory?.components[id]
    if (item === undefined || metric === 'none') return 0
    return metric === 'cochange' ? item.cochange.reduce((total, pair) => total + pair.commits, 0) : item[metric]
  }

  function paintBuilding(building: SVGElement, enabled: boolean, maximum: number): void {
    const id = building.dataset.id!
    const tinted = enabled && codeHistory?.components[id] !== undefined && !building.classList.contains('ghost')
    building.toggleAttribute('data-metric', tinted)
    if (tinted) building.style.setProperty('--metric-fill', mixColour(SCALE_LOW, SCALE_HIGH, maximum === 0 ? 0 : value(id) / maximum))
    else building.style.removeProperty('--metric-fill')
    markOutlier(building, options.live() ? measurements.get(id) : undefined)
  }

  function paintLegend(maximum: number): void {
    legend.hidden = metric === 'none' || !options.live()
    if (legend.hidden) return
    if (loading || error || codeHistory === null) {
      legend.textContent = loading ? 'Reading code history…' : error || 'No Git history'
      return
    }
    const meaning = metric === 'cochange' ? 'Sum of commits shared with other components' : metric === 'instability' ? 'Outgoing / (incoming + outgoing); isolated = 0' : `Distinct ${labels[metric].toLowerCase()} touching component files`
    legend.replaceChildren()
    const title = document.createElement('div')
    title.textContent = `${labels[metric]} · last ${codeHistory.window} commits`
    const scale = document.createElement('div')
    scale.className = 'metric-scale'
    const range = document.createElement('div')
    range.textContent = `0 → ${maximum} · ${meaning}`
    legend.append(title, scale, range)
  }

  function paint(): void {
    const enabled = options.live() && codeHistory !== null && metric !== 'none'
    const maximum = metric === 'instability' ? 1 : Math.max(0, ...[...measurements.keys()].map(value))
    for (const building of document.querySelectorAll<SVGElement>('#map .building')) paintBuilding(building, enabled, maximum)
    paintLegend(maximum)
  }

  async function readHistory(currentRequest: number, generation: number): Promise<void> {
    if (request !== currentRequest) return
    try {
      const response = await fetch(`/metrics.json?window=${historyWindow}`)
      if (!response.ok) throw new Error(await response.text())
      const result = await response.json() as { generation: number; history: CodeHistory | null }
      if (request !== currentRequest || generation !== options.generation() || result.generation !== generation) return
      codeHistory = result.history
    } catch (cause) {
      if (request !== currentRequest) return
      error = cause instanceof Error ? cause.message : String(cause)
    }
    loading = false
    paint()
    options.repaint()
  }

  function refresh(): void {
    const currentRequest = ++request
    const generation = options.generation()
    codeHistory = null
    error = ''
    measurements = componentMetrics(options.world())
    controls.hidden = !options.live()
    loading = options.live()
    paint()
    if (!options.live()) return
    afterNextPaint(() => readHistory(currentRequest, generation))
  }

  select.addEventListener('change', () => { metric = select.value as Metric; paint() })
  windowInput.addEventListener('change', () => {
    if (!windowInput.checkValidity() || !Number.isSafeInteger(windowInput.valueAsNumber)) return
    historyWindow = windowInput.valueAsNumber
    refresh()
  })
  return {
    refresh, paint,
    details(host: HTMLElement, id: string) {
      if (options.live()) paintMetricDetails(host, id, options.world(), measurements, codeHistory, options.select)
    },
  }
}
