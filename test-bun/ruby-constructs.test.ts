import { expect, test } from 'bun:test'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { ScannerPlugin } from '@groma/scanner'
import { buildPackage } from '../plugins/scanners/ruby/build.ts'

const fixture = path.resolve(import.meta.dir, '../test/fixtures/ruby-rails-constructs')
const files = ['constructs.rb', 'config/routes.rb', 'app/controllers/api/people_controller.rb',
  'app/controllers/api/notes_controller.rb', 'app/controllers/api/profiles_controller.rb']

async function packaged(run: (scanner: ScannerPlugin) => Promise<void>): Promise<void> {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'groma-ruby-constructs-'))
  try {
    await buildPackage(directory)
    const scanner = (await import(pathToFileURL(path.join(directory, 'src/index.js')).href)).default as ScannerPlugin
    await run(scanner)
  } finally { await rm(directory, { recursive: true, force: true }) }
}

test.concurrent('Rails resource contexts preserve parent actions, nested paths and custom action targets', async () => {
  await packaged(async scanner => {
    const observation = (await scanner.scan(fixture, {}, files))!
    const actions = new Map(observation.operations!.map(operation => [operation.id, operation.name]))
    const endpoints = observation.httpEndpoints!.filter(endpoint => actions.get(endpoint.operation) !== '(module)').map(endpoint => ({
      method: endpoint.method,
      path: `/${endpoint.path.map(segment => segment.kind === 'literal' ? segment.value : `:${segment.name}`).join('/')}`,
      action: actions.get(endpoint.operation), position: endpoint.order!.position,
    }))
    const target = (method: string, route: string) => endpoints.find(endpoint =>
      endpoint.method === method && endpoint.path === route)
    expect(target('GET', '/api/people')?.action).toBe('Api::PeopleController#index')
    expect(target('GET', '/api/people/:id')?.action).toBe('Api::PeopleController#show')
    expect(target('PATCH', '/api/people/:id/profile')?.action).toBe('Api::PeopleController#update_profile')
    expect(target('GET', '/api/people/:id/hidden')).toBeUndefined()
    expect(target('POST', '/api/people/:id/note')?.action).toBe('Api::NotesController#create')
    expect(target('DELETE', '/api/people/:id/notes/:note_id')?.action).toBe('Api::NotesController#destroy')
    expect(target('GET', '/api/people/search')?.action).toBe('Api::PeopleController#search')
    expect(target('GET', '/api/people/:person_id/notes')?.action).toBe('Api::NotesController#index')
    expect(target('POST', '/api/people/:person_id/notes')?.action).toBe('Api::NotesController#create')
    expect(target('GET', '/api/people/:person_id/profile')?.action).toBe('Api::ProfilesController#show')
    expect(target('PATCH', '/api/people/:person_id/profile')?.action).toBe('Api::ProfilesController#update')
    expect(target('PUT', '/api/people/:person_id/profile')?.action).toBe('Api::ProfilesController#update')
    // A collection route is registered before the parent's parameter route can capture its name.
    expect(target('GET', '/api/people/search')!.position).toBeLessThan(target('GET', '/api/people/:id')!.position)
    expect(endpoints).toHaveLength(11)
  })
}, 60000)

test.concurrent('Ruby method scopes keep singleton, concern and nested operations owned by their declaring types', async () => {
  await packaged(async scanner => {
    const observation = (await scanner.scan(fixture, {}, ['constructs.rb']))!
    const operations = observation.operations!
    expect(operations.map(operation => operation.name).sort()).toEqual([
      'Configurable::ClassMethods#configure', 'Configurable::ClassMethods#secret', 'Configurable#run',
      'Worker.build', 'Worker.key', 'Worker::Failure#initialize', 'Worker#execute',
    ].sort())
    const source = await readFile(path.join(fixture, 'constructs.rb'), 'utf8')
    const nested = operations.find(operation => operation.name === 'Worker::Failure#initialize')!
    expect(nested.position).toBe(source.indexOf('def initialize'))
    expect(observation.invocations!.filter(call => call.source === nested.id).map(call => call.member)).toEqual(['record_failure'])
    const outline = (await scanner.readCodeStructure!(fixture, [{ file: 'constructs.rb',
      symbols: ['Worker.key', 'Configurable::ClassMethods#configure', 'Worker::Failure#initialize'] }]))[0]!
    expect(outline.declarations.map(type => type.name)).toEqual(['Configurable', 'Worker'])
    const members = outline.declarations.flatMap(type => type.kind === 'type' ? type.members : [])
    expect(members.find(member => member.name === 'configure')).toMatchObject({ visibility: 'public', entry: true })
    expect(members.find(member => member.name === 'secret')).toMatchObject({ visibility: 'private', entry: false })
    expect(members.find(member => member.name === 'key')).toMatchObject({ visibility: 'private', entry: true })
    expect(members.find(member => member.name === 'execute')).toMatchObject({ visibility: 'public', entry: false })
  })
}, 60000)

