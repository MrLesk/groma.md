import { expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import compromised from '../test/fixtures/certificate-trust/compromised-cas.json'
import { clean, directories, fixtures, fixtureTls } from './certificate-fixtures.ts'

test.concurrent('npm global installation keeps npm CA configuration instead of project Bun trust', async () => {
  const f = await directories()
  const manifest = { name: 'backlog.md', version: '1.0.0' }
  const tarball = await new Bun.Archive({ 'package/package.json': JSON.stringify(manifest) }, { compress: 'gzip' }).bytes()
  const integrity = `sha512-${createHash('sha512').update(tarball).digest('base64')}`
  const server = Bun.serve({ hostname: 'localhost', port: 0,
    tls: fixtureTls('registry-server.pem'),
    fetch(request) {
      const url = new URL(request.url)
      if (url.pathname === '/fixture.tgz') return new Response(tarball)
      return Response.json({ name: manifest.name, 'dist-tags': { latest: manifest.version }, versions: { [manifest.version]: {
        ...manifest, dist: { tarball: `${url.origin}/fixture.tgz`, integrity },
      } } })
    },
  })
  try {
    const cafile = path.join(f.home, 'npm.pem'), prefix = path.join(f.home, 'prefix')
    await writeFile(cafile, [clean, ...compromised.certificates.map(certificate => certificate.pem)].join('\n'))
    await writeFile(path.join(f.project, 'blocked.pem'), compromised.certificates[0]!.pem)
    await writeFile(path.join(f.project, '.npmrc'), 'cafile=blocked.pem\n')
    await writeFile(path.join(f.project, 'bunfig.toml'), '[install]\ncafile="blocked.pem"\n')
    const launcher = path.join(f.project, 'node_modules', 'fixture', 'install.ts')
    await mkdir(path.dirname(launcher), { recursive: true })
    const module = pathToFileURL(path.resolve(import.meta.dir, '../src/work/backlog-cli.ts')).href
    await writeFile(launcher, `import { installBacklogCli } from ${JSON.stringify(module)}; await installBacklogCli(false);`)
    const child = Bun.spawn([process.execPath, launcher], { cwd: f.project,
      env: { ...process.env, ...f.environment, NPM_CONFIG_CAFILE: cafile, NPM_CONFIG_PREFIX: prefix,
        NPM_CONFIG_REGISTRY: server.url.href, NPM_CONFIG_CACHE: path.join(f.home, 'cache'), NPM_CONFIG_AUDIT: 'false',
        NPM_CONFIG_USERCONFIG: path.join(f.home, '.npmrc'), NO_PROXY: 'localhost,127.0.0.1', no_proxy: 'localhost,127.0.0.1' },
      stdout: 'pipe', stderr: 'pipe',
    })
    const [exit, error] = await Promise.all([child.exited, new Response(child.stderr).text()])
    expect(exit, error).toBe(0)
    const modules = process.platform === 'win32' ? prefix : path.join(prefix, 'lib')
    expect(JSON.parse(await readFile(path.join(modules, 'node_modules', manifest.name, 'package.json'), 'utf8')).version).toBe(manifest.version)
  } finally { server.stop(true); await f.close() }
})

async function registry(certificate: string) {
  const manifest = { name: 'backlog.md', version: '1.0.0' }
  const tarball = await new Bun.Archive({ 'package/package.json': JSON.stringify(manifest) }, { compress: 'gzip' }).bytes()
  const integrity = `sha512-${createHash('sha512').update(tarball).digest('base64')}`
  let requests = 0, authenticated = 0
  const server = Bun.serve({ hostname: 'localhost', port: 0, tls: fixtureTls(certificate),
    fetch(request) {
      requests++
      if (request.headers.get('authorization') === 'Bearer npm-trust-fixture') authenticated++
      const url = new URL(request.url)
      if (url.pathname === '/fixture.tgz') return new Response(tarball)
      return Response.json({ name: manifest.name, 'dist-tags': { latest: manifest.version }, versions: { [manifest.version]: {
        ...manifest, dist: { tarball: `${url.origin}/fixture.tgz`, integrity },
      } } })
    },
  })
  return { server, get requests() { return requests }, get authenticated() { return authenticated },
    reset() { requests = 0; authenticated = 0 } }
}

function expectRegistryOutcome(r: Awaited<ReturnType<typeof registry>>, accepted: boolean, method: string, exit: number, error: string): void {
  if (accepted) {
    expect(exit, `${method}: ${error}`).toBe(0)
    expect(r.requests).toBeGreaterThan(0)
    expect(r.authenticated).toBe(r.requests)
  } else {
    expect(exit, error).not.toBe(0)
    expect(r.requests, `${method}: ${error}`).toBe(0)
    expect(r.authenticated).toBe(0)
  }
}

for (const mode of ['user-ca', 'environment-cafile']) {
  test.concurrent(`npm global install preserves native effective private CA precedence (${mode})`, async () => {
    const f = await directories(), global = path.join(f.home, 'global.npmrc'), user = path.join(f.home, 'user.npmrc')
    const launcher = path.join(f.project, 'node_modules', 'fixture', 'install.ts')
    await mkdir(path.dirname(launcher), { recursive: true })
    const module = pathToFileURL(path.resolve(import.meta.dir, '../src/work/backlog-cli.ts')).href
    await writeFile(launcher, `import {installBacklogCli} from ${JSON.stringify(module)}; await installBacklogCli(false);`)
    const inherited = Object.fromEntries(Object.entries(process.env).filter(([key]) =>
      !/^(?:npm_config_.*|https?_proxy|all_proxy|no_proxy|node_extra_ca_certs|ssl_cert_(?:file|dir)|curl_ca_bundle)$/i.test(key)))
    try {
      for (const certificate of ['registry-server.pem', 'other-registry-server.pem']) {
        const r = await registry(certificate)
        try {
          const other = path.join(fixtures, 'other-registry-ca.pem').replaceAll('\\', '/')
          await writeFile(global, `cafile=${other}\n`)
          const selected = mode === 'user-ca' ? clean : (await Bun.file(other).text()).trim()
          await writeFile(user, `ca=${JSON.stringify(selected)}\n//${r.server.url.host}/:_authToken=npm-trust-fixture\n`)
          for (const method of ['raw', 'groma']) {
            r.reset()
            const prefix = path.join(f.home, `${certificate}-${method}`)
            const child = Bun.spawn(method === 'raw' ? ['npm', 'install', '--global', 'backlog.md@latest'] : [process.execPath, launcher], {
              cwd: f.project, env: { ...inherited, ...f.environment, NPM_CONFIG_GLOBALCONFIG: global, NPM_CONFIG_USERCONFIG: user,
                NPM_CONFIG_PREFIX: prefix, NPM_CONFIG_CACHE: path.join(prefix, 'cache'), NPM_CONFIG_REGISTRY: r.server.url.href,
                NPM_CONFIG_AUDIT: 'false', NPM_CONFIG_UPDATE_NOTIFIER: 'false', NPM_CONFIG_FETCH_RETRIES: '0', NPM_CONFIG_FETCH_TIMEOUT: '5000',
                ...(mode === 'environment-cafile' ? { NPM_CONFIG_CAFILE: path.join(fixtures, 'registry-ca.pem') } : {}),
                NO_PROXY: 'localhost,127.0.0.1', no_proxy: 'localhost,127.0.0.1' },
              stdout: 'pipe', stderr: 'pipe', signal: AbortSignal.timeout(10000),
            })
            const [exit, error] = await Promise.all([child.exited, new Response(child.stderr).text(), new Response(child.stdout).text()])
            expect(child.signalCode, error).toBeNull()
            expectRegistryOutcome(r, certificate === 'registry-server.pem', method, exit, error)
          }
        } finally { r.server.stop(true) }
      }
    } finally { await f.close() }
  }, 30000)
}
