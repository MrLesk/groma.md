import { expect, test } from 'bun:test'
import { createHash, X509Certificate } from 'node:crypto'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import compromised from '../test/fixtures/certificate-trust/compromised-cas.json'
import { hasDistrustedCertificateKey, trustedCertificates, withCertificateTrust } from '../src/certificate-trust.ts'
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
  expect(trustedCertificates([unsupported], 'native')).toEqual([unsupported])
  await withCertificateTrust([unsupported], async cafile => {
    expect((await readFile(cafile, 'utf8')).trim()).toBe(unsupported)
  }, 'native')
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
    const withoutGit = await run({ PATH: '' })
    expect(withoutGit.exit, withoutGit.error).toBe(0)
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
    await writeFile(cafile, [clean, await readFile(path.join(fixtures, 'native-ed448-ca.pem'), 'utf8'), ...compromised.certificates.map(certificate => certificate.pem)].join('\n'))
    // These local fixture certificates have no CRL endpoint; keep CA verification, but omit that fixture-only lookup.
    // Git applies this Schannel setting only when its backend is explicit; the fixture excludes system config.
    const gitConfig = path.join(f.home, 'git-config')
    const baseConfig = `[http]\n  schannelCheckRevoke = false\n${process.platform === 'win32' ? '  sslBackend = schannel\n' : ''}`
    // Ed448 HTTPS is proven with Linux Git/OpenSSL; other native backends may not support that algorithm.
    const certificates = ['incident-server-emudhra.pem', 'incident-server-aaa.pem', 'registry-server.pem',
      ...(process.platform === 'linux' ? ['native-ed448-server.pem'] : [])]
    for (const certificate of certificates) {
      let requests = 0
      const server = Bun.serve({ hostname: 'localhost', port: 0,
        tls: { key: Bun.file(path.join(fixtures, 'registry-server-key.pem')), cert: Bun.file(path.join(fixtures, certificate)) },
        fetch() { requests++; return new Response('No repository', { status: 404 }) },
      })
      try {
        const repository = `${server.url.href}repository`
        await writeFile(gitConfig, `${baseConfig}[http "${repository}"]\n  sslVerify = false\n  schannelUseSSLCAInfo = false\n[http "https://irrelevant.invalid/"]\n  sslCAInfo = /missing/irrelevant-ca.pem\n`)
        const child = Bun.spawn([process.execPath, '-e', source, `git+${repository}#fixture`], {
          cwd: f.project, env: { ...process.env, ...f.environment, GIT_SSL_CAINFO: process.platform === 'win32' ? undefined : cafile,
            git_ssl_cainfo: process.platform === 'win32' ? cafile : undefined, git_ssl_no_verify: process.platform === 'win32' ? '1' : undefined,
            GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: gitConfig, NO_PROXY: 'localhost,127.0.0.1', no_proxy: 'localhost,127.0.0.1' },
          stdout: 'pipe', stderr: 'pipe',
        })
        const [exit, error] = await Promise.all([child.exited, new Response(child.stderr).text()])
        expect(exit).not.toBe(0)
        if (certificate === 'registry-server.pem' || certificate === 'native-ed448-server.pem') {
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

test.concurrent('package-manager Git dependencies reject URL-scoped TLS opt-outs and preserve private CA authentication', async () => {
  const f = await directories()
  try {
    const cafile = path.join(f.home, 'git-ca.pem'), config = path.join(f.home, 'git-config')
    await writeFile(cafile, [clean, ...compromised.certificates.map(certificate => certificate.pem)].join('\n'))
    const module = pathToFileURL(path.resolve(import.meta.dir, '../src/scanner/modules/package-manager.ts')).href
    const source = `import { installDependencies } from ${JSON.stringify(module)}; await installDependencies(process.cwd(), 'Git fixture');`
    for (const certificate of ['incident-server-emudhra.pem', 'incident-server-aaa.pem', 'registry-server.pem']) {
      let requests = 0, authenticated = 0
      const server = Bun.serve({ hostname: 'localhost', port: 0,
        tls: { key: Bun.file(path.join(fixtures, 'registry-server-key.pem')), cert: Bun.file(path.join(fixtures, certificate)) },
        fetch(request) {
          requests++
          if (request.headers.get('authorization') === 'Bearer private-git-fixture') authenticated++
          return new Response('No repository', { status: 404 })
        },
      })
      try {
        const repository = new URL('repository.git', server.url)
        repository.username = 'private-fixture'
        await writeFile(path.join(f.project, 'package.json'), JSON.stringify({ dependencies: { 'git-fixture': `git+${repository.href}` } }))
        await writeFile(config, `[http]\n  sslCAInfo = ${cafile.replaceAll('\\', '/')}\n  schannelCheckRevoke = false\n${process.platform === 'win32' ? '  sslBackend = schannel\n' : ''}[http "${repository.href}"]\n  sslVerify = false\n  schannelUseSSLCAInfo = false\n`)
        const child = Bun.spawn([process.execPath, '-e', source], { cwd: f.project,
          env: { ...process.env, ...f.environment, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: config,
            GIT_SSL_CAINFO: undefined, GIT_SSL_CAPATH: undefined,
            GIT_CONFIG_COUNT: process.platform === 'win32' ? undefined : '1', git_config_count: process.platform === 'win32' ? '1' : undefined,
            ...(process.platform === 'win32' ? { git_ssl_cainfo: cafile, git_ssl_no_verify: '1' } : {}),
            GIT_CONFIG_KEY_0: 'http.extraHeader', GIT_CONFIG_VALUE_0: 'Authorization: Bearer private-git-fixture',
            BUN_INSTALL_CACHE_DIR: path.join(f.home, 'cache'), NO_PROXY: 'localhost,127.0.0.1', no_proxy: 'localhost,127.0.0.1' },
          stdout: 'pipe', stderr: 'pipe',
        })
        const [exit, error] = await Promise.all([child.exited, new Response(child.stderr).text()])
        expect(exit).not.toBe(0)
        if (certificate === 'registry-server.pem') {
          expect(requests, error).toBeGreaterThan(0)
          expect(authenticated).toBe(requests)
          expect(error).toMatch(/RepositoryNotFound|not found/)
        } else {
          expect(requests, error).toBe(0)
          expect(error).toMatch(/certificate|issuer/i)
        }
      } finally { server.stop(true) }
    }
  } finally { await f.close() }
}, 30000)

async function privateGitCase(
  f: Awaited<ReturnType<typeof directories>>, repository: string,
  { mode, install, cafile, caDirectory }: { mode: string; install: boolean; cafile: string; caDirectory: string },
) {
  const config = path.join(f.home, 'git-only-config')
  const isPath = mode.endsWith('path'), selected = isPath ? caDirectory : cafile
  const scope = mode.startsWith('url') ? ` "${repository}"` : ''
  const backend = process.platform === 'win32' ? '  sslBackend = schannel\n' : ''
  let authority = mode.startsWith('env') ? '' : `[http${scope}]\n  ${isPath ? 'sslCAPath' : 'sslCAInfo'} = ${selected.replaceAll('\\', '/')}\n`
  if (mode === 'empty-file') authority = `[http]\n  sslCAInfo =\n  sslCAPath = ${caDirectory.replaceAll('\\', '/')}\n`
  await writeFile(config, `[http]\n  schannelCheckRevoke = false\n  schannelUseSSLCAInfo = true\n${backend}${authority}`)
  const module = pathToFileURL(path.resolve(import.meta.dir, '../src/scanner/modules/package-manager.ts')).href
  const direct = pathToFileURL(path.resolve(import.meta.dir, '../src/scanner/modules/package.ts')).href
  const source = install
    ? `import { installDependencies } from ${JSON.stringify(module)}; await installDependencies(process.cwd(), 'Git fixture');`
    : `import { parseScannerSource, installScannerPackage } from ${JSON.stringify(direct)}; await installScannerPackage(parseScannerSource(process.cwd(), ${JSON.stringify(`git+${repository}#fixture`)}), process.cwd() + '/cache');`
  const child = Bun.spawn([process.execPath, '-e', source], { cwd: f.project,
    env: { ...process.env, ...f.environment, GIT_CONFIG_GLOBAL: config, GIT_CONFIG_NOSYSTEM: '1',
      GIT_SSL_CAINFO: mode === 'env-file' ? cafile : undefined, GIT_SSL_CAPATH: mode === 'env-path' ? caDirectory : undefined,
      GIT_CONFIG_PARAMETERS: undefined,
      [process.platform === 'win32' ? 'git_config_parameters' : 'GIT_CONFIG_PARAMETERS']: mode === 'parameters'
        ? `'http.extraHeader=Authorization: Bearer parameters-fixture' ${[
          [`http.${repository}.sslVerify`, 'false'], [`http.${repository}.sslCAInfo`, cafile],
        ].map(pair => pair.map(value => `'${value!.replaceAll("'", "'\\''")}'`).join('=')).join(' ')}` : undefined,
      NODE_EXTRA_CA_CERTS: '', BUN_INSTALL_CACHE_DIR: path.join(f.home, 'cache'),
      NO_PROXY: 'localhost,127.0.0.1', no_proxy: 'localhost,127.0.0.1' }, stdout: 'pipe', stderr: 'pipe',
  })
  const [exit, error] = await Promise.all([child.exited, new Response(child.stderr).text()])
  return { exit, error }
}

test.concurrent('direct and package-manager Git preserve Git-only CA file and hashed-directory selection', async () => {
  const f = await directories()
  const cafile = path.join(f.home, 'git-only.pem'), caDirectory = path.join(f.home, 'hashed')
  await mkdir(caDirectory)
  await writeFile(cafile, clean)
  // OpenSSL subject hash for the committed private registry CA; unhashed files and CRLs are not authorities.
  await writeFile(path.join(caDirectory, '81ee7702.0'), compromised.certificates[3]!.pem)
  await writeFile(path.join(caDirectory, '81ee7702.1'), clean)
  await writeFile(path.join(caDirectory, 'unrelated.txt'), 'not a certificate')
  await writeFile(path.join(caDirectory, '81ee7702.r0'), 'not a certificate')
  const server = Bun.serve({ hostname: 'localhost', port: 0,
    tls: { key: Bun.file(path.join(fixtures, 'registry-server-key.pem')), cert: Bun.file(path.join(fixtures, 'registry-server.pem')) },
    fetch() { requests++; return new Response('No repository', { status: 404 }) },
  })
  let requests = 0
  try {
    const repository = new URL('repository.git', server.url).href
    await writeFile(path.join(f.project, 'package.json'), JSON.stringify({ dependencies: { 'git-fixture': `git+${repository}` } }))
    const modes = ['global-file', 'url-file', 'env-file', ...(process.platform === 'linux' ? ['global-path', 'url-path', 'env-path'] : [])]
    for (const mode of modes) for (const install of [false, true]) {
      const before = requests
      const { exit, error } = await privateGitCase(f, repository, { mode, install, cafile, caDirectory })
      expect(exit).not.toBe(0)
      expect(requests - before, `${mode} / package-manager=${install}: ${error}`).toBeGreaterThan(0)
      expect(error).toMatch(/RepositoryNotFound|not found/)
    }
    for (const install of [false, true]) {
      const before = requests
      const { exit, error } = await privateGitCase(f, repository, { mode: 'empty-file', install, cafile, caDirectory })
      expect(exit).not.toBe(0)
      expect(requests).toBe(before)
      expect(error).toContain('configured Git CA file is empty')
    }
  } finally { server.stop(true); await f.close() }
}, 60000)

for (const mode of ['url-file', 'parameters']) for (const install of [false, true])
test.concurrent(`Git ${mode}, package-manager=${install} retains private trust without incident paths`, async () => {
  const f = await directories()
  const cafile = path.join(f.home, "scoped'private.pem")
  await writeFile(cafile, [clean, ...compromised.certificates.map(certificate => certificate.pem)].join('\n'))
  try {
    for (const certificate of ['incident-server-emudhra.pem', 'incident-server-aaa.pem', 'registry-server.pem']) {
      let requests = 0, authenticated = 0
      const server = Bun.serve({ hostname: 'localhost', port: 0,
        tls: { key: Bun.file(path.join(fixtures, 'registry-server-key.pem')), cert: Bun.file(path.join(fixtures, certificate)) },
        fetch(request) {
          requests++
          if (request.headers.get('authorization') === 'Bearer parameters-fixture') authenticated++
          return new Response('No repository', { status: 404 })
        },
      })
      try {
        // Git accepts an equals sign in a username; PARAMETERS must quote key and value independently.
        const repository = `${server.url.href.replace('://', install ? '://private=fixture@' : '://')}repository.git`
        await writeFile(path.join(f.project, 'package.json'), JSON.stringify({ dependencies: { fixture: `git+${repository}` } }))
        const before = requests, beforeAuthenticated = authenticated
        const { exit, error } = await privateGitCase(f, repository, { mode, install, cafile, caDirectory: f.home })
        expect(exit).not.toBe(0)
        if (certificate === 'registry-server.pem') {
          expect(requests - before, error).toBeGreaterThan(0)
          if (mode === 'parameters') expect(authenticated - beforeAuthenticated).toBe(requests - before)
        } else {
          expect(requests - before, error).toBe(0)
          expect(error).toMatch(/certificate|issuer/i)
        }
      } finally { server.stop(true) }
    }
  } finally { await f.close() }
}, 60000)

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
        const key=pem=>new X509Certificate(pem).publicKey.export({type:'spki',format:'der'}).toString('base64');
        process.stdout.write(JSON.stringify({keys:certificates.map(key),extra:key(readFileSync(process.argv[2],'utf8'))}));`
      const inspection = Bun.spawn(['node', '-e', inspect, settings.SSL_CERT_FILE!, path.join(fixtures, 'unsupported-key-ca.pem')], { stdout: 'pipe', stderr: 'pipe' })
      const [inspectionExit, output, inspectionError] = await Promise.all([
        inspection.exited, new Response(inspection.stdout).text(), new Response(inspection.stderr).text(),
      ])
      expect(inspectionExit, inspectionError).toBe(0)
      const { keys, extra: expectedExtra } = JSON.parse(output) as { keys: string[]; extra: string }
      expect(keys.length).toBeGreaterThan(0)
      expect(keys).toContain(expectedExtra)
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
