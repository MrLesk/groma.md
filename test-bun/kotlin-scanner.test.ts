import { expect, test } from 'bun:test'
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { CodeSymbol, ScannerPlugin, ScanObservation } from '@groma/scanner'
import { buildPackage } from '../plugins/scanners/kotlin/build.ts'
import { scannerFiles } from '../src/scanner/modules/selection.ts'

const fixture = path.resolve(import.meta.dir, '../test/fixtures/kotlin-source')
const orders = 'src/main/kotlin/shop/Orders.kt'
const broken = 'src/test/kotlin/shop/Broken.kt'
const symbol = ({ name, line, visibility, entry }: CodeSymbol) => [name, line, visibility, entry]

async function verifyEvidence(observation: ScanObservation): Promise<void> {
  expect(observation.files.map(file => file.file)).toEqual([orders])
  expect(observation.files[0]!.symbols!.map(item => [item.name, item.kind]).sort()).toEqual([
    ['Orders', 'class'], ['Registry', 'object'], ['Status', 'enum'], ['Store', 'interface'],
    ['hidden', 'function'], ['shout', 'function'], ['transform', 'function'], ['quoted name', 'function'],
  ].sort())
  const text = await readFile(path.join(fixture, orders), 'utf8')
  // Companion functions take the enclosing type; a bodiless interface method and a primary constructor do no work.
  const positions = Object.fromEntries(observation.operations!.map(operation => [operation.name, operation.position]))
  expect(positions).toEqual({
    'Orders.constructor': text.indexOf('constructor()'), 'Orders.place': text.indexOf('fun place'),
    'Orders.audit': text.indexOf('private fun audit'), 'Orders.first': text.indexOf('protected fun first'),
    'Orders.count': text.indexOf('internal fun count'), 'Orders.create': text.indexOf('fun create'),
    'Registry.store': text.indexOf('fun store'), 'Status.label': text.indexOf('fun label'),
    shout: text.indexOf('fun String.shout'), hidden: text.indexOf('private fun hidden'),
    transform: text.indexOf('val transform'), 'quoted name': text.indexOf('fun `quoted name`'),
  })
  const place = observation.operations!.find(operation => operation.name === 'Orders.place')!
  // Both calls of the chain start at its receiver.
  expect(observation.invocations!.filter(call => call.source === place.id).map(call => [call.member, call.position, call.line]).sort())
    .toEqual([['load', text.indexOf('store.load(id)'), 6], ['trim', text.indexOf('store.load(id)'), 6]])
  const create = observation.operations!.find(operation => operation.name === 'Orders.create')!
  expect(observation.invocations!.find(call => call.source === create.id))
    .toMatchObject({ member: 'Orders', position: text.indexOf('Orders()'), line: 11 })
  expect(observation.invocations!.every(call => call.unresolved && call.targets.length === 0)).toBeTrue()
}

async function verifyOutline(scanner: ScannerPlugin): Promise<void> {
  const files = await scanner.readCodeStructure!(fixture, [{ file: orders, symbols: ['Orders', 'place', 'shout'] }])
  expect(files[0]!.declarations.map(declaration => [
    declaration.kind, ...symbol(declaration), declaration.kind === 'type' ? declaration.members.map(symbol) : [],
  ])).toEqual([
    ['type', 'Orders', 4, 'public', true, [
      ['constructor', 4, 'public', false], ['constructor', 5, 'public', false], ['place', 6, 'public', true],
      ['audit', 7, 'private', false], ['first', 8, 'protected', false], ['count', 9, 'internal', false],
      ['create', 11, 'public', false],
    ]],
    ['type', 'Store', 13, 'public', false, [['load', 13, 'public', false]]],
    ['type', 'Registry', 14, 'public', false, [['store', 14, 'public', false]]],
    ['type', 'Status', 15, 'public', false, [['label', 15, 'public', false]]],
    ['function', 'shout', 16, 'public', true, []],
    ['function', 'hidden', 17, 'private', false, []],
    ['function', 'transform', 18, 'public', false, []],
    // A quoted name is outlined as scans report it, without its backticks.
    ['function', 'quoted name', 21, 'public', false, []],
  ])
}

test.concurrent('packaged Kotlin scanner reads selected source, bounded calls and outlines without a build model', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'groma-kotlin-'))
  try {
    const artifact = path.join(temporary, 'scanner')
    await buildPackage(artifact)
    const scanner = (await import(pathToFileURL(path.join(artifact, 'src/index.js')).href)).default as ScannerPlugin
    await scanner.checkReadiness!(fixture, {}, [orders])
    const first = (await scanner.scan!(fixture, {}, [orders]))!
    await verifyEvidence(first)
    expect(await scanner.scan!(fixture, {}, [orders])).toEqual(first)
    await expect(scanner.scan!(fixture, {}, [orders, broken])).rejects.toThrow('Broken.kt')
    await verifyOutline(scanner)

    const project = path.join(temporary, 'project')
    await cp(fixture, project, { recursive: true })
    // Windows checkouts carry CRLF and sometimes a byte order mark; offsets and lines still refer to the file as it is on disk.
    const windows = '\uFEFFpackage shop\r\nfun ship() {\r\n    pack()\r\n}\r\n'
    await writeFile(path.join(project, 'Ship.kt'), windows)
    await writeFile(path.join(project, 'Latin.kt'), Buffer.from([0x2f, 0x2f, 0xe9]))
    await expect(scanner.scan!(project, {}, ['Latin.kt'])).rejects.toThrow('Latin.kt')
    await rm(path.join(project, 'Latin.kt'))
    // Generated code chains thousands of terms; the walk over them must not exhaust the worker's stack.
    await writeFile(path.join(project, 'Deep.kt'), `fun deep() = ${Array(6000).fill('f()').join(' + ')}\n`)
    expect((await scanner.scan!(project, {}, ['Deep.kt']))!.invocations).toHaveLength(6000)
    await rm(path.join(project, 'Deep.kt'))
    // Gradle writes output to `build/`, yet a package may carry the same name.
    const tool = 'src/main/kotlin/shop/build/Tool.kt'
    for (const file of [tool, 'build/generated/Made.kt']) {
      await mkdir(path.dirname(path.join(project, file)), { recursive: true })
      await writeFile(path.join(project, file), 'package shop\n')
    }
    const init = Bun.spawn(['git', 'init', '--quiet', project], { stderr: 'pipe' })
    expect(await init.exited, await new Response(init.stderr).text()).toBe(0)
    const manifest = JSON.parse(await readFile(path.join(artifact, 'package.json'), 'utf8'))
    const selected = await scannerFiles(project, manifest.groma.scanner, false)
    expect(selected).toEqual(['Ship.kt', orders, tool])
    expect(await scanner.listSourceFiles!(project, {}, [...selected, 'build.gradle.kts'])).toEqual(selected)
    const observation = (await scanner.scan!(project, {}, selected))!
    expect(observation.operations!.find(operation => operation.name === 'ship')!.position).toBe(windows.indexOf('fun ship'))
    expect(observation.invocations!.find(call => call.member === 'pack')).toMatchObject({ position: windows.indexOf('pack()'), line: 3 })
  } finally { await rm(temporary, { recursive: true, force: true }) }
}, 120000)
