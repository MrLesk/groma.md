import { expect, test } from 'bun:test'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { ScannerPlugin } from '@groma/scanner'
import { buildPackage } from '../plugins/scanners/dart/build.ts'
import { scannerFiles } from '../src/scanner/modules/selection.ts'

const configured = process.env.GROMA_TEST_DART_PACKAGE
const scannerTest = configured || Bun.which('dart') ? test.concurrent : test.skip

scannerTest('Dart uses selected package language versions consistently for scans and outlines', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'groma-dart-version-'))
  try {
    const artifact = configured ? path.resolve(configured) : path.join(temporary, 'scanner')
    if (!configured) await buildPackage(artifact)
    const scanner = (await import(pathToFileURL(path.join(artifact, 'src/index.js')).href)).default as ScannerPlugin
    const root = path.join(temporary, 'project')
    const file = 'packages/messages/lib/message.dart'
    const pubspec = 'packages/messages/pubspec.yaml'
    await mkdir(path.dirname(path.join(root, file)), { recursive: true })
    const source = '\uFEFF// 😀\r\nclass Message {\r\n  final String value;\r\n  const Message({required final String value}) : value = value;\r\n  void send() { print(value); }\r\n}\r\n'
    await writeFile(path.join(root, file), source)
    await writeFile(path.join(root, 'pubspec.yaml'), 'environment:\n  sdk: ">=3.13.0 <4.0.0"\n')
    await writeFile(path.join(root, pubspec), 'environment:\n  sdk: ^3.11.0\n')
    const selected = ['pubspec.yaml', pubspec, file]
    const observation = (await scanner.scan(root, {}, selected))!
    expect(observation.files.map(item => item.file)).toEqual([file])
    expect(await scanner.listSourceFiles!(root, {}, selected)).toEqual([file])
    expect(observation.operations!.find(operation => operation.name === 'Message'))
      .toMatchObject({ position: source.indexOf('const Message') })
    expect(observation.invocations).toEqual([expect.objectContaining({
      member: 'print', position: source.indexOf('print('), line: 5, unresolved: true, targets: [],
    })])
    const references = [{ file, symbols: ['Message'] }]
    const outline = await scanner.readCodeStructure!(root, references, {}, selected)
    expect(outline[0]!.declarations[0]).toMatchObject({ name: 'Message', line: 2, members: [
      expect.objectContaining({ name: 'Message', line: 4 }), expect.objectContaining({ name: 'send', line: 5 }),
    ] })
    // An unselected nested manifest cannot override the selected parent or the parser default.
    await expect(scanner.scan(root, {}, ['pubspec.yaml', file])).rejects.toThrow(file)
    await expect(scanner.readCodeStructure!(root, references, {}, [file])).rejects.toThrow(file)
    await writeFile(path.join(root, file), `// @dart=3.11\n${source.slice(1)}`)
    expect((await scanner.scan(root, {}, [file]))!.files.map(item => item.file)).toEqual([file])
    await writeFile(path.join(root, file), `// @dart=3.13\n${source.slice(1)}`)
    await expect(scanner.scan(root, {}, selected)).rejects.toThrow(file)
    await writeFile(path.join(root, file), source)
    await writeFile(path.join(root, pubspec), 'environment:\n  sdk: ">=3.11.4 <4.0.0"\n')
    expect(await scanner.scan(root, {}, selected)).toEqual(observation)
    expect(await readFile(path.join(root, file), 'utf8')).toBe(source)
    const init = Bun.spawn(['git', 'init', '--quiet', root], { stderr: 'pipe' })
    expect(await init.exited, await new Response(init.stderr).text()).toBe(0)
    const manifest = JSON.parse(await readFile(path.join(artifact, 'package.json'), 'utf8'))
    expect(await scannerFiles(root, manifest.groma.scanner, false)).toEqual([...selected].sort())
  } finally { await rm(temporary, { recursive: true, force: true }) }
}, 120000)
