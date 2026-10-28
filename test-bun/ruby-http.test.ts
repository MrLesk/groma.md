import { expect, test } from 'bun:test'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { ScannerPlugin } from '@groma/scanner'
import { buildPackage } from '../plugins/scanners/ruby/build.ts'
import { scannerFiles } from '../src/scanner/modules/selection.ts'
import { httpRelationships } from '../src/http-relationships.ts'

const fixture = path.resolve(import.meta.dir, '../test/fixtures/ruby-coverage')

test.concurrent('Ruby HTTP clients preserve request methods, configured paths, session bases and uncertainty', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'groma-ruby-http-'))
  try {
    await buildPackage(directory)
    const scanner = (await import(pathToFileURL(path.join(directory, 'src/index.js')).href)).default as ScannerPlugin
    const manifest = JSON.parse(await readFile(path.join(directory, 'package.json'), 'utf8'))
    const observation = (await scanner.scan(fixture, {}, await scannerFiles(fixture, manifest.groma.scanner)))!
    const names = new Map(observation.operations!.map(operation => [operation.id, operation.name]))
    const requests = observation.httpRequests!
    const from = (name: string) => requests.filter(request => names.get(request.operation) === name)
    expect(from('Client#one')).toMatchObject([{ method: 'GET', configured: true,
      path: [{ kind: 'literal', value: 'items' }, { kind: 'dynamic' }] }])
    expect(from('Client#create')).toMatchObject([{ method: 'POST', path: [{ kind: 'literal', value: 'items' }] }])
    expect(from('Client#external')[0]!.path[0]).toEqual({ kind: 'unknown' })
    expect(from('Client#session')).toMatchObject([{ method: 'GET', configured: true, path: [{ kind: 'literal', value: 'items' }] }])
    expect(from('Client#stream')).toMatchObject([{ method: 'GET', configured: true,
      path: [{ kind: 'literal', value: 'items' }, { kind: 'dynamic' }] }])
    expect(from('Client#remove')[0]!.method).toBe('DELETE')
    expect(from('Client#shadowed')).toEqual([])
    expect(from('Client#shadowed_path')[0]!.path).toEqual([{ kind: 'unknown' }])
    expect(from('Outer#unproven')).toEqual([])
    const owners = new Map(observation.files.map(file => [file.file, file.file]))
    const rows = httpRelationships([observation], owners)
    expect(rows.some(row => row.source === 'clients.rb' && row.target === 'app/controllers/items_controller.rb')).toBeTrue()
  } finally { await rm(directory, { recursive: true, force: true }) }
}, 60000)

test.concurrent('an earlier unreadable Rails mount prevents a false relationship to a later handler', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'groma-ruby-blocked-'))
  try {
    const root = path.resolve(import.meta.dir, '../test/fixtures/ruby-http-blocked')
    await buildPackage(directory)
    const scanner = (await import(pathToFileURL(path.join(directory, 'src/index.js')).href)).default as ScannerPlugin
    const observation = (await scanner.scan(root, {}, [
      'client.rb', 'config/routes.rb', 'app/controllers/items_controller.rb',
    ]))!
    expect(httpRelationships([observation], new Map(observation.files.map(file => [file.file, file.file])))).toEqual([])
    expect(observation.httpEndpoints!.some(endpoint => endpoint.method === '*' &&
      endpoint.path.some(segment => segment.kind === 'catch-all' && segment.constrained))).toBeTrue()
  } finally { await rm(directory, { recursive: true, force: true }) }
}, 60000)


