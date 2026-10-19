import { expect, test } from 'bun:test'
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { CodeSymbol, HttpEndpointSegment, ScannerPlugin, ScanObservation } from '@groma/scanner'
import { buildPackage } from '../plugins/scanners/kotlin/build.ts'
import { scannerFiles } from '../src/scanner/modules/selection.ts'

const fixture = path.resolve(import.meta.dir, '../test/fixtures/kotlin-source')
const spring = path.resolve(import.meta.dir, '../test/fixtures/kotlin-spring')
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
  // A call in a parameter default runs with the function, as it does with a constructor.
  const hidden = observation.operations!.find(operation => operation.name === 'hidden')!
  expect(observation.invocations!.filter(call => call.source === hidden.id).map(call => call.member)).toEqual(['store'])
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

async function verifyOperationScopes(scanner: ScannerPlugin): Promise<void> {
  const observation = (await scanner.scan(fixture, {}, ['scopes/Calls.kt']))!
  const calls = Object.fromEntries(observation.operations!.map(operation => [operation.name,
    observation.invocations!.filter(call => call.source === operation.id).map(call => call.member).sort(),
  ]))
  expect(calls).toEqual({
    outer: ['defaultValue', 'now', 'prepareObject', 'schedule'], namedLambda: ['directLambda'], namedFunction: ['directFunction'],
  })
}

async function verifyVisibility(scanner: ScannerPlugin): Promise<void> {
  const files = await scanner.readCodeStructure!(fixture, [{ file: 'scopes/Visibility.kt', symbols: [] }], {}, ['scopes/Visibility.kt', 'scopes/Base.kt'])
  expect(files.map(file => file.file)).toEqual(['scopes/Visibility.kt'])
  const members = Object.fromEntries(files[0]!.declarations.filter(declaration => declaration.kind === 'type')
    .map(declaration => [declaration.name, declaration.members.map(member => [member.name, member.visibility])]))
  expect(members.Message).toEqual([['constructor', 'protected'], ['constructor', 'protected']])
  expect(members.State).toEqual([['constructor', 'private']])
  expect(members.Derived).toEqual([['hidden', 'protected'], ['local', 'internal'], ['visible', 'public']])
  expect(members.CrossFile).toEqual([['remote', 'protected']])
  expect(members.Unknown).toEqual([['visible', 'public'], ['local', 'public']])
  expect(members.Ambiguous).toEqual([])
  expect(members.InheritedOverload).toEqual([])
  const observation = (await scanner.scan(fixture, {}, ['scopes/Visibility.kt']))!
  expect(observation.operations!.some(operation => operation.name === 'Unknown.unseen')).toBeTrue()
  expect(observation.files[0]!.symbols!.some(item => item.name === 'Unknown')).toBeTrue()
}

