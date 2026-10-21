import { createHash, X509Certificate } from 'node:crypto'
import { getCACertificates } from 'node:tls'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
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

/** Keep the caller's trust policy while excluding keys affected by the CA compromise. */
export function trustedCertificates(bundles: readonly string[]): string[] {
  const certificates = new Map<string, string>()
  for (const bundle of bundles) {
    const entries = bundle.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g)
    if (!entries?.length) throw new Error('The configured CA bundle contains no PEM certificates.')
    for (const pem of entries) {
      const certificate = new X509Certificate(pem)
      const key = createHash('sha256').update(certificate.publicKey.export({ type: 'spki', format: 'der' })).digest('hex')
      if (!distrustedKeys.has(key)) certificates.set(certificate.fingerprint256, pem)
    }
  }
  return [...certificates.values()]
}

/** Include platform and explicitly added CAs, then remove the affected authentication paths. */
export function runtimeCertificates(): string[] {
  return trustedCertificates([
    ...getCACertificates('default'), ...getCACertificates('system'), ...getCACertificates('extra'),
  ])
}

/** Give one child process a filtered trust store without changing the parent environment. */
export async function withCertificateTrust<T>(
  certificates: readonly string[],
  operation: (cafile: string, environment: NodeJS.ProcessEnv) => Promise<T>,
): Promise<T> {
  const directory = await mkdtemp(path.join(tmpdir(), 'groma-certificate-trust-'))
  try {
    const cafile = path.join(directory, 'ca.pem'), empty = path.join(directory, 'empty')
    const trusted = trustedCertificates(certificates)
    if (trusted.length === 0) throw new Error('No trusted certificate authorities remain.')
    await mkdir(empty)
    await writeFile(cafile, trusted.join('\n'), { mode: 0o600 })
    return await operation(cafile, {
      SSL_CERT_FILE: cafile, SSL_CERT_DIR: empty, CURL_CA_BUNDLE: cafile,
      GIT_SSL_CAINFO: cafile, GIT_SSL_CAPATH: empty, GIT_SSL_NO_VERIFY: 'false',
      NODE_EXTRA_CA_CERTS: cafile, NODE_USE_SYSTEM_CA: '0', NODE_TLS_REJECT_UNAUTHORIZED: '1',
      NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --use-openssl-ca`.trim(),
    })
  } finally { await rm(directory, { recursive: true, force: true }) }
}
