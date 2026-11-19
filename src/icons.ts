/**
 * The named icons an author can give an architecture element. A document stores only the name.
 * The web map draws each name as one small object on the line of the element's name: standing in the tilted
 * views, and the same object drawn flat in the 2D view, the hierarchy and the details.
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
