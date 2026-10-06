import { execFile } from 'node:child_process'
import { cp, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execute = promisify(execFile)
const pluginRoot = fileURLToPath(new URL('./', import.meta.url))

function tool(name: string): string {
  const executable = process.platform === 'win32' ? `${name}.exe` : name
  return process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, 'bin', executable) : executable
}

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
    const response = await fetch(`https://repo.maven.apache.org/maven2/org/scala-sbt/sbt-launch/${version}/sbt-launch-${version}.jar`)
    if (!response.ok) throw new Error(`Could not download the build launcher: ${response.status}`)
    const launcher = path.join(project, 'sbt-launch.jar')
    await writeFile(launcher, Buffer.from(await response.arrayBuffer()))
    const repositories = path.join(project, 'repositories')
    await writeFile(repositories, '[repositories]\nlocal\nmaven-central: https://repo.maven.apache.org/maven2/\n')
    await execute(tool('java'), ['-Dsbt.override.build.repos=true', `-Dsbt.repository.config=${repositories}`,
      '-Dsbt.supershell=false', '-Dsbt.log.noformat=true', '-Dsbt.server.autostart=false', '-jar', launcher, 'assembly'],
    { cwd: project, maxBuffer: 8 * 1024 * 1024 })
    await mkdir(path.dirname(destination), { recursive: true })
    await cp(path.join(project, 'target/scala-3.9.0/worker.jar'), destination)
  } finally { await rm(project, { recursive: true, force: true }) }
}

async function writeNotices(inputs: string[], output: string): Promise<void> {
  const directories = new Set(inputs.flatMap(input => /^(.*node_modules\/(?:@[^/]+\/)?[^/]+)\//.exec(input.replaceAll('\\', '/'))?.[1] ?? []))
  const sections = [
    await readFile(path.join(pluginRoot, 'THIRD-PARTY-NOTICES.txt'), 'utf8'),
    'Java runtime licenses are in each dist/<host>/runtime/legal directory.\n',
    'Bundled npm package license texts follow.\n',
  ]
  for (const directory of [...directories].map(item => path.resolve(item)).sort()) {
    const manifest = JSON.parse(await readFile(path.join(directory, 'package.json'), 'utf8'))
    const license = (await readdir(directory)).find(name => /^licen[cs]e/i.test(name))
    if (!license) throw new Error(`Review the missing license text for ${manifest.name}@${manifest.version}`)
    sections.push(`\n${manifest.name} ${manifest.version}\nLicense: ${manifest.license}\n\n${await readFile(path.join(directory, license), 'utf8')}`)
  }
  await writeFile(output, sections.join(''))
}

/** Consumers receive the parser and runtime; sbt is used only by maintainers here. */
export async function buildPackage(destination: string): Promise<void> {
  await rm(destination, { recursive: true, force: true })
  await mkdir(destination, { recursive: true })
  await buildWorker(path.join(destination, 'dist/worker.jar'))
  const runtime = path.join(destination, 'dist', `${process.platform}-${process.arch}`, 'runtime')
  await mkdir(path.dirname(runtime), { recursive: true })
  // jdeps --print-module-deps on the assembled parser worker.
  await execute(tool('jlink'), ['--add-modules', 'java.base,jdk.unsupported',
    '--strip-debug', '--no-header-files', '--no-man-pages', '--output', runtime])
  const built = await Bun.build({
    entrypoints: [path.join(pluginRoot, 'src/index.ts')],
    outdir: path.join(destination, 'src'), target: 'bun', format: 'esm', naming: 'index.js', metafile: true,
  })
  if (!built.success) throw new Error(built.logs.join('\n'))
  await writeNotices(Object.keys(built.metafile?.inputs ?? {}), path.join(destination, 'THIRD-PARTY-NOTICES.txt'))
  const manifest = JSON.parse(await readFile(path.join(pluginRoot, 'package.json'), 'utf8'))
  await writeFile(path.join(destination, 'package.json'), `${JSON.stringify({
    name: manifest.name, version: manifest.version, description: manifest.description,
    private: manifest.private, type: 'module', license: 'MIT', os: [process.platform], cpu: [process.arch],
    groma: { scanner: { ...manifest.groma.scanner, entry: './src/index.js' } },
  }, null, 2)}\n`)
  await cp(path.join(pluginRoot, '../../../LICENSE'), path.join(destination, 'LICENSE'))
}

if (import.meta.main) {
  const output = path.join(pluginRoot, 'dist/package')
  await buildPackage(output)
  await cp(path.join(output, 'dist'), path.join(pluginRoot, 'dist'), { recursive: true })
  console.log(output)
}
