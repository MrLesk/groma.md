import { expect, test } from 'bun:test'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import scanner from '../plugins/scanners/ada/src/index.ts'
import manifest from '../plugins/scanners/ada/package.json'
import { scannerFiles } from '../src/scanner/modules/selection.ts'

const fixture = path.resolve(import.meta.dir, '../test/fixtures/ada-source')
const files = ['interface.ads', 'implementation.adb', 'main.adb']

async function project(run: (root: string) => Promise<void>) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'groma-ada-test-'))
  try {
    for (const file of files) await writeFile(path.join(root, file), await readFile(path.join(fixture, `${file}.fixture`)))
    await run(root)
  } finally { await rm(root, { recursive: true, force: true }) }
}

test.concurrent('Ada associates selected package specifications and bodies by declaration, preserving uncertain calls', async () => {
  await project(async root => {
    await writeFile(path.join(root, 'unselected.adb'), 'broken source')
    const observation = (await scanner.scan(root, {}, files))!
    expect(observation.files.map(file => file.file)).toEqual(['implementation.adb', 'interface.ads', 'main.adb'])
    expect(observation.sourceUnits).toEqual([{ primary: 'interface.ads', files: ['implementation.adb', 'interface.ads'] }])
    expect(observation.invocations!.every(call => call.unresolved && call.targets.length === 0)).toBe(true)
    const calls = observation.invocations!.map(call => ({ caller: observation.operations!.find(operation => operation.id === call.source)!.name, member: call.member }))
    expect(calls).toEqual([
      { caller: 'Helper', member: 'Foreign' }, { caller: 'Nested', member: 'Deep_Call' },
      { caller: 'Run', member: 'Helper' }, { caller: 'Run', member: 'Nested' },
      { caller: 'Run', member: 'Hidden' }, { caller: 'Main', member: 'Engine.Run' },
    ])
    const source = await readFile(path.join(root, 'main.adb'), 'utf8')
    expect(observation.operations!.find(operation => operation.name === 'Main')!.position).toBe(source.indexOf('procedure Main'))
    expect(observation.invocations!.find(call => call.member === 'Engine.Run')!.position).toBe(source.indexOf('Engine.Run'))
    expect(await scanner.scan(root, {}, files)).toEqual(observation)
    const subset = (await scanner.scan(root, {}, ['implementation.adb']))!
    expect(subset.sourceUnits).toEqual([])
  })
})

test.concurrent('Ada outlines use selected specifications for body visibility and omit nested callable declarations', async () => {
  await project(async root => {
    const result = await scanner.readCodeStructure(root, [{ file: 'implementation.adb', symbols: ['rUN'] }], {}, files)
    expect(result[0]!.declarations.map(item => [item.name, item.visibility, item.line, item.entry])).toEqual([
      ['Helper', 'private', 2, false], ['Run', 'public', 7, true], ['Value', 'public', 19, false], ['Hidden', 'internal', 20, false],
    ])
    expect(await scanner.readCodeStructure(root, [{ file: 'implementation.adb', symbols: [] }], {})).toEqual([])
    const spec = await scanner.readCodeStructure(root, [{ file: 'interface.ads', symbols: [] }], {}, files)
    expect(spec[0]!.declarations.map(item => [item.name, item.kind, item.visibility])).toEqual([
      ['State', 'type', 'public'], ['Run', 'function', 'public'], ['Value', 'function', 'public'],
      ['State', 'type', 'internal'], ['Hidden', 'function', 'internal'],
    ])
  })
})

test.concurrent('Ada does not choose duplicate build variants or uncertain completion profiles', async () => {
  await project(async root => {
    await writeFile(path.join(root, 'variant.ads'), 'package Engine is procedure Run (Count : Long_Integer); end Engine;')
    const observation = (await scanner.scan(root, {}, [...files, 'variant.ads']))!
    expect(observation.sourceUnits).toEqual([])
    expect(await scanner.readCodeStructure(root, [{ file: 'implementation.adb', symbols: [] }], {}, [...files, 'variant.ads'])).toEqual([])
    const outline = await scanner.readCodeStructure(root, [{ file: 'implementation.adb', symbols: [] }], {}, ['implementation.adb', 'variant.ads'])
    expect(outline[0]!.declarations.some(item => item.name === 'Run')).toBe(false)
  })
})

