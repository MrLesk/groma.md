/** The named accents. An accent is presentation metadata and keeps its colour in every viewer theme. */
export const accentColours: Readonly<Record<string, string>> = {
  red: '#dc4545', orange: '#d97928', amber: '#b88a18', yellow: '#b99a18',
  green: '#299764', teal: '#228e91', cyan: '#208cb4', blue: '#397ed1',
  indigo: '#6864d4', violet: '#9261ce', purple: '#a351ba', pink: '#d34b8b',
  brown: '#9a7052', grey: '#78838c',
}

/**
 * The colour an authored value stands for, as lower-case #rrggbb so one colour has one spelling.
 * Undefined when the value is neither a name nor #RRGGBB.
 */
export function accentColour(value: string | undefined): string | undefined {
  if (value === undefined) return undefined
  if (Object.hasOwn(accentColours, value)) return accentColours[value]
  return /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : undefined
}

export function isAccentColour(value: string): boolean {
  return accentColour(value) !== undefined
}
