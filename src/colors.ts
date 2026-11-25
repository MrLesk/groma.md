/**
 * The named colors an author can give an architecture element. A document stores only the name;
 * every UI theme says what each name looks like. No name is green: green marks selection and lit flows.
 */
export const COLOR_NAMES = ['red', 'orange', 'yellow', 'blue', 'violet', 'pink'] as const

export type ColorName = (typeof COLOR_NAMES)[number]

export function isColorName(value: unknown): value is ColorName {
  return COLOR_NAMES.includes(value as ColorName)
}