test.concurrent('Ada reports syntax and preprocessing limits with physical source locations', async () => {
  await project(async root => {
    await writeFile(path.join(root, 'broken.ads'), 'package Broken is procedure ; end Broken;')
    await expect(scanner.scan(root, {}, ['broken.ads'])).rejects.toThrow(/broken.ads:1:/)
    await writeFile(path.join(root, 'conditional.adb'), 'procedure Test is begin\n#if Debug then\nWork;\n#end if;\nend Test;')
    await expect(scanner.scan(root, {}, ['conditional.adb'])).rejects.toThrow(/conditional.adb:2:.*GNAT preprocessing/)
    expect(await scanner.listSourceFiles(root, {}, ['main.adb', 'app.gpr', 'interface.ads', 'README.md'])).toEqual(['interface.ads', 'main.adb'])
  })
})

test.concurrent('Ada outlines nested package body declarations using their selected nested specification', async () => {
  await project(async root => {
    await writeFile(path.join(root, 'outer.ads'), 'package Outer is package Inner is procedure Work; end Inner; end Outer;')
    await writeFile(path.join(root, 'outer.adb'), 'package body Outer is package body Inner is procedure Work is begin null; end Work; end Inner; end Outer;')
    const selected = ['outer.ads', 'outer.adb']
    const result = await scanner.readCodeStructure(root, [{ file: 'outer.adb', symbols: [] }], {}, selected)
    expect(result[0]?.declarations.map(item => [item.name, item.visibility])).toEqual([['Work', 'public']])
  })
})

test.concurrent('Ada default selection preserves source packages named like root cache and output directories', async () => {
  await project(async root => {
    const init = Bun.spawn(['git', 'init', '--quiet', root], { stderr: 'pipe' })
    expect(await init.exited, await new Response(init.stderr).text()).toBe(0)
    for (const file of ['src/alire/cache.ads', 'src/obj/model.ads', 'alire/cache.ads', 'obj/generated.ads']) {
      await mkdir(path.dirname(path.join(root, file)), { recursive: true })
      await writeFile(path.join(root, file), 'package Example is end Example;')
    }
    const selected = await scannerFiles(root, manifest.groma.scanner)
    expect(selected.filter(file => file.includes('/'))).toEqual(['src/alire/cache.ads', 'src/obj/model.ads'])
  })
})


test.concurrent('Ada preserves declarations and source positions around GNAT fixed-lower-bound array types', async () => {
  await project(async root => {
    const source = '-- 📻 Radio buffers\npackage Radio is\n   type TX_RX_Data\n     is array (Payload_Length range 1 .. <>) of UInt8;\n   procedure Send is null;\nend Radio;\n'
    await writeFile(path.join(root, 'radio.ads'), source)
    const observation = (await scanner.scan(root, {}, ['radio.ads']))!
    expect(Object.fromEntries(observation.files[0]!.symbols.map(item => [item.name, item.id]))).toEqual({
      TX_RX_Data: `radio.ads:${source.indexOf('type TX_RX_Data')}`,
      Send: `radio.ads:${source.indexOf('procedure Send')}`,
    })
    const outline = await scanner.readCodeStructure(root, [{ file: 'radio.ads', symbols: [] }], {}, ['radio.ads'])
    expect(outline[0]!.declarations.map(item => [item.name, item.kind, item.visibility, item.line])).toEqual([
      ['TX_RX_Data', 'type', 'public', 3], ['Send', 'function', 'public', 5],
    ])
    expect(await readFile(path.join(root, 'radio.ads'), 'utf8')).toBe(source)
  })
})


test.concurrent('Ada generic subprogram specifications establish public body visibility without exposing formals', async () => {
  await project(async root => {
    await writeFile(path.join(root, 'runner.ads'), 'package Runner is\n   generic\n      with procedure Step;\n   procedure Run;\nend Runner;\n')
    await writeFile(path.join(root, 'runner.adb'), 'package body Runner is\n   procedure Run is\n   begin\n      Step;\n   end Run;\nend Runner;\n')
    const selected = ['runner.ads', 'runner.adb']
    const outline = await scanner.readCodeStructure(root, selected.map(file => ({ file, symbols: [] })), {}, selected)
    expect(outline.map(file => [file.file, file.declarations.map(item => [item.name, item.visibility, item.line])])).toEqual([
      ['runner.ads', [['Run', 'public', 4]]], ['runner.adb', [['Run', 'public', 2]]],
    ])
  })
})
