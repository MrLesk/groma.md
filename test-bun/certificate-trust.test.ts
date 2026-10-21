import { expect, test } from 'bun:test'
import { createHash, X509Certificate } from 'node:crypto'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import compromised from '../test/fixtures/certificate-trust/compromised-cas.json'
import { trustedCertificates, withCertificateTrust } from '../src/certificate-trust.ts'
import { packageManagerCertificates } from '../src/scanner/modules/package-trust.ts'

const fixtures = path.resolve(import.meta.dir, '../test/fixtures/certificate-trust')
const clean = (await readFile(path.join(fixtures, 'registry-ca.pem'), 'utf8')).trim()

async function directories() {
  const root = await mkdtemp(path.join(tmpdir(), 'groma-ca-test-'))
  const home = path.join(root, 'home'), project = path.join(root, 'project'), xdg = path.join(root, 'xdg')
  await Promise.all([home, project, xdg].map(directory => mkdir(directory)))
  return { root, home, project, xdg, environment: { HOME: home, USERPROFILE: home }, close: () => rm(root, { recursive: true, force: true }) }
}

test.concurrent('compromised keys and their cross-signed copies cannot become trust anchors', () => {
  for (const certificate of compromised.certificates) {
    expect(trustedCertificates([certificate.pem]), certificate.name).toEqual([])
    expect(trustedCertificates([certificate.pem, clean, clean]), certificate.name).toEqual([clean])
  }
  expect(() => trustedCertificates(['not a certificate'])).toThrow('no PEM certificates')
})

test.concurrent('unsupported platform CA keys are omitted and an unusable store fails closed', async () => {
  const unsupported = (await readFile(path.join(fixtures, 'unsupported-key-ca.pem'), 'utf8')).trim()
  expect(() => new X509Certificate(unsupported).publicKey).toThrow('PUBLIC_KEY_DECODE_ERROR')
  expect(trustedCertificates([unsupported, clean])).toEqual([clean])
  let invoked = false
  await expect(withCertificateTrust([unsupported], async () => { invoked = true })).rejects.toThrow('No trusted certificate authorities remain')
  expect(invoked).toBe(false)
})

test.concurrent("relative cafiles use Bun's working directory with environment values and XDG fallback", async () => {
  const f = await directories()
  try {
    await writeFile(path.join(f.project, 'private.pem'), clean)
    await writeFile(path.join(f.home, '.npmrc'), `cafile=\${CA_NAME} # private registry\n`)
    const environment = { ...f.environment, XDG_CONFIG_HOME: f.xdg, CA_NAME: 'private.pem' }
    expect(await packageManagerCertificates(f.project, environment)).toEqual([clean])
        await writeFile(path.join(f.xdg, '.npmrc'), 'cafile=private.pem\n')
    expect(await packageManagerCertificates(f.project, environment)).toEqual([clean])
  } finally { await f.close() }
})

test.concurrent('userconfig and bunfig CA overrides retain replacement precedence and remove blocked private anchors', async () => {
  const f = await directories()
  try {
    await writeFile(path.join(f.project, 'private.pem'), clean)
    await writeFile(path.join(f.home, 'custom.npmrc'), 'cafile=private.pem\n')
    await writeFile(path.join(f.home, '.npmrc'), `ca=${JSON.stringify(compromised.certificates[0]!.pem)}\n`)
    const environment = { ...f.environment, NPM_CONFIG_USERCONFIG: path.relative(f.project, path.join(f.home, 'custom.npmrc')) }
    expect(await packageManagerCertificates(f.project, environment)).toEqual([clean])
    await writeFile(path.join(f.project, '.npmrc'), `ca[]=${JSON.stringify(compromised.certificates[0]!.pem)}\n`)
    expect(await packageManagerCertificates(f.project, environment)).toEqual([clean])
    await writeFile(path.join(f.project, 'blocked.pem'), compromised.certificates[0]!.pem)
    await writeFile(path.join(f.project, '.npmrc'), 'cafile=blocked.pem\n')
    await expect(packageManagerCertificates(f.project, environment)).rejects.toThrow('no trusted certificates')
    await writeFile(path.join(f.home, '.bunfig.toml'), '[install]\ncafile="private.pem"\n')
    expect(await packageManagerCertificates(f.project, environment)).toEqual([clean])
    await writeFile(path.join(f.project, 'bunfig.toml'), `[install]\nca=${JSON.stringify(compromised.certificates[0]!.pem)}\n`)
    expect(await packageManagerCertificates(f.project, environment)).toEqual([clean])
    await writeFile(path.join(f.project, 'bunfig.toml'), '[install]\ncafile="blocked.pem"\n')
    await expect(packageManagerCertificates(f.project, environment)).rejects.toThrow('no trusted certificates')
  } finally { await f.close() }
})

