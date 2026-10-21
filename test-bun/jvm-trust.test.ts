import { test, expect } from 'bun:test'
import { execFile } from 'node:child_process'
import { X509Certificate } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { rootCertificates } from 'node:tls'
import { promisify } from 'node:util'
import { jdkTool, prepareJavaTrustStore, secureJavaTrustStore } from '../plugins/scanners/jvm-package.ts'

const execute = promisify(execFile)
const compromisedRoot = "-----BEGIN CERTIFICATE-----\nMIICTjCCAdOgAwIBAgIKPPYHqWhwDtqLhDAKBggqhkjOPQQDAzBrMQswCQYDVQQG\nEwJJTjETMBEGA1UECxMKZW1TaWduIFBLSTElMCMGA1UEChMcZU11ZGhyYSBUZWNo\nbm9sb2dpZXMgTGltaXRlZDEgMB4GA1UEAxMXZW1TaWduIEVDQyBSb290IENBIC0g\nRzMwHhcNMTgwMjE4MTgzMDAwWhcNNDMwMjE4MTgzMDAwWjBrMQswCQYDVQQGEwJJ\nTjETMBEGA1UECxMKZW1TaWduIFBLSTElMCMGA1UEChMcZU11ZGhyYSBUZWNobm9s\nb2dpZXMgTGltaXRlZDEgMB4GA1UEAxMXZW1TaWduIEVDQyBSb290IENBIC0gRzMw\ndjAQBgcqhkjOPQIBBgUrgQQAIgNiAAQjpQy4LRL1KPOxst3iAhKAnjlfSU2fySU0\nWXTsuwYc58Byr+iuL+FBVIcUqEqy6HyC5ltqtdyzdc6LBtCGI79G1Y4PPwT01xyS\nfvalY8L1X44uT6EYGQIrMgqCZH0Wk9GjQjBAMB0GA1UdDgQWBBR8XQKEE9TMipuB\nzhccLikenEhjQjAOBgNVHQ8BAf8EBAMCAQYwDwYDVR0TAQH/BAUwAwEB/zAKBggq\nhkjOPQQDAwNpADBmAjEAvvNhzwIQHWSVB7gYboiFBS+DCBeQyh+KTOgNG3qxrdWB\nCUfvO6wIBHxcmbHtRwfSAjEAnbpV/KlK6O3t5nYBQnvI+GDZjVGLVTv7jHvrZQnD\n+JbNR6iC8hZVdyR+EhCVBCyj\n-----END CERTIFICATE-----"

test.concurrent('packaged JVM trust removes compromised authorities and preserves custom trusted certificates', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'groma-java-trust-'))
  try {
    const store = await prepareJavaTrustStore(path.join(temporary, 'cacerts'))
    const blocked = path.join(temporary, 'blocked.pem')
    const custom = path.join(temporary, 'custom.pem')
    const allowed = rootCertificates.find(pem => new X509Certificate(pem).subject.includes('CN=ISRG Root X1'))!
    await writeFile(blocked, compromisedRoot)
    await writeFile(custom, allowed)
    const options = ['-keystore', store, '-storepass', 'changeit']
    for (const [alias, file] of [['blocked-test', blocked], ['custom-test', custom]]) {
      await execute(jdkTool('keytool'), ['-importcert', '-noprompt', '-alias', alias!, '-file', file!, ...options])
    }
    await secureJavaTrustStore(store)
    await expect(execute(jdkTool('keytool'), ['-exportcert', '-rfc', '-alias', 'blocked-test', ...options])).rejects.toThrow()
    const { stdout } = await execute(jdkTool('keytool'), ['-exportcert', '-rfc', '-alias', 'custom-test', ...options])
    expect(new X509Certificate(stdout).fingerprint256).toBe(new X509Certificate(allowed).fingerprint256)
  } finally { await rm(temporary, { recursive: true, force: true }) }
}, 30000)

test.concurrent('Scala build rejects a modified launcher before executing it', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'groma-sbt-checksum-'))
  try {
    const destination = path.join(temporary, 'worker.jar')
    const script = `globalThis.fetch = async () => new Response('modified launcher');
      const { buildWorker } = await import(${JSON.stringify(path.resolve(import.meta.dir, '../plugins/scanners/scala/build.ts'))});
      await buildWorker(${JSON.stringify(destination)});`
    const child = Bun.spawn([process.execPath, '--eval', script], { stdout: 'pipe', stderr: 'pipe' })
    const [exitCode, stderr] = await Promise.all([child.exited, new Response(child.stderr).text()])
    expect(exitCode).not.toBe(0)
    expect(stderr).toContain('Unexpected sbt launcher checksum')
    await expect(readFile(destination)).rejects.toThrow()
  } finally { await rm(temporary, { recursive: true, force: true }) }
}, 10000)
