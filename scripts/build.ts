import { copyFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import packageJson from '../package.json' with { type: 'json' }
import { browserRenderer } from '../src/viewers/web/runtime.ts'

const outfile = process.env.GROMA_BUILD_OUTFILE
  ?? process.argv[2]
  ?? path.join('dist', process.platform === 'win32' ? 'groma.exe' : 'groma')
const target = process.env.GROMA_BUILD_TARGET as Bun.Build.CompileTarget | undefined
const executablePath = process.env.GROMA_BUILD_EXECUTABLE_PATH
const aot = process.env.GROMA_BUILD_AOT === '1'
const trim = process.env.GROMA_BUILD_TRIM === '1'
if (aot || trim) {
  const help = Bun.spawnSync([process.execPath, 'build', '--help'])
  for (const flag of [...(aot ? ['--aot'] : []), ...(trim ? ['--trim'] : [])]) {
    if (help.exitCode !== 0 || !help.stdout.toString().includes(`${flag} `)) {
      throw new Error(`The running Bun compiler does not support ${flag}`)
    }
  }
  if (executablePath !== undefined && executablePath !== process.execPath) {
    throw new Error('Experimental builds must embed the running compiler; omit GROMA_BUILD_EXECUTABLE_PATH')
  }
}
if (target !== undefined && executablePath === undefined) {
  throw new Error('Prepare the target runtime with Node.js: node scripts/prepare-bun-runtime.cjs <target>')
}
const dependencyAssets = Object.entries({
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
})
  .filter(([, version]) => !version.startsWith('workspace:'))

function packageAssetName(name: string): string {
  return `groma-package-${encodeURIComponent(name)}`
}

async function prepareCreditAssets(root: string): Promise<string[]> {
  const assets: string[] = []
  for (const [name] of dependencyAssets) {
    const directory = path.join(root, packageAssetName(name))
    await mkdir(directory)
    await copyFile(path.join('node_modules', name, 'package.json'), path.join(directory, 'package.json'))
    for (const license of ['LICENSE', 'LICENSE.md']) {
      try {
        await copyFile(path.join('node_modules', name, license), path.join(directory, 'LICENSE'))
        break
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      }
    }
    assets.push(directory)
  }
  return assets
}

async function prepareRendererAsset(root: string): Promise<string> {
  const renderer = browserRenderer
  const build = await Bun.build({
    entrypoints: [path.resolve(renderer.entry)],
    target: 'browser',
  })
  const directory = path.join(root, renderer.asset)
  await mkdir(directory)
  await writeFile(path.join(directory, 'index.js'), await build.outputs[0]!.text())
  return directory
}

const packedRoot = await mkdtemp(path.join(os.tmpdir(), 'groma-compile-assets-'))
const compile: Bun.CompileBuildOptions = {
  outfile,
  executablePath: executablePath ?? process.execPath,
  assets: [
    ...await prepareCreditAssets(packedRoot),
    await prepareRendererAsset(packedRoot),
    'docs',
  ],
  autoloadDotenv: false,
  autoloadBunfig: false,
  autoloadTsconfig: false,
  // Runtime scanner imports still need their installed dependencies' exports and main entries.
  autoloadPackageJson: true,
  ...(aot ? { aot: true, allowCodeFromDisk: true } : {}),
  // Scanner installation invokes self as Bun; Python's disk-loaded runtime uses node:vm.
  ...(trim ? { trim: { allow: ['cli', 'node-vm'] } } : {}),
  ...(target === undefined ? {} : { target }),
  ...(target?.startsWith('bun-windows-') === true
    ? {
        windows: {
          title: 'Groma',
          publisher: packageJson.author,
          version: packageJson.version,
          description: packageJson.description,
          copyright: `Copyright ${new Date().getFullYear()} ${packageJson.author}`,
        },
      }
    : {}),
}

await mkdir(path.dirname(outfile), { recursive: true })
try {
  await Bun.build({
    entrypoints: ['src/cli.ts', 'src/architecture-findings-worker.ts'],
    target: 'bun',
    format: 'esm',
    compile,
    bytecode: !aot,
    minify: true,
    sourcemap: 'linked',
  })
} finally {
  await rm(packedRoot, { recursive: true, force: true })
}
