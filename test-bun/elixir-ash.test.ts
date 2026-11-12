import { expect, test } from 'bun:test'
import type { CodeDeclaration } from '@groma/scanner'
import { buildPackage as buildElixir } from '../plugins/scanners/elixir/build.ts'
import { buildPackage as buildJavaScript } from '../plugins/scanners/javascript/build.ts'
import { httpRelationships } from '../src/http-relationships.ts'
import { blocked, endpointRows, observe, withFixture } from './elixir-fixture.ts'

const domain = 'lib/desk/support.ex', ticket = 'lib/desk/support/ticket.ex'

test.concurrent('Ash actions are operations and code interfaces are functions of the module that hosts them', async () => {
  await withFixture('elixir-ash', { elixir: buildElixir }, async (root, { elixir }) => {
    const observation = await observe(root, elixir)
    const actions = observation.operations!.filter(operation => operation.file === ticket && operation.name.endsWith('(action)'))
      .map(operation => operation.name)
    // The names in `defaults` and each action entity; `summary/1` is a plain function, not an action.
    expect(actions.sort()).toEqual(['destroy', 'escalate', 'open', 'read', 'update'].map(name => `Desk.Support.Ticket.${name} (action)`))

    const members = (declarations: CodeDeclaration[]) => declarations.map(declaration =>
      [declaration.name, declaration.kind === 'type' ? declaration.members.map(member => [member.name, member.visibility, member.entry]) : []])
    const outline = await elixir.scanner.readCodeStructure!(root, [
      { file: domain, symbols: ['Desk.Support.open_ticket'] }, { file: ticket, symbols: [] },
    ])
    expect(outline.map(file => members(file.declarations))).toEqual([
      // Defined on the domain for its Ticket resource. A `?` name and a calculation interface are not read.
      [['Desk.Support', [['open_ticket', 'public', true], ['list_tickets', 'public', false]]]],
      [['Desk.Support.Ticket', [['close', 'public', false], ['summary/1', 'public', false]]]],
    ])
    // An interface function is a declaration only: it has no operation of its own.
    expect(observation.operations!.some(operation => operation.name.includes('open_ticket') || operation.name.includes('close'))).toBeFalse()
  })
}, 60000)

test.concurrent('AshJsonApi routes become endpoints under the Phoenix forward that mounts their router', async () => {
  await withFixture('elixir-ash', { elixir: buildElixir }, async (root, { elixir }) => {
    const mount = '/api/json/desk'
    expect(endpointRows(await observe(root, elixir))).toEqual([
      // One mount: its routes share the forward's position. The document the router answers itself is a blocker.
      [0, '*', blocked(`${mount}/open_api`), '(module)'],
      // Routes the domain declares for a resource run that resource's actions.
      [0, 'GET', `${mount}/tickets`, 'Desk.Support.Ticket.read (action)'],
      [0, 'GET', `${mount}/tickets/:id`, 'Desk.Support.Ticket.read (action)'],
      [0, 'POST', `${mount}/tickets`, 'Desk.Support.Ticket.open (action)'],
      [0, 'POST', `${mount}/tickets/:id/escalate`, 'Desk.Support.Ticket.escalate (action)'],
      // Routes a resource declares itself, under its own base. A relationship route without an action is a blocker.
      [0, 'GET', `${mount}/notes`, 'Desk.Support.Note.read (action)'],
      [0, 'POST', `${mount}/notes`, 'Desk.Support.Note.create (action)'],
      [0, 'GET', `${mount}/notes/:id/ticket`, 'Desk.Support.Note.read (action)'],
      [0, '*', blocked(`${mount}/notes`), '(module)'],
      // The mounted router answers everything else under its path, before any later route.
      [1, '*', blocked(mount), '(module)'],
      [2, 'GET', `${mount}/late`, 'DeskWeb.LateController.show/2'],
      // AshAuthentication's live session wrapper keeps the paths of its routes.
      [3, 'GET', '/home', 'DeskWeb.HomeLive.mount/3'],
      // A router whose domains are computed is one blocker. The spare router nothing forwards to reports nothing.
      [4, '*', blocked('/internal/api'), '(module)'],
      // Router options such as `alias: false` change which module is mounted, so this forward is not read.
      [5, '*', blocked('/scoped/api'), '(module)'],
    ])
  })
}, 60000)

test.concurrent('a browser request derives a row to the Ash resource whose action answers it', async () => {
  await withFixture('elixir-ash', { elixir: buildElixir, javascript: buildJavaScript }, async (root, scanners) => {
    const combined = [await observe(root, scanners.elixir), await observe(root, scanners.javascript)]
    const owners = new Map(combined.flatMap(observation => observation.files.map(file => [file.file, file.file])))
    // The schema document and the route registered after the mount, under its path, stay unproven.
    expect(httpRelationships(combined, owners).map(row => [row.source, row.target])).toEqual([['assets/js/app.js', ticket]])
  })
}, 60000)
