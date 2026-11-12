/**
 * The named icons an author can give an architecture element. A document stores only the name.
 * The web map draws each name twice: as a small object standing on the element in the tilted views,
 * and as a flat glyph in the 2D view, the hierarchy and the details.
 */
export const ICON_NAMES = [
  'person', 'agent',
  'browser', 'mobile', 'desktop', 'terminal',
  'service', 'worker', 'gateway', 'scheduler',
  'database', 'cache', 'queue', 'storage', 'document', 'search',
  'repository', 'package', 'cloud', 'lock', 'mail', 'chart', 'board',
] as const

export type IconName = (typeof ICON_NAMES)[number]

export function isIconName(value: unknown): value is IconName {
  return ICON_NAMES.includes(value as IconName)
}
