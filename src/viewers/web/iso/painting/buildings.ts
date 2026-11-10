import { buildingFont } from '../../../../sheet/measure.ts'
import type { BuildingFloor } from '../../../../sheet/types.ts'
import type { Plane, ProjectedBuilding, ProjectedScene } from '../projection/project.ts'
import type { Still } from './icon-camera.ts'
import { roofName } from './names.ts'
import { facadePattern, facadePatternId } from './style.ts'
import { colorAttribute, node, pointsAttribute, type SvgNode } from './svg.ts'

function classOf(projected: ProjectedBuilding): string {
  const { building } = projected
  const kind = building.kind === 'actor' ? 'actor' : building.external ? 'external' : 'component'
  const ghost = building.origin === 'observed' ? '' : ` ghost ${building.origin}`
  return `building ${kind}${ghost}`
}

/** Each file type contributes its two facade tiles once, before any building references them. */
export function facadeDefs(scene: ProjectedScene): SvgNode[] {
  const fileTypes = new Set(scene.buildings.flatMap(({ building }) => building.floors.map(floor => floor.facadeFileType)))
  return [...fileTypes].flatMap(fileType =>
    [...facadePattern(fileType, 'left', scene.view), ...facadePattern(fileType, 'right', scene.view)])
}

function floorPattern(
  projected: ProjectedBuilding,
  floor: BuildingFloor | undefined,
  plane: Extract<Plane, 'left' | 'right'>,
): string {
  if (floor !== undefined) return facadePatternId(floor.facadeFileType, plane)
  if (projected.building.kind === 'actor') return `dots-${plane}`
  return `${projected.building.external ? 'cross' : 'lines'}-${plane}`
}

function floorSvg(
  projected: ProjectedBuilding,
  faces: ProjectedBuilding['floors'][number],
  floor: BuildingFloor | undefined,
): SvgNode[] {
  const body = faces.flatMap(face => {
    const points = pointsAttribute(face.points)
    const shape = node('polygon', { points }, `face ${face.side}`)
    if (face.side === 'top') return [shape]
    const pattern = floorPattern(projected, floor, face.plane!)
    return [shape, node('polygon', { points, style: `fill:url(#${pattern})` }, `pattern ${face.side}`)]
  })
  return floor === undefined ? body
    : [node('g', { 'data-files': floor.files.join('\n'), 'data-file-type': floor.facadeFileType }, 'floor', body)]
}

/**
 * Buildings back to front: visible floors, patterned side faces, and on the final roofs the name with its icon
 * before it. `still` is set for a drawing without a live stylesheet, such as a cover; the live map passes none.
 */
export function buildingsSvg(scene: ProjectedScene, still?: Still): SvgNode[] {
  return scene.buildings.map(projected => {
    const { building, floors, text } = projected
    return node('g', { 'aria-label': building.title, 'data-id': building.representationId, ...colorAttribute(building) }, classOf(projected), [
      ...floors.flatMap((faces, index) => floorSvg(projected, faces, building.floors[index])),
      ...roofName(text, buildingFont(building), scene.view, building.icon, still),
    ])
  })
}
