import { expect, test } from 'bun:test'
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import packageJson from '../package.json'
import { configuredScannerModules, updateNpmScanners, updateScanner } from '../src/scanner/modules/inventory.ts'
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
  let held: ReturnType<typeof Promise.withResolvers<void>> | undefined
  let requested = Promise.withResolvers<void>()
  const scanLog = path.join(root, 'scans.log')
  const server = Bun.serve({ port: 0, async fetch(request) {
    const url = new URL(request.url)
    if (url.pathname.endsWith('.tgz')) {
      downloads.push(path.basename(url.pathname))
      return new Response(Bun.file(path.join(root, path.basename(url.pathname))))
    }
    metadataReads++
    if (held) { requested.resolve(); await held.promise }
    if (unavailable) return new Response('Unavailable', { status: 503 })
    return Response.json({ name, versions, 'dist-tags': { latest: '2.0.0' } })
  } })
  const release = () => { held?.resolve(); held = undefined }
  const close = async () => { release(); await server.stop(true); await rm(root, { recursive: true, force: true }) }
  try {
    await cp(path.resolve(import.meta.dir, '../test/fixtures/flows'), root, { recursive: true })
    const pkg = path.join(root, 'package')
    await mkdir(pkg)
    for (const version of ['1.0.0', '1.1.0', '1.2.0', '2.0.0']) {
      const manifest = { name, version, groma: { scanner: { id: 'sample', entry: './index.js', include: ['**/*.sample'], exclude: ['**/*.snap'], discovery: {
        technologies: ['sample'], rules: [], compatibility: { groma: version === '2.0.0' ? '^9.0.0' : packageJson.version },
      } } } }
      await writeFile(path.join(pkg, 'package.json'), JSON.stringify(manifest))
      await writeFile(path.join(pkg, 'index.js'), `import { appendFile } from 'node:fs/promises';
      export default { id: 'sample', async scan() {
        await appendFile(${JSON.stringify(scanLog)}, '${version}\\n');
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
    return { root, name, config, downloads,
      get scans() {
        try { return readFileSync(scanLog, 'utf8').trim().split('\n') }
        catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []; throw error }
      },
      holdRegistry: () => { held = Promise.withResolvers<void>(); requested = Promise.withResolvers<void>(); return { requested: requested.promise, release } },
      goOffline: () => server.stop(true),
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

test.concurrent('automaticUpdates false skips registry checks while installed scans and explicit updates still work', async () => {
  const f = await fixture()
  let session: Awaited<ReturnType<typeof createScannerSession>> | undefined
  try {
    await updateScanner(f.root, 'sample', `${f.name}@1.0.0`, f.options)
    const config = { ...f.config, automaticUpdates: false }
    await writeGromaConfig(f.root, config)
    const reads = f.metadataReads()
    expect(await updateNpmScanners(f.root, f.options)).toBe(false)
    session = await createScannerSession(f.root, f.options)
    await session.ready
    await session.close()
    expect(f.scans).toEqual(['1.0.0'])
    expect(f.metadataReads()).toBe(reads)
    expect(await readGromaConfig(f.root)).toEqual(config)
    await updateScanner(f.root, 'sample', undefined, f.options)
    expect(await readGromaConfig(f.root)).toEqual({ ...config, scanners: [{ ...config.scanners[0], source: `${f.name}@1.1.0` }] })
  } finally { await session?.close(); await f.close() }
})

test.concurrent('disabling automaticUpdates during a held check keeps the installed selection', async () => {
  const f = await fixture()
  let gate: ReturnType<typeof f.holdRegistry> | undefined
  try {
    await updateScanner(f.root, 'sample', `${f.name}@1.0.0`, f.options)
    gate = f.holdRegistry()
    const updating = updateNpmScanners(f.root, f.options)
    await gate.requested
    const config = { ...f.config, automaticUpdates: false }
    await writeGromaConfig(f.root, config)
    gate.release()
    expect(await updating).toBe(false)
    expect(await readGromaConfig(f.root)).toEqual(config)
  } finally { gate?.release(); await f.close() }
})

test.concurrent('live startup uses the installed scanner before a held update check, then rescans after updating', async () => {
  const f = await fixture()
  const updated = Promise.withResolvers<void>()
  const edited = Promise.withResolvers<void>()
  let session: Awaited<ReturnType<typeof createScannerSession>> | undefined
  let gate: ReturnType<typeof f.holdRegistry> | undefined
  try {
    await updateScanner(f.root, 'sample', `${f.name}@1.0.0`, f.options)
    gate = f.holdRegistry()
    session = await createScannerSession(f.root, { ...f.options, onFold: () => {
      if (f.scans.length === 2) updated.resolve()
      if (f.scans.length === 3) edited.resolve()
    } })
    expect(await Promise.race([session.ready.then(() => 'ready'), gate.requested.then(() => 'registry')])).toBe('ready')
    await session.ready
    expect(f.scans).toEqual(['1.0.0'])
    await gate.requested
    const changed = { ...f.config, scanners: [{ ...f.config.scanners[0], settings: { mode: 'changed' } }] }
    await writeGromaConfig(f.root, changed)
    gate.release()
    await updated.promise
    expect(f.scans).toEqual(['1.0.0', '1.1.0'])
    expect(await readGromaConfig(f.root)).toEqual({ ...changed, scanners: [{ ...changed.scanners[0], source: `${f.name}@1.1.0` }] })
    const reads = f.metadataReads()
    f.publishNewer()
    await writeFile(path.join(f.root, 'src/main.sample'), 'edited')
    await edited.promise
    expect(f.scans).toEqual(['1.0.0', '1.1.0', '1.1.0'])
    expect(f.metadataReads()).toBe(reads)
  } finally { gate?.release(); await session?.close(); await f.close() }
})

for (const mode of ['scan', 'watch', 'live'] as const) {
  test.concurrent(`${mode} works offline with its installed npm scanner`, async () => {
    const f = await fixture()
    let session: { close(): Promise<void> } | undefined
    try {
      await updateScanner(f.root, 'sample', `${f.name}@1.0.0`, f.options)
      const saved = await readFile(path.join(f.root, 'groma/config.json'), 'utf8')
      await f.goOffline()
      if (mode === 'scan') await scanRepository(f.root, f.options)
      else if (mode === 'live') {
        const live = await createScannerSession(f.root, f.options)
        session = live
        await live.ready
        expect(live.state.plugins.find(item => item.id === 'sample')?.status).toBe('ready')
      } else {
        const folded = Promise.withResolvers<void>()
        session = await watchScan(f.root, { ...f.options, onFold: () => { folded.resolve() } })
        await writeFile(path.join(f.root, 'src/main.sample'), 'edited')
        await folded.promise
      }
      expect(f.scans).toEqual(['1.0.0'])
      expect(await readFile(path.join(f.root, 'groma/config.json'), 'utf8')).toBe(saved)
    } finally { await session?.close(); await f.close() }
  })
}

test.concurrent('closing a live session does not wait for its held registry check', async () => {
  const f = await fixture()
  let session: Awaited<ReturnType<typeof createScannerSession>> | undefined
  let gate: ReturnType<typeof f.holdRegistry> | undefined
  try {
    await updateScanner(f.root, 'sample', `${f.name}@1.0.0`, f.options)
    gate = f.holdRegistry()
    session = await createScannerSession(f.root, f.options)
    expect(await Promise.race([session.ready.then(() => 'ready'), gate.requested.then(() => 'registry')])).toBe('ready')
    await gate.requested
    await session.close()
    expect(f.scans).toEqual(['1.0.0'])
  } finally { gate?.release(); await session?.close(); await f.close() }
})

test.concurrent('a one-shot CLI scan exits while its background registry check is held', async () => {
  const f = await fixture()
  let gate: ReturnType<typeof f.holdRegistry> | undefined
  let child: Bun.Subprocess<'ignore', 'pipe', 'pipe'> | undefined
  try {
    const home = path.join(f.root, 'home')
    await mkdir(home)
    await writeFile(path.join(home, '.npmrc'), `@example:registry=${f.options.registry}\n`)
    await updateScanner(f.root, 'sample', `${f.name}@1.0.0`, { ...f.options, cacheRoot: path.join(home, '.groma/cache/scanners') })
    gate = f.holdRegistry()
    child = Bun.spawn([process.execPath, path.resolve(import.meta.dir, '../src/cli.ts'), 'scan'], {
      cwd: f.root, env: { ...process.env, HOME: home, USERPROFILE: home, XDG_CONFIG_HOME: home }, stdin: 'ignore', stdout: 'pipe', stderr: 'pipe',
    })
    await gate.requested
    expect(await child.exited, await new Response(child.stderr).text()).toBe(0)
    expect(f.scans).toEqual(['1.0.0'])
  } finally {
    // Fail the held check so its detached worker has no download or project write left to perform.
    f.makeUnavailable(); gate?.release()
    await child?.exited
    await f.close()
  }
})

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
