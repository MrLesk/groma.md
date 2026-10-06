import type { CliRenderer, KeyEvent } from '@opentui/core'

import { isEmptyWorld } from '../../empty-world.ts'
import { createArchitectureSearch } from '../../search.ts'
import { litLegs, projectFlowStep } from './flow.ts'
import { panesForWidth, terminalLayout } from './layout.ts'
import {
  clickTreeRow,
  defaultSelection,
  initialState,
  litAction,
  reduceViewer,
  selectMapItem,
} from './navigation.ts'
import type { ViewerAction, ViewerState } from './navigation.ts'
import { MAP_KEYS } from './keys.ts'
import { reduceSearch } from './navigation-search.ts'
import type { SearchInput } from './navigation-search.ts'
import { viewerTheme } from './atoms/theme.ts'
import { paintMap } from './paint.ts'
import { mountScreen } from './panes/screen.ts'
import { screenView } from './panes/view.ts'
import { depthFor, depthKey, itemAt, projectWorld } from './projection.ts'
import { firstPlaced } from './navigation-spatial.ts'
import { ease, glide, morph } from './projection-motion.ts'
import type { TerminalProjection } from './projection.ts'
import type { TerminalCamera } from './projection-camera.ts'
import type { TerminalViewModel } from './model.ts'
import { reconcileWorkFocus, workView } from './work/model.ts'
import type { TerminalLevel, WorkItemDetails } from '../../types.ts'
import type { TaskDiffPayload } from '../source/diff.ts'
import type { CodeFile } from '../source/structure.ts'
import { clickHistoryRevision } from './navigation-history.ts'

/** Motion frames: a pan glides, a depth change or world update morphs a little longer. */
const MOTION_MS = 24
const PAN_FRAMES = 6
const MORPH_FRAMES = 10
/** Pulses advance one cell per step along a lit flow; nothing else on the map moves on its own. */
const PULSE_MS = 90

interface ViewerOptions {
  openScanners?: () => Promise<void>
  level?: TerminalLevel
  currentId?: string
  onRefresh?: () => void | Promise<void>
  /** The full record of one task, read when the details pane opens it. */
  readTask?: (id: string) => Promise<WorkItemDetails>
  /** The source outline of a component's Code files, read when its How tab shows. */
  readStructure?: (elementId: string) => Promise<CodeFile[] | undefined>
  /** A component's source file, read when a declaration opens it. */
  readSource?: (elementId: string, file: string) => Promise<{ source: string } | undefined>
  /** One task's file facts and diffs, shared by its record and file reader. */
  readTaskDiff?: (taskId: string) => Promise<TaskDiffPayload | undefined>
  /** The live working tree or one compatible historical model, read when revision state changes. */
  readRevision?: (revisionId?: string) => Promise<TerminalViewModel | undefined>
}

export interface TerminalViewer {
  closed: Promise<void>
  destroy(): void
  refresh(): Promise<void>
  update(next: TerminalViewModel): void
  setView(next: {
    level?: TerminalLevel
    currentId?: string
  }): void
}

