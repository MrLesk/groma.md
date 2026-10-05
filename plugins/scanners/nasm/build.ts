import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execute = promisify(execFile)
const root = fileURLToPath(new URL('./', import.meta.url))
const version = '3.02'
const hash = '87336eba53b4acfe917424ab5d500d2b0054d9f5148d35c2273ccf2cfb712f0d'
const executable = process.platform === 'win32' ? 'nasm.exe' : 'nasm'

async function archive(): Promise<string> {
  const file = path.join(root, `dist/nasm-${version}.tar.xz`)
  await mkdir(path.dirname(file), { recursive: true })
  if (!existsSync(file)) {
    const response = await fetch(`https://www.nasm.us/pub/nasm/releasebuilds/${version}/nasm-${version}.tar.xz`)
    if (!response.ok) throw new Error(`NASM download failed: ${response.status}`)
    await writeFile(file, new Uint8Array(await response.arrayBuffer()))
  }
  if (createHash('sha256').update(await readFile(file)).digest('hex') !== hash) {
    throw new Error('Unexpected NASM source archive checksum')
  }
  return file
}

async function compile(directory: string): Promise<void> {
  const options = { cwd: directory, maxBuffer: 16 * 1024 * 1024 }
  if (process.platform === 'win32') {
    const vswhere = path.join(process.env['ProgramFiles(x86)']!, 'Microsoft Visual Studio/Installer/vswhere.exe')
    const { stdout } = await execute(vswhere, ['-latest', '-products', '*', '-property', 'installationPath'])
    const setup = path.join(stdout.trim(), 'Common7/Tools/VsDevCmd.bat')
    const arch = process.arch === 'arm64' ? 'arm64' : 'amd64'
    await writeFile(path.join(directory, 'build-nasm.cmd'),
      `@call "${setup}" -arch=${arch} -host_arch=${arch}\r\n@if errorlevel 1 exit /b %errorlevel%\r\n@nmake /f Mkfiles/msvc.mak nasm.exe\r\n`)
    await execute('cmd.exe', ['/d', '/c', 'build-nasm.cmd'], options)
  } else {
    await execute('./configure', ['--disable-debug'], options)
    await execute('make', ['-j4', 'nasm'], options)
  }
}

/** Maintainer-only build: consumers receive a source preprocessor, never run a project build. */
export async function buildPackage(destination: string): Promise<void> {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'groma-nasm-build-'))
  try {
    // Git Bash tar interprets a Windows drive prefix as a remote archive host.
    const tar = process.platform === 'win32' ? path.join(process.env.SystemRoot!, 'System32/tar.exe') : 'tar'
    await execute(tar, ['-xf', await archive(), '-C', temporary])
    const source = path.join(temporary, `nasm-${version}`)
    const main = path.join(source, 'asm/nasm.c')
    const original = await readFile(main, 'utf8')
    const needle = 'struct src_location where = src_where();'
    if (original.split(needle).length !== 2) throw new Error('NASM preprocessing location patch no longer applies')
    // NASM normally emits macro-definition locations. Groma needs the outer invocation's physical source.
    await writeFile(main, original.replace(needle, 'struct src_location where = src_where_top();'))
    await compile(source)
    const dist = path.join(destination, 'dist', `${process.platform}-${process.arch}`)
    await mkdir(dist, { recursive: true })
    await cp(path.join(source, executable), path.join(dist, executable))
    const built = await Bun.build({ entrypoints: [path.join(root, 'src/index.ts')], outdir: path.join(destination, 'src'),
      target: 'bun', format: 'esm', naming: 'index.js' })
    if (!built.success) throw new Error(built.logs.join('\n'))
    const { dependencies: _, ...manifest } = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'))
    await writeFile(path.join(destination, 'package.json'), `${JSON.stringify({ ...manifest,
      os: [process.platform], cpu: [process.arch],
      groma: { scanner: { ...manifest.groma.scanner, entry: './src/index.js' } },
    }, null, 2)}\n`)
    await cp(path.join(root, '../../../LICENSE'), path.join(destination, 'LICENSE'))
    await cp(path.join(source, 'LICENSE'), path.join(destination, 'NASM-LICENSE'))
    await cp(path.join(root, 'THIRD-PARTY-NOTICES.txt'), path.join(destination, 'THIRD-PARTY-NOTICES.txt'))
  } finally { await rm(temporary, { recursive: true, force: true }) }
}

if (import.meta.main) {
  const output = path.resolve(process.argv[2] ?? path.join(root, 'dist/package'))
  await buildPackage(output)
  await cp(path.join(output, 'dist'), path.join(root, 'dist'), { recursive: true })
  console.log(output)
}
