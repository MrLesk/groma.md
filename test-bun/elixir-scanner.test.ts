import { expect, test } from 'bun:test'
import { cp, mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { CodeSymbol, ScannerPlugin } from '@groma/scanner'
import { buildPackage } from '../plugins/scanners/elixir/build.ts'
import { loadArchitecture } from '../src/architecture-reader.ts'
import { loadAnnotatedArchitecture, reconcileScanObservations } from '../src/core.ts'
import { readDocument, upsertCode } from '../src/markdown-emitter.ts'
import { addScanner } from '../src/scanner/modules/inventory.ts'
import { scannerFiles } from '../src/scanner/modules/selection.ts'
import { readCodeStructure } from '../src/viewers/source/structure.ts'

const fixtures = path.resolve(import.meta.dir, '../test/fixtures')
const orders = 'apps/shop/lib/shop/orders.ex'
const wire = 'apps/shop/proto/lib/wire.ex'

/** A fresh copy of the fixture as a Git repository with an empty architecture, and the built scanner package. */
async function setup() {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'groma-elixir-'))
  const root = path.join(temporary, 'project'), artifact = path.join(temporary, 'scanner')
  await cp(path.join(fixtures, 'empty-project'), root, { recursive: true })
  await cp(path.join(fixtures, 'elixir-mix'), root, { recursive: true })
  const git = Bun.spawn(['git', 'init', '--quiet', root], { stdout: 'ignore', stderr: 'pipe' })
  expect(await git.exited, await new Response(git.stderr).text()).toBe(0)
  await buildPackage(artifact)
  const manifest = JSON.parse(await readFile(path.join(artifact, 'package.json'), 'utf8'))
  const scanner = (await import(pathToFileURL(path.join(artifact, manifest.groma.scanner.entry)).href)).default as ScannerPlugin
  return { temporary, root, artifact, scanner, selected: await scannerFiles(root, manifest.groma.scanner) }
}

test.concurrent('the Elixir scanner reads only the sources Mix compiles and gives each launched project one entry', async () => {
  const { temporary, root, scanner, selected } = await setup()
  try {
    const sources = [
      'apps/dynamic/src/plugin.ex', 'apps/shop/extra/audit.ex', 'apps/shop/lib/shop/application.ex',
      'apps/shop/lib/shop/cli.ex', orders, wire, 'apps/tool/lib/tool/cli.ex', 'apps/tool/lib/tool/shape.ex',
    ]
    // Selected by the include list but compiled by no project: the umbrella root's lib and a template under priv.
    expect(selected).toEqual(expect.arrayContaining(['lib/stray.ex', 'apps/shop/priv/templates/report.ex']))
    expect(await scanner.listSourceFiles!(root, {}, [...selected, 'README.md'])).toEqual(sources)
    // A listing runs before exclusions, so it names a source in a directory only the test environment compiles.
    const excluded = 'apps/shop/test/support/broken.ex'
    expect(await scanner.listSourceFiles!(root, {}, [...selected, excluded])).toContain(excluded)

    await scanner.checkReadiness!(root, {}, selected)
    const observation = (await scanner.scan(root, {}, selected))!
    expect(await scanner.scan(root, {}, [...selected].reverse())).toEqual(observation)
    expect(observation.files.map(file => file.file)).toEqual(sources)

    const rootOf = (file: string) => observation.roots.find(candidate => candidate.file === file)!
    expect(observation.files.find(file => file.file === orders)!.roots).toEqual([rootOf('apps/shop/mix.exs').id])
    expect(rootOf('apps/shop/mix.exs').parent).toBe(rootOf('mix.exs').id)
    // The shop's source directories reach into the nested proto project, so both projects compile that file.
    expect(observation.files.find(file => file.file === wire)!.roots)
      .toEqual([rootOf('apps/shop/mix.exs').id, rootOf('apps/shop/proto/mix.exs').id])
    // Source directories the scanner cannot read keep every file of that project and say so.
    expect(observation.diagnostics.filter(diagnostic => diagnostic.severity === 'warning').map(diagnostic => diagnostic.file))
      .toEqual(['apps/dynamic/mix.exs'])

    // The shop declares an application callback and an escript: one entry, the callback. The tool has only an escript.
    expect(observation.entryPoints).toEqual([
      { file: 'apps/shop/lib/shop/application.ex', declaration: 'apps/shop/mix.exs', name: 'shop',
        files: sources.filter(file => file.startsWith('apps/shop/')) },
      { file: 'apps/tool/lib/tool/cli.ex', declaration: 'apps/tool/mix.exs', name: 'tool',
        files: sources.filter(file => file.startsWith('apps/tool/')) },
    ])
    await expect(scanner.scan(root, {}, [...selected, excluded])).rejects.toThrow(`${excluded}:`)
  } finally { await rm(temporary, { recursive: true, force: true }) }
}, 60000)

