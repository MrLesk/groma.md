import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { getCACertificates } from 'node:tls'
import { gitEnvironmentSetting, trustedCertificates, withCertificateTrust } from '../../certificate-trust.ts'

/** Read configuration without putting its credential-bearing key names in command arguments or errors. */
async function configuration(project: string, args: string[], command: 'config' | 'ls-remote' = 'config'): Promise<string | null | undefined> {
  let child: Bun.Subprocess<'ignore', 'pipe', 'pipe'>
  try {
    child = Bun.spawn(['git', command, ...args], {
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

/** Ask Git to expand insteadOf without fetching; keep credentials out of subsequent configuration arguments. */
async function effectiveUrl(project: string, url: string): Promise<string> {
  const expanded = await configuration(project, ['--get-url', url], 'ls-remote')
  if (!expanded) throw new Error('Could not resolve the Git download URL.')
  const target = expanded.replace(/\r?\n$/, '').replace(/^(?:https?|ftps?)::(?=https?:\/\/)/i, '')
  if (!/^https?:\/\//i.test(target)) return url // Preserve existing SSH/local rewrites, which do not use HTTP trust.
  return target.replace(/^([a-z][a-z0-9+.-]*:\/\/)([^/?#]*)/i, (_match, scheme: string, authority: string) => {
    const at = authority.lastIndexOf('@'), colon = authority.indexOf(':')
    // Do not reserialize URL.href: Git distinguishes raw '=' usernames from percent-encoded ones.
    const selected = colon >= 0 && colon < at ? authority.slice(0, colon) + authority.slice(at) : authority
    return `${scheme}${selected}`
  })
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
  const output = await configuration(project, ['--null', '--get-regexp', '^http\\.(.*\\.)?(sslcainfo|sslcapath)$'])
  return (output ?? '').split('\0').filter(Boolean).map(entry => {
    const separator = entry.indexOf('\n')
    if (separator < 0) throw new Error('Could not inspect Git CA configuration.')
    return [entry.slice(0, separator), entry.slice(separator + 1)]
  })
}

/** Keep PEM authorities and revocation lists; DER and unrelated directory entries are not copied. */
async function directoryAuthority(source: string): Promise<string | undefined> {
  const content = await readFile(source, 'utf8')
  const certificates = content.match(/-----BEGIN (TRUSTED )?CERTIFICATE-----[\s\S]*?-----END \1CERTIFICATE-----/g) ?? []
  const crls = content.match(/-----BEGIN X509 CRL-----[\s\S]*?-----END X509 CRL-----/g) ?? []
  const retained = [...(certificates.length ? trustedCertificates(certificates, 'native') : []), ...crls]
  return certificates.length || crls.length ? retained.join('\n') : undefined
}

/** Compact files in the original prefix without making entries beyond its first gap reachable to OpenSSL. */
async function filteredHashChain(target: string, hash: string, entries: Map<number, string | undefined>): Promise<void> {
  let input = 0, output = 0
  while (entries.has(input)) {
    const content = entries.get(input)
    if (content === undefined) break // Do not move a later authority over an unrecognized native entry.
    input++
    if (content) await writeFile(path.join(target, `${hash}.${output++}`), content, { mode: 0o600 })
  }
  // GnuTLS also loads these original names; OpenSSL must still encounter a gap first.
  for (const [index, content] of entries) {
    if (index > input && content) await writeFile(path.join(target, `${hash}.${index}`), content, { mode: 0o600 })
  }
}

/** Preserve ordinary GnuTLS names and OpenSSL's original contiguous hash chains independently. */
async function filteredDirectory(source: string, target: string): Promise<void> {
  await mkdir(target)
  const hashes = new Map<string, Map<number, string | undefined>>()
  for (const name of await readdir(source)) {
    const filename = path.join(source, name)
    const information = await stat(filename).catch(error => {
      if (error.code === 'ENOENT') return undefined // Native CA lookup ignores dangling links.
      throw error
    })
    if (!information?.isFile()) continue
    const content = await directoryAuthority(filename)
    const match = /^([a-f0-9]{8})\.(0|[1-9][0-9]*)$/i.exec(name)
    if (!match) {
      if (content) await writeFile(path.join(target, name), content, { mode: 0o600 })
      continue
    }
    // OpenSSL may continue past an empty regular slot; never copy unknown bytes or remove that slot.
    await writeFile(path.join(target, name), '', { mode: 0o600 })
    const entries = hashes.get(match[1]!) ?? new Map<number, string | undefined>()
    entries.set(Number(match[2]), content)
    hashes.set(match[1]!, entries)
  }
  for (const [hash, entries] of hashes) await filteredHashChain(target, hash, entries)
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

/** An unusable PM scope must not abort unrelated requests; selecting it must still fail closed. */
async function configuredAuthority(files: CaFiles, key: string, value: string, index: number): Promise<string> {
  try {
    // Let Git expand each path; an unrelated invalid ~user must not abort bulk enumeration.
    const expanded = await configuration(files.project, ['--file', '-', '--null', '--path', '--default', value, '--get', 'groma.path'])
    if (expanded == null) throw new Error('Could not expand the Git CA path.')
    return await selectedCa(files, key, expanded.replace(/\0$/, ''), index)
  }
  catch (error) {
    if (!/^http\..+\.(sslcainfo|sslcapath)$/.test(key)) throw error
    if (key.endsWith('.sslcapath')) return files.empty
    const invalid = path.join(path.dirname(files.cafile), `git-unusable-${index}.pem`)
    await writeFile(invalid, '', { mode: 0o600 })
    return invalid
  }
}

async function configuredCa(files: CaFiles, configured: [string, string][], explicit: NodeJS.ProcessEnv) {
  const settings: [string, string][] = [['http.sslCAInfo', files.cafile], ['http.sslCAPath', files.empty]]
  for (const [index, [key, value]] of configured.entries()) {
    const kind = key.endsWith('.sslcapath') ? 'sslcapath' : 'sslcainfo'
    if (explicit[kind] === undefined) settings.push([key, await configuredAuthority(files, key, value, index)])
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
  const configured = await caSettings(project, url === undefined ? undefined : await effectiveUrl(project, url))
  return withCertificateTrust(getCACertificates('system'), async (cafile, native) => {
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
