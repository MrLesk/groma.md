import { expect, test } from 'bun:test'
import { createTestRenderer } from '@opentui/core/testing'
import { mountWelcome } from '../src/welcome.ts'
import { loadWelcomeModel } from '../src/welcome/model.ts'
import { mountTerminalViewer } from '../src/viewers/tui/terminal-viewer.ts'
import { terminalModel, viewerFixtureRoot } from './helpers.ts'

test.concurrent('welcome waits for terminal suspension before handing off an action', async () => {
  const setup = await createTestRenderer({ width: 120, height: 36 })
  const suspended = Promise.withResolvers<void>()
  let suspending = false
  setup.renderer.suspend = () => { suspending = true; return suspended.promise }
  try {
    const selection = mountWelcome(setup.renderer, await loadWelcomeModel(viewerFixtureRoot), 'launcher', 'suspend')
    let finished = false
    void selection.then(() => { finished = true })
    setup.mockInput.pressEnter()
    await Bun.sleep(0)
    expect(suspending).toBe(true)
    expect(finished).toBe(false)
    suspended.resolve()
    expect(await selection).toBe('web')
  } finally {
    suspended.resolve()
    await setup.dispose()
  }
})

for (const view of ['welcome', 'map'] as const) {
  test.concurrent(`${view} waits for terminal restoration before reporting close`, async () => {
    const setup = await createTestRenderer({ width: 120, height: 36 })
    const restored = Promise.withResolvers<void>()
    Object.defineProperty(setup.renderer, 'closed', { configurable: true, value: restored.promise })
    try {
      const closed: Promise<unknown> = view === 'welcome'
        ? mountWelcome(setup.renderer, await loadWelcomeModel(viewerFixtureRoot))
        : mountTerminalViewer(setup.renderer, await terminalModel(viewerFixtureRoot)).closed
      let finished = false
      void closed.then(() => { finished = true })
      setup.mockInput.pressCtrlC()
      await Bun.sleep(0)
      expect(setup.renderer.isDestroyed).toBe(true)
      expect(finished).toBe(false)
      restored.resolve()
      await closed
      expect(finished).toBe(true)
    } finally {
      restored.resolve()
      Reflect.deleteProperty(setup.renderer, 'closed')
      await setup.dispose()
    }
  })
}
