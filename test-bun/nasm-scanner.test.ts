import { expect, test } from 'bun:test'
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { ScannerPlugin } from '@groma/scanner'
import { buildPackage } from '../plugins/scanners/nasm/build.ts'
import manifest from '../plugins/scanners/nasm/package.json'
import { scannerFiles } from '../src/scanner/modules/selection.ts'

const fixture = path.resolve(import.meta.dir, '../test/fixtures/nasm-source')

test.concurrent('NASM retains macro call-site origins, include scope and uncertain providers in a selected source snapshot', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'groma-nasm-test-'))
  const root = path.join(temporary, 'source')
  const artifact = path.join(temporary, 'scanner')
  try {
    await cp(fixture, root, { recursive: true })
    await buildPackage(artifact)
    const scanner: ScannerPlugin = (await import(pathToFileURL(path.join(artifact, 'src/index.js')).href)).default
    const git = Bun.spawn(['git', 'init', '--quiet', root], { stderr: 'pipe' })
    expect(await git.exited, await new Response(git.stderr).text()).toBe(0)
    await writeFile(path.join(root, 'excluded.asm'), '%error excluded input\n')
    const selected = await scannerFiles(root, { ...manifest.groma.scanner, exclude: ['excluded.asm'] })
    expect(selected).toEqual(['helpers.asm', 'macros.inc', 'main.asm'])
    expect(await scanner.listSourceFiles!(root, {}, selected)).toEqual(selected)
    await scanner.checkReadiness!(root, {}, selected)
    const text = (await readFile(path.join(root, 'main.asm'), 'utf8')).replace('A source', 'A 🚀 source').replaceAll('\n', '\r\n')
    await writeFile(path.join(root, 'main.asm'), text)
    const observation = (await scanner.scan(root, {}, selected))!
    const operations = new Map(observation.operations!.map(operation => [operation.id, operation]))
    expect([...operations.values()].map(operation => operation.name).sort()).toEqual(['helper', 'main', 'main.local'])
    const calls = observation.invocations!.map(call => ({ ...call,
      caller: operations.get(call.source)!.name, providers: call.targets.map(id => operations.get(id)!.name),
    }))
    expect(calls).toHaveLength(4)
    expect(calls.find(call => call.member === 'helper')).toMatchObject({
      caller: 'main', providers: ['helper'], unresolved: false, line: 11, position: text.indexOf('call helper'),
    })
    expect(calls.find(call => call.member === 'main.local')).toMatchObject({ providers: ['main.local'], unresolved: false })
    expect(calls.find(call => call.line === 13)).toMatchObject({ providers: [], unresolved: true })
    expect(calls.find(call => call.member === 'outside')).toMatchObject({
      providers: [], unresolved: true, line: 14, position: text.indexOf('CALL_EXTERNAL'),
    })
    expect(observation.sourceUnits).toBeUndefined()
    expect(observation.entryPoints).toBeUndefined()
    const outline = await scanner.readCodeStructure!(root, [
      { file: 'helpers.asm', symbols: ['helper'] }, { file: 'main.asm', symbols: ['main'] }, { file: 'macros.inc', symbols: [] },
    ], {}, selected)
    expect(outline.map(file => [file.file, file.declarations.map(item => [item.name, item.line, item.visibility, item.entry])])).toEqual([
      ['helpers.asm', [['helper', 4, 'internal', true]]], ['main.asm', [['main', 10, 'public', true]]],
    ])
    expect(operations.get('main.asm:main')!.position).toBe(text.indexOf('ROUTINE main'))
    // The include is still on disk: only the selected snapshot may supply its contents.
    await expect(scanner.scan(root, {}, selected.filter(file => file !== 'helpers.asm'))).rejects.toThrow('helpers.asm')
    await writeFile(path.join(root, 'helpers.asm'), '%error broken include\n')
    await expect(scanner.scan(root, {}, selected)).rejects.toThrow('broken include')
  } finally { await rm(temporary, { recursive: true, force: true }) }
}, 120000)
