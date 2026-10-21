import { X509Certificate } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

export const fixtures = path.resolve(import.meta.dir, '../test/fixtures/certificate-trust')
export const clean = (await readFile(path.join(fixtures, 'registry-ca.pem'), 'utf8')).trim()

export function fixtureCertificate(certificate: string): Buffer {
  const pem = readFileSync(path.join(fixtures, certificate)), leaf = new X509Certificate(pem)
  const now = Date.now()
  if (!(Date.parse(leaf.validFrom) <= now && now < Date.parse(leaf.validTo))) throw new Error(`TLS fixture ${certificate} is not currently valid.`)
  return pem
}

export function fixtureTls(certificate: string) {
  return { key: Bun.file(path.join(fixtures, 'registry-server-key.pem')), cert: fixtureCertificate(certificate) }
}

export async function directories() {
  const root = await mkdtemp(path.join(tmpdir(), 'groma-ca-test-'))
  const home = path.join(root, 'home'), project = path.join(root, 'project'), xdg = path.join(root, 'xdg')
  await Promise.all([home, project, xdg].map(directory => mkdir(directory)))
  return { root, home, project, xdg, environment: { HOME: home, USERPROFILE: home }, close: () => rm(root, { recursive: true, force: true }) }
}
