import { expect, test } from 'bun:test'
import { cp, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { parseFrontmatter, parseMarkdown } from 'comark'
import {
  createScanObservation,
  type HttpEndpointSegment,
  type HttpRequestSegment,
  type ScanHttpEndpoint,
  type ScanHttpRequest,
  type ScanObservation,
} from '@groma/scanner'

import { buildArchitectureModel } from '../src/architecture-model.ts'
import { loadArchitecture } from '../src/architecture-reader.ts'
import { httpRelationships } from '../src/http-relationships.ts'
import { withRelationship, withoutRelationship } from '../src/markdown-emitter.ts'
import { storedConnections } from '../src/relationship-markdown.ts'
import type { ArchitectureDocument, RelationshipConnection } from '../src/types.ts'

const empty = '---\ntype: Groma Relationships\ntitle: Architecture relationships\n---\n'
const client = 'src/client.ts'
const talks = 'src/talks.ts'
const owners = new Map([client, talks].map(file => [file, file]))

/** The same document shape the loader stores, so the strict reader validates every row. */
async function connections(source: string): Promise<RelationshipConnection[]> {
  const tree = await parseMarkdown(source)
  const document = {
    sourceFilename: 'groma/relationships.md',
    body: parseFrontmatter(source).content,
    nodes: tree.nodes,
    frontmatter: tree.frontmatter,
  } as ArchitectureDocument
  return storedConnections([document], [], (_code, _file, message) => { throw new Error(message) })
}

function rowFor(name: string) {
  return {
    sourceName: `src/${name}`, sourceHref: `../src/${name}`,
    targetName: 'src/plain.md', targetHref: '../src/plain.md',
    description: 'Calls the target', technology: 'HTTPS',
  }
}

function scan(id: string, facts: { httpEndpoints?: ScanHttpEndpoint[], httpRequests?: ScanHttpRequest[] }): ScanObservation {
  return createScanObservation({
    scanner: { id, technology: id, engine: 'fixture', engineVersion: '1' },
    roots: [{ id: 'app', kind: 'project', name: 'App' }],
    files: [client, talks].map(file => ({ file, roots: ['app'], symbols: [] })),
    operations: [client, talks].map(file => ({ id: file, file, name: 'handle' })),
    ...facts,
    diagnostics: [],
  })
}

function endpoint(file: string, method: string, route: string): ScanHttpEndpoint {
  const segments = route.split('/').filter(Boolean).map((part): HttpEndpointSegment => {
    const variable = /^:(\w+)([?+*]?)(!?)$/.exec(part)
    if (!variable) return { kind: 'literal', value: part }
    return { kind: 'parameter', name: variable[1]! }
  })
  return { operation: file, method, path: segments }
}

function request(method: string, url: string): ScanHttpRequest {
  const segments = url.split('/').filter(Boolean).map((part): HttpRequestSegment => ({ kind: 'literal', value: part }))
  return { operation: client, method, path: segments }
}

test.concurrent('a stored row round-trips any file name through the strict reader', async () => {
  const names = [
    'a|b.md', 'c\nd.md', 'e\r\nf.md', 'g]h.md', 'i](j.md', 'k[l.md',
    'm(n).md', 'weird)n.md', 'p q.md', 'r%20s.md', 't#u.md', 'v&amp;w.md',
    'w"x.md', "y'z.md", 'back\\slash.md', 'ünï codé.md', '_snake_.md', 'C:\\a.md',
  ]
  let source = empty
  for (const name of names) source = withRelationship(source, rowFor(name))
  const stored = await connections(source)
  expect(stored).toHaveLength(names.length)
  for (const name of names) {
    expect(stored.find(item => item.source === `src/${name}`)).toEqual(expect.objectContaining({
      target: 'src/plain.md', description: 'Calls the target', technology: 'HTTPS',
    }))
  }
})

test.concurrent('rows for names without special characters keep their stored bytes', () => {
  const source = withRelationship(empty, rowFor('added.md'))
  expect(source).toContain('| [src/added.md](../src/added.md) | [src/plain.md](../src/plain.md) | Calls the target | HTTPS |')
})

test.concurrent('a stored row is removed by the same values that wrote it', async () => {
  const written = withRelationship(empty, rowFor('a|b.md'))
  const removed = withoutRelationship(written, rowFor('a|b.md'))
  expect(removed).not.toContain('a|b.md')
  expect(await connections(removed)).toHaveLength(0)
  const plainRemoved = withoutRelationship(withRelationship(empty, rowFor('added.md')), rowFor('added.md'))
  expect(plainRemoved).not.toContain('| [src/added.md]')
})

test.concurrent('an HTTP label with Markdown characters is stored as one row and restored raw', async () => {
  const derived = httpRelationships([
    scan('server', { httpEndpoints: [endpoint(talks, 'GET', '/a&amp;b/:id'), endpoint(talks, 'GET', '/c*d')] }),
    scan('client', { httpRequests: [request('GET', '/a&amp;b/7'), request('GET', '/c*d')] }),
  ], owners)
  expect(derived[0]!.description).toBe('Calls HTTP endpoints: GET /a\\&amp;b/:id, GET /c\\*d')
  const written = withRelationship(empty, {
    sourceName: client, sourceHref: '../src/client.ts',
    targetName: talks, targetHref: '../src/talks.ts',
    description: derived[0]!.description, technology: derived[0]!.technology,
    status: 'stable', authored: false,
  })
  const stored = await connections(written)
  expect(stored).toHaveLength(1)
  expect(stored[0]!.description).toBe('Calls HTTP endpoints: GET /a&amp;b/:id, GET /c*d')
  expect(stored[0]!.technology).toBe('client, server')
})

test.concurrent('a repository whose relationship rows carry hostile file names loads into the model', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'groma-escaping-'))
  try {
    await cp(path.resolve(import.meta.dir, '../test/fixtures/relationship-pairs'), root, { recursive: true })
    const hostile = ['a|b.md', 'p q.md', 'm(n).md', 'ünï.md', 't#u.md', 'e]f(g.md']
    const code = [
      '    - scanner: fixture',
      '      file: "src/c\\nd.md"',
      ...hostile.map(name => `    - scanner: fixture\n      file: src/${name}`),
    ]
    const sources = `---\ntype: C4 Component\ntitle: Odd sources\nstatus: stable\ngroma:\n  id: odd-sources\n  parent: api\n  code:\n${code.join('\n')}\n---\n\nStores odd files.\n`
    const target = '---\ntype: C4 Component\ntitle: Plain target\nstatus: stable\ngroma:\n  id: plain-target\n  parent: api\n  code:\n    - scanner: fixture\n      file: src/plain.md\n---\n\nStores the plain target.\n'
    await writeFile(path.join(root, 'groma/systems/backend/containers/api/components/odd-sources.md'), sources)
    await writeFile(path.join(root, 'groma/systems/backend/containers/api/components/plain-target.md'), target)
    let relationships = empty
    for (const name of [...hostile.map(name => `src/${name}`), 'src/c\nd.md']) {
      relationships = withRelationship(relationships, {
        sourceName: name, sourceHref: `../${name}`,
        targetName: 'src/plain.md', targetHref: '../src/plain.md',
        description: 'Calls the target', technology: 'HTTPS',
      })
    }
    await writeFile(path.join(root, 'groma/relationships.md'), relationships)
    const records = await loadArchitecture(root)
    const model = buildArchitectureModel(records.documents)
    const pairs = model.relationships
      .flatMap(relationship => (relationship.connections ?? []).map(connection => `${connection.source}->${connection.target}`))
      .sort()
    expect(pairs).toEqual([...hostile.map(name => `src/${name}`), 'src/c\nd.md'].map(name => `${name}->src/plain.md`).sort())
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
