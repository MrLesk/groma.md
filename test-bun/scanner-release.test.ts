import { expect, test } from 'bun:test'
import { cp, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { stageWorkSourcePackages, waitForPublishedScanner } from '../scripts/scanner-release.ts'

test.concurrent('release metadata waits for the exact uploaded scanner version', async () => {
  const staged = { name: '@example/scanner', version: '1.2.3' }
  const published = { ...staged, groma: { scanner: { discovery: { compatibility: { groma: '>=0.6.0' } } } } }
  let requests = 0
  const server = Bun.serve({ port: 0, fetch() {
    requests++
    const versions = requests === 1
      ? { '1.2.2': { ...staged, version: '1.2.2' }, '2.0.0': { ...staged, version: '2.0.0' } }
      : { '1.2.3': published }
    return Response.json({ versions })
  } })
  try {
    const actual = await waitForPublishedScanner(staged, Date.now() + 1000, server.url.href)
    expect(actual.version).toBe(staged.version)
    expect(actual.groma?.scanner?.discovery?.compatibility?.groma).toBe('>=0.6.0')
    expect(requests).toBeGreaterThan(1)
  } finally { server.stop(true) }
}, 5000)

test.concurrent('release metadata stops waiting at its deadline when the version remains missing', async () => {
  const staged = { name: '@example/missing-scanner', version: '1.2.3' }
  const server = Bun.serve({ port: 0, fetch() { return Response.json({ versions: {} }) } })
  const deadline = Date.now() + 200
  try {
    await expect(waitForPublishedScanner(staged, deadline, server.url.href)).rejects.toThrow(`${staged.name}@${staged.version}`)
    expect(Date.now()).toBeGreaterThanOrEqual(deadline)
  } finally { server.stop(true) }
}, 5000)

async function stageHost(input: string, host: string, workers: Record<string, string>) {
  for (const [id, name] of Object.entries(workers)) {
    const directory = path.join(input, host, id)
    const worker = path.join(directory, id === 'rust' ? 'dist/bin' : 'dist', host,
      name + (host.startsWith('win32-') ? '.exe' : ''))
    await mkdir(path.dirname(worker), { recursive: true })
    await writeFile(worker, host, { mode: 0o600 })
    await writeFile(path.join(directory, 'package.json'), JSON.stringify({ name: `@groma/scanner-${id}`,
      os: [host.split('-')[0]], cpu: [host.split('-')[1]] }))
  }
  const name = `@groma/scanner-csharp-${host}`
  const runtime = path.join(input, host, 'csharp/node_modules', name)
  const [system, arch] = host.split('-')
  await mkdir(path.join(runtime, 'worker'), { recursive: true })
  await writeFile(path.join(runtime, 'package.json'), JSON.stringify({ name, version: '0.1.3', os: [system], cpu: [arch] }))
  await writeFile(path.join(runtime, 'worker', `Groma.CSharpScanner${system === 'win32' ? '.exe' : ''}`), host)
  await writeFile(path.join(input, host, 'csharp/package.json'), JSON.stringify({
    name: '@groma/scanner-csharp', version: '0.1.3', optionalDependencies: { [name]: '0.1.3' },
  }))
  for (const id of ['swift', 'cobol', 'scala', 'kotlin']) await writeFile(path.join(input, host, id, 'dist', host, 'runtime-library'), `runtime for ${host}`)
}

async function verifyHostRuntimes(output: string, id: string, hosts: string[]) {
  const manifest = JSON.parse(await readFile(path.join(output, id, 'package.json'), 'utf8'))
  expect(manifest.os.sort()).toEqual(['darwin', 'linux', 'win32'])
  expect(manifest.cpu.sort()).toEqual(['arm64', 'x64'])
  for (const host of hosts) {
    const directory = path.join(output, id, 'dist', host)
    const name = { scala: 'runtime/bin/java', kotlin: 'runtime/bin/java', cobol: 'runtime/bin/java', swift: 'worker', nasm: 'nasm' }[id]!
    const worker = path.join(directory, name + (host.startsWith('win32-') ? '.exe' : ''))
    expect(await readFile(worker, 'utf8')).toBe(host)
    if (id !== 'nasm') expect(await readFile(path.join(directory, 'runtime-library'), 'utf8')).toBe(`runtime for ${host}`)
    if (process.platform !== 'win32') expect((await stat(worker)).mode & 0o111).toBe(0o111)
  }
}

test.concurrent('scanner assembly keeps native workers and runtime libraries from every release host', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'groma-scanner-release-'))
  const input = path.join(temporary, 'hosts'), output = path.join(temporary, 'packages')
  const hosts = ['darwin-arm64', 'linux-arm64', 'linux-x64', 'win32-arm64', 'win32-x64']
  const workers = { go: 'worker', rust: 'groma-rust-scanner', typescript: 'tsc',
    java: 'runtime/bin/java', scala: 'runtime/bin/java', kotlin: 'runtime/bin/java', cobol: 'runtime/bin/java', nasm: 'nasm', swift: 'worker' }
  try {
    for (const host of hosts) await stageHost(input, host, workers)
    const child = Bun.spawn([process.execPath, path.resolve(import.meta.dir, '../scripts/scanner-release.ts'),
      'assemble', input, output], { stdout: 'pipe', stderr: 'pipe' })
    const error = await new Response(child.stderr).text()
    expect(await child.exited, error).toBe(0)
    for (const id of ['swift', 'cobol', 'nasm', 'scala', 'kotlin']) await verifyHostRuntimes(output, id, hosts)
  } finally { await rm(temporary, { recursive: true, force: true }) }
})

