import { expect, test } from 'bun:test'
import { X509Certificate } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import compromised from '../test/fixtures/certificate-trust/compromised-cas.json'
import { directories, fixtures } from './certificate-fixtures.ts'

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
      const repository = 'https://github.com/MrLesk/groma.md'
      const inherited = Object.fromEntries(Object.entries(process.env).filter(([key]) =>
        !/^git_(?:config_(?:count|parameters|key_\d+|value_\d+)|ssl_no_verify)$/i.test(key)))
      const environment = { ...inherited, ...f.environment, ...config.env,
        RUNNER_TEMP: f.root, GITHUB_ENV: environmentFile, NODE_EXTRA_CA_CERTS: extra,
        GITHUB_SERVER_URL: 'https://github.com', GITHUB_REPOSITORY: 'MrLesk/groma.md',
        GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'http.extraHeader', GIT_CONFIG_VALUE_0: 'X-Indexed: preserved',
        GIT_CONFIG_PARAMETERS: `'http.extraHeader'='X-Parameters: preserved' 'http.${repository}.sslVerify'='false' 'http.${repository}.git.schannelUseSSLCAInfo'='false'`,
        GIT_CONFIG_GLOBAL: path.join(f.home, 'git-config'), GIT_CONFIG_NOSYSTEM: '1',
        GIT_PROXY_SSL_CAINFO: extra, git_proxy_ssl_cainfo: extra,
      }
      await writeFile(environment.GIT_CONFIG_GLOBAL, '')
      const child = Bun.spawn(['bash', '-c', step.run!], { env: environment, stdout: 'pipe', stderr: 'pipe' })
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
      expect((await readFile(path.dirname(settings.GIT_PROXY_SSL_CAINFO!))).length).toBe(0)
      await expect(readFile(settings.GIT_PROXY_SSL_CAINFO!)).rejects.toThrow()
      expect(settings.git_proxy_ssl_cainfo).toBe(settings.GIT_PROXY_SSL_CAINFO)
      expect(settings.NODE_EXTRA_CA_CERTS).toBe(settings.SSL_CERT_FILE)
      expect(settings.NODE_USE_SYSTEM_CA).toBe('0')
      expect(config.env.NODE_OPTIONS).toBe('--use-openssl-ca')
      for (const url of [repository, `${repository}.git`]) for (const key of ['http.sslVerify', 'http.schannelUseSSLCAInfo']) {
        const query = Bun.spawn(['git', 'config', '--get-urlmatch', key, url], {
          cwd: f.project, env: { ...environment, ...settings }, stdout: 'pipe', stderr: 'pipe',
        })
        const [code, output, error] = await Promise.all([query.exited, new Response(query.stdout).text(), new Response(query.stderr).text()])
        expect(code, error).toBe(0)
        expect(output.trim()).toBe('true')
      }
      expect(settings.GIT_CONFIG_PARAMETERS!.startsWith(`${environment.GIT_CONFIG_PARAMETERS} `)).toBe(true)
      const authentication = Bun.spawn(['git', 'config', '--get-all', 'http.extraHeader'], {
        cwd: f.project, env: { ...environment, ...settings }, stdout: 'pipe', stderr: 'pipe',
      })
      const [authCode, headers, authError] = await Promise.all([
        authentication.exited, new Response(authentication.stdout).text(), new Response(authentication.stderr).text(),
      ])
      expect(authCode, authError).toBe(0)
      expect(headers.trim().split('\n')).toEqual(['X-Indexed: preserved', 'X-Parameters: preserved'])
      for (const [key, value] of [['GIT_SSL_NO_VERIFY', 'false'], ['GIT_SSL_NO_VERIFY', ''], ['gIt_SsL_nO_vErIfY', 'true']]) {
        await writeFile(environmentFile, '')
        const rejected = Bun.spawn(['bash', '-c', step.run!], {
          env: { ...environment, [key!]: value! }, stdout: 'pipe', stderr: 'pipe',
        })
        const [code, error] = await Promise.all([rejected.exited, new Response(rejected.stderr).text(), new Response(rejected.stdout).text()])
        expect(code).not.toBe(0)
        expect(error).toContain('Remove GIT_SSL_NO_VERIFY')
        expect(await readFile(environmentFile, 'utf8')).toBe('')
      }
    } finally { await f.close() }
  })
}
