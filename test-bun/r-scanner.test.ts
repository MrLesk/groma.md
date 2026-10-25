import { expect, test } from 'bun:test'
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { ScannerPlugin, ScanObservation } from '@groma/scanner'
import { buildPackage } from '../plugins/scanners/r/build.ts'
import { discoverScanners } from '../src/scanner/modules/discovery.ts'
import { scannerFiles } from '../src/scanner/modules/selection.ts'

const fixture = path.resolve(import.meta.dir, '../test/fixtures/r-source/functions.R')

async function packageScanner(temporary: string): Promise<{ scanner: ScannerPlugin; artifact: string }> {
  const artifact = path.join(temporary, 'scanner')
  await buildPackage(artifact)
  return { scanner: (await import(pathToFileURL(path.join(artifact, 'src/index.js')).href)).default, artifact }
}

test.concurrent('R scans only selected source and outlines direct top-level functions in their source roots', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'groma-r-source-'))
  try {
    const { scanner, artifact } = await packageScanner(temporary)
    const root = path.join(temporary, 'project')
    await mkdir(path.join(root, 'R'), { recursive: true })
    await mkdir(path.join(root, 'tools'), { recursive: true })
    await mkdir(path.join(root, 'tests'), { recursive: true })
    await cp(fixture, path.join(root, 'R/functions.R'))
    await cp(fixture, path.join(root, 'tools/helpers.r'))
    await writeFile(path.join(root, 'DESCRIPTION'), 'Package: orders\n')
    await writeFile(path.join(root, 'tools/DESCRIPTION'), 'Package: orderTools\n')
    await writeFile(path.join(root, 'tests/broken.R'), 'broken <- function(\n')
    await writeFile(path.join(root, 'notes.Rmd'), 'not R source')
    const git = Bun.spawn(['git', 'init', '--quiet', root], { stderr: 'pipe' })
    expect(await git.exited, await new Response(git.stderr).text()).toBe(0)
    const manifest = JSON.parse(await readFile(path.join(artifact, 'package.json'), 'utf8'))
    const files = await scannerFiles(root, manifest.groma.scanner)
    const observation = (await scanner.scan(root, {}, files))!
    expect(observation.files.map(file => file.file)).toEqual(['R/functions.R', 'tools/helpers.r'])
    expect(observation.files[0]!.symbols.map(symbol => symbol.name).sort()).toEqual(['%join%', 'increment', 'ship'])
    const ownership = observation.files.map(file => [file.file,
      observation.roots.find(candidate => candidate.id === file.roots[0])?.name])
    expect(ownership).toEqual([['R/functions.R', 'orders'], ['tools/helpers.r', 'orderTools']])
    expect(observation.roots.find(candidate => candidate.name === 'orderTools')?.parent).toBe('.')
    expect(await scanner.listSourceFiles!(root, {}, files)).toEqual(['R/functions.R', 'tools/helpers.r'])

    const outline = await scanner.readCodeStructure!(root, [{ file: 'R/functions.R', symbols: ['ship'] }])
    expect(outline[0]!.declarations.map(declaration => declaration.name).sort()).toEqual(['%join%', 'increment', 'ship'])
    expect(outline[0]!.declarations.find(declaration => declaration.entry))
      .toMatchObject({ kind: 'function', name: 'ship', line: 3 })
    await expect(scanner.scan(root, {}, [...files, 'tests/broken.R'])).rejects.toThrow('tests/broken.R')
    expect((await discoverScanners(root)).recommendations.some(candidate => candidate.id === 'r')).toBeTrue()
  } finally { await rm(temporary, { recursive: true, force: true }) }
})

test.concurrent('a built R package scans offline without R, installed project dependencies or source execution', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'groma-r-package-'))
  try {
    const { artifact } = await packageScanner(temporary)
    const root = path.join(temporary, 'project')
    const emptyHome = path.join(temporary, 'home')
    await mkdir(root)
    await mkdir(emptyHome)
    await cp(fixture, path.join(root, 'functions.R'))
    const before = await readFile(path.join(root, 'functions.R'), 'utf8')
    const runner = path.join(temporary, 'scan.mjs')
    await writeFile(runner, `
      globalThis.fetch = () => { throw new Error('Scanning used the network') };
      const scanner = (await import(${JSON.stringify(pathToFileURL(path.join(artifact, 'src/index.js')).href)})).default;
      const root = ${JSON.stringify(root)};
      await scanner.checkReadiness(root, {}, ['functions.R']);
      const first = await scanner.scan(root, {}, ['functions.R']);
      const second = await scanner.scan(root, {}, ['functions.R']);
      if (JSON.stringify(first) !== JSON.stringify(second)) throw new Error('Repeated scan differs');
      console.log(JSON.stringify(first));
    `)
    const child = Bun.spawn([process.execPath, runner], {
      cwd: temporary, stdout: 'pipe', stderr: 'pipe',
      env: { PATH: '', HOME: emptyHome, USERPROFILE: emptyHome, SystemRoot: process.env.SystemRoot ?? '' },
    })
    const [output, error, code] = await Promise.all([
      new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited,
    ])
    expect(code, error).toBe(0)
    const observation: ScanObservation = JSON.parse(output)
    expect(observation.files[0]!.symbols.some(symbol => symbol.name === 'ship')).toBeTrue()
    expect(await readFile(path.join(root, 'functions.R'), 'utf8')).toBe(before)
  } finally { await rm(temporary, { recursive: true, force: true }) }
})
