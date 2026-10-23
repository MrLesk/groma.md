import { expect, test } from 'bun:test'
import { createHash, X509Certificate } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import compromised from '../test/fixtures/certificate-trust/compromised-cas.json'
import { hasDistrustedCertificateKey, trustedCertificates, withCertificateTrust } from '../src/certificate-trust.ts'
import { packageManagerCertificates } from '../src/scanner/modules/package-trust.ts'

import { clean, directories, fixtures, fixtureTls } from './certificate-fixtures.ts'

test.concurrent('compromised keys and their cross-signed copies cannot become trust anchors', () => {
  for (const certificate of compromised.certificates) {
    expect(hasDistrustedCertificateKey(certificate.pem), certificate.name).toBe(true)
    expect(trustedCertificates([certificate.pem]), certificate.name).toEqual([])
    expect(trustedCertificates([certificate.pem, clean, clean]), certificate.name).toEqual([clean])
  }
  expect(hasDistrustedCertificateKey(clean)).toBe(false)
  expect(() => hasDistrustedCertificateKey('not a certificate')).toThrow()
  expect(() => hasDistrustedCertificateKey(clean.slice(0, -30))).toThrow()
  expect(() => trustedCertificates(['not a certificate'])).toThrow('no PEM certificates')
})

test.concurrent('unsupported platform CA keys are omitted and an unusable store fails closed', async () => {
  const unsupported = (await readFile(path.join(fixtures, 'unsupported-key-ca.pem'), 'utf8')).trim()
  expect(() => new X509Certificate(unsupported).publicKey).toThrow('PUBLIC_KEY_DECODE_ERROR')
  expect(hasDistrustedCertificateKey(unsupported)).toBe(false)
  const malformed = Buffer.from(new X509Certificate(unsupported).raw)
  const marker = Buffer.from('3043300506032b6571033a00', 'hex') // Ed448 SubjectPublicKeyInfo / zero unused bits.
  const key = malformed.indexOf(marker)
  expect(key).toBeGreaterThan(0)
  malformed[key + marker.length - 1] = 1
  const malformedPem = `-----BEGIN CERTIFICATE-----\n${malformed.toString('base64')}\n-----END CERTIFICATE-----`
  expect(() => hasDistrustedCertificateKey(malformedPem)).toThrow()
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
    tls: fixtureTls('registry-server.pem'),
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
  const run = async (environment: NodeJS.ProcessEnv = {}) => {
    const child = Bun.spawn([process.execPath, '-e', source, server.url.href], { cwd: f.project,
      env: { ...process.env, ...f.environment, ...environment, XDG_CONFIG_HOME: f.home, NPM_CONFIG_USERCONFIG: path.join(f.home, '.npmrc'),
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
    const gitConfig = path.join(f.home, 'unrelated-git-config')
    for (const kind of ['sslCAInfo', 'sslCAPath']) for (const ca of ['/missing/unrelated-ca.pem', '~groma-missing-user-625/ca.pem']) {
      await writeFile(gitConfig, `[http "https://unrelated.invalid/repository"]\n ${kind}=${ca}\n`)
      await rm(path.join(f.project, 'node_modules'), { recursive: true, force: true })
      const before = requests.filter(request => request === '/fixture.tgz').length
      const unrelated = await run({ GIT_CONFIG_GLOBAL: gitConfig, GIT_CONFIG_NOSYSTEM: '1', BUN_INSTALL_CACHE_DIR: path.join(f.home, `cache-${requests.length}`) })
      expect(unrelated.exit, unrelated.error).toBe(0)
      expect(requests.filter(request => request === '/fixture.tgz').length).toBeGreaterThan(before)
    }
    const withoutGit = await run({ PATH: '' })
    expect(withoutGit.exit, withoutGit.error).toBe(0)
    expect(requests).toContain('/fixture.tgz')
    expect(JSON.parse(await readFile(path.join(f.project, 'node_modules', manifest.name, 'package.json'), 'utf8')).version).toBe(manifest.version)
  } finally { server.stop(true); await f.close() }
})