export function mountTerminalViewer(
  renderer: CliRenderer,
  response: TerminalViewModel,
  options: ViewerOptions = {},
): TerminalViewer {
  let viewModel = response
  let architectureSearch = createArchitectureSearch(response.elements)
  let state: ViewerState = {
    ...initialState(response),
    panes: panesForWidth(renderer.width),
    terminalWidth: renderer.width,
    ...(options.level === undefined ? {} : { level: options.level }),
    ...(options.currentId === undefined ? {} : { currentId: options.currentId }),
  }
  let closed = false
  let scannerSettingsOpen = false
  let resolveClosed!: () => void
  const closedPromise = new Promise<void>(resolve => {
    resolveClosed = resolve
  })
  const theme = viewerTheme()
  // Each depth keeps its own camera, so returning to it finds the map where it was.
  const cameras = new Map<string, TerminalCamera>()
  // Map clicks resolve against the projection last painted; motion moves from what the map showed.
  let lastProjection: TerminalProjection | undefined
  let motion: { from: TerminalProjection; to: TerminalProjection; frame: number; frames: number; morph: boolean } | undefined
  // After the wheel or a drag, the camera stays where it was put until the selection moves.
  let freeCamera = false
  let pulsePhase = 0
  let frameTimer: ReturnType<typeof setTimeout> | undefined
  let loadingRevision: string | null | false = false
  const screen = mountScreen(renderer, theme, {
    onMapResize: () => repaint(),
    onHierarchyRow(id) {
      transition(state.history === undefined
        ? clickTreeRow(viewModel, state, id)
        : clickHistoryRevision(viewModel, state, id))
    },
    onMapCell(x, y) {
      const item = lastProjection === undefined ? undefined : itemAt(lastProjection.items, x, y)
      // A collapsed group opens on its first component.
      const id = item?.representationId ?? firstPlaced(viewModel, item?.members ?? [])
      if (id !== undefined) {
        transition(selectMapItem(viewModel, state, id))
      }
    },
    onMapPan(dx, dy) {
      const shown = lastProjection
      if (shown === undefined) return
      // The hand moves the map directly; the projection holds the moved camera inside the map.
      cameras.set(shown.depth, { x: shown.camera.x + dx, y: shown.camera.y + dy })
      freeCamera = true
      motion = undefined
      repaint('instant')
    },
  })

  function project() {
    const lit = litAction(viewModel, state)
    const taskView = workView(viewModel, state.work)
    const flowAttention = state.actionStep === undefined
      ? undefined
      : litLegs(viewModel, lit)[state.actionStep]?.target
    const level = taskView?.level ?? state.level
    const currentId = taskView?.currentId ?? state.currentId
    const viewport = screen.mapViewport()
    const depth = depthKey(depthFor(viewModel, level, currentId, viewport))
    const projection = projectWorld(viewModel, {
      viewport,
      level,
      currentId,
      attentionIds: taskView?.attentionIds ?? (flowAttention === undefined ? [] : [flowAttention]),
      camera: cameras.get(depth),
      follow: !freeCamera,
    })
    cameras.set(depth, projection.camera)
    return projection
  }

  /** What the map shows right now, part way through any motion. */
  function displayed(): TerminalProjection | undefined {
    if (motion === undefined) return lastProjection
    const t = ease(motion.frame / motion.frames)
    return motion.morph ? morph(motion.from, motion.to, t) : glide(motion.from, motion.to, t)
  }

  /** Moving starts from the displayed frame: a new depth or world morphs, a new camera glides. */
  function startMotion(next: TerminalProjection, worldChanged: boolean): void {
    const shown = displayed()
    if (shown === undefined) return
    const morphs = worldChanged || shown.depth !== next.depth
    const pans = shown.camera.x !== next.camera.x || shown.camera.y !== next.camera.y
    if (!morphs && !pans) return
    motion = { from: shown, to: next, frame: 0, frames: morphs ? MORPH_FRAMES : PAN_FRAMES, morph: morphs }
  }

  function paintFrame(): void {
    if (closed || screen.map.isDestroyed || lastProjection === undefined) return
    clearTimeout(frameTimer)
    const lit = litAction(viewModel, state)
    const frame = displayed()!
    const pulsing = motion === undefined && viewModel.flows.some(flow => flow.id === lit.id)
    paintMap(screen.map.frameBuffer, frame, viewModel, theme, {
      lit,
      step: projectFlowStep(viewModel, lastProjection, lit.id, state.actionStep),
      workFocus: state.work,
      workList: state.workList,
      ...(pulsing ? { animationPhase: pulsePhase } : {}),
    })
    screen.map.requestRender()
    nextFrame(pulsing)
  }

  /** Motion advances quickly, pulses at their own pace; a settled map paints once more without pulses, then rests. */
  function nextFrame(pulsing: boolean): void {
    if (motion !== undefined) {
      motion = motion.frame + 1 >= motion.frames ? undefined : { ...motion, frame: motion.frame + 1 }
      frameTimer = setTimeout(paintFrame, MOTION_MS)
    } else if (pulsing) {
      pulsePhase += 1
      frameTimer = setTimeout(paintFrame, PULSE_MS)
    } else if (pulsePhase !== 0) {
      pulsePhase = 0
      frameTimer = setTimeout(paintFrame, 0)
    }
  }

  /** Paints the current state: a world update morphs into it, a pan by hand jumps, anything else glides. */
  function repaint(change?: 'world' | 'instant'): void {
    if (closed || screen.map.isDestroyed) return
    const map = screen.mapViewport()
    state = { ...state, terminalWidth: renderer.width, mapSize: { width: map.width, height: map.height } }
    if (!terminalLayout(state).map && lastProjection !== undefined) {
      screen.apply(screenView(theme, viewModel, state, lastProjection, litAction(viewModel, state), undefined))
      return
    }
    const projection = project()
    const lit = litAction(viewModel, state)
    if (state.work === undefined && state.currentId === undefined) {
      state = { ...state, currentId: projection.currentId ?? undefined }
    }
    if (change !== 'instant') startMotion(projection, change === 'world')
    lastProjection = projection
    paintFrame()
    screen.apply(screenView(theme, viewModel, state, projection, lit, projectFlowStep(viewModel, projection, lit.id, state.actionStep)))
  }

  function release(): void {
    clearTimeout(frameTimer)
    renderer.keyInput.off('keypress', onKeypress)
    renderer.off('destroy', onRendererDestroy)
    resolveClosed()
  }

  function onRendererDestroy(): void {
    if (closed) return
    closed = true
    release()
  }

  function destroy(): void {
    if (closed) return
    closed = true
    release()
    renderer.destroy()
  }

  function refresh(): Promise<void> {
    if (closed) return Promise.resolve()
    return Promise.resolve(options.onRefresh?.())
  }

  function update(next: TerminalViewModel): void {
    if (closed) return
    const revisionChanged = next.revision?.id !== viewModel.revision?.id
    const worldChanged = next.sheet !== viewModel.sheet
    viewModel = next
    architectureSearch = createArchitectureSearch(next.elements)
    const work = next.revision === undefined ? reconcileWorkFocus(next.work, state.work) : undefined
    const currentId = next.elements.some(element => element.representationId === state.currentId)
      ? state.currentId
      : defaultSelection(next, state.level)?.representationId
    state = {
      ...state,
      currentId,
      work,
      revisionId: next.revision?.id,
      ...(revisionChanged ? {
        taskRecord: undefined,
        sourceView: undefined,
        diffView: undefined,
        codeStructure: undefined,
      } : {}),
    }
    repaint(worldChanged ? 'world' : undefined)
  }

  function actionFor(key: KeyEvent): ViewerAction | undefined {
    return MAP_KEYS.find(entry => entry.name === key.name && Boolean(entry.ctrl) === key.ctrl)?.action
  }


  function searchInputFor(key: KeyEvent): SearchInput | undefined {
    if (key.name === 'return') return { type: 'accept' }
    if (key.name === 'backspace') return { type: 'delete' }
    if (key.name === 'down') return { type: 'next' }
    if (key.name === 'up') return { type: 'previous' }
    if (key.name === 'space') return { type: 'char', char: ' ' }
    if (key.name?.length === 1 && !key.ctrl) return { type: 'char', char: key.name }
    return undefined
  }

  /** A user action: the map moves to its new state, and a new selection takes the camera back from the hand. */
  function transition(next: ViewerState): void {
    if (next.currentId !== state.currentId || next.level !== state.level) freeCamera = false
    state = next
    loadPending()
    repaint()
  }

  function loadPendingRevision(): void {
    const wantedRevision = state.revisionId ?? null
    const shownRevision = viewModel.revision?.id ?? null
    const readRevision = options.readRevision
    if (readRevision === undefined || wantedRevision === shownRevision || loadingRevision === wantedRevision) return
    loadingRevision = wantedRevision
    void readRevision(state.revisionId).then(next => {
      if (closed || (state.revisionId ?? null) !== wantedRevision) return
      loadingRevision = false
      if (next !== undefined) update(next)
    })
  }

  /** Whatever the details pane opened and still lacks: a revision, record, structure, source file, or diff. */
  function loadPending(): void {
    loadPendingRevision()
    const { taskRecord, sourceView, currentId } = state
    if (taskRecord !== undefined && taskRecord.diff === undefined) {
      state = { ...state, taskRecord: { ...taskRecord, diff: null } }
      void Promise.all([
        taskRecord.details ?? options.readTask?.(taskRecord.id),
        options.readTaskDiff?.(taskRecord.id),
      ]).then(([details, diff]) => {
        if (!closed && state.taskRecord?.id === taskRecord.id) take({ taskRecord: { ...state.taskRecord, details, diff: diff ?? null } })
      })
    }
    const component = viewModel.elements.find(element => element.representationId === currentId && element.kind === 'component')
    if (state.detailsTab === 'how' && component !== undefined && state.codeStructure?.elementId !== component.representationId) {
      state = { ...state, codeStructure: { elementId: component.representationId, files: [] } }
      void options.readStructure?.(component.representationId).then(files => {
        if (!closed && state.currentId === component.representationId) take({ codeStructure: { elementId: component.representationId, files: files ?? [] } })
      })
    }
    if (sourceView !== undefined && sourceView.text === undefined && currentId !== undefined) {
      void options.readSource?.(currentId, sourceView.file).then(payload => {
        if (!closed && state.sourceView?.file === sourceView.file) take({ sourceView: { ...sourceView, text: payload?.source ?? '' } })
      })
    }
  }

  /** A read arrived: the state takes it and the screen repaints. */
  function take(part: Partial<ViewerState>): void {
    state = { ...state, ...part }
    repaint()
  }

  function onSearchKey(key: KeyEvent): void {
    if (key.name === 'escape') {
      state = reduceSearch(viewModel, architectureSearch, state, { type: 'cancel' })
      repaint()
      return
    }
    const input = searchInputFor(key)
    if (!input) return
    transition(reduceSearch(viewModel, architectureSearch, state, input))
  }

  function handleNonSearchKey(key: KeyEvent): boolean {
    if (key.name === '/' && state.work === undefined) {
      state = reduceSearch(viewModel, architectureSearch, state, { type: 'open' })
      repaint()
    } else if (key.name === 'escape') {
      transition(reduceViewer(viewModel, state, 'dismiss'))
    } else if (key.name === 'r' && !key.ctrl) {
      void refresh()
    } else return false
    return true
  }

  function handleEmptyWorldKey(key: KeyEvent): boolean {
    if (!isEmptyWorld(viewModel)) return false
    if (key.name === 'escape' || key.name === 'q') destroy()
    else if (key.name === 'r' && !key.ctrl) void refresh()
    return true
  }

  function openScannerSettings(key: KeyEvent): boolean {
    if (key.name === 's' && key.shift && !key.ctrl && state.search === undefined && options.openScanners) {
      scannerSettingsOpen = true
      void options.openScanners().finally(() => { scannerSettingsOpen = false; repaint() })
      return true
    }
    return false
  }

  function globalKey(key: KeyEvent): boolean {
    if (key.eventType === 'release' || scannerSettingsOpen) return true
    if (openScannerSettings(key)) return true
    // Groma owns pane navigation; focused toolkit scrollbars must not scroll again.
    key.preventDefault()
    if (key.ctrl && key.name === 'c') { destroy(); return true }
    return false
  }

  function onKeypress(key: KeyEvent): void {
    if (globalKey(key)) return
    if (handleEmptyWorldKey(key)) return
    if (state.search) {
      onSearchKey(key)
      return
    }
    if (handleNonSearchKey(key)) return
    const action = actionFor(key)
    if (!action) return
    transition(reduceViewer(viewModel, state, action))
  }

  renderer.keyInput.on('keypress', onKeypress)
  renderer.once('destroy', onRendererDestroy)
  repaint()

  return {
    closed: closedPromise,
    destroy,
    refresh,
    update,
    setView(next: {
      level?: TerminalLevel
      currentId?: string
      }) {
      state = {
        ...state,
        level: next.level ?? state.level,
        currentId: next.currentId ?? state.currentId,
      }
      repaint()
    },
  }
}
