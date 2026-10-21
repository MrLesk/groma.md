import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'
import { runtimeCertificates, trustedCertificates } from '../../certificate-trust.ts'

type Environment = Readonly<Record<string, string | undefined>>
type CertificateSetting = { file?: string; certificates?: string[] }

async function optionalFile(file: string): Promise<string | undefined> {
  try { return await readFile(file, 'utf8') }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }
}

function substituted(value: string, environment: Environment): string {
  return value.replace(/\$\{([^}?]+)(\?)?\}/g, (original, name: string, optional: string | undefined) =>
    environment[name] ?? (optional ? '' : original))
}

function npmValue(value: string, environment: Environment): string {
  const quoted = value.match(/^(["'])([\s\S]*)\1\s*(?:[;#].*)?$/)
  const plain = quoted ? quoted[2]! : value.replace(/(?<!\\)[;#].*$/, '').trim()
  return substituted(plain.replace(/\\n/g, '\n').replace(/\\([;#])/g, '$1'), environment)
}

function npmCertificates(text: string, environment: Environment): CertificateSetting | undefined {
  const certificates: string[] = []
  let file: string | undefined
  for (const line of text.split(/\r?\n/)) {
    const entry = line.match(/^\s*(ca(?:\[\])?|cafile)\s*=\s*(.*?)\s*$/)
    if (!entry) continue
    const value = npmValue(entry[2]!, environment)
    if (entry[1] === 'cafile') file = value
    else {
      if (entry[1] === 'ca') certificates.length = 0
      certificates.push(value)
    }
  }
  return file !== undefined ? { file } : certificates.length ? { certificates } : undefined
}

function bunCertificates(text: string): CertificateSetting | undefined {
  const config = Bun.TOML.parse(text) as { install?: { ca?: unknown; cafile?: unknown } }
  const { ca, cafile } = config.install ?? {}
  if (cafile !== undefined) {
    if (typeof cafile !== 'string') throw new Error('The configured install.cafile must be a path.')
    return { file: cafile }
  }
  if (ca === undefined) return undefined
  const certificates = Array.isArray(ca) ? ca : [ca]
  if (!certificates.every(value => typeof value === 'string')) throw new Error('The configured install.ca must contain PEM certificates.')
  return { certificates }
}

async function configurationFiles(directory: string, environment: Environment) {
  const home = environment.HOME ?? environment.USERPROFILE ?? homedir()
  const xdg = environment.XDG_CONFIG_HOME && path.resolve(directory, environment.XDG_CONFIG_HOME)
  const userconfig = environment.NPM_CONFIG_USERCONFIG ?? environment.npm_config_userconfig
  const resolve = (file: string, base: string) => file.startsWith('~/')
    ? path.join(home, file.slice(2)) : path.resolve(base, file)
  const userFile = userconfig !== undefined ? resolve(userconfig, directory)
    : xdg && await optionalFile(path.join(xdg, '.npmrc')) !== undefined ? path.join(xdg, '.npmrc') : path.join(home, '.npmrc')
  const global = xdg && path.isAbsolute(environment.XDG_CONFIG_HOME!) ? xdg : home
  return { resolve, files: [
    { file: userFile, parse: (text: string) => npmCertificates(text, environment) },
    { file: path.join(directory, '.npmrc'), parse: (text: string) => npmCertificates(text, environment) },
    { file: path.join(global, '.bunfig.toml'), parse: bunCertificates },
    { file: path.join(directory, 'bunfig.toml'), parse: bunCertificates },
  ] }
}

async function configuredCertificates(directory: string, environment: Environment): Promise<string[] | undefined> {
  const { resolve, files } = await configurationFiles(directory, environment)
  let setting: CertificateSetting | undefined
  for (const { file, parse } of files) {
    const text = await optionalFile(file)
    const next = text === undefined ? undefined : parse(text)
    if (next) setting = { ...setting, ...next, ...(next.file === undefined ? {} : { file: resolve(next.file, directory) }) }
  }
  if (setting?.file !== undefined) return [await readFile(setting.file, 'utf8')]
  return setting?.certificates
}

/** Bun's CA overrides replace its default trust, while registries, tokens and proxies remain Bun's responsibility. */
export async function packageManagerCertificates(directory: string, environment: Environment = process.env): Promise<string[]> {
  const certificates = await configuredCertificates(directory, environment) ?? runtimeCertificates()
  const trusted = trustedCertificates(certificates)
  if (trusted.length === 0) throw new Error('The configured CA bundle has no trusted certificates after removing compromised certificate authorities.')
  return trusted
}
