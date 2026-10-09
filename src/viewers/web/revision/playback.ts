import type { WebDataSource } from '../data.ts'
import type { WebPayload, WebRevision } from '../payload.ts'

interface PlaybackOptions {
  root: HTMLElement
  data: WebDataSource
  current(): WebPayload
  present(payload: WebPayload, first: boolean): void
  repaint(): void
  error(reason: unknown): void
}

/** Plays immutable revision comparisons; the revision control continues to own the displayed payload. */
export function createRevisionPlayback(options: PlaybackOptions) {
  const { root, data } = options
  const control = document.createElement('span')
  control.className = 'revision-playback'
  control.hidden = true
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'chrome-button'
  const speed = document.createElement('select')
  speed.className = 'chrome-button'
  speed.setAttribute('aria-label', 'Playback speed')
  for (const value of [0.5, 1, 2, 4]) {
    const option = document.createElement('option')
    option.value = String(value)
    option.textContent = `${value}×`
    option.selected = value === 1
    speed.append(option)
  }
  const caption = document.createElement('span')
  caption.className = 'revision-playback-caption'
  caption.hidden = true
  caption.setAttribute('role', 'status')
  control.append(button, speed, caption)
  root.append(control)
  let range: { from: WebRevision; to: WebRevision } | undefined
  let running = false
  let generation = 0
  let wake: (() => void) | undefined
  const cache = new Map<string, Promise<WebPayload>>()

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
      // Prefetched errors are reported only if playback reaches that step.
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
    root.toggleAttribute('data-playing', running)
  }

  function stop(clearRange = false): void {
    generation++
    running = false
    wake?.()
    if (clearRange) { range = undefined; caption.hidden = true }
    else if (options.current().revision !== null) describe(options.current().revision!)
    paint()
  }

  function pause(): Promise<void> {
    return new Promise(resolve => {
      const timer = window.setTimeout(done, 1500 / Number(speed.value))
      function done(): void { window.clearTimeout(timer); wake = undefined; resolve() }
      wake = done
    })
  }

  function describe(revision: WebRevision): void {
    const date = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(revision.date))
    caption.textContent = `${revision.shortId} · ${revision.subject} · ${date}`
    caption.hidden = false
  }

  function preload(revisions: WebRevision[], index: number): void {
    for (const next of [index + 1, index + 2]) {
      const revision = revisions[next]
      if (revision !== undefined) void read(revision.id, revisions[next - 1]!.id)
    }
  }

  async function walk(revisions: WebRevision[], token: number): Promise<boolean> {
    for (let index = 0; index < revisions.length; index++) {
      preload(revisions, index)
      const revision = revisions[index]!
      const payload = await read(revision.id, revisions[index - 1]?.id)
      if (token !== generation) return false
      describe(revision)
      options.present(payload, index === 0)
      await pause()
      if (token !== generation) return false
    }
    return true
  }

  async function play(): Promise<void> {
    const selected = endpoints()
    if (selected === undefined || data.readPlaybackRevisions === undefined) return
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
  speed.addEventListener('change', () => wake?.())
  return {
    paint,
    remember,
    cancel: () => stop(true),
    get range() { return range },
    get running() { return running },
  }
}
