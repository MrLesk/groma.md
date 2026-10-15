import { execFile } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { promisify } from 'node:util'

const execute = promisify(execFile)
const root = fileURLToPath(new URL('./', import.meta.url))
const sdkVersion = '3.13.5'

/** Build only: the native executable embeds analyzer and a Dart runtime, so scans need neither SDK nor dependencies. */
export async function buildPackage(destination: string): Promise<void> {
  const executable = Bun.which('dart')
  if (!executable) throw new Error(`Building the Dart scanner requires Dart SDK ${sdkVersion} on PATH.`)
  const dart = await realpath(executable)
  const version = (await execute(dart, ['--version'])).stdout
  if (!version.includes(`version: ${sdkVersion} `)) throw new Error(`Dart scanner build requires SDK ${sdkVersion}; found ${version.trim()}`)
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'groma-dart-build-'))
  try {
    await cp(path.join(root, 'worker'), temporary, { recursive: true, filter: source => path.basename(source) !== '.dart_tool' })
    await execute(dart, ['pub', 'get', '--enforce-lockfile'], { cwd: temporary })
    await execute(dart, ['analyze', '--fatal-infos'], { cwd: temporary })
    const assets = path.join(destination, 'dist', `${process.platform}-${process.arch}`)
    await mkdir(assets, { recursive: true })
    await execute(dart, ['compile', 'exe', 'bin/main.dart', '-o', path.join(assets, process.platform === 'win32' ? 'worker.exe' : 'worker')], { cwd: temporary })
    const bundle = await Bun.build({ entrypoints: [path.join(root, 'src/index.ts')], outdir: path.join(destination, 'src'),
      target: 'bun', format: 'esm', naming: 'index.js' })
    if (!bundle.success) throw new AggregateError(bundle.logs, 'Dart adapter build failed')
    const { dependencies: _, ...manifest } = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'))
    await writeFile(path.join(destination, 'package.json'), `${JSON.stringify({ ...manifest,
      os: [process.platform], cpu: [process.arch],
      repository: { type: 'git', url: 'https://github.com/MrLesk/groma.md.git', directory: 'plugins/scanners/dart' },
      publishConfig: { access: 'public' }, files: ['src', 'dist', 'LICENSE', 'THIRD-PARTY-NOTICES.txt', 'README.md'],
      groma: { scanner: { ...manifest.groma.scanner, entry: './src/index.js' } },
    }, null, 2)}\n`)
    await cp(path.join(root, '../../../LICENSE'), path.join(destination, 'LICENSE'))
    await cp(path.join(root, '../../../docs/scanners/dart/index.md'), path.join(destination, 'README.md'))
    await notices(temporary, dart, destination)
  } finally { await rm(temporary, { recursive: true, force: true }) }
}

/** Keep the exact licenses of the SDK and locked parser dependencies with every binary distribution. */
async function notices(temporary: string, dart: string, destination: string): Promise<void> {
  const config = path.join(temporary, '.dart_tool/package_config.json')
  const value = JSON.parse(await readFile(config, 'utf8'))
  const texts = [`Dart SDK ${sdkVersion}\n${await readFile(path.resolve(dart, '../../LICENSE'), 'utf8')}`]
  for (const dependency of value.packages as { name: string; rootUri: string }[]) {
    if (dependency.name === 'groma_dart_worker') continue
    const directory = fileURLToPath(new URL(dependency.rootUri, pathToFileURL(config)))
    texts.push(`${dependency.name}\n${await readFile(path.join(directory, 'LICENSE'), 'utf8')}`)
  }
  await writeFile(path.join(destination, 'THIRD-PARTY-NOTICES.txt'), texts.join('\n\n'))
}

if (import.meta.main) {
  const destination = path.resolve(process.argv[2] ?? path.join(root, 'dist/package'))
  await buildPackage(destination)
  await cp(path.join(destination, 'dist'), path.join(root, 'dist'), { recursive: true })
  console.log(destination)
}
