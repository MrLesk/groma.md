import type { ArchitectureFlow, ArchitectureGraph } from '../../../types.ts'
import { paragraph, showIdOnHover } from '../atoms/text.ts'
import { chromeButton } from '../atoms/button.ts'
import type { FlowRef } from '../../flows.ts'
import { flowEditEntry } from '../organisms/commands.ts'
import { isWriteViewOpen, paintWriteEntries } from '../organisms/write-view.ts'
import type { FlowWrites } from '../organisms/writes.ts'
import { tagRow } from '../tags/tag-row.ts'
import { flowReturn, type WebFlowRef } from './state.ts'

function button(label: string, action: () => void): HTMLButtonElement {
  const control = document.createElement('button')
  control.type = 'button'
  control.className = 'link'
  control.textContent = label
  control.addEventListener('click', action)
  return control
}

function stepControl(label: string, action: () => void): HTMLButtonElement {
  const control = chromeButton(label)
  control.addEventListener('click', action)
  return control
}

/** What the flow pane lets a person do while reading: walk the steps, inspect an end, toggle the focus on a tag. */
export interface FlowReading {
  onStep: (step: number | undefined) => void
  onInspect: (id: string) => void
  focusTags: readonly string[]
  onToggleTag: (tag: string) => void
}

/**
 * Shows the flow's wording, its own focusable tags and its ordered steps. With `writes`, the pane's write
 * entry is Edit; an open Edit view stays across repaints.
 */
export function paintFlowDetails(
  host: HTMLElement,
  flow: ArchitectureFlow,
  active: FlowRef,
  world: ArchitectureGraph,
  { onStep, onInspect, focusTags, onToggleTag }: FlowReading,
  writes: FlowWrites | undefined,
): void {
  // An open Edit view stays across repaints while the pane may write. On another revision it gives way to reading.
  if (writes !== undefined && isWriteViewOpen(host, flow.id)) return
  host.querySelector('h1')!.textContent = flow.title
  host.querySelector('.meta')!.textContent = 'Flow'
  host.querySelector('.tabs')!.replaceChildren()
  const body = host.querySelector('.body')!
  body.replaceChildren()
  if (flow.description) body.append(paragraph('description', flow.description))
  for (const prose of flow.overview.split('\n\n')) body.append(paragraph('overview', prose))
  if (flow.tags?.length) body.append(tagRow(flow.tags, focusTags, onToggleTag))
  const controls = document.createElement('div')
  controls.className = 'flow-controls'
  const previous = stepControl('Previous', () => onStep(Math.max(0, (active.step ?? 1) - 1)))
  previous.disabled = active.step === undefined || active.step === 0
  const next = stepControl('Next', () => onStep((active.step ?? -1) + 1))
  next.disabled = active.step === flow.steps.length - 1
  const clear = stepControl('Clear focus', () => onStep(undefined))
  clear.disabled = active.step === undefined
  controls.append(previous, next, clear)
  body.append(controls)
  const names = new Map(world.elements.map(element => [element.id, element.title]))
  const list = document.createElement('ol')
  flow.steps.forEach((step, index) => {
    const row = document.createElement('li')
    row.className = 'flow-step'
    row.classList.toggle('active', active.step === index)
    const action = button(step.action, () => onStep(index))
    action.setAttribute('aria-current', active.step === index ? 'step' : 'false')
    const ends = document.createElement('div')
    ends.className = 'flow-ends'
    const end = (id: string): HTMLButtonElement => {
      const name = button(names.get(id) ?? id, () => onInspect(id))
      showIdOnHover(name, id)
      return name
    }
    ends.append(end(step.source), '→', end(step.target))
    row.append(action, ends)
    list.append(row)
  })
  body.append(list)
  if (writes !== undefined) paintWriteEntries(host, flow.id, [flowEditEntry(flow, world, writes)], writes.onRead)
}

/** The reader returns to its origin; endpoint inspection returns to the same flow. */
export function paintFlowReturn(
  host: HTMLElement, active: WebFlowRef | undefined, readingFlow: boolean,
  world: ArchitectureGraph, onSelect: (id: string) => void, onBack: () => void,
  fileOpen: boolean,
): void {
  host.querySelector('.flow-back')?.remove()
  const target = flowReturn(active, readingFlow, fileOpen)
  if (target === undefined) return
  const origin = world.elements.find(element => element.representationId === active!.returnTo)
  if (target === 'origin' && origin === undefined) return
  const back = chromeButton(target === 'origin' ? `Back to ${origin!.title}` : 'Back to flow', { glyph: '←' })
  back.addEventListener('click', target === 'origin' ? () => onSelect(origin!.representationId) : onBack)
  back.classList.add('flow-back')
  host.querySelector('.meta')!.before(back)
}
