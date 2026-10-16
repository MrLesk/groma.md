import { expect, test } from 'bun:test'
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import os from 'node:os'
import path from 'node:path'
import packageJson from '../package.json'
import { configuredScannerModules, updateScanner } from '../src/scanner/modules/inventory.ts'
import { readGromaConfig, writeGromaConfig } from '../src/config.ts'
import { changePluginSettings, parsePluginSettingsAction } from '../src/plugins/settings.ts'
import { restorePlugin } from '../src/plugins/management.ts'
import { createScannerSession } from '../src/scanner/session.ts'
import { scanRepository, watchScan } from '../src/scanner.ts'

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'groma-update-'))
  const name = `@example/scanner-${randomUUID()}`
  const versions: Record<string, unknown> = {}
  const releases: Record<string, unknown> = {}
  let unavailable = false
  let metadataReads = 0
  const downloads: string[] = []
  const scans: string[] = []
  const server = Bun.serve({ port: 0, fetch(request) {
    const url = new URL(request.url)
    if (url.pathname.startsWith('/scanned/')) {
      scans.push(url.pathname.slice('/scanned/'.length))
      return new Response('ok')
    }
    if (url.pathname.endsWith('.tgz')) {
      downloads.push(path.basename(url.pathname))
      return new Response(Bun.file(path.join(root, path.basename(url.pathname))))
    }
    metadataReads++
    if (unavailable) return new Response('Unavailable', { status: 503 })
    return Response.json({ name, versions, 'dist-tags': { latest: '2.0.0' } })
  } })
  const close = async () => { await server.stop(true); await rm(root, { recursive: true, force: true }) }
  try {
    await cp(path.resolve(import.meta.dir, '../test/fixtures/flows'), root, { recursive: true })
    const pkg = path.join(root, 'package')
    await mkdir(pkg)
    for (const version of ['1.0.0', '1.1.0', '1.2.0', '2.0.0']) {
      const manifest = { name, version, groma: { scanner: { id: 'sample', entry: './index.js', include: ['**/*.sample'], exclude: ['**/*.snap'], discovery: {
        technologies: ['sample'], rules: [], compatibility: { groma: version === '2.0.0' ? '^9.0.0' : packageJson.version },
      } } } }
      await writeFile(path.join(pkg, 'package.json'), JSON.stringify(manifest))
      await writeFile(path.join(pkg, 'index.js'), `export default { id: 'sample', async scan() {
        await fetch('${server.url.origin}/scanned/${version}', { method: 'POST' });
        return { scanner: { id: 'sample', technology: 'sample', engine: 'fixture', engineVersion: '${version}' }, roots: [], files: [], diagnostics: [] };
      } }`)
      const pack = Bun.spawn(['tar', '-czf', `${version}.tgz`, 'package'], { cwd: root, stdout: 'ignore', stderr: 'pipe' })
      const error = await new Response(pack.stderr).text()
      expect(await pack.exited, error).toBe(0)
      releases[version] = { ...manifest, dist: { tarball: `${server.url.origin}/${version}.tgz` } }
      if (version !== '1.2.0') versions[version] = releases[version]
    }
    await mkdir(path.join(root, 'src'), { recursive: true })
    await writeFile(path.join(root, 'src/main.sample'), 'first')
    await writeFile(path.join(root, '.gitignore'), 'cache/\npackage/\n*.tgz\n')
    expect(await Bun.spawn(['git', 'init', '--quiet', root], { stdout: 'ignore', stderr: 'pipe' }).exited).toBe(0)
    const config = { workSources: [], exclude: ['generated/**'], useGitignore: false, scanners: [
      { id: 'sample', source: `${name}@1.0.0`, settings: { mode: 'strict' }, include: ['src/**/*.sample'], exclude: ['**/*.gen.ts'] },
    ] }
    await writeGromaConfig(root, config)
    return { root, name, config, scans, downloads,
      options: { registry: server.url.href, cacheRoot: path.join(root, 'cache') },
      metadataReads: () => metadataReads,
      publishNewer: () => { versions['1.2.0'] = releases['1.2.0'] },
      makeUnavailable: () => { unavailable = true }, close,
    }
  } catch (error) { await close(); throw error }
}