test.concurrent('metadata lookup and tarball installation use verified HTTPS with the configured private CA', async () => {
  const f = await directories()
  const manifest = { name: 'groma-ca-registry-fixture', version: '1.0.0' }
  const tarball = await new Bun.Archive({ 'package/package.json': JSON.stringify(manifest) }, { compress: 'gzip' }).bytes()
  const integrity = `sha512-${createHash('sha512').update(tarball).digest('base64')}`
  const requests: string[] = []
  const server = Bun.serve({ hostname: 'localhost', port: 0,
    tls: { key: Bun.file(path.join(fixtures, 'registry-server-key.pem')), cert: Bun.file(path.join(fixtures, 'registry-server.pem')) },
    fetch(request) {
      const url = new URL(request.url)
      requests.push(url.pathname)
      if (url.pathname === '/fixture.tgz') return new Response(tarball)
      return Response.json({ name: manifest.name, 'dist-tags': { latest: manifest.version }, versions: { [manifest.version]: {
        ...manifest, dist: { tarball: `${url.origin}/fixture.tgz`, integrity },
      } } })
    },
  })
  const module = pathToFileURL(path.resolve(import.meta.dir, '../src/scanner/modules/package-manager.ts')).href
  const source = `import { readPublishedRelease, installDependencies } from ${JSON.stringify(module)};
    await readPublishedRelease(${JSON.stringify(manifest.name)}, {registry: process.argv[1]});
    await installDependencies(process.cwd(), 'certificate fixture', process.argv[1]);`
  const run = async () => {
    const child = Bun.spawn([process.execPath, '-e', source, server.url.href], { cwd: f.project,
      env: { ...process.env, ...f.environment, XDG_CONFIG_HOME: f.home, NPM_CONFIG_USERCONFIG: path.join(f.home, '.npmrc'),
        NODE_EXTRA_CA_CERTS: '', NO_PROXY: 'localhost,127.0.0.1', no_proxy: 'localhost,127.0.0.1' },
      stdout: 'pipe', stderr: 'pipe' })
    const [exit, error] = await Promise.all([child.exited, new Response(child.stderr).text()])
    return { exit, error }
  }
  try {
    await writeFile(path.join(f.project, 'package.json'), JSON.stringify({ private: true, dependencies: { [manifest.name]: manifest.version } }))
    const untrusted = await run()
    expect(untrusted.exit).not.toBe(0)
    expect(untrusted.error).toMatch(/certificate|issuer|LEAF_SIGNATURE/i)
    expect(requests).toHaveLength(0)
    await writeFile(path.join(f.home, 'registry.pem'), `${clean}\n${compromised.certificates[0]!.pem}`)
    await writeFile(path.join(f.home, '.npmrc'), `cafile=${path.join(f.home, 'registry.pem').replaceAll('\\', '/')}\n`)
    const trusted = await run()
    expect(trusted.exit, trusted.error).toBe(0)
    expect(requests).toContain('/fixture.tgz')
    expect(JSON.parse(await readFile(path.join(f.project, 'node_modules', manifest.name, 'package.json'), 'utf8')).version).toBe(manifest.version)
  } finally { server.stop(true); await f.close() }
})

test.concurrent('Git scanner HTTPS rejects incident chains and retains the configured private CA', async () => {
  const f = await directories()
  const module = pathToFileURL(path.resolve(import.meta.dir, '../src/scanner/modules/package.ts')).href
  const source = `import { parseScannerSource, installScannerPackage } from ${JSON.stringify(module)};
    await installScannerPackage(parseScannerSource(process.cwd(), process.argv[1]), process.cwd() + '/cache');`
  try {
    const cafile = path.join(f.home, 'git.pem')
    await writeFile(cafile, [clean, ...compromised.certificates.map(certificate => certificate.pem)].join('\n'))
    // These local fixture certificates have no CRL endpoint; keep CA verification, but omit that fixture-only lookup.
    const gitConfig = path.join(f.home, 'git-config')
    await writeFile(gitConfig, '[http]\n  schannelCheckRevoke = false\n')
    for (const certificate of ['incident-server-emudhra.pem', 'incident-server-aaa.pem', 'registry-server.pem']) {
      let requests = 0
      const server = Bun.serve({ hostname: 'localhost', port: 0,
        tls: { key: Bun.file(path.join(fixtures, 'registry-server-key.pem')), cert: Bun.file(path.join(fixtures, certificate)) },
        fetch() { requests++; return new Response('No repository', { status: 404 }) },
      })
      try {
        const child = Bun.spawn([process.execPath, '-e', source, `git+${server.url.href}repository#fixture`], {
          cwd: f.project, env: { ...process.env, ...f.environment, GIT_SSL_CAINFO: cafile,
            GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: gitConfig, NO_PROXY: 'localhost,127.0.0.1', no_proxy: 'localhost,127.0.0.1' },
          stdout: 'pipe', stderr: 'pipe',
        })
        const [exit, error] = await Promise.all([child.exited, new Response(child.stderr).text()])
        expect(exit).not.toBe(0)
        if (certificate === 'registry-server.pem') {
          expect(requests, error).toBeGreaterThan(0)
          expect(error).toContain('not found')
        } else {
          expect(requests, error).toBe(0)
          expect(error).toMatch(/certificate|issuer/i)
        }
      } finally { server.stop(true) }
    }
  } finally { await f.close() }
})

