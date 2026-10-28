import { expect, test } from 'bun:test'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { ScannerPlugin } from '@groma/scanner'
import { buildPackage } from '../plugins/scanners/ruby/build.ts'
import { scannerFiles } from '../src/scanner/modules/selection.ts'
import { prepareArchitectureFindings } from '../src/architecture-findings.ts'

const fixture = path.resolve(import.meta.dir, '../test/fixtures/ruby-coverage')

async function packaged(run: (scanner: ScannerPlugin, selected: string[]) => Promise<void>) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'groma-ruby-coverage-'))
  try {
    await buildPackage(directory)
    const scanner = (await import(pathToFileURL(path.join(directory, 'src/index.js')).href)).default as ScannerPlugin
    const manifest = JSON.parse(await readFile(path.join(directory, 'package.json'), 'utf8'))
    await run(scanner, await scannerFiles(fixture, manifest.groma.scanner))
  } finally { await rm(directory, { recursive: true, force: true }) }
}

test.concurrent('Ruby project roots and explicit entries retain their own local source units', async () => {
  await packaged(async (scanner, selected) => {
    const observation = (await scanner.scan(fixture, {}, selected))!
    const library = observation.roots.find(root => root.file === 'a/Gemfile')!
    const project = observation.roots.find(root => root.name === 'example-tool')!
    expect(library.parent).toBe(project.id)
    expect(observation.files.find(file => file.file === 'a/shared.rb')!.roots).toEqual([library.id])
    const entries = observation.entryPoints!
    const command = entries.find(entry => entry.file === 'exe/inspect')!
    expect(command.declaration).toBe('tool.gemspec')
    expect(command.files).toEqual(['exe/inspect', 'lib/command.rb'])
    expect(entries.find(entry => entry.file === 'run.rb')!.files).toEqual(['lib/command.rb', 'run.rb'])
    const rack = entries.find(entry => entry.file === 'config.ru')!
    expect(rack.files).toContain('config/application.rb')
    expect(rack.files).toContain('app/controllers/items_controller.rb')
    expect(rack.files).toContain('config/routes.rb')
    expect(rack.files).not.toContain('a/shared.rb')
    expect(rack.files).not.toContain('compared.rb')
  })
}, 60000)

test.concurrent('Ruby compared method bodies normalize bindings while retaining semantic differences', async () => {
  await packaged(async (scanner, selected) => {
    const observation = (await scanner.scan(fixture, {}, selected))!
    const operation = (name: string) => observation.operations!.find(operation => operation.name === name)!
    const first = operation('Calculations#first')
    expect(first.tokens!.length).toBeGreaterThanOrEqual(8)
    expect(first.tokens).toEqual(operation('Calculations#second').tokens)
    expect(first.tokens).not.toEqual(operation('Calculations#different').tokens)
    expect(operation('Calculations#block_first').tokens).not.toEqual(operation('Calculations#block_second').tokens)
    expect(operation('Calculations#block_first').tokens).toEqual(operation('Calculations#block_same').tokens)
    expect([first.startLine, first.endLine]).toEqual([2, 5])
    expect(operation('(factory)#convert').tokens!.length).toBeGreaterThanOrEqual(8)
    const constructed = await scanner.readCodeStructure!(fixture, [{ file: 'constructed.rb', symbols: ['transform'] }])
    expect(constructed[0]!.declarations.map(declaration => [declaration.kind, declaration.name, declaration.entry]))
      .toEqual([['function', 'transform', true]])
    expect(observation.operations!.some(operation => operation.name === 'transform')).toBeFalse()
    const comparison = prepareArchitectureFindings([observation])
    try {
      const findings = await comparison.complete(new Map(observation.files.map(file => [file.file, file.file])))
      expect(findings.some(finding => finding.instances.some(instance => instance.name === 'Calculations#first') &&
        finding.instances.some(instance => instance.name === 'Calculations#second'))).toBeTrue()
    } finally { await comparison.close() }
  })
}, 60000)

