import { expect, test } from 'bun:test'
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { CodeFile, ScannerPlugin, ScanObservation } from '@groma/scanner'
import { buildPackage } from '../plugins/scanners/dart/build.ts'
import { scannerFiles } from '../src/scanner/modules/selection.ts'

const fixture = path.resolve(import.meta.dir, '../test/fixtures/dart-source')
const configured = process.env.GROMA_TEST_DART_PACKAGE
const scannerTest = configured || Bun.which('dart') ? test.concurrent : test.skip
const files = ['main.dart', 'src/cart.dart', 'src/not_a_part.dart', 'types.dart']

function verifyCalls(observation: ScanObservation, source: string) {
  const calls = Object.fromEntries(observation.operations!.map(operation => [operation.name,
    observation.invocations!.filter(call => call.source === operation.id).map(call => call.member),
  ]))
  expect(calls.Cart).toEqual(['initial', 'ready'])
  expect(calls['Cart.place']).toEqual(['enqueue', 'save'])
  expect(calls['Cart.create']).toEqual(['Cart'])
  expect(calls['Shop.build']).toEqual(['Button'])
  expect(calls.transform).toEqual(['trim'])
  expect(calls['Text.shout']).toEqual(['toUpperCase'])
  expect(observation.operations!.some(operation => operation.name.includes('caption'))).toBeFalse()
  expect(observation.invocations!.every(call => call.unresolved && call.targets.length === 0)).toBeTrue()
  const main = observation.operations!.find(operation => operation.name === 'main')!
  expect(main.position).toBe(source.indexOf('void main'))
  expect(observation.invocations!.find(call => call.source === main.id && call.member === 'runApp'))
    .toMatchObject({ position: source.indexOf('runApp('), line: 7 })
}

function verifyOutline(outline: CodeFile[]) {
  const main = outline.find(file => file.file === 'main.dart')!
  expect(main.declarations.map(declaration => declaration.name)).toEqual(['main', 'transform', '_save', 'Shop'])
  expect(main.declarations.find(declaration => declaration.name === '_save'))
    .toMatchObject({ visibility: 'private', entry: false, line: 9 })
  const cart = outline.find(file => file.file === 'src/cart.dart')!.declarations[0]!
  expect(cart.kind).toBe('type')
  if (cart.kind !== 'type') throw new Error('Missing Cart outline')
  expect(cart.members.map(member => [member.name, member.visibility, member.entry, member.line])).toEqual([
    ['Cart', 'public', false, 4], ['Cart._empty', 'private', true, 5],
    ['place', 'public', true, 8], ['_reset', 'private', false, 14], ['create', 'public', false, 15],
  ])
  const types = outline.find(file => file.file === 'types.dart')!
  expect(types.declarations.map(declaration => declaration.name)).toEqual(['Store', '_Logging', 'State', 'OrderId'])
  const store = types.declarations[0]!
  expect(store.kind === 'type' && store.members.map(member => member.name)).toEqual(['save'])
}

scannerTest('packaged Dart reads selected source, library parts and caller-owned evidence without project resolution', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'groma-dart-test-'))
  try {
    const artifact = configured ? path.resolve(configured) : path.join(temporary, 'scanner')
    if (!configured) await buildPackage(artifact)
    const scanner = (await import(pathToFileURL(path.join(artifact, 'src/index.js')).href)).default as ScannerPlugin
    const root = path.join(temporary, 'project')
    await cp(fixture, root, { recursive: true })
    const source = await readFile(path.join(root, 'main.dart'), 'utf8')
    const first = (await scanner.scan(root, {}, files))!
    expect(await scanner.listSourceFiles!(root, {}, [...files, 'pubspec.yaml'])).toEqual(files)
    expect(first.files.map(file => file.file)).toEqual(files)
    expect(first.sourceUnits).toEqual([{ primary: 'main.dart', files: ['main.dart', 'src/cart.dart'] }])
    expect(first.entryPoints).toEqual([{ file: 'main.dart', declaration: 'main.dart', name: 'main', files: ['main.dart', 'src/cart.dart'] }])
    expect((await scanner.scan(root, {}, ['main.dart']))!.sourceUnits).toEqual([])
    verifyCalls(first, source)
    verifyOutline(await scanner.readCodeStructure!(root, files.map(file => ({ file, symbols: ['place', 'Cart._empty', 'Cart', 'Shop'] }))))
    expect(await scanner.scan(root, {}, files)).toEqual(first)
    expect(await readFile(path.join(root, 'main.dart'), 'utf8')).toBe(source)
    await writeFile(path.join(root, 'Broken.dart'), 'class {')
    await expect(scanner.scan(root, {}, ['Broken.dart'])).rejects.toThrow('Broken.dart')
    await rm(path.join(root, 'Broken.dart'))
    const physical = '\uFEFF// 😀\r\nvoid send() {\r\n deliver();\r\n}\r\n'
    await writeFile(path.join(root, 'Physical.dart'), physical)
    const positions = (await scanner.scan(root, {}, ['Physical.dart']))!
    expect(positions.operations![0]!.position).toBe(physical.indexOf('void send'))
    expect(positions.invocations![0]).toMatchObject({ position: physical.indexOf('deliver()'), line: 3 })
    expect((await scanner.readCodeStructure!(root, [{ file: 'Physical.dart', symbols: ['send'] }]))[0]!.declarations[0])
      .toMatchObject({ name: 'send', line: 2, visibility: 'public', entry: true })
    const init = Bun.spawn(['git', 'init', '--quiet', root], { stderr: 'pipe' })
    expect(await init.exited, await new Response(init.stderr).text()).toBe(0)
    const manifest = JSON.parse(await readFile(path.join(artifact, 'package.json'), 'utf8'))
    expect(await scannerFiles(root, manifest.groma.scanner, false)).toEqual(['Physical.dart', ...files])
  } finally { await rm(temporary, { recursive: true, force: true }) }
}, 120000)
