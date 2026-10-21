import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { gitEnvironmentSetting, runtimeCertificates, trustedCertificates, withCertificateTrust } from '../../certificate-trust.ts'

/** Read configuration without putting its credential-bearing key names in command arguments or errors. */
async function configuration(project: string, args: string[]): Promise<string | null | undefined> {
  let child: Bun.Subprocess<'ignore', 'pipe', 'pipe'>
  try {
    child = Bun.spawn(['git', 'config', ...args], {
      cwd: project, stdin: 'ignore', stdout: 'pipe', stderr: 'pipe',
    })
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT' && 'path' in error && error.path === 'git') return undefined
    throw error
  }
  const [code, output] = await Promise.all([
    child.exited, new Response(child.stdout).text(), new Response(child.stderr).text(),
  ])
  if (code === 1) return null
  if (code !== 0) throw new Error('Could not inspect Git TLS configuration.')
  return output
}

async function caSettings(project: string, url?: string): Promise<[string, string][]> {
  if (url !== undefined) {
    const file = await configuration(project, ['--path', '--get-urlmatch', 'http.sslCAInfo', url])
    const directory = await configuration(project, ['--path', '--get-urlmatch', 'http.sslCAPath', url])
    const settings: [string, string][] = []
    if (file != null) settings.push(['http.sslcainfo', file.replace(/\r?\n$/, '')])
    if (directory != null) settings.push(['http.sslcapath', directory.replace(/\r?\n$/, '')])
    return settings
  }
  const output = await configuration(project, ['--null', '--path', '--get-regexp', '^http\\.(.*\\.)?(sslcainfo|sslcapath)$'])
  return (output ?? '').split('\0').filter(Boolean).map(entry => {
    const separator = entry.indexOf('\n')
    if (separator < 0) throw new Error('Could not inspect Git CA configuration.')
    return [entry.slice(0, separator), entry.slice(separator + 1)]
  })
}

/** Keep OpenSSL's contiguous hash chains contiguous after blocked certificates are removed. */
async function filteredDirectory(source: string, target: string): Promise<void> {
  await mkdir(target)
  const hashes = new Map<string, Set<number>>()
  for (const name of await readdir(source)) {
    const match = /^([a-f0-9]{8})\.(0|[1-9][0-9]*)$/i.exec(name)
    if (!match) continue // Ignore unrelated files and CRLs.
    const entries = hashes.get(match[1]!) ?? new Set<number>()
    entries.add(Number(match[2]))
    hashes.set(match[1]!, entries)
  }
  for (const [hash, entries] of hashes) {
    let input = 0, output = 0
    // Native lookup ignores entries after a missing index; preserve that selection.
    while (entries.has(input)) {
      const certificates = trustedCertificates([await readFile(path.join(source, `${hash}.${input++}`), 'utf8')], 'native')
      for (const pem of certificates) await writeFile(path.join(target, `${hash}.${output++}`), pem, { mode: 0o600 })
    }
  }
}

/** Preserve each Git CA file/directory policy while removing the incident keys. */
async function filteredCa(project: string, value: string, target: string, directory: boolean): Promise<string> {
  const source = path.resolve(project, value)
  if (directory) await filteredDirectory(source, target)
  else {
    const certificates = trustedCertificates([await readFile(source, 'utf8')], 'native')
    if (!certificates.length) throw new Error('The configured Git CA bundle contains no trusted authorities.')
    await writeFile(target, certificates.join('\n'), { mode: 0o600 })
  }
  return target
}

type CaFiles = { project: string; cafile: string; empty: string }

async function selectedCa(files: CaFiles, key: string, value: string, index: number): Promise<string> {
  const directory = key.endsWith('sslcapath')
  if (!value) {
    if (directory) return files.empty
    throw new Error('The configured Git CA file is empty.')
  }
  const target = path.join(path.dirname(files.cafile), `git-ca-${index}`)
  return filteredCa(files.project, value, target, directory)
}

