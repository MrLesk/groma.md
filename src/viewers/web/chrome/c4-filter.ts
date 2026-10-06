import type { C4Kind } from '../../../types.ts'
import { kindLabel } from '../../atoms/kind.ts'
import type { LayeredScene } from '../iso/projection/separation.ts'

type MapFilter = C4Kind | 'relationship'

/** The shared ● ■ ▱ ▪ element marks and a directed relationship arrow. */
const filters: { filter: MapFilter; icon: string }[] = [
  { filter: 'actor', icon: '<circle cx="12" cy="12" r="7" fill="currentColor" stroke="none"/>' },
  { filter: 'system', icon: '<rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor" stroke="none"/>' },
  { filter: 'container', icon: '<path d="M8 6h13l-5 12H3L8 6Z"/>' },
  { filter: 'component', icon: '<rect x="8" y="8" width="8" height="8" rx="1.3" fill="currentColor" stroke="none"/>' },
  { filter: 'relationship', icon: '<path d="M4 12h16m-5-5 5 5-5 5"/>' },
]

/** Visibility changes presentation only: retained geometry and camera bounds stay identical. */
export function filterC4Scene(scene: LayeredScene, hidden: ReadonlySet<MapFilter>): LayeredScene {
  if (hidden.size === 0) return scene
  const islands = scene.islands.filter(({ island }) => !hidden.has(island.kind === 'actors' ? 'actor' : 'system'))
  const slabs = hidden.has('container') ? [] : scene.slabs
  const buildings = scene.buildings.filter(({ building }) => !hidden.has(building.kind))
  const visible = new Set([
    ...islands.flatMap(({ island }) => island.element === null ? [] : [island.element.representationId]),
    ...slabs.map(({ slab }) => slab.representationId),
    ...buildings.map(({ building }) => building.representationId),
  ])
  return {
    ...scene, islands, slabs, buildings,
    zones: scene.zones.filter(({ zone }) => zone.members.some(id => visible.has(id))),
    routes: hidden.has('relationship') ? [] : scene.routes.filter(({ route }) => visible.has(route.source) && visible.has(route.target)),
    layerPlanes: scene.layerPlanes.filter(plane => !hidden.has(plane.layer)),
  }
}

export function c4FilterControl(): string {
  return `<div id="c4-filter" class="floating-map-bar" role="group" aria-label="Map filters">${filters.map(({ filter, icon }) => {
    const label = filter === 'relationship' ? 'Relationships' : `${kindLabel(filter)}s`
    return `<button type="button" data-filter="${filter}" aria-label="${label}" aria-pressed="true" aria-controls="map"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon}</svg><span class="c4-tooltip" aria-hidden="true">${label}</span></button>`
  }).join('')}</div>`
}

/** The control owns page-local visibility; every projection uses its current selection. */
export function bindC4Filter(host: HTMLElement, repaint: () => void): (scene: LayeredScene) => LayeredScene {
  const hidden = new Set<MapFilter>()
  for (const { filter } of filters) {
    const button = host.querySelector<HTMLButtonElement>(`button[data-filter="${filter}"]`)!
    button.addEventListener('click', () => {
      if (hidden.has(filter)) hidden.delete(filter)
      else hidden.add(filter)
      button.setAttribute('aria-pressed', String(!hidden.has(filter)))
      repaint()
    })
  }
  return scene => filterC4Scene(scene, hidden)
}

export const c4FilterCss = `
  #c4-filter {
    position: absolute; left: calc(var(--hierarchy-inset) + 24px); top: 134px; z-index: 7;
    flex-direction: column; gap: 4px; padding: 5px; border-radius: 23px;
    transition: left var(--chrome-motion) var(--chrome-ease);
  }
  #c4-filter button {
    position: relative; display: grid; place-items: center; width: 32px; height: 32px; padding: 0;
    border: 1px solid transparent; border-radius: 50%; color: var(--muted);
    transition: color 160ms ease, background 160ms ease;
  }
  #c4-filter svg { display: block; width: 16px; height: 16px; }
  #c4-filter button:hover { color: var(--ink); background: var(--hover); }
  #c4-filter [aria-pressed="true"], #c4-filter [aria-pressed="true"]:hover { color: var(--paper); background: var(--ink); }
  #c4-filter .c4-tooltip {
    position: absolute; left: calc(100% + 13px); top: 50%; transform: translate(-4px, -50%);
    padding: 5px 9px; border: 1px solid var(--hairline); border-radius: 6px; background: var(--paper); color: var(--ink);
    font-size: 11px; opacity: 0; visibility: hidden; pointer-events: none;
    box-shadow: 0 2px 8px #0002; transition: opacity 160ms ease, transform 160ms ease;
  }
  #c4-filter button:is(:hover, :focus-visible) .c4-tooltip { opacity: 1; visibility: visible; transform: translate(0, -50%); }
  body.hud-hidden #c4-filter { display: none; }
  @media (prefers-reduced-motion: reduce) {
    #c4-filter, #c4-filter button, #c4-filter .c4-tooltip { transition: none; }
  }
`