async function packPackage(directory: string, output: string) {
  const child = Bun.spawn(['npm', 'pack', directory, '--json', '--ignore-scripts', '--pack-destination', output], {
    stdout: 'pipe', stderr: 'pipe', env: { ...process.env, npm_config_cache: path.join(output, 'npm-cache') },
  })
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited,
  ])
  expect(code, stderr).toBe(0)
  return JSON.parse(stdout)[0] as { filename: string; files: { path: string }[] }
}

test.concurrent('staged Backlog release installs its contract and supports npm selection and restore', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'groma-work-release-'))
  const staged = path.join(root, 'packages')
  const releases = new Map<string, Record<string, unknown>>()
  const server = Bun.serve({ port: 0, fetch(request) {
    const pathname = decodeURIComponent(new URL(request.url).pathname).slice(1)
    if (pathname.endsWith('.tgz')) return new Response(Bun.file(path.join(root, pathname)))
    const release = releases.get(pathname)
    if (!release) return new Response('Missing package', { status: 404 })
    return Response.json({ name: release.name, versions: { [release.version as string]: release } })
  } })
  try {
    await cp(path.resolve(import.meta.dir, '../test/fixtures/flows'), root, { recursive: true })
    await stageWorkSourcePackages(staged)
    for (const id of ['work-source-contract', 'work-source-backlog']) {
      const directory = path.join(staged, id)
      const manifest = JSON.parse(await readFile(path.join(directory, 'package.json'), 'utf8'))
      const packed = await packPackage(directory, root)
      expect(packed.files.map(file => file.path)).toContain('src/index.ts')
      expect(packed.files.map(file => file.path)).toContain('LICENSE')
      releases.set(manifest.name, { ...manifest, dist: { tarball: `${server.url.origin}/${packed.filename}` } })
    }
    const contract = releases.get('@groma/work-source')!
    const adapter = releases.get('@groma/work-source-backlog')!
    expect(adapter.dependencies).toEqual({ '@groma/work-source': contract.version })
    const moduleRoot = path.resolve(import.meta.dir, '../src')
    const script = `
      import { addPlugin } from ${JSON.stringify(path.join(moduleRoot, 'plugin-management.ts'))}
      import { changePluginSettings } from ${JSON.stringify(path.join(moduleRoot, 'scanner/modules/settings.ts'))}
      import { readPluginConfig } from ${JSON.stringify(path.join(moduleRoot, 'scanner/modules/config.ts'))}
      import { configuredWorkSource } from ${JSON.stringify(path.join(moduleRoot, 'work-sources.ts'))}
      import { rm } from 'node:fs/promises'
      const root = ${JSON.stringify(root)}
      const options = { registry: ${JSON.stringify(server.url.href)}, cacheRoot: root + '/cache' }
      const installed = await addPlugin(root, '@groma/work-source-backlog', options)
      await rm(options.cacheRoot, { recursive: true, force: true })
      await changePluginSettings(root, { action: 'restore', id: 'backlog' }, options)
      const restored = await configuredWorkSource(root, options)
      console.log(JSON.stringify({ installed, config: await readPluginConfig(root), id: restored?.plugin?.id }))
    `
    const child = Bun.spawn([process.execPath, '--eval', script], { stdout: 'pipe', stderr: 'pipe',
      env: { ...process.env, BUN_INSTALL_CACHE_DIR: path.join(root, 'bun-cache') } })
    const [stdout, stderr, code] = await Promise.all([
      new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited,
    ])
    expect(code, stderr).toBe(0)
    const source = `@groma/work-source-backlog@${adapter.version}`
    expect(JSON.parse(stdout)).toEqual({
      installed: { id: 'backlog', source, status: 'found' },
      config: { scanners: [], workSources: [{ id: 'backlog', source }] }, id: 'backlog',
    })
  } finally { server.stop(true); await rm(root, { recursive: true, force: true }) }
})
