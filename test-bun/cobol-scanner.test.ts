import { expect, test } from 'bun:test'
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { ScannerPlugin } from '@groma/scanner'
import { buildPackage } from '../plugins/scanners/cobol/build.ts'
import manifest from '../plugins/scanners/cobol/package.json'
import { scannerFiles } from '../src/scanner/modules/selection.ts'

const fixture = path.resolve(import.meta.dir, '../test/fixtures/cobol-source')

async function setup() {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'groma-cobol-test-'))
  const root = path.join(temporary, 'source')
  const artifact = path.join(temporary, 'scanner')
  try {
    await cp(fixture, root, { recursive: true })
    await buildPackage(artifact)
    const scanner: ScannerPlugin = (await import(pathToFileURL(path.join(artifact, 'src/index.js')).href)).default
    return { temporary, root, scanner }
  } catch (error) { await rm(temporary, { recursive: true, force: true }); throw error }
}

test.concurrent('COBOL keeps original program locations, declaration candidates and uncertain dynamic calls across COPY', async () => {
  const { temporary, root, scanner } = await setup()
  try {
    const git = Bun.spawn(['git', 'init', '--quiet', root], { stderr: 'pipe' })
    expect(await git.exited, await new Response(git.stderr).text()).toBe(0)
    await writeFile(path.join(root, 'excluded.cbl'), '       INVALID COBOL\n')
    const selected = await scannerFiles(root, { ...manifest.groma.scanner, exclude: ['excluded.cbl'] })
    expect(selected.sort()).toEqual(['Fields.CPY', 'caller.cbl', 'providers.cob'])
    expect(await scanner.listSourceFiles!(root, {}, selected)).toEqual(selected)
    await scanner.checkReadiness!(root, {}, selected)
    const original = await readFile(path.join(root, 'caller.cbl'), 'utf8')
    const source = original.replace('A comment', 'A 🚀 comment').replace(/\r?\n/g, '\r\n')
    await writeFile(path.join(root, 'caller.cbl'), source)
    const observation = (await scanner.scan(root, {}, selected))!
    const operations = new Map(observation.operations!.map(operation => [operation.id, operation]))
    const calls = observation.invocations!.map(call => ({ ...call,
      caller: operations.get(call.source)!.name, providers: call.targets.map(target => operations.get(target)!.name),
    }))
    expect(calls).toHaveLength(4)
    expect(calls.find(call => call.caller === 'MAIN' && call.member === 'WORKER')).toMatchObject({
      providers: ['WORKER'], unresolved: true, line: 10, position: source.indexOf("CALL 'WORKER'"),
    })
    expect(calls.find(call => call.line === 11)).toMatchObject({ providers: [], unresolved: true })
    expect(calls.find(call => call.member === 'MISSING')).toMatchObject({ providers: [], unresolved: true })
    expect(observation.diagnostics.filter(item => item.severity === 'warning')).toEqual([])
    expect(observation.sourceUnits).toBeUndefined()
    expect(observation.entryPoints).toBeUndefined()
    expect(observation.files.find(file => file.file === 'Fields.CPY')!.symbols).toEqual([])
    expect(await scanner.scan(root, {}, selected)).toEqual(observation)

    const outlines = await scanner.readCodeStructure!(root, [
      { file: 'caller.cbl', symbols: ['MAIN'] }, { file: 'providers.cob', symbols: ['WORKER'] }, { file: 'Fields.CPY', symbols: [] },
    ])
    expect(outlines.map(file => [file.file, file.declarations.map(item => [item.kind, item.name, item.line, item.entry])])).toEqual([
      ['caller.cbl', [['program', 'MAIN', 4, true]]],
      ['providers.cob', [['program', 'WORKER', 2, true], ['program', 'SECOND', 10, false]]],
    ])
    expect(observation.operations!.find(operation => operation.name === 'MAIN')!.position).toBe(source.indexOf('MAIN.'))

    // Excluded copybooks cannot be read as hidden context, even when they exist on disk.
    const missing = (await scanner.scan(root, {}, selected.filter(file => file !== 'Fields.CPY')))!
    expect(missing.diagnostics.some(item => item.code === 'missing copybook')).toBeTrue()
    expect(await scanner.scan(root, {}, selected)).toEqual(observation)
    await writeFile(path.join(root, 'Fields.CPY'), '       01 OLD-NAME PIC ???.\n')
    await expect(scanner.scan(root, {}, selected)).rejects.toThrow('Fields.CPY')
    await writeFile(path.join(root, 'Fields.CPY'), await readFile(path.join(fixture, 'Fields.CPY'), 'utf8'))
    await writeFile(path.join(root, 'caller.cbl'), source.replace("CALL 'WORKER'", 'MOVE TO'))
    await expect(scanner.scan(root, {}, selected)).rejects.toThrow('caller.cbl:10')
  } finally { await rm(temporary, { recursive: true, force: true }) }
}, 120000)
