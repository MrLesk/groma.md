import { expect, test } from 'bun:test'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { ScannerPlugin } from '@groma/scanner'
import { buildPackage } from '../plugins/scanners/ruby/build.ts'
import { scannerFiles } from '../src/scanner/modules/selection.ts'
import { discoverScanners } from '../src/scanner/modules/discovery.ts'
import { officialScannerCatalog } from '../src/scanner/modules/official-catalog.ts'

const fixture = path.resolve(import.meta.dir, '../test/fixtures/ruby-coverage')
const template = 'app/views/items/index.html.erb'

test.concurrent('packaged Ruby scanner reads ERB at template locations and retains Rails membership', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'groma-ruby-erb-'))
  try {
    await buildPackage(directory)
    const manifest = JSON.parse(await readFile(path.join(directory, 'package.json'), 'utf8'))
    const scanner = (await import(pathToFileURL(path.join(directory, 'src/index.js')).href)).default as ScannerPlugin
    const selected = await scannerFiles(fixture, manifest.groma.scanner)
    expect(selected).toContain(template)
    expect(await scanner.listSourceFiles!(fixture, {}, [template])).toEqual([template])
    await scanner.checkReadiness!(fixture, {}, [template])
    const discovery = await discoverScanners(fixture, {}, officialScannerCatalog.filter(scanner => scanner.id === 'ruby'))
    expect(discovery.findings.some(finding => finding.file === template && finding.technology === 'ruby')).toBeTrue()
    const observation = (await scanner.scan(fixture, {}, selected))!
    const source = await readFile(path.join(fixture, template), 'utf8')
    const file = observation.files.find(file => file.file === template)!
    const project = observation.roots.find(root => root.file === 'tool.gemspec')!
    expect(file.roots).toEqual([project.id])
    expect(file.symbols?.map(symbol => symbol.name)).toEqual(['heading'])
    const operation = observation.operations!.find(operation => operation.file === template)!
    expect(operation.position).toBe(source.indexOf('def heading'))
    expect(operation.tokens).toBeUndefined()
    const title = observation.invocations!.find(call => call.source === operation.id && call.member === 'title')!
    expect(title).toMatchObject({ position: source.indexOf('title(items)'), line: 7, unresolved: true, targets: [] })
    const outline = await scanner.readCodeStructure!(fixture, [{ file: template, symbols: [] }])
    expect(outline[0]!.declarations).toMatchObject([{ name: 'heading', line: 5, kind: 'function' }])
    expect(observation.entryPoints!.find(entry => entry.file === 'config.ru')!.files).toContain(template)
    expect(observation.entryPoints!.some(entry => entry.file === template)).toBeFalse()
    expect(await scanner.scan(fixture, {}, [...selected].reverse())).toEqual(observation)
    expect(await readFile(path.join(fixture, template), 'utf8')).toBe(source)
  } finally { await rm(directory, { recursive: true, force: true }) }
}, 60000)
