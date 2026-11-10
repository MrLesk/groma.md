import type { IconName } from '../../../icons.ts'

/** Glyphs are drawn on a square of this many units. */
export const GLYPH_SIZE = 24

/**
 * One flat glyph per icon name, as the path of its lines on a 24-unit square. A glyph shows the same
 * thing as the icon's object, seen from the front or from above, with nothing closer than 2 units to the edge.
 */
export const iconGlyphs: Record<IconName, string> = {
  person: 'M15.5 7.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0ZM5 20.5c0-3.9 3.1-6.5 7-6.5s7 2.6 7 6.5Z',
  agent: 'M5 9h14v10H5ZM12 9V5.5M13 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 13v1.5M15 13v1.5M3 13v3M21 13v3',
  browser: 'M3 5h18v14H3ZM3 9h18M6 7h.01M8.5 7h.01M7 12.5h4v3.5H7ZM14 12.5h3M14 16h3',
  mobile: 'M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1ZM11 18h2',
  desktop: 'M3 4h18v12H3ZM12 16v4M8 20h8',
  terminal: 'M3 5h18v14H3ZM7 10l3 2.5L7 15M12.5 15H17',
  service: 'M4 4h16v6H4ZM4 14h16v6H4ZM7 7h.01M7 17h.01M11 7h6M11 17h6',
  worker: 'M18.7 10.4L21.1 10.7L21.1 13.3L18.7 13.6L17.9 15.7L19.3 17.5L17.5 19.3L15.7 17.9L13.6 18.7L13.3 21.1L10.7 21.1L10.4 18.7L8.3 17.9L6.5 19.3L4.7 17.5L6.1 15.7L5.3 13.6L2.9 13.3L2.9 10.7L5.3 10.4L6.1 8.3L4.7 6.5L6.5 4.7L8.3 6.1L10.4 5.3L10.7 2.9L13.3 2.9L13.6 5.3L15.7 6.1L17.5 4.7L19.3 6.5L17.9 8.3ZM14.8 12a2.8 2.8 0 1 1-5.6 0 2.8 2.8 0 0 1 5.6 0Z',
  gateway: 'M3 21h18M5 21V7h14v14M9 21v-7a3 3 0 0 1 6 0v7M3 7h18M5 7V4h14v3',
  scheduler: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 7v5l3.5 2',
  database: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3ZM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  cache: 'M7 7h10v10H7ZM10 10h4v4h-4ZM9.5 4v3M14.5 4v3M9.5 17v3M14.5 17v3M4 9.5h3M4 14.5h3M17 9.5h3M17 14.5h3',
  queue: 'M3 8h5v5H3ZM9.5 8h5v5h-5ZM16 8h5v5h-5ZM3 17.5h17M17.5 15l2.5 2.5-2.5 2.5',
  storage: 'M5 3h14v18H5ZM5 9h14M5 15h14M10.5 6h3M10.5 12h3M10.5 18h3',
  document: 'M7 3h7l4 4v14H7ZM14 3v4h4M10 12h5M10 16h5',
  search: 'M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0ZM15.5 15.5 20 20',
  repository: 'M8 5.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM8 18.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM20 7.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM6 7.5v9M18 9.5c0 4-7 2.5-11 6',
  package: 'M12 3l8 4.5v9L12 21l-8-4.5v-9ZM4 7.5l8 4.5 8-4.5M12 12v9M8 5.25l8 4.5',
  cloud: 'M6.5 19C4 19 2 17.2 2 14.8c0-2.3 1.7-4.1 3.9-4.3C6.3 7.4 8.9 5 12 5c3.2 0 5.8 2.5 6 5.6 2.3.2 4 2 4 4.2 0 2.4-1.9 4.2-4.3 4.2Z',
  lock: 'M6 11h12v9H6ZM8.5 11V8a3.5 3.5 0 0 1 7 0v3M12 14.5V17',
  mail: 'M3 6h18v12H3ZM3 7l9 6.5L21 7',
  chart: 'M4 20h16M6 20v-6h3v6M10.5 20V9h3v11M15 20V5h3v15',
  board: 'M3 4h18v16H3ZM9 4v16M15 4v16M5 7h2M5 10h2M11 7h2M17 7h2M17 10h2M17 13h2',
}
