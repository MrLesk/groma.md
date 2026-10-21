const { execFile } = require('node:child_process')
const { createHash, X509Certificate } = require('node:crypto')
const { mkdtemp, readFile, rm, writeFile } = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { promisify } = require('node:util')

const execute = promisify(execFile)
const commandOptions = { timeout: 30000, maxBuffer: 4 * 1024 * 1024, windowsHide: true }

/** Change only disposable GitHub-hosted runner trust before native package downloads. */
async function prepareHostedRunnerTrust() {
  if (process.env.GITHUB_ACTIONS !== 'true' || process.env.RUNNER_ENVIRONMENT !== 'github-hosted') {
    throw new Error('Native trust preparation is restricted to disposable GitHub-hosted runners.')
  }
  if (process.platform === 'linux') return
  if (process.platform !== 'win32' && process.platform !== 'darwin') throw new Error('Unsupported hosted runner platform.')
  const temporary = await mkdtemp(path.join(process.env.RUNNER_TEMP || os.tmpdir(), 'groma-native-trust-'))
  try {
    const fixture = path.resolve(__dirname, '../test/fixtures/certificate-trust/compromised-cas.json')
    const { certificates } = JSON.parse(await readFile(fixture, 'utf8'))
    if (!certificates?.length) throw new Error('The compromised certificate fixture is empty.')
    const keys = new Set()
    const files = []
    for (const { pem } of certificates) {
      const certificate = new X509Certificate(pem)
      keys.add(createHash('sha256').update(certificate.publicKey.export({ type: 'spki', format: 'der' })).digest('hex'))
      const file = path.join(temporary, `${certificate.fingerprint256.replaceAll(':', '')}.cer`)
      await writeFile(file, certificate.raw)
      files.push(file)
    }
    if (process.platform === 'win32') await denyWindowsCertificates(temporary, [...keys])
    else for (const file of files) {
      // Administrative trust settings override the read-only system root keychain.
      await execute('sudo', ['-n', 'security', 'add-trusted-cert', '-d', '-r', 'deny', '-k', '/Library/Keychains/System.keychain', file], commandOptions)
    }
    console.log(`Native OS trust denies ${keys.size} affected signing keys; run the .NET probe after SDK setup.`)
  } finally { await rm(temporary, { recursive: true, force: true }) }
}

async function denyWindowsCertificates(directory, keys) {
  const policy = path.join(directory, 'keys.json')
  const script = path.join(directory, 'deny-certificates.ps1')
  await writeFile(policy, JSON.stringify(keys))
  await writeFile(script, `param([string]$Directory, [string]$Policy)
$ErrorActionPreference = 'Stop'
$blocked = @(Get-Content -LiteralPath $Policy -Raw | ConvertFrom-Json)
$removed = 0
foreach ($store in @('Cert:\\LocalMachine\\Root', 'Cert:\\LocalMachine\\CA', 'Cert:\\CurrentUser\\Root', 'Cert:\\CurrentUser\\CA')) {
  foreach ($certificate in @(Get-ChildItem -LiteralPath $store)) {
    $spki = $certificate.PublicKey.ExportSubjectPublicKeyInfo()
    $hash = [Convert]::ToHexString([System.Security.Cryptography.SHA256]::HashData($spki)).ToLowerInvariant()
    if ($blocked -contains $hash) {
      Remove-Item -LiteralPath $certificate.PSPath -Force
      $removed++
    }
  }
}
$files = @(Get-ChildItem -LiteralPath $Directory -Filter '*.cer')
foreach ($file in $files) {
  $certificate = Import-Certificate -FilePath $file.FullName -CertStoreLocation 'Cert:\\LocalMachine\\Disallowed'
  if (-not (Test-Path -LiteralPath ('Cert:\\LocalMachine\\Disallowed\\' + $certificate.Thumbprint))) {
    throw ('Certificate was not added to Disallowed: ' + $file.Name)
  }
}
Write-Host ('Removed ' + $removed + ' affected trusted certificates; denied ' + $files.Count + ' public certificate variants.')
`)
  const result = await execute('pwsh', ['-NoProfile', '-NonInteractive', '-File', script, '-Directory', directory, '-Policy', policy], commandOptions)
  process.stdout.write(result.stdout)
}

module.exports = { prepareHostedRunnerTrust }
if (require.main === module) prepareHostedRunnerTrust().catch(error => { console.error(error); process.exitCode = 1 })
