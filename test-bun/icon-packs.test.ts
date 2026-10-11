import { expect, test } from 'bun:test'
import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import os from 'node:os'
import path from 'node:path'
import { attachElementIcons } from '../src/icon-packs.ts'
import { addPlugin, updatePlugin } from '../src/plugin-management.ts'
import { readPluginConfig } from '../src/scanner/modules/config.ts'
import { box } from './helpers.ts'

async function project(prefix: string): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), prefix))
  await cp(path.resolve(import.meta.dir, '../test/fixtures/empty-project'), root, { recursive: true })
  return root
}

/** A pack with one `database` icon; the SVG says which pack and version drew it. */
async function writePack(directory: string, name: string, id: string, version = '1.0.0') {
  const manifest = { name, version, groma: { icons: { id, icons: { database: './database.svg' } } } }
  await mkdir(directory, { recursive: true })
  await writeFile(path.join(directory, 'package.json'), JSON.stringify(manifest))
  await writeFile(path.join(directory, 'database.svg'), `<svg xmlns="http://www.w3.org/2000/svg"><title>${id} ${version}</title></svg>`)
  return manifest
}

test.concurrent('an icon is the first configured pack that has its name, the pack it names, or the emoji itself', async () => {
  const root = await project('groma-icon-resolve-')
  try {
    for (const id of ['first', 'second']) {
      await writePack(path.join(root, id), `icons-${id}`, id)
      await addPlugin(root, `./${id}`)
    }
    const elements = ['database', 'first:database', 'second:database', '📦', 'missing']
      .map((icon, index) => ({ ...box(`element-${index}`, 'component', { x: 0, y: 0, width: 1, height: 1 }), icon }))
    await attachElementIcons(root, elements)
    const [bare, first, second, emoji, missing] = elements.map(element => element.resolvedIcon)
    expect(first).toMatchObject({ kind: 'image' })
    expect(bare).toEqual(first)
    expect(second).toMatchObject({ kind: 'image' })
    expect(second).not.toEqual(first)
    expect(emoji).toEqual({ kind: 'emoji', text: '📦' })
    expect(missing).toBeUndefined()
  } finally { await rm(root, { recursive: true, force: true }) }
})

test.concurrent('updating an icon pack keeps its place in the configured order', async () => {
  const root = await project('groma-icon-update-')
  const name = `@example/icons-${randomUUID()}`
  const versions: Record<string, unknown> = {}
  const server = Bun.serve({ port: 0, fetch(request) {
    const url = new URL(request.url)
    if (url.pathname.endsWith('.tgz')) return new Response(Bun.file(path.join(root, path.basename(url.pathname))))
    return Response.json({ name, versions, 'dist-tags': { latest: '1.1.0' } })
  } })
  try {
    for (const version of ['1.0.0', '1.1.0']) {
      const manifest = await writePack(path.join(root, 'package'), name, 'primary', version)
      const pack = Bun.spawn(['tar', '-czf', `${version}.tgz`, 'package'], { cwd: root, stdout: 'ignore', stderr: 'pipe' })
      const error = await new Response(pack.stderr).text()
      expect(await pack.exited, error).toBe(0)
      versions[version] = { ...manifest, dist: { tarball: `${server.url.origin}/${version}.tgz` } }
    }
    await writePack(path.join(root, 'secondary'), 'icons-secondary', 'secondary')
    const options = { registry: server.url.href, cacheRoot: path.join(root, 'cache') }
    await addPlugin(root, `${name}@1.0.0`, options)
    await addPlugin(root, './secondary', options)
    await updatePlugin(root, 'primary', undefined, options)
    expect((await readPluginConfig(root)).icons).toEqual([
      { id: 'primary', source: `${name}@1.1.0` }, { id: 'secondary', source: './secondary' },
    ])
  } finally {
    await server.stop(true)
    await rm(root, { recursive: true, force: true })
  }
})
