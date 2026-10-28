export const ARCHITECTURE_ICON_VIEWBOX = 24

/** Original Groma drawings. Color belongs to the viewer, never to the artwork. */
export interface ArchitectureIcon {
  id: string
  label: string
  category: 'People' | 'Architecture' | 'Applications' | 'Infrastructure'
  paths: readonly { d: string; tone: 'line' | 'wash' }[]
}

const line = (d: string) => ({ d, tone: 'line' as const })
const wash = (d: string) => ({ d, tone: 'wash' as const })

/** One embedded set, drawn on a 24-unit grid with space around each silhouette. */
export const architectureIcons: readonly ArchitectureIcon[] = [
  {
    id: 'groma:person', label: 'Person', category: 'People',
    paths: [
      wash('M5 20v-1a7 7 0 0 1 14 0v1Z'),
      line('M15.25 7a3.25 3.25 0 1 1-6.5 0 3.25 3.25 0 0 1 6.5 0ZM5 20v-1a7 7 0 0 1 14 0v1Z'),
    ],
  },
  {
    id: 'groma:team', label: 'Team', category: 'People',
    paths: [
      wash('M2.5 20v-1.5a6.5 6.5 0 0 1 13 0V20Z'),
      line('M12 7.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM2.5 20v-1.5a6.5 6.5 0 0 1 13 0V20ZM16 5.5a3 3 0 1 1 0 6M18 14a5 5 0 0 1 3.5 4.8V20H19'),
    ],
  },
  {
    id: 'groma:system', label: 'System', category: 'Architecture',
    paths: [
      wash('M8 14h8v4H8Z'),
      line('M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM6 6h4v4H6ZM14 6h4v4h-4ZM8 14h8v4H8ZM8 10v2h8v-2M12 12v2'),
    ],
  },
  {
    id: 'groma:external', label: 'External system', category: 'Architecture',
    paths: [
      wash('M4 9h11v11H4Z'),
      line('M10 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-5M9 15 21 3M15 3h6v6'),
    ],
  },
  {
    id: 'groma:component', label: 'Component', category: 'Architecture',
    paths: [
      wash('M7 3h12v18H7Z'),
      line('M7 5V3h12v18H7v-2M3 6h7v4H3ZM3 14h7v4H3ZM7 10v4M14 8h2M14 16h2'),
    ],
  },
  {
    id: 'groma:group', label: 'Group', category: 'Architecture',
    paths: [
      wash('M7 7h4v4H7ZM13 13h4v4h-4Z'),
      line('M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5M7 7h4v4H7ZM13 7h4v4h-4ZM7 13h4v4H7ZM13 13h4v4h-4Z'),
    ],
  },
  {
    id: 'groma:application', label: 'Application', category: 'Applications',
    paths: [
      wash('M4 4h16v4H4Z'),
      line('M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM3 8h18M6 5.5h.01M8.5 5.5h.01M7 12h4v5H7ZM15 12h2M15 16h2'),
    ],
  },
  {
    id: 'groma:browser', label: 'Browser', category: 'Applications',
    paths: [
      wash('M3 4h18v5H3Z'),
      line('M4.5 3.5h15A1.5 1.5 0 0 1 21 5v14a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19V5a1.5 1.5 0 0 1 1.5-1.5ZM3 9h18M6 6.25h.01M8.5 6.25h.01M12 6.25h6M9 12.5 6.5 15 9 17.5M15 12.5l2.5 2.5-2.5 2.5'),
    ],
  },
  {
    id: 'groma:mobile', label: 'Mobile app', category: 'Applications',
    paths: [
      wash('M6 16h12v4H6Z'),
      line('M8 2.5h8a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-15a2 2 0 0 1 2-2ZM10 5h4M6 16.5h12M11 19h2'),
    ],
  },
  {
    id: 'groma:service', label: 'Service', category: 'Applications',
    paths: [
      wash('M12 3 20 7.5v9L12 21l-8-4.5v-9Z'),
      line('M12 3 20 7.5v9L12 21l-8-4.5v-9ZM4 7.5l8 4.5 8-4.5M12 12v9M8 5.25l8 4.5'),
    ],
  },
  {
    id: 'groma:worker', label: 'Worker', category: 'Applications',
    paths: [
      wash('M10 8.5 16 12l-6 3.5Z'),
      line('M10 8.5 16 12l-6 3.5ZM19.5 7A9 9 0 0 0 3 12M3 7v5h5M4.5 17A9 9 0 0 0 21 12M21 17v-5h-5'),
    ],
  },
  {
    id: 'groma:database', label: 'Database', category: 'Infrastructure',
    paths: [
      wash('M4 6c0-2 3.6-3.5 8-3.5S20 4 20 6s-3.6 3.5-8 3.5S4 8 4 6Z'),
      line('M4 6c0-2 3.6-3.5 8-3.5S20 4 20 6s-3.6 3.5-8 3.5S4 8 4 6ZM4 6v12c0 2 3.6 3.5 8 3.5s8-1.5 8-3.5V6M4 12c0 2 3.6 3.5 8 3.5s8-1.5 8-3.5'),
    ],
  },
  {
    id: 'groma:queue', label: 'Queue', category: 'Infrastructure',
    paths: [
      wash('M15 4h5v11h-5Z'),
      line('M3 4h5v11H3ZM9 4h5v11H9ZM15 4h5v11h-5ZM3 20h18M18 17l3 3-3 3'),
    ],
  },
  {
    id: 'groma:cache', label: 'Cache', category: 'Infrastructure',
    paths: [
      wash('M13 5 7.5 13H12l-1 6 5.5-8H12Z'),
      line('M6 3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3ZM13 5 7.5 13H12l-1 6 5.5-8H12Z'),
    ],
  },
  {
    id: 'groma:storage', label: 'File storage', category: 'Infrastructure',
    paths: [
      wash('M3 10h18v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z'),
      line('M3 10V6a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2ZM3 10h18M9 15h6'),
    ],
  },
  {
    id: 'groma:gateway', label: 'Gateway', category: 'Infrastructure',
    paths: [
      wash('M9 4h6v16H9Z'),
      line('M9 4h6v16H9ZM2 7h4l3 5-3 5H2M2 12h7M15 12h7M19 9l3 3-3 3'),
    ],
  },
  {
    id: 'groma:repository', label: 'Repository', category: 'Infrastructure',
    paths: [
      wash('M4 3h14a2 2 0 0 1 2 2v15H6a2 2 0 0 1-2-2Z'),
      line('M6 3h12a2 2 0 0 1 2 2v15H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM4 17h16M9 7v6M9 11c5 0 6-1 6-4M9 6h.01M9 14h.01M15 6h.01'),
    ],
  },
  {
    id: 'groma:cloud', label: 'Cloud', category: 'Infrastructure',
    paths: [
      wash('M6 19a4.5 4.5 0 0 1-.5-9A6.5 6.5 0 0 1 18 8.5 5.25 5.25 0 0 1 18 19Z'),
      line('M6 19a4.5 4.5 0 0 1-.5-9A6.5 6.5 0 0 1 18 8.5 5.25 5.25 0 0 1 18 19ZM5.5 10A4.5 4.5 0 0 1 9 11.5'),
    ],
  },
  {
    id: 'groma:identity', label: 'Identity', category: 'Infrastructure',
    paths: [
      wash('M12 2.5 20 6v6c0 4.5-4.5 7.5-8 9.5C8.5 19.5 4 16.5 4 12V6Z'),
      line('M12 2.5 20 6v6c0 4.5-4.5 7.5-8 9.5C8.5 19.5 4 16.5 4 12V6ZM14.5 10a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM12 12.5V16'),
    ],
  },
  {
    id: 'groma:mail', label: 'Mail', category: 'Infrastructure',
    paths: [
      wash('M3 6h18l-9 7Z'),
      line('M4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-11A1.5 1.5 0 0 1 4.5 5ZM3 6l9 7 9-7M3 18l6-6M21 18l-6-6'),
    ],
  },
]

/** An icon is authored by its qualified name; missing names mean no assigned icon. */
export function architectureIcon(id: string | undefined): ArchitectureIcon | undefined {
  return architectureIcons.find(icon => icon.id === id)
}
