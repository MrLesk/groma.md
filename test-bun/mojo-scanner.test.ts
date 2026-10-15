import { expect, test } from 'bun:test'
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { ScannerPlugin } from '@groma/scanner'
import { buildPackage } from '../plugins/scanners/mojo/build.ts'
import { scannerFiles } from '../src/scanner/modules/selection.ts'

const fixture = path.resolve(import.meta.dir, '../test/fixtures/mojo-source')

test.concurrent('packaged Mojo scanner preserves source declarations, call owners and uncertainty', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'groma-mojo-'))
  try {
    const artifact = path.join(temporary, 'scanner')
    await buildPackage(artifact)
    const scanner = (await import(pathToFileURL(path.join(artifact, 'src/index.js')).href)).default as ScannerPlugin
    const manifest = JSON.parse(await readFile(path.join(artifact, 'package.json'), 'utf8'))
    const selected = await scannerFiles(fixture, manifest.groma.scanner)
    expect(selected.sort()).toEqual(['library.🔥', 'main.mojo', 'modern.mojo'])
    await scanner.checkReadiness!(fixture, {}, selected)
    expect(await scanner.listSourceFiles!(fixture, {}, [...selected, 'ignored.txt'])).toEqual(selected)
    const observation = (await scanner.scan(fixture, {}, selected))!
    expect(await scanner.scan(fixture, {}, [...selected].reverse())).toEqual(observation)
    expect(observation.files.map(file => file.file)).toEqual(selected)
    expect(observation.entryPoints).toEqual([{ file: 'main.mojo', declaration: 'main.mojo', name: 'main', files: ['main.mojo'] }])
    const operations = observation.operations!
    expect(operations.some(operation => operation.name === 'Writable.write')).toBeFalse()
    expect(operations.some(operation => operation.name === 'Writable.describe')).toBeTrue()
    const byName = (name: string) => operations.find(operation => operation.name === name)!
    const calls = (name: string) => observation.invocations!.filter(call => call.source === byName(name).id)
    // Nested definitions own their calls; lambdas, defaults and compile-time work do not leak into _run.
    expect(calls('Service._run').map(call => call.member)).toEqual(['write', 'schedule', 'finish'])
    expect(calls('Service._run.nested').map(call => call.member)).toEqual(['nested_work'])
    expect(calls('Service.Nested.hidden').map(call => call.member)).toEqual(['inside_nested_type'])
    expect(calls('main').map(call => call.member)).toEqual(['Service', '_run', 'transform'])
    // Generic parameters and computed indices share bracket syntax; neither is claimed as runtime work.
    expect(calls('parameter_caller').map(call => call.member)).toEqual([
      'consume', 'argument', 'consume_pair', 'argument', 'pop.fence', 'make_items',
    ])
    expect(operations.some(operation => operation.name === 'Reader.read')).toBeTrue()
    expect(operations.some(operation => operation.name === 'Reader.from')).toBeTrue()
    expect(calls('message').map(call => call.member)).toEqual(['format'])
    expect(calls('choose').map(call => call.member)).toEqual(['print'])
    expect(calls('checked').map(call => call.member)).toEqual(['print'])
    expect(observation.invocations!.every(call => call.unresolved && call.targets.length === 0)).toBeTrue()
    const source = await readFile(path.join(fixture, 'main.mojo'), 'utf8')
    expect(byName('Service._run').position).toBe(source.indexOf('def _run'))
    expect(calls('Service._run')[0]).toMatchObject({ line: 21, position: source.indexOf('self.store.write') })
    const files = await scanner.readCodeStructure!(fixture, [{ file: 'main.mojo', symbols: ['Service', '_run', 'quoted name'] }])
    expect(files).toHaveLength(1)
    const declarations = files[0]!.declarations
    expect(declarations.map(item => [item.name, item.line])).toEqual([
      ['Writable', 4], ['Service', 10], ['transform', 38], ['quoted name', 41], ['_helper', 44], ['main', 47],
    ])
    const service = declarations.find(item => item.name === 'Service')!
    expect(service.kind).toBe('type')
    if (service.kind !== 'type') throw new Error('Expected Service type')
    expect(service.members.map(item => [item.name, item.line, item.entry])).toEqual([
      ['__init__', 13, false], ['create', 17, false], ['_run', 20, true],
    ])
    expect(service.entry).toBeTrue()
    expect(service.members.every(item => item.visibility === 'public')).toBeTrue()
    expect(declarations.find(item => item.name === '_helper')!.visibility).toBe('public')
    expect(declarations.find(item => item.name === 'quoted name')!.entry).toBeTrue()
    await expect(scanner.scan(fixture, {}, [...selected, 'tests/broken.mojo'])).rejects.toThrow('tests/broken.mojo:1:')

    const project = path.join(temporary, 'project')
    await cp(fixture, project, { recursive: true })
    const physical = '# 🔥\r\ndef main(argument: Int):\r\n    send(argument)\r\n'
    await writeFile(path.join(project, 'physical.mojo'), physical)
    const second = (await scanner.scan(project, {}, ['physical.mojo']))!
    expect(second.entryPoints).toEqual([])
    expect(second.operations![0]!.position).toBe(physical.indexOf('def main'))
    expect(second.invocations![0]).toMatchObject({ position: physical.indexOf('send'), line: 3 })
    expect(await readFile(path.join(project, 'physical.mojo'), 'utf8')).toBe(physical)
  } finally { await rm(temporary, { recursive: true, force: true }) }
}, 60000)
