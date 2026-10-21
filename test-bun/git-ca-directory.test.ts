import { expect, test } from 'bun:test'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { clean, directories, fixtures, fixtureTls } from './certificate-fixtures.ts'
import compromised from '../test/fixtures/certificate-trust/compromised-cas.json'

type DirectoryFixture = Awaited<ReturnType<typeof directories>>

async function nativeRequest(f: DirectoryFixture, url: string, guarded: boolean, install: boolean) {
  const environment = Object.fromEntries(Object.entries(process.env).filter(([key]) =>
    !/^(?:git_|https?_proxy|all_proxy|no_proxy|node_extra_ca_certs)/i.test(key)))
  Object.assign(environment, { ...f.environment, GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_GLOBAL: path.join(f.home, 'gitconfig'), NO_PROXY: 'localhost,127.0.0.1' })
  const command = ['git', 'ls-remote', url]
  const module = pathToFileURL(path.resolve(import.meta.dir, '../src/scanner/modules/git-trust.ts')).href
  const source = `import {withGitCertificateTrust} from ${JSON.stringify(module)};
    await withGitCertificateTrust(process.cwd(), async environment => {
      const child = Bun.spawn(${JSON.stringify(command)}, {env:{...process.env,...environment},stdout:'inherit',stderr:'inherit'});
      process.exitCode = await child.exited;
    }, ${install ? 'undefined' : JSON.stringify(url)});`
  const child = Bun.spawn(guarded ? [process.execPath, '-e', source] : command, { cwd: f.project,
    env: environment, stdout: 'pipe', stderr: 'pipe', signal: AbortSignal.timeout(10000) })
  const [exit, error] = await Promise.all([child.exited, new Response(child.stderr).text(), new Response(child.stdout).text()])
  expect(child.signalCode, error).toBeNull()
  expect(exit, error).not.toBe(0) // The peer serves a controlled 404 after successful TLS.
  return error
}

async function directoryConfiguration(f: DirectoryFixture, source: string) {
  const otherCa = path.join(fixtures, 'other-registry-ca.pem').replaceAll('\\', '/')
  await writeFile(path.join(f.home, 'gitconfig'), `[http]\n sslCAInfo = ${otherCa}\n sslCAPath = ${source.replaceAll('\\', '/')}\n extraHeader = Authorization: Bearer directory-fixture\n schannelUseSSLCAInfo = true\n${process.platform === 'win32' ? ' sslBackend = openssl\n' : ''}`)
}

test.concurrent('Git preserves native ordinary PEM directory selection without retaining incident authorities', async () => {
  const f = await directories(), source = path.join(f.home, 'authorities')
  await mkdir(source)
  await directoryConfiguration(f, source)
  const corpus = [clean, ...compromised.certificates.map(certificate => certificate.pem)].join('\n')
  try {
    for (const name of ['ordinary.pem', 'ordinary.crt', 'ordinary']) {
      await writeFile(path.join(source, name), corpus)
      for (const certificate of ['registry-server.pem', 'incident-server-emudhra.pem', 'incident-server-aaa.pem']) {
        let requests = 0, authenticated = 0
        const server = Bun.serve({ hostname: 'localhost', port: 0, tls: fixtureTls(certificate), fetch(request) {
          requests++
          if (request.headers.get('authorization') === 'Bearer directory-fixture') authenticated++
          return new Response('No repository', { status: 404 })
        } })
        try {
          const url = new URL('repository.git', server.url).href
          await nativeRequest(f, url, false, false)
          const nativeRequests = requests
          expect(authenticated).toBe(nativeRequests)
          for (const install of [false, true]) {
            const before = requests, beforeAuthenticated = authenticated
            const error = await nativeRequest(f, url, true, install)
            const expected = certificate === 'registry-server.pem' ? nativeRequests : 0
            expect(requests - before, `${name}: ${error}`).toBe(expected)
            expect(authenticated - beforeAuthenticated).toBe(expected)
          }
        } finally { server.stop(true) }
      }
      await rm(path.join(source, name))
    }
  } finally { await f.close() }
}, 60000)

test.concurrent('Git preserves native hash gaps and unrecognized regular prefixes', async () => {
  const f = await directories(), source = path.join(f.home, 'authorities')
  await mkdir(source)
  // This subject hash belongs to the other private authority, which appears only after the original gap.
  const hash = '74640382', prefix = path.join(source, `${hash}.0`)
  const ordinary = await readFile(path.join(fixtures, 'unsupported-key-ca.pem'), 'utf8')
  const authority = await readFile(path.join(fixtures, 'other-registry-ca.pem'))
  // An explicit CAfile excluding the peer keeps this an independent directory-policy check.
  await writeFile(path.join(f.home, 'gitconfig'), `[http]\n sslCAInfo = ${path.join(fixtures, 'registry-ca.pem').replaceAll('\\', '/')}\n sslCAPath = ${source.replaceAll('\\', '/')}\n extraHeader = Authorization: Bearer directory-fixture\n${process.platform === 'win32' ? ' sslBackend = openssl\n' : ''}`)
  let requests = 0, authenticated = 0
  const server = Bun.serve({ hostname: 'localhost', port: 0, tls: fixtureTls('other-registry-server.pem'), fetch(request) {
    requests++
    if (request.headers.get('authorization') === 'Bearer directory-fixture') authenticated++
    return new Response('No repository', { status: 404 })
  } })
  try {
    const url = new URL('repository.git', server.url).href
    for (const [index, content, blocked] of [[2, `${clean}\n${ordinary}`, false], [2, 'not PEM', false],
      [1, 'not PEM', false], [1, '', false], [2, 'not PEM', true]] as const) {
      await writeFile(path.join(source, `${hash}.${index}`), authority)
      await writeFile(prefix, blocked ? compromised.certificates[0]!.pem : content)
      if (blocked) await writeFile(path.join(source, `${hash}.1`), content)
      const before = requests
      await nativeRequest(f, url, false, false)
      const nativeRequests = requests - before
      for (const install of [false, true]) {
        const current = requests
        const error = await nativeRequest(f, url, true, install)
        expect(requests - current, error).toBe(nativeRequests)
      }
      expect(authenticated).toBe(requests)
      await rm(path.join(source, `${hash}.${index}`))
      if (blocked) await rm(path.join(source, `${hash}.1`))
    }
  } finally { server.stop(true); await f.close() }
}, 30000)
