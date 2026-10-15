import { componentMetrics, outlierLine, type ComponentMetrics } from '../../../component-metrics.ts'
import type { CodeHistory } from '../../../history/code-history.ts'
import type { ArchitectureGraph } from '../../../types.ts'
import { mixColour } from '../atoms/theme.ts'
import type { WebCodeHistoryPayload } from '../payload.ts'
import { paintMetricDetails } from './details.ts'

type Metric = 'none' | 'commits' | 'committers' | 'cochange' | 'instability'
const labels: Record<Metric, string> = { none: 'None', commits: 'Commits', committers: 'Committers', cochange: 'Co-change', instability: 'Instability' }
/** What the legend says a metric's scale counts. */
const meanings: Record<Exclude<Metric, 'none'>, string> = {
  commits: 'Distinct commits touching component files',
  committers: 'Distinct committers touching component files',
  cochange: 'Sum of commits shared with other components',
  instability: 'Outgoing / (incoming + outgoing); isolated = 0',
}

interface Options {
  world(): ArchitectureGraph
  generation(): number
  live(): boolean
  readCodeHistory(window: number): Promise<WebCodeHistoryPayload>
  repaint(): void
  select(id: string): void
}

/** The commits read when the page opens. The History window field changes the number until the page is reloaded. */
const DEFAULT_HISTORY_WINDOW = 500

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
`

/** Draws, relabels or removes the triangle left of a building's name. */
function markOutlier(building: SVGElement, metrics: ComponentMetrics | undefined): void {
  const description = outlierLine(metrics)
  const previous = building.querySelector('.metric-outlier')
  if (description === undefined) { previous?.remove(); return }
  if (previous !== null) { previous.setAttribute('aria-label', description); return }
  const label = building.querySelector('.label')
  const text = label?.querySelector('text')
  if (label === null || label === undefined || text === null || text === undefined) return
  const mark = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  const size = Number(text.getAttribute('font-size'))
  mark.setAttribute('x', String(Number(text.getAttribute('x')) - size))
  mark.setAttribute('y', text.getAttribute('y') ?? '0')
  mark.setAttribute('font-size', String(size * 0.8))
  mark.setAttribute('class', 'metric-outlier')
  mark.setAttribute('aria-label', description)
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
    + `</select></label><label>History window (commits)<input type="number" min="1" step="1" value="${DEFAULT_HISTORY_WINDOW}"></label>`
  document.getElementById('settings-options')!.append(controls)
  const select = controls.querySelector('select')!
  const windowInput = controls.querySelector('input')!
  const legend = document.createElement('div')
  legend.id = 'metric-legend'
  legend.hidden = true
  document.getElementById('legend')!.append(legend)
  let metric: Metric = 'none'
  let historyWindow = DEFAULT_HISTORY_WINDOW
  /** The last answer for `historyWindow`: null before it, in a repository without commits and after a failed read. */
  let codeHistory: CodeHistory | null = null
  /** True until the first answer for `historyWindow` arrives; later reads of that window show the last answer meanwhile. */
  let loading = true
  let error = ''
  let request = 0

  const metricsOf = (id: string) => componentMetrics(options.world()).get(id)

  function value(id: string): number {
    if (metric === 'instability') return metricsOf(id)?.instability ?? 0
    const item = codeHistory?.components[id]
    return item === undefined || metric === 'none' ? 0 : item[metric]
  }

  function paintBuilding(building: SVGElement, enabled: boolean, maximum: number): void {
    const id = building.dataset.id!
    const tinted = enabled && codeHistory?.components[id] !== undefined && !building.classList.contains('ghost')
    building.toggleAttribute('data-metric', tinted)
    if (tinted) building.style.setProperty('--metric-fill', mixColour(SCALE_LOW, SCALE_HIGH, maximum === 0 ? 0 : value(id) / maximum))
    else building.style.removeProperty('--metric-fill')
    markOutlier(building, options.live() ? metricsOf(id) : undefined)
  }

  function paintLegend(maximum: number): void {
    if (metric === 'none' || !options.live()) { legend.hidden = true; return }
    legend.hidden = false
    if (loading || error || codeHistory === null) {
      legend.textContent = loading ? 'Reading code history…' : error || 'No Git history'
      return
    }
    legend.replaceChildren()
    const title = document.createElement('div')
    // Instability comes from the relationships as they are now; only the Git metrics have a window.
    title.textContent = metric === 'instability' ? labels[metric] : `${labels[metric]} · last ${codeHistory.window} commits`
    const scale = document.createElement('div')
    scale.className = 'metric-scale'
    const range = document.createElement('div')
    range.textContent = `0 → ${maximum} · ${meanings[metric]}`
    legend.append(title, scale, range)
  }

  function paint(): void {
    const enabled = options.live() && codeHistory !== null && metric !== 'none'
    const maximum = metric === 'instability' ? 1 : Math.max(0, ...[...componentMetrics(options.world()).keys()].map(value))
    for (const building of document.querySelectorAll<SVGElement>('#map .building')) paintBuilding(building, enabled, maximum)
    paintLegend(maximum)
  }

  async function readHistory(currentRequest: number): Promise<void> {
    if (request !== currentRequest) return
    try {
      const answer = await options.readCodeHistory(historyWindow)
      // An answer for another map than the one shown is dropped too: the world update on its way starts the next read.
      if (request !== currentRequest || answer.generation !== options.generation()) return
      codeHistory = answer.history
      error = ''
    } catch (cause) {
      if (request !== currentRequest) return
      codeHistory = null
      error = cause instanceof Error ? cause.message : String(cause)
    }
    loading = false
    paint()
    options.repaint()
  }

  /**
   * Paints the world now shown and reads its history. The last answer stays on screen until the new one arrives, so a
   * live update does not blink the tints off.
   */
  function refresh(): void {
    const currentRequest = ++request
    controls.hidden = !options.live()
    paint()
    if (options.live()) afterNextPaint(() => readHistory(currentRequest))
  }

  select.addEventListener('change', () => { metric = select.value as Metric; paint() })
  windowInput.addEventListener('change', () => {
    if (!windowInput.checkValidity() || !Number.isSafeInteger(windowInput.valueAsNumber)) return
    historyWindow = windowInput.valueAsNumber
    // The counts on screen belong to the previous window, so they go and the legend says that it is reading.
    codeHistory = null
    error = ''
    loading = true
    refresh()
  })
  return {
    refresh, paint,
    details(host: HTMLElement, id: string) {
      if (options.live()) paintMetricDetails(host, id, options.world(), codeHistory, options.select)
    },
  }
}
