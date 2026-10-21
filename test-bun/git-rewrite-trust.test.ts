import { expect, test } from 'bun:test'
import { execFile, type ExecFileException } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import compromised from '../test/fixtures/certificate-trust/compromised-cas.json'
import { clean, directories, fixtureTls } from './certificate-fixtures.ts'

function execute(command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv) {
  return new Promise<{ exit: string | number; killed?: boolean; error: string }>(resolve =>
    execFile(command, args, { cwd, env, timeout: 10000 }, (error, _stdout, stderr) => {
      const failure = error as ExecFileException | null
      resolve({ exit: failure?.code ?? 0, killed: failure?.killed, error: stderr })
    }))
}
test.concurrent('direct Git policy preserves an existing HTTPS to SCP-style SSH rewrite without networking', async () => {
  const f = await directories(), config = path.join(f.home, 'git-config')
  const alias = 'https://scanner-fixture.invalid/repository.git', target = 'git@fixture.invalid:repository.git'
  try {
    await writeFile(config, `[url ${JSON.stringify(target)}]\n insteadOf=${alias}\n`)
    const module = pathToFileURL(path.resolve(import.meta.dir, '../src/scanner/modules/git-trust.ts')).href
    const source = `import {withGitCertificateTrust} from ${JSON.stringify(module)};
      await withGitCertificateTrust(process.cwd(), async environment => {
        const child = Bun.spawn(['git','ls-remote','--get-url',${JSON.stringify(alias)}],{env:{...process.env,...environment},stdout:'pipe',stderr:'pipe'});
        const code=await child.exited; if(code!==0) throw new Error('Could not read the unchanged Git rewrite.');
        process.stderr.write(await new Response(child.stdout).text());
      },${JSON.stringify(alias)});`
    const result = await execute(process.execPath, ['-e', source], f.project, {
      ...process.env, ...f.environment, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: config,
    })
    expect(result.exit, result.error).toBe(0)
    expect(result.killed).not.toBe(true)
    expect(result.error.trim()).toBe(target)
  } finally { await f.close() }
})

for (const helper of ['', 'http::', 'https::', 'ftp::', 'ftps::']) {
  test.concurrent(`direct Git selects verified effective URL trust after insteadOf (${helper || 'normal HTTPS'})`, async () => {
    const f = await directories(), config = path.join(f.home, 'git-config'), cafile = path.join(f.home, "raw'ca.pem")
    const alias = 'https://scanner-fixture.invalid/repository.git'
    const module = pathToFileURL(path.resolve(import.meta.dir, '../src/scanner/modules/package.ts')).href
    const source = `import {parseScannerSource,installScannerPackage} from ${JSON.stringify(module)};
      await installScannerPackage(parseScannerSource(process.cwd(), ${JSON.stringify(`git+${alias}#fixture`)}),process.cwd()+'/cache');`
    const inherited = Object.fromEntries(Object.entries(process.env).filter(([key]) =>
      !/^(?:git_(?:config.*|ssl.*|proxy.*)|ssl_cert_file|ssl_cert_dir|curl_ca_bundle|https?_proxy|all_proxy|no_proxy|node_extra_ca_certs)$/i.test(key)))
    const env = { ...inherited, ...f.environment, GIT_CONFIG_GLOBAL: config, GIT_CONFIG_NOSYSTEM: '1',
      NODE_EXTRA_CA_CERTS: '', NO_PROXY: 'localhost,127.0.0.1', no_proxy: 'localhost,127.0.0.1' }
    await writeFile(cafile, [clean, ...compromised.certificates.map(certificate => certificate.pem)].join('\n'))
    try {
      for (const certificate of ['registry-server.pem', 'incident-server-emudhra.pem', 'incident-server-aaa.pem']) {
        let requests = 0, authenticated = 0
        const server = Bun.serve({ hostname: 'localhost', port: 0, tls: fixtureTls(certificate),
          fetch(request) {
            requests++
            if (request.headers.get('authorization') === 'Bearer rewrite-fixture') authenticated++
            return new Response('No repository', { status: 404 })
          },
        })
        try {
          // Rewrites can introduce credentials. Preserve Git's raw '=' username while omitting the password from policy queries.
          const selected = `${server.url.href.replace('://', '://private=fixture@')}repository.git`
          const target = selected.replace('private=fixture@', 'private=fixture:fixture-password@')
          const backend = process.platform === 'win32' ? ' sslBackend=openssl\n' : ''
          await writeFile(config, `[url ${JSON.stringify(helper + target)}]\n insteadOf=${alias}\n[http]\n sslVerify=true\n schannelUseSSLCAInfo=true\n${backend}[http ${JSON.stringify(selected)}]\n sslCAInfo=${JSON.stringify(cafile.replaceAll('\\', '/'))}\n extraHeader=Authorization: Bearer rewrite-fixture\n`)
          const raw = await execute('git', ['ls-remote', alias], f.project, env)
          expect(typeof raw.exit, raw.error).toBe('number')
          expect(raw.killed, raw.error).not.toBe(true)
          expect(requests, raw.error).toBeGreaterThan(0)
          expect(authenticated).toBe(requests)
          requests = 0; authenticated = 0
          const guarded = await execute(process.execPath, ['-e', source], f.project, env)
          expect(typeof guarded.exit, guarded.error).toBe('number')
          expect(guarded.killed, guarded.error).not.toBe(true)
          expect(guarded.exit).not.toBe(0)
          if (certificate === 'registry-server.pem') {
            expect(requests, guarded.error).toBeGreaterThan(0)
            expect(authenticated).toBe(requests)
            expect(guarded.error).toMatch(/not found/i)
          } else {
            expect(requests, guarded.error).toBe(0)
            expect(authenticated).toBe(0)
            expect(guarded.error).toMatch(/certificate|issuer|trust|SSL/i)
          }
        } finally { server.stop(true) }
      }
    } finally { await f.close() }
  }, 60000)
}
