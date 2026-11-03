import { architectureIcons, ARCHITECTURE_ICON_VIEWBOX, type ArchitectureIcon } from '../../../architecture-icons.ts'

/** The library and authoring picker search the same published names and categories. */
export function matchingArchitectureIcons(query: string): readonly ArchitectureIcon[] {
  const search = query.trim().toLowerCase()
  return architectureIcons.filter(icon =>
    [icon.label, icon.id, icon.category].some(value => value.toLowerCase().includes(search)))
}

export const iconCatalogCss = `
  .architecture-icon-preview { width: 24px; height: 24px; flex: none; fill: none; stroke: currentColor;
    stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
  .architecture-icon-preview .icon-wash { fill: currentColor; stroke: none; fill-opacity: 0.14; }
  .architecture-icon-preview .icon-shade { fill: currentColor; stroke: none; fill-opacity: 0.18; }
`

/** DOM previews share the map's catalog without copying or adapting its path data. */
export function iconPreview(icon: ArchitectureIcon | undefined): SVGSVGElement {
  const namespace = 'http://www.w3.org/2000/svg'
  const image = document.createElementNS(namespace, 'svg')
  image.classList.add('architecture-icon-preview')
  image.setAttribute('viewBox', `0 0 ${ARCHITECTURE_ICON_VIEWBOX} ${ARCHITECTURE_ICON_VIEWBOX}`)
  image.setAttribute('aria-hidden', 'true')
  for (const drawing of icon?.paths ?? [{ d: 'M5 5 19 19M19 5 5 19', tone: 'line' }]) {
    const path = document.createElementNS(namespace, 'path')
    path.setAttribute('d', drawing.d)
    path.setAttribute('class', `icon-${drawing.tone}`)
    image.append(path)
  }
  return image
}
