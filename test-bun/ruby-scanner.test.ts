import { expect, test } from 'bun:test'
import { cp, mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { ScannerPlugin } from '@groma/scanner'
import { buildPackage } from '../plugins/scanners/ruby/build.ts'
import { scannerFiles } from '../src/scanner/modules/selection.ts'
import { discoverScanners } from '../src/scanner/modules/discovery.ts'
import { officialScannerCatalog } from '../src/scanner/modules/official-catalog.ts'

const fixture = path.resolve(import.meta.dir, '../test/fixtures/ruby-rails')

test.concurrent('packaged Ruby scanner preserves declarations and resolves Rails routes to public local actions', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'groma-ruby-'))
  try {
    const root = path.join(temporary, 'project')
    const artifact = path.join(temporary, 'scanner')
    await cp(fixture, root, { recursive: true })
    const git = Bun.spawn(['git', 'init', '--quiet', root], { stderr: 'pipe' })
    expect(await git.exited, await new Response(git.stderr).text()).toBe(0)
    await buildPackage(artifact)
    const manifest = JSON.parse(await readFile(path.join(artifact, 'package.json'), 'utf8'))
    const scanner = (await import(pathToFileURL(path.join(artifact, manifest.groma.scanner.entry)).href)).default as ScannerPlugin
    const selected = await scannerFiles(root, manifest.groma.scanner)
    expect(selected.sort()).toEqual([
      'Gemfile', 'app/controllers/admin/orders_controller.rb', 'app/controllers/orders_controller.rb',
      'app/models/order.rb', 'config/routes.rb',
    ])
    const listed = await scanner.listSourceFiles!(root, {}, [...selected, 'README.md'])
    expect(listed.sort()).toEqual(selected.filter(file => file.endsWith('.rb')))
    await scanner.checkReadiness!(root, {}, selected)
    const observation = (await scanner.scan(root, {}, selected))!
    expect(await scanner.scan(root, {}, [...selected].reverse())).toEqual(observation)
    expect(observation.files.map(file => file.file)).toEqual(listed)
    const operation = (name: string) => observation.operations!.find(item => item.name === name)!
    const source = await readFile(path.join(root, 'app/models/order.rb'), 'utf8')
    const total = operation('Order#total')
    expect(total.position).toBe(source.indexOf('def total'))
    const calls = observation.invocations!.filter(call => call.source === total.id)
    expect(calls.map(call => call.member)).toEqual(['calculate', 'each'])
    expect(calls[0]).toMatchObject({ position: source.indexOf('calculate'), line: 8 })
    expect(observation.invocations!.every(call => call.unresolved && call.targets.length === 0)).toBeTrue()

    const routeName = (id: string) => observation.operations!.find(item => item.id === id)!.name
    // Unresolved/private routes remain blockers, never resolved handlers.
    const endpoints = observation.httpEndpoints!.filter(endpoint => routeName(endpoint.operation) !== '(module)')
    expect(endpoints.map(endpoint => [endpoint.method, endpoint.path, routeName(endpoint.operation)])).toEqual([
      ['GET', [], 'OrdersController#index'],
      ['GET', [{ kind: 'literal', value: 'orders' }, { kind: 'parameter', name: 'id' }], 'OrdersController#show'],
      ['GET', [{ kind: 'literal', value: 'orders' }], 'OrdersController#index'],
      ['GET', [{ kind: 'literal', value: 'orders' }, { kind: 'parameter', name: 'id' }], 'OrdersController#show'],
      ['GET', [{ kind: 'literal', value: 'admin' }, { kind: 'literal', value: 'orders' }], 'Admin::OrdersController#index'],
    ])
    expect(endpoints.every(endpoint => endpoint.order?.application === 'config/routes.rb')).toBeTrue()
    expect(endpoints.map(endpoint => endpoint.order!.position)).toEqual(
      [...endpoints.map(endpoint => endpoint.order!.position)].sort((a, b) => a - b))

    const outline = await scanner.readCodeStructure!(root, [
      { file: 'app/controllers/orders_controller.rb', symbols: ['OrdersController', 'OrdersController#index'] },
      { file: 'app/models/order.rb', symbols: ['Order#initialize'] },
      { file: 'app/controllers/admin/orders_controller.rb', symbols: ['Admin::OrdersController#index'] },
    ])
    const controller = outline[0]!.declarations.find(item => item.name === 'OrdersController')!
    if (controller.kind !== 'type') throw new Error('Expected a controller type')
    expect(controller.entry).toBeTrue()
    expect(controller.members.map(member => [member.name, member.visibility, member.entry])).toEqual([
      ['index', 'public', true], ['show', 'public', false], ['build', 'public', false],
      ['guarded', 'protected', false], ['secret', 'private', false],
    ])
    const order = outline[1]!.declarations[0]!
    if (order.kind !== 'type') throw new Error('Expected an Order type')
    expect(order.members[0]).toMatchObject({ name: 'initialize', visibility: 'private', entry: true, line: 3 })
    const namespaced = outline[2]!.declarations.find(item => item.name === 'Admin::OrdersController')!
    if (namespaced.kind !== 'type') throw new Error('Expected a namespaced controller')
    expect(namespaced.members[0]).toMatchObject({ name: 'index', entry: true, line: 3 })
    await expect(scanner.scan(root, {}, [...selected, 'spec/broken_spec.rb'])).rejects.toThrow('spec/broken_spec.rb:')
    expect(await readFile(path.join(root, 'app/models/order.rb'), 'utf8')).toBe(source)

    const discovery = await discoverScanners(root, {}, officialScannerCatalog.filter(item => item.id === 'ruby'))
    expect(discovery.findings.some(item => item.technology === 'rails' && item.file === 'config/routes.rb')).toBeTrue()
    expect(discovery.findings.some(item => item.technology === 'ruby')).toBeTrue()
  } finally { await rm(temporary, { recursive: true, force: true }) }
}, 60000)