test.concurrent('Elixir functions are one operation per name and arity, and their calls stay unresolved', async () => {
  const { temporary, root, scanner, selected } = await setup()
  try {
    const observation = (await scanner.scan(root, {}, selected))!
    const source = await readFile(path.join(root, orders), 'utf8')
    const named = (name: string) => observation.operations!.filter(operation => operation.name === name)
    // Three clauses, declared at the first one.
    expect(named('Shop.Orders.total/2').map(operation => operation.position)).toEqual([source.indexOf('def total(lines, discount \\\\ 0)')])
    for (const executable of ['Shop.Orders.describe/1', 'Shop.Orders.Line.subtotal/1', 'Shop.Orders.apply_discount/2', 'Tool.Shape.Tool.Square.area/1']) {
      expect(named(executable)).toHaveLength(1)
    }
    // A macro, a guard and a protocol signature are declarations without run-time work.
    for (const declaration of ['Shop.Orders.traced/1', 'Shop.Orders.is_free/1', 'Tool.Shape.area/1']) {
      expect(named(declaration)).toEqual([])
      expect(observation.files.flatMap(file => file.symbols).some(symbol => symbol.name === declaration)).toBeTrue()
    }
    const total = named('Shop.Orders.total/2')[0]!
    const calls = observation.invocations!.filter(call => call.source === total.id)
    // The guard's is_list and the call inside the anonymous function are not calls of total/2.
    expect(calls.map(call => [call.member, call.position])).toEqual([
      ['map', source.indexOf('Enum.map')], ['sum', source.indexOf('Enum.sum')], [undefined, source.indexOf('apply_discount(discount)')],
    ])
    expect(observation.invocations!.every(call => call.unresolved && call.targets.length === 0)).toBeTrue()
  } finally { await rm(temporary, { recursive: true, force: true }) }
}, 60000)

test.concurrent('an Elixir outline lists every module as a type with name/arity members and their visibility', async () => {
  const { temporary, root, scanner } = await setup()
  try {
    const outline = await scanner.readCodeStructure!(root, [
      { file: orders, symbols: ['Shop.Orders.total/2', 'Shop.Orders.Line'] },
      { file: 'apps/tool/lib/tool/shape.ex', symbols: [] },
    ])
    const symbol = ({ name, line, visibility, entry }: CodeSymbol) => [name, line, visibility, entry]
    const rows = outline.map(file => file.declarations.map(declaration => [
      ...symbol(declaration), declaration.kind === 'type' ? declaration.members.map(symbol) : [],
    ]))
    expect(rows).toEqual([
      [
        ['Shop.Orders', 1, 'public', false, [
          ['describe/1', 10, 'public', false], ['total/2', 12, 'public', true], ['traced/1', 23, 'public', false],
          ['is_free/1', 29, 'public', false], ['apply_discount/2', 31, 'private', false],
        ]],
        // A nested module is its own type; naming it marks none of its members.
        ['Shop.Orders.Line', 4, 'public', true, [['subtotal/1', 7, 'public', false]]],
      ],
      [
        ['Tool.Shape', 1, 'public', false, [['area/1', 2, 'public', false]]],
        ['Tool.Square', 5, 'public', false, []],
        ['Tool.Shape.Tool.Square', 8, 'public', false, [['area/1', 9, 'public', false]]],
      ],
    ])
  } finally { await rm(temporary, { recursive: true, force: true }) }
}, 60000)

test.concurrent('a Module.name/arity Code symbol survives a scan through core and marks its outline entry', async () => {
  const { temporary, root, artifact, scanner, selected } = await setup()
  try {
    await addScanner(root, artifact)
    const observation = (await scanner.scan(root, {}, selected))!
    await reconcileScanObservations(root, [observation])
    const link = { scanner: 'elixir', file: orders, symbol: 'Shop.Orders.total/2' }
    const created = (await loadAnnotatedArchitecture(root)).elements.find(element => element.code.some(code => code.file === orders))!
    const document = (await loadArchitecture(root)).documents
      .find(candidate => (candidate.frontmatter.groma as { id?: string }).id === created.id)!
    await upsertCode(root, document.sourceFilename, [link])
    // A rescan keeps a curated symbol only when the scan reports a symbol of exactly that name.
    await reconcileScanObservations(root, [observation])
    expect(await readDocument(root, document.sourceFilename)).toContain('symbol: Shop.Orders.total/2')
    const world = await loadAnnotatedArchitecture(root)
    const owner = world.elements.find(element => element.id === created.id)!
    expect(owner.code.map(({ scanner, file, symbol }) => ({ scanner, file, symbol }))).toEqual([link])
    const [file] = await readCodeStructure(root, world, null, owner.representationId) ?? []
    const members = file!.declarations.flatMap(declaration => declaration.kind === 'type' ? declaration.members : [])
    expect(members.filter(member => member.entry).map(member => member.name)).toEqual(['total/2'])
  } finally { await rm(temporary, { recursive: true, force: true }) }
}, 60000)
