import { createHash, X509Certificate } from 'node:crypto'
import { getCACertificates, rootCertificates } from 'node:tls'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

// CVE-2026-111943: remove compromised intermediate keys and every ancestor that
// can authenticate them, including Sectigo's cross-sign. Match keys, not names or
// certificate fingerprints, so another certificate for the same key stays blocked.
// Source: https://emudhra.we-have-a-problem.com/{roots,impacted-intermediates}.json
const distrustedKeys = new Set([
  'c619e4780ed8e0abeda24ad732567de4383a7ea941338f6d1a7d1b49ac792fe9', // emSign Root TLS CA - G3
  '0a6c2b2ca5b364207954171987ac9d2178561569d8205457e77ca90c32ede282', // emSign Root CS CA - G3
  'bd153ed7b0434f6886b17bce8bbe84ed340c7132d702a8f4fa318f756ecbd6f3', // AAA Certificate Services
  '8d417db2dd8bf5e3084d1e3f196d583849d81bdd4c00c70b9d39369e96b8c782', // emSign ECC Root CA - G3
  'ebed6475c2c2d80fcb199f3fe8dd6e6b3ce60b77eb15d4e42c3dec0c6f5b5105', // EM DV TLS CA - G3B
  '43bffa19d6ef651451f6841e019931e96f6f2eaeff28ab4b6f1ce4576de2717b', // EM OV TLS CA - G3B
  'e0254c7fcdc265e2f0f8a428dabb75ab4ae039b4872d62f5ee57f0877d5a8a41', // EM EV TLS CA - G3B
  '49dd353dc2b919a3770645117d0e60c16115e7d1bc259eefe734b00ea434fe5f', // EM DV TLS CA - G3C
  '63ecefee431d49523bc1136c4e72d0206a477086caf606cd5cf025686c109cf8', // EM OV TLS CA - G3C
  '5c0660a2b164910d8ff589c18e14552e9e0ec237dcefe2cb736d41a4811f81a0', // EM EV TLS CA - G3C
  'ec4ffa1ad0ac88081314b7aaffef6a91f97cd57291bb5ba686c5415f5eb4f6b6', // EM OV CS CA - G3B
  '92c063d67e8f14db71d288e11266ffdaf69cbf115f7bab14f3bc2f68d25e0e30', // EM OV CS CA - G3C
])

// Read SubjectPublicKeyInfo only when Bun cannot instantiate a native-supported key.
function nativeSubjectPublicKeyInfo(der: Buffer): Buffer {
  function field(start: number, limit = der.length) {
    if (start < 0 || start + 2 > limit) throw new Error('Invalid certificate DER field')
    let offset = start
    const tag = der[offset++]!
    let length = der[offset++]!
    if (length & 0x80) {
      const count = length & 0x7f
      if (!count || count > 4 || offset + count > limit) throw new Error('Invalid certificate DER length')
      length = 0
      for (let index = 0; index < count; index++) length = length * 256 + der[offset++]!
    }
    const end = offset + length
    if (!Number.isSafeInteger(end) || end > limit) throw new Error('Invalid certificate DER field')
    return { tag, content: offset, end }
  }
  const sequence = field(0), tbs = field(sequence.content, sequence.end)
  if (sequence.tag !== 0x30 || sequence.end !== der.length || tbs.tag !== 0x30) throw new Error('Invalid certificate sequence')
  let offset = tbs.content
  if (der[offset] === 0xa0) offset = field(offset, tbs.end).end // Optional explicit version.
  for (const tag of [0x02, 0x30, 0x30, 0x30, 0x30]) { // serial, signature, issuer, validity, subject.
    const entry = field(offset, tbs.end)
    if (entry.tag !== tag) throw new Error('Invalid certificate identity field')
    offset = entry.end
  }
  const spki = field(offset, tbs.end), algorithm = field(spki.content, spki.end)
  const oid = field(algorithm.content, algorithm.end), key = field(algorithm.end, spki.end)
  if (spki.tag !== 0x30 || algorithm.tag !== 0x30 || oid.tag !== 0x06 || oid.end <= oid.content ||
    key.tag !== 0x03 || key.end !== spki.end || der[key.content] !== 0 || key.end <= key.content + 1) {
    throw new Error('Invalid certificate SubjectPublicKeyInfo')
  }
  return der.subarray(offset, spki.end)
}

