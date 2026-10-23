import { expect, test } from 'bun:test'
import { execFile, type ExecFileException } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import http from 'node:http'
import https from 'node:https'
import net from 'node:net'
import path from 'node:path'
import tls from 'node:tls'
import { pathToFileURL } from 'node:url'
import { directories, fixtureCertificate, fixtures } from './certificate-fixtures.ts'

type Method = 'raw' | 'direct' | 'install'
type Fixture = Awaited<ReturnType<typeof directories>>
type Result = { exit: string | number | null; killed?: boolean; error: string }

function execute(command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv): Promise<Result> {
  return new Promise(resolve => execFile(command, args, { cwd, env, timeout: 10000 }, (error, _stdout, stderr) => {
    const failure = error as ExecFileException | null
    resolve({ exit: failure?.code ?? 0, killed: failure?.killed, error: stderr })
  }))
}

function environment(f: Fixture, config: string): NodeJS.ProcessEnv {
  const clean = Object.fromEntries(Object.entries(process.env).filter(([key]) =>
    !/^(?:git_config(?:_.+)?|git_ssl_(?:no_verify|cainfo|capath)|git_proxy_ssl_cainfo|https?_proxy|all_proxy|no_proxy)$/i.test(key)))
  return { ...clean, ...f.environment, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: config,
    NO_PROXY: '', no_proxy: '', GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'Never',
    GIT_SSL_CAINFO: path.join(fixtures, 'registry-ca.pem'), NODE_EXTRA_CA_CERTS: '' }
}

async function run(method: Method, f: Fixture, remote: string, env: NodeJS.ProcessEnv): Promise<Result> {
  if (method === 'raw') return execute('git', ['-c', `http.${remote}.schannelUseSSLCAInfo=true`, 'ls-remote', remote], f.project, env)
  const manager = pathToFileURL(path.resolve(import.meta.dir, '../src/scanner/modules/package-manager.ts')).href
  const scanner = pathToFileURL(path.resolve(import.meta.dir, '../src/scanner/modules/package.ts')).href
  const source = method === 'install'
    ? `import { installDependencies } from ${JSON.stringify(manager)}; await installDependencies(process.cwd(), 'proxy fixture');`
    : `import { parseScannerSource, installScannerPackage } from ${JSON.stringify(scanner)}; await installScannerPackage(parseScannerSource(process.cwd(), ${JSON.stringify(`git+${remote}#fixture`)}), process.cwd() + '/cache');`
  await writeFile(path.join(f.project, 'package.json'), JSON.stringify({ dependencies: { fixture: `git+${remote}` } }))
  return execute(process.execPath, ['-e', source], f.project, {
    ...env, BUN_INSTALL_CACHE_DIR: path.join(f.home, `cache-${method}-${crypto.randomUUID()}`),
  })
}

function platformConfig(backend = 'schannel'): string {
  // The fixture CA has no CRL endpoint. Keep strict certificate verification with the native Windows backend.
  return `[http]\n schannelCheckRevoke=false\n schannelUseSSLCAInfo=true\n${process.platform === 'win32' ? ` sslBackend=${backend}\n` : ''}`
}

function checkFailure(result: Result): void {
  expect(result.exit, result.error).not.toBe(0)
  expect(typeof result.exit, result.error).toBe('number')
  expect(result.killed, result.error).not.toBe(true)
}

async function httpsProxy(certificate: string) {
  const sockets = new Set<net.Socket>()
  let requests = 0, authorization: string | undefined
  const server = tls.createServer({ key: await readFile(path.join(fixtures, 'registry-server-key.pem')), cert: fixtureCertificate(certificate) }, socket => {
    let headers = ''
    socket.on('data', data => {
      headers += data.toString()
      if (!headers.includes('\r\n\r\n')) return
      requests++
      authorization = /proxy-authorization:\s*([^\r\n]+)/i.exec(headers)?.[1]
      socket.removeAllListeners('data')
      socket.end('HTTP/1.1 502 Fixture proxy\r\nContent-Length: 0\r\n\r\n')
    })
  })
  server.on('connection', socket => { sockets.add(socket); socket.on('close', () => sockets.delete(socket)) })
  server.on('tlsClientError', () => {})
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  return {
    url: `https://fixture-user:fixture-password@localhost:${(server.address() as net.AddressInfo).port}`,
    get requests() { return requests }, get authorization() { return authorization },
    reset() { requests = 0; authorization = undefined },
    async close() { for (const socket of sockets) socket.destroy(); await new Promise<void>(resolve => server.close(() => resolve())) },
  }
}

