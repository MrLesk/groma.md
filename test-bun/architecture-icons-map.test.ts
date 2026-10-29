import assert from 'node:assert/strict'
import { test } from 'bun:test'
import { loadAnnotatedArchitecture } from '../src/core.ts'
import type { AnnotatedArchitectureModel, C4Kind } from '../src/types.ts'
import { sheetScene } from '../src/sheet/scene.ts'
import { buildingsSvg } from '../src/viewers/web/iso/painting/buildings.ts'
import { islandsSvg, slabsSvg } from '../src/viewers/web/iso/painting/ground.ts'
import type { SvgNode } from '../src/viewers/web/iso/painting/svg.ts'
import { NESTED_POSE, OVERHEAD_POSE } from '../src/viewers/web/iso/view-motion/orbit.ts'
import { presentScene } from '../src/viewers/web/iso/view-motion/presentation.ts'
import { renderCover } from '../src/viewers/web/sharing/cover.ts'
import { repositoryRoot } from './helpers.ts'

function descendants(nodes: readonly SvgNode[]): SvgNode[] {
  return nodes.flatMap(item => [item, ...(typeof item.children === 'string' ? [] : descendants(item.children))])
}

function titleIcon(owner: SvgNode | undefined): string | undefined {
  assert.ok(owner !== undefined && typeof owner.children !== 'string')
  const label = owner.children.find(item => item.attributes.class?.split(' ').includes('label'))
  assert.ok(label !== undefined)
  const icon = descendants([label]).find(item => item.attributes['data-icon'] !== undefined)
  assert.ok(icon !== undefined && typeof icon.children !== 'string' && icon.children.length > 0)
  return icon.attributes['data-icon']
}

const iconByKind: Record<C4Kind, string> = {
  actor: 'groma:person', system: 'groma:system', container: 'groma:application', component: 'groma:database',
}

function assignIcons(world: AnnotatedArchitectureModel): void {
  for (const element of world.elements) {
    element.icon = element.external ? 'groma:repository' : iconByKind[element.kind]
    if (element.group === undefined) continue
    const parent = world.elements.find(item => item.representationId === element.parent)!
    parent.groupAppearance = { ...parent.groupAppearance, [element.group]: { icon: 'groma:group' } }
  }
}

test.concurrent('authored icons stay with each architecture owner in live map drawings and static covers', async () => {
  const world = await loadAnnotatedArchitecture(`${repositoryRoot}/test/fixtures/plain-view`)
  assignIcons(world)
  const sheet = sheetScene(world)
  assert.ok(sheet.zones.length > 0)
  for (const pose of [NESTED_POSE, OVERHEAD_POSE]) {
    const scene = presentScene(sheet, undefined, pose)
    const nodes = descendants([...islandsSvg(scene), ...slabsSvg(scene), ...buildingsSvg(scene)])
    for (const element of world.elements) {
      assert.equal(titleIcon(nodes.find(item => item.attributes['data-id'] === element.representationId)), element.icon)
    }
    for (const zone of sheet.zones) {
      assert.equal(titleIcon(nodes.find(item => item.attributes['data-id'] === zone.key)), 'groma:group')
    }
  }
  const expected = [...world.elements.map(element => element.icon!), ...sheet.zones.map(() => 'groma:group')].sort()
  for (const theme of ['light', 'dark', 'blueprint'] as const) {
    const svg = renderCover({ sheet, project: null }, theme)
    assert.deepEqual([...svg.matchAll(/data-icon="([^"]+)"/g)].map(match => match[1]!).sort(), expected)
  }
})