function certificateKey(certificate: X509Certificate, runtime: 'bun' | 'native' = 'bun'): string | undefined {
  let spki: Buffer
  try { spki = certificate.publicKey.export({ type: 'spki', format: 'der' }) }
  catch (error) {
    if (!(error instanceof Error && 'code' in error && error.code === 'ERR_OSSL_X509_PUBLIC_KEY_DECODE_ERROR')) throw error
    // Bun TLS cannot use these keys. Java can; inspect its bounded DER instead.
    if (runtime === 'bun') return undefined
    spki = nativeSubjectPublicKeyInfo(certificate.raw)
  }
  return createHash('sha256').update(spki).digest('hex')
}

/** Match the incident keys for native runtimes too; malformed certificates or SPKI structures throw. */
export function hasDistrustedCertificateKey(pem: string): boolean {
  const key = certificateKey(new X509Certificate(pem), 'native')
  if (key === undefined) throw new Error('Cannot inspect the native certificate key.')
  return distrustedKeys.has(key)
}

/** Keep the caller's trust policy while excluding keys affected by the CA compromise. */
export function trustedCertificates(bundles: readonly string[]): string[] {
  const certificates = new Map<string, string>()
  for (const bundle of bundles) {
    const entries = bundle.match(/-----BEGIN (TRUSTED )?CERTIFICATE-----[\s\S]*?-----END \1CERTIFICATE-----/g)
    if (!entries?.length) throw new Error('The configured CA bundle contains no PEM certificates.')
    for (const pem of entries) {
      const certificate = new X509Certificate(pem)
      const key = certificateKey(certificate)
      // Trusted PEM includes auxiliary trust/rejection data outside the certificate fingerprint.
      const identity = pem.startsWith('-----BEGIN TRUSTED CERTIFICATE-----') ? pem : certificate.fingerprint256
      if (key && !distrustedKeys.has(key)) certificates.set(identity, pem)
    }
  }
  return [...certificates.values()]
}

/** Include platform and explicitly added CAs, then remove the affected authentication paths. */
export function runtimeCertificates(): string[] {
  return trustedCertificates([
    ...rootCertificates, ...getCACertificates('default'), ...getCACertificates('system'), ...getCACertificates('extra'),
  ])
}

/** Scope Node certificate settings to the child; Bun receives the CA file directly. */
export async function withCertificateTrust<T>(
  certificates: readonly string[],
  operation: (cafile: string, environment: NodeJS.ProcessEnv) => Promise<T>,
): Promise<T> {
  const directory = await mkdtemp(path.join(tmpdir(), 'groma-certificate-trust-'))
  try {
    const cafile = path.join(directory, 'ca.pem')
    const trusted = trustedCertificates(certificates)
    if (trusted.length === 0) throw new Error('No trusted certificate authorities remain.')
    await writeFile(cafile, trusted.join('\n'), { mode: 0o600 })
    // Only Node consumers need environment overrides. Bun receives --cafile directly;
    // native Git must retain its own CA, proxy and verification configuration.
    const environment: NodeJS.ProcessEnv = {
      NODE_EXTRA_CA_CERTS: cafile, NODE_USE_SYSTEM_CA: '0', NODE_TLS_REJECT_UNAUTHORIZED: '1',
      NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --use-openssl-ca`.trim(),
    }
    return await operation(cafile, environment)
  } finally { await rm(directory, { recursive: true, force: true }) }
}
