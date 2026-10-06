import { expect, test } from 'bun:test'
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { CodeSymbol, CodeType, ScannerPlugin, ScanObservation } from '@groma/scanner'
import { buildPackage } from '../plugins/scanners/scala/build.ts'
import { scannerFiles } from '../src/scanner/modules/selection.ts'

const fixtures = path.resolve(import.meta.dir, '../test/fixtures')
const symbol = ({ name, line, visibility, entry }: CodeSymbol) => [name, line, visibility, entry]

function verifyInventory(observation: ScanObservation): void {
  const inventory = observation.files.find(file => file.file === 'Inventory.scala')!
  expect(inventory.symbols!.map(item => [item.name, item.kind]).sort()).toEqual([
    ['Nested', 'class'], ['ShopCase', 'class'], ['ShopClass', 'class'], ['ShopEnum', 'enum'],
    ['ShopObject', 'object'], ['ShopTrait', 'trait'], ['ship', 'def'],
  ].sort())
  expect(observation.files.find(file => file.file === 'PackageObject.scala')!.symbols!.map(item => item.name)).toEqual(['route'])
  expect(observation.operations!.filter(operation => operation.file === 'Operations.scala').map(operation => operation.name).sort())
    .toEqual(['Demo.helper', 'Demo.noop', 'Worker.fn', 'Worker.ord', 'Worker.run', 'Worker.this'])
  expect(observation.operations!.some(operation => operation.file === 'Indent.scala' && operation.name === 'Orders.place')).toBeTrue()
}

async function verifyCalls(observation: ScanObservation, root: string): Promise<void> {
  const operation = observation.operations!.find(item => item.file === 'Rules.scala' && item.name === 'check.place')!
  const text = await readFile(path.join(root, 'Rules.scala'), 'utf8')
  expect(operation.position).toBe(text.indexOf('def place'))
  const shadowed = observation.invocations!.find(call => call.source === operation.id && call.member === 'price')!
  expect(shadowed).toMatchObject({ position: text.lastIndexOf('price()'), line: 5, targets: [], unresolved: true })
  for (const [file, member] of [['Calls.scala', 'price'], ['DuplicatePrice.scala', 'price'],
    ['Selection.scala', 'price'], ['api/Calls.scala', 'price'], ['ApplyInfix.scala', 'Box'], ['ApplyInfix.scala', '+']]) {
    const callers = new Set(observation.operations!.filter(item => item.file === file).map(item => item.id))
    expect(observation.invocations!.some(call => callers.has(call.source) && call.member === member && call.unresolved)).toBeTrue()
  }
  expect(observation.invocations!.every(call => call.unresolved && call.targets.length === 0)).toBeTrue()
}

async function verifyOutline(scanner: ScannerPlugin): Promise<void> {
  const files = await scanner.readCodeStructure!(path.join(fixtures, 'scala-outline'), [{ file: 'Orders.scala', symbols: ['Orders', 'place'] }])
  expect(files[0]!.declarations.map(declaration => [
    declaration.kind, ...symbol(declaration), declaration.kind === 'type' ? declaration.members.map(symbol) : [],
  ])).toEqual([
    ['type', 'Orders', 3, 'public', true, [
      ['Orders', 3, 'public', false], ['place', 4, 'public', true], ['audit', 5, 'private', false],
      ['first', 6, 'protected', false], ['count', 7, 'internal', false],
    ]],
    ['type', 'Receipt', 11, 'public', false, [
      ['Receipt', 11, 'public', false], ['this', 12, 'public', false], ['this', 13, 'public', false],
    ]],
    ['type', 'Status', 15, 'public', false, [['label', 17, 'public', false]]],
    ['function', 'ship', 19, 'public', false, []],
  ])
  const rules = await scanner.readCodeStructure!(path.join(fixtures, 'scala-parse'), [{ file: 'Rules.scala', symbols: [] }])
  expect(rules[0]!.declarations.map(item => [item.kind, item.name])).toEqual([
    ['type', 'check'], ['type', 'Store'], ['function', 'transform'],
  ])
  const store = rules[0]!.declarations.find(item => item.name === 'Store')! as CodeType
  expect(store.members.map(item => [item.name, item.line])).toEqual([['load', 7]])
}

test.concurrent('packaged Scala scanner reads selected source, bounded calls and outlines without an sbt model', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'groma-scala-'))
  try {
    const artifact = path.join(temporary, 'scanner')
    await buildPackage(artifact)
    const scanner = (await import(pathToFileURL(path.join(artifact, 'src/index.js')).href)).default as ScannerPlugin
    const root = path.join(fixtures, 'scala-parse')
    const files = ['Inventory.scala', 'PackageObject.scala', 'Indent.scala', 'Operations.scala', 'Rules.scala',
      'Calls.scala', 'DuplicatePrice.scala', 'Selection.scala', 'api/Calls.scala', 'api/Pricing.scala', 'ApplyInfix.scala']
    await scanner.checkReadiness!(root, {}, files)
    const first = (await scanner.scan!(root, {}, files))!
    verifyInventory(first)
    await verifyCalls(first, root)
    expect(await scanner.scan!(root, {}, files)).toEqual(first)
    await expect(scanner.scan!(root, {}, ['Ok.scala', 'Broken.scala'])).rejects.toThrow('Broken.scala')
    await verifyOutline(scanner)

    const project = path.join(temporary, 'project')
    await cp(path.join(fixtures, 'scala-sbt-custom-root'), project, { recursive: true })
    await mkdir(path.join(project, 'src/test'), { recursive: true })
    await cp(path.join(root, 'Broken.scala'), path.join(project, 'src/test/Broken.scala'))
    await writeFile(path.join(project, 'build.sbt'), 'sys.error("Scanning must never evaluate this build")\n')
    const init = Bun.spawn(['git', 'init', '--quiet', project], { stderr: 'pipe' })
    expect(await init.exited, await new Response(init.stderr).text()).toBe(0)
    const manifest = JSON.parse(await readFile(path.join(artifact, 'package.json'), 'utf8'))
    const selected = await scannerFiles(project, manifest.groma.scanner, false)
    expect(selected).toEqual(['modules/Api.scala'])
    expect(await scanner.listSourceFiles!(project, {}, [...selected, 'build.sbt'])).toEqual(selected)
    expect((await scanner.scan!(project, {}, selected))!.files.map(file => file.file)).toEqual(selected)
  } finally { await rm(temporary, { recursive: true, force: true }) }
}, 120000)