async function verifyEntriesAndEndpoints(scanner: ScannerPlugin): Promise<void> {
  const application = 'src/main/kotlin/shop/Application.kt'
  const controller = 'src/main/kotlin/shop/OrderController.kt'
  const invoices = ['src/main/kotlin/shop/InvoiceApi.kt', 'src/main/kotlin/shop/InvoiceController.kt']
  const observation = (await scanner.scan(spring, {}, [
    'pom.xml', application, controller, ...invoices, 'worker/build.gradle.kts', 'worker/src/main/kotlin/jobs/Job.kt',
  ]))!
  // The nested Gradle unit keeps its own file and declares no entry: its only main is private, which the JVM cannot start.
  expect(observation.entryPoints).toEqual([{ file: application, declaration: application, name: 'Application', files: [application, ...invoices, controller] }])
  expect(observation.diagnostics).toEqual([])
  // Without its build declaration nothing bounds the main's unit, and the scan says why no entry is reported.
  const unbounded = (await scanner.scan(spring, {}, [application]))!
  expect(unbounded.entryPoints).toEqual([])
  expect(unbounded.diagnostics).toMatchObject([{ code: 'kotlin-main-without-build-declaration', file: application }])
  const segment = (part: HttpEndpointSegment) => part.kind === 'literal' ? part.value
    : `${part.kind === 'catch-all' ? '*' : ':'}${part.name}${part.optional ? '?' : ''}${part.constrained ? '!' : ''}`
  const handler = (id: string) => observation.operations!.find(operation => operation.id === id)!.name
  // An unmapped function and a client interface report nothing. A computed route, a route held in a constant and an
  // unreadable method are blockers: the readable prefix, then a constrained optional catch-all.
  expect(observation.httpEndpoints!.map(endpoint => `${endpoint.method} ${handler(endpoint.operation)} /${endpoint.path.map(segment).join('/')}`)).toEqual([
    'GET OrderController.list /api/orders',
    'GET OrderController.find /api/orders/:id',
    'PUT OrderController.replace /api/orders/:id!/lines/:line!',
    'POST OrderController.search /api/orders/search',
    'GET OrderController.search /api/orders/search',
    'DELETE OrderController.remove /api/orders/files/*path?!',
    'POST OrderController.computed /api/orders/**?!',
    '* OrderController.constant /api/orders/**?!',
    '* OrderController.export /api/orders/export/**?!',
    // The class-level mapping is declared by an interface in another file.
    'GET InvoiceController.find /api/invoices/:id',
  ])
}

test.concurrent('packaged Kotlin scanner reads selected source, bounded calls and outlines without a build model', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'groma-kotlin-'))
  try {
    const artifact = path.join(temporary, 'scanner')
    if (process.env.GROMA_TEST_KOTLIN_PACKAGE) await cp(process.env.GROMA_TEST_KOTLIN_PACKAGE, artifact, { recursive: true })
    else await buildPackage(artifact)
    const scanner = (await import(pathToFileURL(path.join(artifact, 'src/index.js')).href)).default as ScannerPlugin
    await scanner.checkReadiness!(fixture, {}, [orders])
    const first = (await scanner.scan!(fixture, {}, [orders]))!
    await verifyEvidence(first)
    expect(await scanner.scan!(fixture, {}, [orders])).toEqual(first)
    await expect(scanner.scan!(fixture, {}, [orders, broken])).rejects.toThrow('Broken.kt')
    await verifyOutline(scanner)
    await verifyOperationScopes(scanner)
    await verifyVisibility(scanner)
    await verifyEntriesAndEndpoints(scanner)

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
    // Gradle writes output to `build/`, yet a package may carry the same name. Test source sets have variants.
    const tool = 'src/main/kotlin/shop/build/Tool.kt'
    for (const file of [tool, 'build/generated/Made.kt', 'src/testDebug/kotlin/A.kt', 'src/androidTestDebug/kotlin/A.kt']) {
      await mkdir(path.dirname(path.join(project, file)), { recursive: true })
      await writeFile(path.join(project, file), 'package shop\n')
    }
    const init = Bun.spawn(['git', 'init', '--quiet', project], { stderr: 'pipe' })
    expect(await init.exited, await new Response(init.stderr).text()).toBe(0)
    const manifest = JSON.parse(await readFile(path.join(artifact, 'package.json'), 'utf8'))
    const selected = await scannerFiles(project, manifest.groma.scanner, false)
    expect(selected).toEqual(['Ship.kt', 'scopes/Base.kt', 'scopes/Calls.kt', 'scopes/Visibility.kt', orders, tool])
    expect(await scanner.listSourceFiles!(project, {}, [...selected, 'build.gradle.kts'])).toEqual(selected)
    const observation = (await scanner.scan!(project, {}, selected))!
    expect(observation.operations!.find(operation => operation.name === 'ship')!.position).toBe(windows.indexOf('fun ship'))
    expect(observation.invocations!.find(call => call.member === 'pack')).toMatchObject({ position: windows.indexOf('pack()'), line: 3 })
  } finally { await rm(temporary, { recursive: true, force: true }) }
}, 120000)
