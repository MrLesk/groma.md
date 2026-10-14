import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { compiledAsset } from '../../compiled-asset.ts'
import { loadAnnotatedArchitecture } from '../../core.ts'
import { loadProjectProfile, type ProjectProfile } from '../../project-profile.ts'
import { measuredSheetScene } from '../../sheet/scene.ts'
import type { AnnotatedArchitectureModel } from '../../types.ts'
import type { WebMapPayload } from './payload.ts'

export type MapLoadPhase = 'loading-architecture' | 'preparing-map'

/** The interactive browser entry included in source runs and the standalone CLI. */
export const browserRenderer = { asset: 'groma-web-render', entry: 'src/viewers/web/render.ts' }

/** Builds the same browser runtime used by live and published delivery. */
export async function bundleRenderer(): Promise<string> {
  const renderer = browserRenderer
  const compiledRenderer = compiledAsset(renderer.asset, 'index.js')
  if (compiledRenderer !== undefined) return readFileSync(compiledRenderer, 'utf8')
  const build = await Bun.build({
    entrypoints: [fileURLToPath(new URL(`../../../${renderer.entry}`, import.meta.url))],
    target: 'browser',
  })
  return build.outputs[0]!.text()
}

/** A loaded architecture laid out as the map, without revision or work data. */
export type MapView = Pick<WebMapPayload, 'project' | 'world' | 'sheet' | 'timings'>

/** Lays out a loaded model. Its total time is the time the model took to load plus the layout measured here. */
export function layOutMap(
  world: AnnotatedArchitectureModel,
  project: ProjectProfile | null,
  architectureLoadMilliseconds: number,
): MapView {
  const sheet = measuredSheetScene(world)
  return {
    project,
    world,
    sheet: sheet.scene,
    timings: {
      architectureLoadMilliseconds,
      ...sheet.timings,
      totalMilliseconds: architectureLoadMilliseconds + sheet.timings.placementMilliseconds + sheet.timings.routingMilliseconds,
    },
  }
}

/** Loads and composes the current architecture map without optional work data. */
export async function loadMapRoot(
  repositoryRoot: string,
  onProgress?: (phase: MapLoadPhase) => void | Promise<void>,
): Promise<MapView> {
  onProgress?.('loading-architecture')
  const [architecture, project] = await Promise.all([
    (async () => {
      const loadStarted = performance.now()
      const world = await loadAnnotatedArchitecture(repositoryRoot)
      return { world, milliseconds: performance.now() - loadStarted }
    })(),
    loadProjectProfile(repositoryRoot),
  ])
  // The live host can deliver its status before layout occupies the event loop.
  await onProgress?.('preparing-map')
  return layOutMap(architecture.world, project ?? null, architecture.milliseconds)
}
