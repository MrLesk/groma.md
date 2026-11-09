import { AUTO_THEME, shownTheme, themeMode, type ThemeDefinition } from '../../../themes/definition.ts'
import { bindPopover } from '../atoms/popover.ts'
import { createThemeTransition } from './motion.ts'

const THEME_STORAGE_KEY = 'groma.theme'

export interface ThemeControl {
  /** Auto, or the id of the enabled theme the person chose. */
  readonly mode: string
}

type ThemeStorage = Pick<Storage, 'getItem' | 'setItem'>

/** The saved choice as stored; the control checks it against the enabled themes. */
export function readSavedTheme(storage: Pick<Storage, 'getItem'>): string {
  return storage.getItem(THEME_STORAGE_KEY) ?? AUTO_THEME
}

/**
 * Owns the theme dropdown, the saved choice and the system appearance behind Auto. The choice is Auto or one of the
 * enabled themes; a saved or shared value naming any other theme falls back to Auto.
 */
export function bindThemeControl(
  control: HTMLDetailsElement,
  initial: string,
  themes: readonly ThemeDefinition[],
  onChange: () => void,
  storage: ThemeStorage = localStorage,
  preference: MediaQueryList = matchMedia('(prefers-color-scheme: dark)'),
): ThemeControl {
  const label = control.querySelector<HTMLElement>('.label')!
  const transition = createThemeTransition(document.body)
  let mode = themeMode(initial, themes)

  const applyTheme = (): void => {
    const theme = shownTheme(mode, themes, preference.matches)
    control.dataset.themeMode = mode
    label.textContent = mode === AUTO_THEME ? 'Auto' : theme.title
    for (const option of control.querySelectorAll<HTMLElement>('.theme-option')) {
      option.setAttribute('aria-current', String(option.dataset.themeMode === mode))
    }
    document.documentElement.dataset.theme = theme.id
  }

  control.addEventListener('click', event => {
    const option = event.target instanceof Element
      ? event.target.closest<HTMLButtonElement>('.theme-option[data-theme-mode]')
      : null
    if (option === null || !control.contains(option)) return
    const selected = themeMode(option.dataset.themeMode, themes)
    control.removeAttribute('open')
    control.querySelector('summary')!.focus()
    storage.setItem(THEME_STORAGE_KEY, selected)
    if (selected === mode) {
      onChange()
      return
    }
    transition(() => {
      mode = selected
      applyTheme()
      onChange()
    })
  })

  bindPopover(control)

  preference.addEventListener('change', () => {
    if (mode === AUTO_THEME) transition(applyTheme)
  })

  applyTheme()
  return {
    get mode() {
      return mode
    },
  }
}