test.concurrent('npm global installation keeps npm CA configuration instead of project Bun trust', async () => {
  const f = await directories()
  const manifest = { name: 'backlog.md', version: '1.0.0' }
  const tarball = await new Bun.Archive({ 'package/package.json': JSON.stringify(manifest) }, { compress: 'gzip' }).bytes()
  const integrity = `sha512-${createHash('sha512').update(tarball).digest('base64')}`
  const server = Bun.serve({ hostname: 'localhost', port: 0,
    tls: { key: Bun.file(path.join(fixtures, 'registry-server-key.pem')), cert: Bun.file(path.join(fixtures, 'registry-server.pem')) },
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

for (const workflow of ['ci', 'release', 'architecture']) {
  test.concurrent(`${workflow} bootstraps safe TLS for action network calls`, async () => {
    const f = await directories()
    try {
      const config = Bun.YAML.parse(await readFile(path.resolve(import.meta.dir, `../.github/workflows/${workflow}.yml`), 'utf8')) as {
        env: Record<string, string>; jobs: Record<string, { steps: { run?: string }[] }>
      }
      const step = Object.values(config.jobs)[0]!.steps[0]!
      const extra = path.join(f.root, 'compromised.pem'), environmentFile = path.join(f.root, 'github-env')
      const unsupported = await readFile(path.join(fixtures, 'unsupported-key-ca.pem'), 'utf8')
      await writeFile(extra, [...compromised.certificates.map(certificate => certificate.pem), unsupported].join('\n'))
      await writeFile(environmentFile, '')
      const child = Bun.spawn(['bash', '-c', step.run!], { env: { ...process.env, ...f.environment,
        ...config.env, RUNNER_TEMP: f.root, GITHUB_ENV: environmentFile, NODE_EXTRA_CA_CERTS: extra }, stdout: 'pipe', stderr: 'pipe' })
      const [exit, error] = await Promise.all([child.exited, new Response(child.stderr).text()])
      expect(exit, error).toBe(0)
      const settings = Object.fromEntries((await readFile(environmentFile, 'utf8')).trim().split('\n').map(line => {
        const split = line.indexOf('='); return [line.slice(0, split), line.slice(split + 1)]
      }))
      // Node understands platform CA algorithms that Bun cannot decode; inspect every key independently.
      const inspect = `const {readFileSync}=require('node:fs'); const {X509Certificate}=require('node:crypto');
        const certificates=readFileSync(process.argv[1],'utf8').match(/-----BEGIN CERTIFICATE-----[\\s\\S]*?-----END CERTIFICATE-----/g)??[];
        process.stdout.write(JSON.stringify(certificates.map(pem=>new X509Certificate(pem).publicKey.export({type:'spki',format:'der'}).toString('base64'))));`
      const inspection = Bun.spawn(['node', '-e', inspect, settings.SSL_CERT_FILE!], { stdout: 'pipe', stderr: 'pipe' })
      const [inspectionExit, output, inspectionError] = await Promise.all([
        inspection.exited, new Response(inspection.stdout).text(), new Response(inspection.stderr).text(),
      ])
      expect(inspectionExit, inspectionError).toBe(0)
      const keys = JSON.parse(output) as string[]
      expect(keys.length).toBeGreaterThan(0)
      for (const blocked of compromised.certificates) {
        const key = new X509Certificate(blocked.pem).publicKey.export({ type: 'spki', format: 'der' }).toString('base64')
        expect(keys, blocked.name).not.toContain(key)
      }
      expect(settings.NODE_EXTRA_CA_CERTS).toBe(settings.SSL_CERT_FILE)
      expect(settings.NODE_USE_SYSTEM_CA).toBe('0')
      expect(config.env.NODE_OPTIONS).toBe('--use-openssl-ca')
    } finally { await f.close() }
  })
}
