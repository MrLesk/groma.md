/** Fixed accents are presentation metadata, independent of the viewer theme. */
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

/** A fixed light tint, so map paint does not blend the accent with the active theme. */
export function accentTint(colour: string): string {
  const channels = [1, 3, 5].map(start => Math.round(parseInt(colour.slice(start, start + 2), 16) * 0.22 + 255 * 0.78))
  return `#${channels.map(value => value.toString(16).padStart(2, '0')).join('')}`
}
