import { AUTO_THEME, isThemeMode, shownTheme, type ThemeDefinition } from '../../../themes/definition.ts'
import { bindPopover } from '../atoms/popover.ts'
import { createThemeTransition } from './motion.ts'

const THEME_STORAGE_KEY = 'groma.theme'

export interface ThemeControl {
  /** Auto, or the id of the enabled theme the person chose. */
  readonly mode: string
}

type ThemeStorage = Pick<Storage, 'getItem' | 'setItem'>

/** The saved choice when the picker still offers it, otherwise Auto: a project may have removed the theme since. */
export function readSavedTheme(storage: Pick<Storage, 'getItem'>, themes: readonly ThemeDefinition[]): string {
  const saved = storage.getItem(THEME_STORAGE_KEY)
  return isThemeMode(saved, themes) ? saved : AUTO_THEME
}

/**
 * Owns the theme dropdown, the saved choice and the system appearance behind Auto. `initial` is Auto or the id of an
 * enabled theme, as readView returns it.
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
  let mode = initial

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
    const selected = option.dataset.themeMode!
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
