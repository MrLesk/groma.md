import { UnreadableRevisionError, type WebDataSource } from '../data.ts'
import { bindPopover } from '../atoms/popover.ts'
import type { WebPayload, WebRevision } from '../payload.ts'

interface PlaybackOptions {
  root: HTMLElement
  data: WebDataSource
  current(): WebPayload
  navigating(): boolean
  present(payload: WebPayload, first: boolean): void
  repaint(): void
  error(reason: unknown): void
}

const SPEEDS = [0.5, 1, 2, 4]

/** The speed choice, built from the header's dropdown atom (atoms/popover.ts) like the theme menu. */
function speedControl(onChange: () => void) {
  let speed = 1
  const menu = document.createElement('details')
  menu.className = 'revision-speed'
  const label = document.createElement('summary')
  label.className = 'chrome-button'
  label.setAttribute('aria-label', 'Playback speed')
  const list = document.createElement('div')
  list.className = 'anchored-popover'
  const options = SPEEDS.map(value => {
    const option = document.createElement('button')
    option.type = 'button'
    option.className = 'anchored-option'
    option.textContent = `${value}×`
    option.addEventListener('click', () => {
      speed = value
      paint()
      menu.open = false
      label.focus()
      onChange()
    })
    return option
  })
  function paint(): void {
    label.textContent = `${speed}×`
    for (const [index, option] of options.entries()) option.setAttribute('aria-current', String(SPEEDS[index] === speed))
  }
  list.append(...options)
  menu.append(label, list)
  bindPopover(menu)
  paint()
  return { element: menu, get value() { return speed } }
}

/** Plays immutable revision comparisons; the revision control continues to own the displayed payload. */
export function createRevisionPlayback(options: PlaybackOptions) {
  const { root, data } = options
  let range: { from: WebRevision; to: WebRevision } | undefined
  let running = false
  let generation = 0
  let wake: (() => void) | undefined
  const cache = new Map<string, Promise<WebPayload>>()
  const control = document.createElement('span')
  control.className = 'revision-playback'
  control.hidden = true
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'chrome-button'
  // A new speed applies at once: the step that is waiting ends.
  const speed = speedControl(() => wake?.())
  const caption = document.createElement('span')
  caption.className = 'revision-playback-caption'
  caption.hidden = true
  caption.setAttribute('role', 'status')
  control.append(button, speed.element, caption)
  root.append(control)

  const keyOf = (revision: string, from?: string) => JSON.stringify([revision, from])
  function remember(payload: WebPayload): void {
    if (payload.revision === null || payload.comparison?.from === null) return
    cache.set(keyOf(payload.revision.id, payload.comparison?.from.id), Promise.resolve(payload))
  }

  function read(revision: string, from?: string): Promise<WebPayload> {
    const key = keyOf(revision, from)
    let pending = cache.get(key)
    if (pending === undefined) {
      pending = data.readWorld(revision, from)
      cache.set(key, pending)
      // A preloaded frame that fails is handled only when playback reaches that step.
      void pending.catch(() => {})
    }
    return pending
  }

  function endpoints() {
    const current = options.current()
    const from = current.comparison?.from
    return range ?? (from && current.revision ? { from, to: current.revision } : undefined)
  }

  function paint(): void {
    control.hidden = data.readPlaybackRevisions === undefined || endpoints() === undefined
    button.textContent = running ? 'Stop' : 'Play'
    button.setAttribute('aria-label', running ? 'Stop history playback' : 'Play history')
    button.disabled = options.navigating()
  }

  function stop(clearRange = false): void {
    generation++
    running = false
    wake?.()
    if (clearRange) { range = undefined; caption.hidden = true }
    else if (range !== undefined && options.current().revision !== null) describe(options.current().revision!)
    paint()
  }

  function pause(): Promise<void> {
    return new Promise(resolve => {
      const timer = window.setTimeout(done, 1500 / speed.value)
      function done(): void { window.clearTimeout(timer); wake = undefined; resolve() }
      wake = done
    })
  }

  function describe(revision: WebRevision): void {
    const date = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(revision.date))
    caption.textContent = `${revision.shortId} · ${revision.subject} · ${date}`
    caption.hidden = false
  }

  /** Loads the next two frames ahead. It assumes each commit follows a readable one; a wrong guess costs one request. */
  function preload(revisions: WebRevision[], index: number): void {
    for (const next of [index + 1, index + 2]) {
      const revision = revisions[next]
      if (revision !== undefined) void read(revision.id, revisions[next - 1]!.id)
    }
  }

  /** The frame that shows `revision` after `shown`, or undefined when the current reader cannot read that commit. */
  async function frame(revision: WebRevision, shown: WebRevision | undefined): Promise<WebPayload | undefined> {
    try {
      return await read(revision.id, shown?.id)
    } catch (reason) {
      if (reason instanceof UnreadableRevisionError) return undefined
      throw reason
    }
  }

  /** Shows the range in Git order. An unreadable commit is skipped: the next frame continues from the last one shown. */
  async function walk(revisions: WebRevision[], token: number): Promise<boolean> {
    let shown: WebRevision | undefined
    for (let index = 0; index < revisions.length; index++) {
      preload(revisions, index)
      const revision = revisions[index]!
      const payload = await frame(revision, shown)
      if (token !== generation) return false
      if (payload === undefined) continue
      describe(revision)
      options.present(payload, shown === undefined)
      shown = revision
      await pause()
      if (token !== generation) return false
    }
    return true
  }

  async function play(): Promise<void> {
    const selected = endpoints()
    if (options.navigating() || selected === undefined || data.readPlaybackRevisions === undefined) return
    range = selected
    running = true
    const token = ++generation
    caption.textContent = 'Loading history…'
    caption.hidden = false
    options.repaint()
    paint()
    try {
      const revisions = await data.readPlaybackRevisions(selected.to.id, selected.from.id)
      if (token !== generation) return
      if (!await walk(revisions, token)) return
      const final = await read(selected.to.id, selected.from.id)
      if (token !== generation) return
      running = false
      options.present(final, false)
      paint()
    } catch (reason) {
      if (token !== generation) return
      stop()
      options.error(reason)
    }
  }

  button.addEventListener('click', () => { if (running) stop(); else void play() })
  return {
    paint,
    remember,
    cancel: (clearRange = true) => stop(clearRange),
    get range() { return range },
  }
}
