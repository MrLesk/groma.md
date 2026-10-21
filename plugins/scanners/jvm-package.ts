import { execFile } from 'node:child_process'
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { trustedCertificates } from '../../src/certificate-trust.ts'

const execute = promisify(execFile)

/** A JDK tool of the maintainer's build JDK: from `JAVA_HOME` when it is set, otherwise from `PATH`. */
export function jdkTool(name: string): string {
  const executable = process.platform === 'win32' ? `${name}.exe` : name
  return process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, 'bin', executable) : executable
}

/** Remove compromised certificate authorities while preserving the build JDK's other trusted certificates. */
export async function secureJavaTrustStore(store: string): Promise<void> {
  const keytool = jdkTool('keytool')
  const options = ['-J-Duser.language=en', '-J-Duser.country=US', '-keystore', store, '-storepass', 'changeit']
  const { stdout } = await execute(keytool, ['-list', '-rfc', ...options])
  const entries = [...stdout.matchAll(/Alias name: ([^\r\n]+)[\s\S]*?(-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----)/g)]
  if (entries.length === 0 || entries.length !== stdout.match(/Alias name: /g)?.length) {
    throw new Error(`Could not inspect the Java trust store: ${store}`)
  }
  for (const entry of entries) {
    if (trustedCertificates([entry[2]!]).length === 0) {
      await execute(keytool, ['-delete', '-alias', entry[1]!, ...options])
    }
  }
}

/** An isolated trust store for build tools that download Maven artifacts. The maintainer's JDK is never modified. */
export async function prepareJavaTrustStore(destination: string): Promise<string> {
  const { stderr } = await execute(jdkTool('java'), ['-XshowSettings:properties', '-version'])
  const home = stderr.match(/java.home = (.+)/)?.[1]?.trim()
  if (!home) throw new Error('Cannot locate the build JDK trust store.')
  await cp(path.join(home, 'lib/security/cacerts'), destination)
  await secureJavaTrustStore(destination)
  return destination
}

/** Writes a notices file: the preface, then the license text of each npm package found among the bundle input paths. */
export async function writeNpmNotices(preface: string, inputs: string[], output: string): Promise<void> {
  const directories = new Set(inputs.flatMap(input => /^(.*node_modules\/(?:@[^/]+\/)?[^/]+)\//.exec(input.replaceAll('\\', '/'))?.[1] ?? []))
  const sections = [preface]
  for (const directory of [...directories].map(item => path.resolve(item)).sort()) {
    const manifest = JSON.parse(await readFile(path.join(directory, 'package.json'), 'utf8'))
    const license = (await readdir(directory)).find(name => /^licen[cs]e/i.test(name))
    if (!license) throw new Error(`Review the missing license text for ${manifest.name}@${manifest.version}`)
    sections.push(`\n${manifest.name} ${manifest.version}\nLicense: ${manifest.license}\n\n${await readFile(path.join(directory, license), 'utf8')}`)
  }
  await writeFile(output, sections.join(''))
}

/**
 * Assembles the package of a scanner whose `src/index.ts` runs a parser worker on a bundled Java runtime. `buildWorker`
 * writes the worker into the package's `dist/` directory, and `modules` are the Java modules that worker needs. The
 * package holds the bundled entry, the worker, a runtime for this host, notices, and a manifest for this host alone.
 */
export async function buildJvmPackage(
  pluginRoot: string, destination: string, modules: string, buildWorker: (dist: string) => Promise<void>,
): Promise<void> {
  await rm(destination, { recursive: true, force: true })
  await mkdir(destination, { recursive: true })
  await buildWorker(path.join(destination, 'dist'))
  const runtime = path.join(destination, 'dist', `${process.platform}-${process.arch}`, 'runtime')
  await mkdir(path.dirname(runtime), { recursive: true })
  await execute(jdkTool('jlink'), ['--add-modules', modules,
    '--strip-debug', '--no-header-files', '--no-man-pages', '--output', runtime])
  await secureJavaTrustStore(path.join(runtime, 'lib/security/cacerts'))
  const built = await Bun.build({
    entrypoints: [path.join(pluginRoot, 'src/index.ts')],
    outdir: path.join(destination, 'src'), target: 'bun', format: 'esm', naming: 'index.js', metafile: true,
  })
  if (!built.success) throw new Error(built.logs.join('\n'))
  const preface = `${await readFile(path.join(pluginRoot, 'THIRD-PARTY-NOTICES.txt'), 'utf8')
  }Java runtime licenses are in each dist/<host>/runtime/legal directory.\nBundled npm package license texts follow.\n`
  await writeNpmNotices(preface, Object.keys(built.metafile?.inputs ?? {}), path.join(destination, 'THIRD-PARTY-NOTICES.txt'))
  const manifest = JSON.parse(await readFile(path.join(pluginRoot, 'package.json'), 'utf8'))
  await writeFile(path.join(destination, 'package.json'), `${JSON.stringify({
    name: manifest.name, version: manifest.version, description: manifest.description,
    private: manifest.private, type: 'module', license: 'MIT', os: [process.platform], cpu: [process.arch],
    groma: { scanner: { ...manifest.groma.scanner, entry: './src/index.js' } },
  }, null, 2)}\n`)
  await cp(path.join(pluginRoot, '../../../LICENSE'), path.join(destination, 'LICENSE'))
}
