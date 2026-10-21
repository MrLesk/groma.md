import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { runtimeCertificates } from '../../../src/certificate-trust.ts'
import { buildJvmPackage, jdkTool, prepareJavaTrustStore } from '../jvm-package.ts'

const execute = promisify(execFile)
const pluginRoot = fileURLToPath(new URL('./', import.meta.url))
// From sbt-2.0.11.tgz, verified against the digest on the upstream GitHub release.
const launcherHash = '2069338b22ed795a3b65615da0858e5b8733fe3f9a3f73b2fcfd559421e11374'

/** Maintainer-only compilation. Each build owns its temporary project and output. */
export async function buildWorker(destination: string): Promise<void> {
  const project = await mkdtemp(path.join(os.tmpdir(), 'groma-scala-build-'))
  try {
    for (const entry of ['build.sbt', 'project/build.properties', 'project/plugins.sbt', 'src']) {
      const output = path.join(project, entry)
      await mkdir(path.dirname(output), { recursive: true })
      await cp(path.join(pluginRoot, 'worker', entry), output, { recursive: true })
    }
    const version = (await readFile(path.join(project, 'project/build.properties'), 'utf8')).trim().split('=')[1]!
    const response = await fetch(`https://repo.maven.apache.org/maven2/org/scala-sbt/sbt-launch/${version}/sbt-launch-${version}.jar`, { tls: { ca: runtimeCertificates() }, decompress: false, headers: { 'Accept-Encoding': 'identity' } })
    if (!response.ok) throw new Error(`Could not download the build launcher: ${response.status}`)
    const jar = Buffer.from(await response.arrayBuffer())
    if (createHash('sha256').update(jar).digest('hex') !== launcherHash) throw new Error('Unexpected sbt launcher checksum')
    const launcher = path.join(project, 'sbt-launch.jar')
    await writeFile(launcher, jar)
    const repositories = path.join(project, 'repositories')
    await writeFile(repositories, '[repositories]\nlocal\nmaven-central: https://repo.maven.apache.org/maven2/\n')
    const trustStore = await prepareJavaTrustStore(path.join(project, 'cacerts'))
    await execute(jdkTool('java'), [`-Djavax.net.ssl.trustStore=${trustStore}`, '-Dsbt.override.build.repos=true', `-Dsbt.repository.config=${repositories}`,
      '-Dsbt.supershell=false', '-Dsbt.log.noformat=true', '-Dsbt.server.autostart=false', '-jar', launcher, 'assembly'],
    { cwd: project, maxBuffer: 8 * 1024 * 1024 })
    await mkdir(path.dirname(destination), { recursive: true })
    await cp(path.join(project, 'worker.jar'), destination)
  } finally { await rm(project, { recursive: true, force: true }) }
}

/** Consumers receive the parser and runtime; sbt is used only by maintainers here. */
export function buildPackage(destination: string): Promise<void> {
  // jdeps --print-module-deps on the assembled parser worker.
  return buildJvmPackage(pluginRoot, destination, 'java.base,jdk.unsupported', dist => buildWorker(path.join(dist, 'worker.jar')))
}

if (import.meta.main) {
  const output = path.join(pluginRoot, 'dist/package')
  await buildPackage(output)
  await cp(path.join(output, 'dist'), path.join(pluginRoot, 'dist'), { recursive: true })
  console.log(output)
}
