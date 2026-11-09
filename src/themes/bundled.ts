import { GROMA_ACCENT, GROMA_ACCENT_ON_LIGHT } from '../brand.ts'
import { themeDefinition, type ThemeDefinition } from './definition.ts'

/**
 * The themes that ship inside groma.md. They are plain theme data, checked by the same validator as a project's own
 * theme files, so a clone of one starts with every colour. A few stylesheet rules still name `dark` and `blueprint`
 * (syntax and panel line treatments); those belong to these two themes and a clone does not take them.
 */
export const bundledThemes: readonly ThemeDefinition[] = [
  themeDefinition('light', {
    title: 'Light', scheme: 'light', chromeOpacity: 0.35,
    palette: {
      paper: '#FFFFFF',
      ink: '#22262E',
      muted: '#585B62',
      accentText: GROMA_ACCENT_ON_LIGHT,
      highlight: '#1D9E75',
      highlightText: '#147A59',
      hairline: '#E4E6EA',
      hover: 'rgba(34, 38, 46, 0.05)',
      line: '#A2A6AE',
      hatch: '#C4C8CF',
      syntaxComment: '#7A8190',
      syntaxFunction: '#087F8C',
      syntaxKeyword: '#7C3AED',
      syntaxNumber: '#C2410C',
      syntaxString: '#0E7C55',
      syntaxType: '#2563EB',
      diffAdded: '#2563EB',
      diffModified: '#9A6700',
      diffRemoved: '#B42318',
      colors: { red: '#D9483B', orange: '#E0782A', yellow: '#C79A08', blue: '#2F7FD9', violet: '#7C5CD6', pink: '#D4479A' },
    },
  }, 'bundled theme light'),
  themeDefinition('dark', {
    title: 'Dark', scheme: 'dark', chromeOpacity: 0.35,
    palette: {
      paper: '#111315',
      ink: '#E6E8EB',
      muted: '#9AA0A8',
      accentText: GROMA_ACCENT,
      highlight: GROMA_ACCENT,
      highlightText: GROMA_ACCENT,
      hairline: '#2A2E33',
      hover: 'rgba(230, 232, 235, 0.08)',
      line: '#6B717A',
      hatch: '#4A5058',
      syntaxComment: '#7D8590',
      syntaxFunction: '#FFD866',
      syntaxKeyword: '#FF6BCB',
      syntaxNumber: '#FFA657',
      syntaxString: '#7EE787',
      syntaxType: '#79C0FF',
      diffAdded: '#79C0FF',
      diffModified: '#E3B341',
      diffRemoved: '#FF7B72',
      colors: { red: '#F27A6E', orange: '#F5A25B', yellow: '#E6C34A', blue: '#6FB1FF', violet: '#A990FF', pink: '#F27CC0' },
    },
  }, 'bundled theme dark'),
  themeDefinition('blueprint', {
    title: 'Blueprint', scheme: 'dark', chromeOpacity: 0.78,
    palette: {
      paper: '#07152B',
      ink: '#D8F3FF',
      muted: '#79A9BD',
      accentText: GROMA_ACCENT,
      highlight: GROMA_ACCENT,
      highlightText: GROMA_ACCENT,
      hairline: '#164764',
      hover: 'rgba(89, 203, 244, 0.09)',
      line: '#527CB0',
      hatch: '#2C496C',
      syntaxComment: '#6E9CB0',
      syntaxFunction: '#FFFFFF',
      syntaxKeyword: '#FFE066',
      syntaxNumber: '#FF8FAB',
      syntaxString: '#70E1F5',
      syntaxType: '#D9B8FF',
      diffAdded: '#B8F26B',
      diffModified: '#FFE066',
      diffRemoved: '#FF8FAB',
      colors: { red: '#FF8A8A', orange: '#FFB070', yellow: '#FFE066', blue: '#8CCBFF', violet: '#C3A6FF', pink: '#FF9AD5' },
    },
  }, 'bundled theme blueprint'),
]

/** The bundled theme with this id, if groma.md ships one. */
export function bundledTheme(id: string): ThemeDefinition | undefined {
  return bundledThemes.find(theme => theme.id === id)
}
