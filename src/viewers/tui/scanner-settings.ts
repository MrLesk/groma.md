import { createCliRenderer, FrameBufferRenderable, RGBA, type CliRenderer, type KeyEvent, type PasteEvent } from '@opentui/core'
import { watchArchitecture } from '../../architecture-watch.ts'
import { createScannerSession, type ScannerSession } from '../../scanner/session.ts'
import { scannerGroups, scannerSettingAction, scannerMatchReason, scannerSettingLabel, type PluginSetting, type ScannerSettingsAction } from '../../scanner/modules/settings-model.ts'
import { loadWelcomeModel, welcomeSheet } from '../../welcome/model.ts'
import { paintShell } from '../../welcome/view.ts'
import { wrap } from './panes/text.ts'
import { text } from './atoms/text.ts'

/** A keyboard-only settings page, shared by the launcher and the live terminal map. */
export async function mountScannerSettings(renderer: CliRenderer, session: ScannerSession, root: string): Promise<void> {
  const model = await loadWelcomeModel(root)
  const sheet = welcomeSheet(model)
  const green = RGBA.fromHex('#1D9E75'), amber = RGBA.fromHex('#D8A652'), blue = RGBA.fromHex('#7AAFC5')
  const foreground = RGBA.defaultForeground(), background = RGBA.defaultBackground()
  let selectedId: string | undefined
  let busy = false, closed = false, searching = false, details = false
  let query = '', scroll = 0, detailScroll = 0
  let visible: PluginSetting[] = []
  let input: { action: 'add' | 'update'; value: string; id?: string } | undefined
  let message = ''
  let failedAction: ScannerSettingsAction | undefined
  const done = Promise.withResolvers<void>()
  const frame = new FrameBufferRenderable(renderer, {
    id: 'scanner-settings', width: renderer.width, height: renderer.height, position: 'absolute', left: 0, top: 0, zIndex: 100,
    onSizeChange: () => paint(),
  })
  frame.width = '100%'
  frame.height = '100%'
  renderer.root.add(frame)
  function line(value: string, y: number, color = foreground) {
    text(frame.frameBuffer, value, 4, y, frame.width - 8, color, background)
  }
  function paintDetails(plugin: PluginSetting | undefined, y: number, height: number) {
    if (!plugin) return
    const rows = [
      `Source: ${plugin.source ?? plugin.installSource ?? plugin.name}`,
      message || plugin.message,
      ...(plugin.kind === 'scanner' ? plugin.matches : []),
    ].flatMap(value => wrap(value, frame.width - 8))
    detailScroll = Math.max(0, Math.min(detailScroll, rows.length - height))
    rows.slice(detailScroll, detailScroll + height).forEach((value, index) => { line(value, y + index) })
  }
  function paintRow(plugin: PluginSetting, y: number) {
    const action = scannerSettingAction(plugin)
    const label = action ? (action.action === 'retry' ? '[Retry]' : '[Install]') : ''
    const nameWidth = 30, descriptionWidth = Math.max(18, frame.width - nameWidth - 26)
    const name = `${plugin.id}${plugin.version ? ` ${plugin.version}` : ''}`
    // Only a scanner recommendation has no saved source; its row says where the project matched.
    const description = plugin.kind === 'scanner' && !plugin.source ? scannerMatchReason(plugin) : scannerSettingLabel(plugin)
    line(`${plugin.id === selectedId ? '> ' : '  '}${name.slice(0, nameWidth).padEnd(nameWidth)} ${description.slice(0, descriptionWidth).padEnd(descriptionWidth)} ${label}`,
      y, plugin.id === selectedId ? green : foreground)
  }
  function paintList(y: number, height: number) {
    const groups = scannerGroups(session.state.plugins, query)
    visible = groups.flatMap(group => group.plugins)
    if (!visible.some(plugin => plugin.id === selectedId)) selectedId = visible[0]?.id
    const rows = groups.flatMap(group => [
      { title: group.title, plugin: undefined as PluginSetting | undefined },
      ...group.plugins.map(plugin => ({ title: '', plugin })),
    ])
    const selectedRow = rows.findIndex(row => row.plugin?.id === selectedId)
    if (selectedRow < scroll) scroll = selectedRow
    if (selectedRow >= scroll + height) scroll = selectedRow - height + 1
    scroll = Math.max(0, Math.min(scroll, rows.length - height))
    if (!rows.length) line(query ? 'No plugins match your search.' : 'No plugins for this project. [a] Add plugin', y)
    rows.slice(scroll, scroll + height).forEach((row, index) => {
      if (row.plugin) paintRow(row.plugin, y + index)
      else line(row.title, y + index, blue)
    })
  }
  function paintFooter() {
    const state = session.state
    line(message || state.notice.message, frame.height - 3, state.notice.tone === 'hint' ? blue : amber)
    const controls = details ? '[d] Hide details  [PgUp/PgDn] Scroll details' : '[d] Details  [/] Search'
    line(input ? `${input.action === 'add' ? 'Plugin source' : 'New version source'}: ${input.value}▌`
      : `[↑↓] Select  [Enter] Action  ${controls}  [Esc] Back`, frame.height - 2)
    line(busy ? 'Working…' : '[x] Remove from project  [u] Update  · Saved architecture is kept.', frame.height - 1)
  }
  function paint() {
    if (closed || frame.isDestroyed) return
    const { contentY: y } = paintShell(frame.frameBuffer, model, sheet)
    line(`Plugins                  [a] Add plugin${failedAction ? '  [r] Retry installation' : ''}`, y, green)
    const recommended = session.state.plugins.filter(item => !item.source && item.installSource).length
    const missing = session.state.plugins.filter(item => item.status === 'missing').length
    line([recommended ? `[i] Install recommended scanners (${recommended})` : '', missing ? `[m] Install missing plugins (${missing})` : ''].filter(Boolean).join('  '), y + 1)
    line(`Search: ${query}${searching ? '▌' : '  [/] Edit'}`, y + 2)
    const start = y + 4
    const detailHeight = details ? Math.min(7, Math.floor((frame.height - start - 4) / 2)) : 0
    const listHeight = Math.max(1, frame.height - start - 4 - detailHeight)
    paintList(start, listHeight)
    if (details) paintDetails(visible.find(plugin => plugin.id === selectedId), start + listHeight + 1, detailHeight)
    paintFooter()
    frame.requestRender()
  }
  async function change(action: ScannerSettingsAction) {
    busy = true; message = ''; failedAction = undefined; paint()
    try { await session.change(action) }
    catch (error) { message = error instanceof Error ? error.message : String(error); failedAction = action }
    finally { busy = false; paint() }
  }
  function close() {
    if (closed) return
    closed = true
    unsubscribe()
    renderer.keyInput.off('keypress', onKey)
    renderer.keyInput.off('paste', onPaste)
    renderer.off('destroy', close)
    frame.destroy()
    done.resolve()
  }
  function inputKey(key: KeyEvent) {
    if (!input) return
    if (key.name === 'escape') input = undefined
    else if (key.name === 'backspace') input.value = input.value.slice(0, -1)
    else if (key.name === 'return' && input.value.trim()) {
      const action: ScannerSettingsAction = input.action === 'add' ? { action: 'add', source: input.value } : { action: 'update', id: input.id!, source: input.value }
      input = undefined; void change(action)
    } else if (!key.ctrl && !key.meta && key.sequence && !key.sequence.includes('\x1b')) input.value += key.sequence
    paint()
  }
  function onPaste(event: PasteEvent) {
    if (busy) return
    const value = new TextDecoder().decode(event.bytes).replace(/[\r\n]/g, '')
    if (searching) query += value
    else if (input) input.value += value
    else return
    paint()
  }
  function pluginKey(key: KeyEvent, plugin: PluginSetting) {
    if (key.name === 'u' && plugin.source) input = { action: 'update', id: plugin.id, value: plugin.source }
    if (key.name === 'x' && plugin.source) void change({ action: 'remove', id: plugin.id })
    if (key.name === 'return') {
      const action = scannerSettingAction(plugin)
      if (action) void change(action)
    }
  }
  function select(offset: number) {
    const index = visible.findIndex(plugin => plugin.id === selectedId)
    selectedId = visible[Math.max(0, Math.min(visible.length - 1, index + offset))]?.id
    detailScroll = 0
  }
  function navigationKey(key: KeyEvent) {
    switch (key.name) {
      case 'escape': case 'q': close(); return
      case 'up': select(-1); break
      case 'down': select(1); break
      case 'pageup': if (details) detailScroll -= 5; else select(-5); break
      case 'pagedown': if (details) detailScroll += 5; else select(5); break
      case '/': searching = true; break
      case 'd': details = !details; detailScroll = 0; break
      case 'a': input = { action: 'add', value: '' }; break
      case 'i': if (session.state.plugins.some(item => !item.source && item.installSource)) void change({ action: 'install-recommended' }); break
      case 'm': if (session.state.plugins.some(item => item.status === 'missing')) void change({ action: 'install-missing' }); break
      case 'r': if (failedAction) void change(failedAction); break
      default: {
        const plugin = visible.find(plugin => plugin.id === selectedId)
        if (plugin) pluginKey(key, plugin)
      }
    }
    paint()
  }
  function searchKey(key: KeyEvent) {
    if (key.name === 'escape') { query = ''; searching = false }
    else if (key.name === 'return') searching = false
    else if (key.name === 'backspace') query = query.slice(0, -1)
    else if (!key.ctrl && !key.meta && key.sequence && !key.sequence.includes('\x1b')) query += key.sequence
    scroll = 0
    paint()
  }
  function onKey(key: KeyEvent) {
    if (key.eventType === 'release') return
    key.preventDefault()
    if (key.ctrl && key.name === 'c') { renderer.destroy(); return }
    if (busy) return
    if (searching) searchKey(key)
    else if (input) inputKey(key)
    else navigationKey(key)
  }
  const unsubscribe = session.subscribe(paint)
  renderer.keyInput.on('keypress', onKey)
  renderer.keyInput.on('paste', onPaste)
  renderer.once('destroy', close)
  paint()
  await done.promise
}

export async function startScannerSettings(root: string): Promise<void> {
  const session = await createScannerSession(root, { scan: false })
  const renderer = await createCliRenderer({ clearOnShutdown: true, consoleMode: 'disabled', exitOnCtrlC: true, screenMode: 'alternate-screen', useMouse: false })
  const architecture = await watchArchitecture(root, { onChange: () => session.reconfigure() })
  try { await mountScannerSettings(renderer, session, root) }
  finally { await architecture.close(); await session.close(); renderer.destroy(); await renderer.closed }
}