async function configuredCa(files: CaFiles, configured: [string, string][], explicit: NodeJS.ProcessEnv) {
  const settings: [string, string][] = [['http.sslCAInfo', files.cafile], ['http.sslCAPath', files.empty]]
  for (const [index, [key, value]] of configured.entries()) {
    const kind = key.endsWith('.sslcapath') ? 'sslcapath' : 'sslcainfo'
    if (explicit[kind] === undefined) settings.push([key, await selectedCa(files, kind, value, index)])
  }
  return settings
}

async function explicitCa(files: CaFiles, explicit: NodeJS.ProcessEnv, offset: number) {
  const environment: NodeJS.ProcessEnv = { GIT_SSL_CAINFO: undefined, GIT_SSL_CAPATH: undefined }
  for (const [index, [kind, value]] of Object.entries(explicit).entries()) {
    if (value === undefined) continue
    const key = kind === 'sslcapath' ? 'GIT_SSL_CAPATH' : 'GIT_SSL_CAINFO'
    environment[key] = await selectedCa(files, kind, value, offset + index)
  }
  return environment
}

function gitEnvironment(native: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const environment = Object.fromEntries(Object.entries(native).filter(([key]) => key.startsWith('GIT_')))
  // Bun omits undefined values; clear every inherited Windows spelling of the bypass.
  for (const key of Object.keys(process.env)) {
    const canonical = key.toUpperCase()
    if (canonical === 'GIT_SSL_NO_VERIFY' || (key !== canonical && canonical in environment)) environment[key] = undefined
  }
  return environment
}

function indexedSettings(environment: NodeJS.ProcessEnv, settings: [string, string][]): NodeJS.ProcessEnv {
  const count = Number(environment.GIT_CONFIG_COUNT)
  if (!Number.isSafeInteger(count + settings.length)) throw new Error('Invalid GIT_CONFIG_COUNT.')
  for (const [offset, [key, value]] of settings.entries()) {
    environment[`GIT_CONFIG_KEY_${count + offset}`] = key
    environment[`GIT_CONFIG_VALUE_${count + offset}`] = value
  }
  environment.GIT_CONFIG_COUNT = String(count + settings.length)
  // Git reads opaque PARAMETERS after indexed settings. Preserve it, then enforce the same filtered values last.
  const quote = (value: string) => `'${value.replaceAll("'", "'\\''")}'`
  const parameters = settings.map(([key, value]) => `${quote(key)}=${quote(value)}`).join(' ')
  environment.GIT_CONFIG_PARAMETERS = [gitEnvironmentSetting('GIT_CONFIG_PARAMETERS'), parameters].filter(Boolean).join(' ')
  return environment
}

/** Direct fetches select one URL; package installation preserves the effective per-URL configuration for nested Git dependencies. */
export async function withGitCertificateTrust<T>(
  project: string, operation: (environment: NodeJS.ProcessEnv) => Promise<T>, url?: string,
): Promise<T> {
  const keys = await configuration(project, ['--null', '--name-only', '--get-regexp', '^http\\.(.*\\.)?(sslverify|schannelusesslcainfo)$'])
  if (keys === undefined) return operation({}) // Without Git, installation cannot start a Git HTTPS dependency.
  const configured = await caSettings(project, url)
  return withCertificateTrust(runtimeCertificates('native'), async (cafile, native) => {
    const files = { project, cafile, empty: native.GIT_SSL_CAPATH! }
    const explicit: NodeJS.ProcessEnv = { sslcainfo: gitEnvironmentSetting('GIT_SSL_CAINFO'), sslcapath: gitEnvironmentSetting('GIT_SSL_CAPATH') }
    // For a known URL the native-selected CA must outrank its original URL-specific setting.
    if (url !== undefined) for (const [key, value] of configured) {
      const kind = key.endsWith('.sslcapath') ? 'sslcapath' : 'sslcainfo'
      explicit[kind] ??= value
    }
    const settings = await configuredCa(files, configured, explicit)
    for (const key of new Set((keys ?? '').split('\0').filter(Boolean))) settings.push([key, 'true'])
    const environment = { ...native, ...await explicitCa(files, explicit, configured.length) }
    return operation(gitEnvironment(indexedSettings(environment, settings)))
  }, 'native')
}