test.concurrent('explicit npm updates select compatible releases and preserve project settings', async () => {
  const f = await fixture()
  try {
    const config = { ...f.config, scanners: [
      { id: 'other', source: './other', include: ['**/*.other'] }, ...f.config.scanners,
    ] }
    for (const source of [undefined, f.name]) {
      await writeGromaConfig(f.root, config)
      await changePluginSettings(f.root, parsePluginSettingsAction({ action: 'update', id: 'sample', source }), f.options)
      expect(await readGromaConfig(f.root)).toEqual({ ...config, scanners: [config.scanners[0], {
        ...config.scanners[1], source: `${f.name}@1.1.0`,
      }] })
      expect((await configuredScannerModules(f.root, f.options)).find(item => item.id === 'sample')).toMatchObject({ status: 'found', version: '1.1.0' })
    }
    await updateScanner(f.root, 'sample', `${f.name}@1.0.0`, f.options)
    expect(await readGromaConfig(f.root)).toEqual(config)
    await expect(updateScanner(f.root, 'sample', '@example/different@1.1.0', f.options)).rejects.toThrow('same npm package')
    await expect(updateScanner(f.root, 'other', undefined, f.options)).rejects.toThrow('local plugins')
    f.makeUnavailable()
    await expect(updateScanner(f.root, 'sample', undefined, f.options)).rejects.toThrow('503')
    expect(await readGromaConfig(f.root)).toEqual(config)
  } finally { await f.close() }
})

test.concurrent('live sessions update before scanning and retain their loaded version until the next startup', async () => {
  const f = await fixture()
  const edited = Promise.withResolvers<void>()
  let folds = 0
  let session: Awaited<ReturnType<typeof createScannerSession>> | undefined
  try {
    await updateScanner(f.root, 'sample', `${f.name}@1.0.0`, f.options)
    session = await createScannerSession(f.root, { ...f.options, onFold: () => { if (++folds === 2) edited.resolve() } })
    await session.ready
    expect(f.scans).toEqual(['1.1.0'])
    expect(await readGromaConfig(f.root)).toEqual({ ...f.config, scanners: [{ ...f.config.scanners[0], source: `${f.name}@1.1.0` }] })
    const reads = f.metadataReads()
    f.publishNewer()
    await writeFile(path.join(f.root, 'src/main.sample'), 'edited')
    await edited.promise
    expect(f.scans).toEqual(['1.1.0', '1.1.0'])
    expect(f.metadataReads()).toBe(reads)
    await session.close()
    session = await createScannerSession(f.root, f.options)
    await session.ready
    expect(f.scans, JSON.stringify(session.state)).toEqual(['1.1.0', '1.1.0', '1.2.0'])
  } finally { await session?.close(); await f.close() }
})

for (const mode of ['scan', 'watch'] as const) {
  test.concurrent(`${mode} startup prepares the latest compatible npm scanner`, async () => {
    const f = await fixture()
    let watcher: Awaited<ReturnType<typeof watchScan>> | undefined
    try {
      await updateScanner(f.root, 'sample', `${f.name}@1.0.0`, f.options)
      if (mode === 'scan') await scanRepository(f.root, f.options)
      else {
        const folded = Promise.withResolvers<void>()
        watcher = await watchScan(f.root, { ...f.options, onFold: () => { folded.resolve() } })
        await writeFile(path.join(f.root, 'src/main.sample'), 'edited')
        await folded.promise
      }
      expect(f.scans).toEqual(['1.1.0'])
      expect((await readGromaConfig(f.root)).scanners[0]?.source).toBe(`${f.name}@1.1.0`)
    } finally { await watcher?.close(); await f.close() }
  })
}

test.concurrent('restoring an npm scanner selects the current release and reuses its installed package', async () => {
  const f = await fixture()
  try {
    await restorePlugin(f.root, 'sample', f.options)
    const expected = { ...f.config, scanners: [{ ...f.config.scanners[0], source: `${f.name}@1.1.0` }] }
    expect(await readGromaConfig(f.root)).toEqual(expected)
    expect(f.downloads).toEqual(['1.1.0.tgz'])
    const saved = await readFile(path.join(f.root, 'groma/config.json'), 'utf8')
    await restorePlugin(f.root, 'sample', f.options)
    expect(f.downloads).toEqual(['1.1.0.tgz'])
    expect(await readFile(path.join(f.root, 'groma/config.json'), 'utf8')).toBe(saved)
  } finally { await f.close() }
})
