export const ARCHITECTURE_ICON_VIEWBOX = 24

/** Original Groma drawings. Color belongs to the viewer, never to the artwork. */
export interface ArchitectureIcon {
  id: string
  label: string
  category: 'People' | 'Architecture' | 'Applications' | 'Infrastructure'
  paths: readonly { d: string; tone: 'line' | 'wash' | 'shade' }[]
}

const line = (d: string) => ({ d, tone: 'line' as const })
const wash = (d: string) => ({ d, tone: 'wash' as const })
const shade = (d: string) => ({ d, tone: 'shade' as const })

/** Front-facing silhouettes, quiet filled bodies and broad shading on a 24-unit grid. */
export const architectureIcons: readonly ArchitectureIcon[] = [
  {
    id: 'groma:person', label: 'Person', category: 'People',
    paths: [
      wash('M15.75 6.5a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM5 21v-3a7 7 0 0 1 14 0v3Z'),
      shade('M5 17.5c4.5 1.1 9.5 1.1 14 0V21H5Z'),
      line('M15.75 6.5a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM5 21v-3a7 7 0 0 1 14 0v3Z'),
    ],
  },
  {
    id: 'groma:team', label: 'Team', category: 'People',
    paths: [
      wash('M12 6.5a3.25 3.25 0 1 1-6.5 0 3.25 3.25 0 0 1 6.5 0ZM2.5 21v-3.5a6.25 6.25 0 0 1 12.5 0V21ZM19.25 7.5a2.75 2.75 0 1 1-5.5 0 2.75 2.75 0 0 1 5.5 0ZM16.5 12.5a5 5 0 0 1 5 5V21H17v-3.5a8.2 8.2 0 0 0-1.4-4.8Z'),
      shade('M2.5 18.5c4 .8 8.5.8 12.5 0V21H2.5ZM17 18.5h4.5V21H17Z'),
      line('M12 6.5a3.25 3.25 0 1 1-6.5 0 3.25 3.25 0 0 1 6.5 0ZM2.5 21v-3.5a6.25 6.25 0 0 1 12.5 0V21ZM19.25 7.5a2.75 2.75 0 1 1-5.5 0 2.75 2.75 0 0 1 5.5 0ZM16.5 12.5a5 5 0 0 1 5 5V21H18'),
    ],
  },
  {
    id: 'groma:system', label: 'System', category: 'Architecture',
    paths: [
      wash('M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z'),
      shade('M6 7h5v7H6ZM15 10h3v4h-3ZM3 18h18v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z'),
      line('M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM6 7h5v7H6ZM15 10h3v4h-3ZM11 12h4'),
    ],
  },
  {
    id: 'groma:external', label: 'External system', category: 'Architecture',
    paths: [
      wash('M5 4h7v8h8v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2ZM15 3h6v6h-6Z'),
      shade('M3 17h17v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2ZM15 7h6v2h-6Z'),
      line('M11 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-6M15 3h6v6h-6ZM10 14l5-5'),
    ],
  },
  {
    id: 'groma:component', label: 'Component', category: 'Architecture',
    paths: [
      wash('M7 3h13v18H7ZM3 6h7v4H3ZM3 14h7v4H3Z'),
      shade('M7 18h13v3H7ZM3 8h7v2H3ZM3 16h7v2H3Z'),
      line('M7 6V3h13v18H7v-3M7 10v4M3 6h7v4H3ZM3 14h7v4H3Z'),
    ],
  },
  {
    id: 'groma:group', label: 'Group', category: 'Architecture',
    paths: [
      wash('M6.5 6.5h4v4h-4ZM13.5 6.5h4v4h-4ZM6.5 13.5h4v4h-4ZM13.5 13.5h4v4h-4Z'),
      shade('M6.5 9h4v1.5h-4ZM13.5 9h4v1.5h-4ZM6.5 16h4v1.5h-4ZM13.5 16h4v1.5h-4Z'),
      line('M7 3H3v4M17 3h4v4M21 17v4h-4M7 21H3v-4M6.5 6.5h4v4h-4ZM13.5 6.5h4v4h-4ZM6.5 13.5h4v4h-4ZM13.5 13.5h4v4h-4Z'),
    ],
  },
  {
    id: 'groma:application', label: 'Application', category: 'Applications',
    paths: [
      wash('M5 3.5h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z'),
      shade('M5 3.5h14a2 2 0 0 1 2 2V8H3V5.5a2 2 0 0 1 2-2ZM6.5 11.5h4v5h-4Z'),
      line('M5 3.5h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2ZM3 8h18M6 5.75h.01M8.75 5.75h.01M6.5 11.5h4v5h-4ZM14 12h3.5M14 16h3.5'),
    ],
  },
  {
    id: 'groma:browser', label: 'Browser', category: 'Applications',
    paths: [
      wash('M5 3.5h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z'),
      shade('M5 3.5h14a2 2 0 0 1 2 2V8H3V5.5a2 2 0 0 1 2-2Z'),
      line('M5 3.5h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2ZM3 8h18M6 5.75h.01M8.75 5.75h.01M13 5.75h5M9 11.5 6 14.5 9 17.5M15 11.5l3 3-3 3'),
    ],
  },
  {
    id: 'groma:mobile', label: 'Mobile app', category: 'Applications',
    paths: [
      wash('M8 2.5h8a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-15a2 2 0 0 1 2-2Z'),
      shade('M8 2.5h8a2 2 0 0 1 2 2V7H6V4.5a2 2 0 0 1 2-2ZM6 17h12v2.5a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2Z'),
      line('M8 2.5h8a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-15a2 2 0 0 1 2-2ZM10 5h4M13 19.25a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z'),
    ],
  },
  {
    id: 'groma:service', label: 'Service', category: 'Applications',
    paths: [
      wash('M7 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z'),
      shade('M5 15h14v2a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2ZM10 9.5l5 2.5-5 2.5Z'),
      line('M7 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2ZM10 9.5l5 2.5-5 2.5ZM2.5 12H5M19 12h2.5M12 2.5V5M12 19v2.5'),
    ],
  },
  {
    id: 'groma:worker', label: 'Worker', category: 'Applications',
    paths: [
      wash('M15.5 12a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z'),
      shade('M8.5 12h7a3.5 3.5 0 0 1-7 0Z'),
      line('M15.5 12a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0ZM19.5 7A9 9 0 0 0 3 12M3 7v5h5M4.5 17A9 9 0 0 0 21 12M21 17v-5h-5'),
    ],
  },
  {
    id: 'groma:server', label: 'Server', category: 'Infrastructure',
    paths: [
      wash('M4 3h16v5H4ZM4 9.5h16v5H4ZM4 16h16v5H4Z'),
      shade('M4 6h16v2H4ZM4 12.5h16v2H4ZM4 19h16v2H4Z'),
      line('M4 3h16v5H4ZM4 9.5h16v5H4ZM4 16h16v5H4ZM7 5.5h.01M10 5.5h.01M7 12h.01M10 12h.01M7 18.5h.01M10 18.5h.01'),
    ],
  },
  {
    id: 'groma:database', label: 'Database', category: 'Infrastructure',
    paths: [
      wash('M4 5.5c0-1.65 3.6-3 8-3s8 1.35 8 3v13c0 1.65-3.6 3-8 3s-8-1.35-8-3Z'),
      shade('M4 14.2c0 1.65 3.6 3 8 3s8-1.35 8-3v4.3c0 1.65-3.6 3-8 3s-8-1.35-8-3Z'),
      line('M4 5.5c0-1.65 3.6-3 8-3s8 1.35 8 3-3.6 3-8 3-8-1.35-8-3ZM4 5.5v13c0 1.65 3.6 3 8 3s8-1.35 8-3v-13M4 9.8c0 1.65 3.6 3 8 3s8-1.35 8-3M4 14.2c0 1.65 3.6 3 8 3s8-1.35 8-3'),
    ],
  },
  {
    id: 'groma:queue', label: 'Queue', category: 'Infrastructure',
    paths: [
      wash('M5.5 3.5h13l2 4.5h-17ZM5 10h14l1.5 4H3.5ZM2.5 16h19v5h-19Z'),
      shade('M2.5 18.5h19V21h-19Z'),
      line('M5.5 3.5h13l2 4.5h-17ZM5 10h14l1.5 4H3.5ZM2.5 16h19v5h-19Z'),
    ],
  },
  {
    id: 'groma:cache', label: 'Cache', category: 'Infrastructure',
    paths: [
      wash('M13 2.5 5 13h6l-1 8.5L19 10h-6Z'),
      shade('M11 13h3l-4 8.5Z'),
      line('M13 2.5 5 13h6l-1 8.5L19 10h-6Z'),
    ],
  },
  {
    id: 'groma:storage', label: 'File storage', category: 'Infrastructure',
    paths: [
      wash('M3 6a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z'),
      shade('M3 17h18v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z'),
      line('M3 6a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2ZM3 10h18'),
    ],
  },
  {
    id: 'groma:gateway', label: 'Gateway', category: 'Infrastructure',
    paths: [
      wash('M4 3h16v18h-4V7H8v14H4Z'),
      shade('M4 17h4v4H4ZM16 17h4v4h-4Z'),
      line('M4 21V3h16v18M8 21V7h8v14M9.5 13h12M19 10.5l2.5 2.5-2.5 2.5'),
    ],
  },
  {
    id: 'groma:repository', label: 'Repository', category: 'Infrastructure',
    paths: [
      wash('M6 3h10l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z'),
      shade('M16 3v4h4ZM4 17h16v4H6a2 2 0 0 1-2-2Z'),
      line('M6 3h10l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM16 3v4h4M4 17h16M9 7v7M9 12c5 0 6-1 6-3M9 7h.01M15 9h.01'),
    ],
  },
  {
    id: 'groma:cloud', label: 'Cloud', category: 'Infrastructure',
    paths: [
      wash('M6.5 20C3.8 20 2 18.1 2 15.5c0-2.6 1.8-4.5 4.2-4.5C6.3 7.1 8.5 4 12 4c3.1 0 5.6 2.7 5.8 5.8 2.6 0 4.2 2.2 4.2 5 0 3-2 5.2-5 5.2Z'),
      shade('M2.2 17c5.8 1 13.8 1 19.3 0-.8 2-2.5 3-4.5 3H6.5c-2.2 0-3.7-1.2-4.3-3Z'),
      line('M6.5 20C3.8 20 2 18.1 2 15.5c0-2.6 1.8-4.5 4.2-4.5C6.3 7.1 8.5 4 12 4c3.1 0 5.6 2.7 5.8 5.8 2.6 0 4.2 2.2 4.2 5 0 3-2 5.2-5 5.2Z'),
    ],
  },
  {
    id: 'groma:identity', label: 'Identity', category: 'Infrastructure',
    paths: [
      wash('M12 2.5 20 6v6c0 4.5-4.5 7.5-8 9.5C8.5 19.5 4 16.5 4 12V6Z'),
      shade('M4.5 14c5 .8 10 .8 15 0-1.2 3.2-4.8 5.7-7.5 7.5-2.7-1.8-6.3-4.3-7.5-7.5Z'),
      line('M12 2.5 20 6v6c0 4.5-4.5 7.5-8 9.5C8.5 19.5 4 16.5 4 12V6ZM14.5 10a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM12 12.5V16'),
    ],
  },
  {
    id: 'groma:mail', label: 'Mail', category: 'Infrastructure',
    paths: [
      wash('M4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-11A1.5 1.5 0 0 1 4.5 5Z'),
      shade('M3 17.5 9 12h6l6 5.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5Z'),
      line('M4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-11A1.5 1.5 0 0 1 4.5 5ZM3 6l9 7 9-7M3 18l6-6M21 18l-6-6'),
    ],
  },
]

/** An icon is authored by its qualified name; missing names mean no assigned icon. */
export function architectureIcon(id: string | undefined): ArchitectureIcon | undefined {
  return architectureIcons.find(icon => icon.id === id)
}