test.concurrent('Git scanner and embedded PM preserve a private authenticated HTTPS proxy', async () => {
  const f = await directories(), config = path.join(f.home, 'git-config')
  const proxy = await httpsProxy('registry-server.pem')
  try {
    await writeFile(config, `${platformConfig('openssl')} proxy=${proxy.url}\n proxyAuthMethod=basic\n`)
    const env = { ...environment(f, config), GIT_PROXY_SSL_CAINFO: path.join(fixtures, 'registry-ca.pem') }
    for (const method of ['raw', 'direct', 'install'] as const) {
      proxy.reset()
      const result = await run(method, f, 'https://fixture-origin.invalid/repository', env)
      checkFailure(result) // The controlled proxy returns 502 after receiving CONNECT.
      expect(proxy.requests, result.error).toBeGreaterThan(0)
      expect(proxy.authorization).toBe(`Basic ${Buffer.from('fixture-user:fixture-password').toString('base64')}`)
      expect(result.error).toContain('502')
    }
  } finally { await proxy.close(); await f.close() }
}, 30000)

async function originServer() {
  let requests = 0, authenticated = 0
  const server = https.createServer({ key: await readFile(path.join(fixtures, 'registry-server-key.pem')), cert: fixtureCertificate('registry-server.pem') },
    (request, response) => {
      requests++
      if (request.headers.authorization === 'Bearer private-origin-fixture') authenticated++
      response.writeHead(404); response.end('mock repository not found')
    })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  return { server, remote: `https://localhost:${(server.address() as net.AddressInfo).port}/repository`,
    get requests() { return requests }, get authenticated() { return authenticated },
    async close() { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())) },
  }
}

async function httpProxy(originPort: number) {
  const sockets = new Set<net.Socket>(), server = http.createServer()
  let tunnels = 0, authorization: string | undefined
  server.on('connection', socket => { sockets.add(socket); socket.on('close', () => sockets.delete(socket)) })
  server.on('connect', (request, socket, head) => {
    tunnels++; authorization = request.headers['proxy-authorization']
    const upstream = net.connect(originPort, '127.0.0.1', () => {
      socket.write('HTTP/1.1 200 Connection Established\r\n\r\n')
      if (head.length) upstream.write(head)
      upstream.pipe(socket); socket.pipe(upstream)
    })
    sockets.add(upstream); upstream.on('close', () => sockets.delete(upstream))
    upstream.on('error', () => socket.destroy()); socket.on('error', () => upstream.destroy())
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  return { url: `http://fixture-user:fixture-password@127.0.0.1:${(server.address() as net.AddressInfo).port}`,
    get tunnels() { return tunnels }, get authorization() { return authorization },
    async close() { for (const socket of sockets) socket.destroy(); await new Promise<void>(resolve => server.close(() => resolve())) },
  }
}

test.concurrent('direct HTTPS and authenticated HTTP CONNECT proxies retain private origin trust', async () => {
  const f = await directories(), config = path.join(f.home, 'git-config'), origin = await originServer()
  const proxy = await httpProxy((origin.server.address() as net.AddressInfo).port)
  try {
    const env = { ...environment(f, config), GIT_PROXY_SSL_CAINFO: path.join(f.home, 'unused-absent-proxy.pem') }
    for (const transport of ['direct', 'http-proxy']) {
      await writeFile(config, `${platformConfig()} extraHeader=Authorization: Bearer private-origin-fixture\n${transport === 'http-proxy' ? ` proxy=${proxy.url}\n proxyAuthMethod=basic\n` : ''}`)
      for (const method of ['direct', 'install'] as const) {
        const requests = origin.requests, authenticated = origin.authenticated, tunnels = proxy.tunnels
        const result = await run(method, f, origin.remote, env)
        checkFailure(result)
        expect(origin.requests, result.error).toBeGreaterThan(requests)
        expect(origin.authenticated - authenticated).toBe(origin.requests - requests)
        expect(result.error).toMatch(/not found|RepositoryNotFound/i)
        if (transport === 'http-proxy') {
          expect(proxy.tunnels).toBeGreaterThan(tunnels)
          expect(proxy.authorization).toBe(`Basic ${Buffer.from('fixture-user:fixture-password').toString('base64')}`)
        }
      }
    }
  } finally { await proxy.close(); await origin.close(); await f.close() }
}, 30000)

test.concurrent('scanner downloads preserve native Git verification settings', async () => {
  const f = await directories(), config = path.join(f.home, 'git-config'), origin = await originServer()
  const env = { ...environment(f, config), GIT_SSL_CAINFO: path.join(fixtures, 'other-registry-ca.pem') }
  try {
    for (const verify of [true, false]) {
      await writeFile(config, `${platformConfig('openssl')} sslVerify=${verify}\n`)
      for (const method of ['raw', 'direct', 'install'] as const) {
        const before = origin.requests
        const result = await run(method, f, origin.remote, env)
        checkFailure(result)
        if (verify) {
          expect(origin.requests, result.error).toBe(before)
          expect(result.error).toMatch(/certificate|SSL|issuer|trust/i)
        } else {
          expect(origin.requests, result.error).toBeGreaterThan(before)
          expect(result.error).toMatch(/not found|RepositoryNotFound/i)
        }
      }
    }
  } finally { await origin.close(); await f.close() }
}, 30000)
