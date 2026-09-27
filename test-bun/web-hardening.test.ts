import { expect, test } from 'bun:test'
import { cp, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { connect } from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { EMPTY_WORK_SNAPSHOT, type WorkSource } from '@groma/work-source'
import { exportWebViewer } from '../src/viewers/web/export.ts'
import { chip, statusButton } from '../src/viewers/web/work/island.ts'
import { startWebViewer } from '../src/viewers/web/server.ts'

function emptyWorkSource(): WorkSource {
  return {
    async read() { return EMPTY_WORK_SNAPSHOT },
    async readItem() { throw new Error('No work items in this fixture') },
    watch() { return { close() {} } },
  }
}

async function preparedViewer(fixture: string, mutate?: (root: string) => Promise<void>) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'groma-hardening-'))
  await cp(path.resolve(import.meta.dir, `../test/fixtures/${fixture}`), root, { recursive: true })
  const git = Bun.spawn(['git', 'init', '--quiet', root], { stdout: 'ignore', stderr: 'pipe' })
  expect(await git.exited).toBe(0)
  await mutate?.(root)
  const viewer = await startWebViewer(root, { port: 0, workSource: emptyWorkSource(), scan: false })
  return { root, viewer }
}

/** One raw HTTP request with an exact Host header; a rebound Host is only visible on the wire. */
function rawStatus(port: number, host: string): Promise<number> {
  const { promise, resolve, reject } = Promise.withResolvers<number>()
  const socket = connect(port, '127.0.0.1', () => {
    socket.write(`GET / HTTP/1.1\r\nHost: ${host}\r\nConnection: close\r\n\r\n`)
  })
  socket.setEncoding('utf8')
  let head = ''
  socket.on('data', chunk => {
    head += chunk
    const match = /^HTTP\/1\.[01] (\d{3})/.exec(head)
    if (match !== null) {
      socket.destroy()
      resolve(Number(match[1]))
    }
  })
  socket.on('error', reject)
  return promise
}

const componentMarked = (escaping: string) => `---
type: C4 Component
title: Orders
status: stable
groma:
  id: orders
  parent: api
  code:
    - scanner: typescript
      file: src/orders.ts
      symbol: placeOrder
    - scanner: typescript
      file: ../${escaping}
---

Records an order and its lines.
`

test.concurrent('the viewer serves the operator loopback and refuses a rebound foreign Host', async () => {
  const { root, viewer } = await preparedViewer('empty-project', async repository => {
    await rm(path.join(repository, 'groma'), { recursive: true, force: true })
  })
  try {
    const port = Number(new URL(viewer.url).port)
    expect((await fetch(`${viewer.url}/`)).status).toBe(200)
    expect(await rawStatus(port, `localhost:${port}`)).toBe(200)
    expect(await rawStatus(port, `127.0.0.1:${port}`)).toBe(200)
    expect(await rawStatus(port, `[::1]:${port}`)).toBe(200)
    expect(await rawStatus(port, 'evil.com')).toBe(403)
    expect(await rawStatus(port, 'localhost.evil.com')).toBe(403)
    expect(await rawStatus(port, 'localhost:4747@evil.com')).toBe(403)
  } finally {
    await viewer.close()
    await rm(root, { recursive: true, force: true })
  }
})

test.concurrent('state-changing requests from a foreign origin are refused; same-origin and bare clients pass', async () => {
  const { root, viewer } = await preparedViewer('empty-project')
  try {
    const port = Number(new URL(viewer.url).port)
    const post = (headers: Record<string, string>) => fetch(`${viewer.url}/scanners`, { method: 'POST', headers })
    expect((await post({ Origin: `http://localhost:${port + 1}` })).status).toBe(403)
    expect((await post({ Referer: 'https://evil.example/page' })).status).toBe(403)
    // Past the origin gate the request reaches the map: the same-origin and bare posts render the page.
    expect((await post({ Origin: `http://localhost:${port}` })).status).toBe(200)
    expect((await post({ Referer: `http://localhost:${port}/page` })).status).toBe(200)
    expect((await fetch(`${viewer.url}/scanners`, { method: 'POST' })).status).toBe(200)
  } finally {
    await viewer.close()
    await rm(root, { recursive: true, force: true })
  }
})

test.concurrent('a stored reference outside the repository is refused and an owned file is served', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'groma-hardening-source-'))
  const escaping = `${path.basename(root)}-outside.txt`
  let viewer: Awaited<ReturnType<typeof startWebViewer>> | undefined
  try {
    await cp(path.resolve(import.meta.dir, '../test/fixtures/source-view'), root, { recursive: true })
    await writeFile(path.join(root, 'groma/systems/shop/containers/api/components/orders.md'), componentMarked(escaping))
    await writeFile(path.join(path.dirname(root), escaping), 'secret outside content')
    const git = Bun.spawn(['git', 'init', '--quiet', root], { stdout: 'ignore', stderr: 'pipe' })
    expect(await git.exited).toBe(0)
    viewer = await startWebViewer(root, { port: 0, workSource: emptyWorkSource(), scan: false })
    const escaped = await fetch(`${viewer.url}/source.json?element=orders&file=../${escaping}`)
    expect(escaped.status).toBe(404)
    expect((await fetch(`${viewer.url}/code.json?element=orders`)).status).toBe(404)
    const served = await fetch(`${viewer.url}/source.json?element=orders&file=src/orders.ts`)
    expect(served.status).toBe(200)
    expect(((await served.json()) as { source: string }).source).toContain('placeOrder')
  } finally {
    await viewer?.close()
    await rm(root, { recursive: true, force: true })
    await rm(path.join(path.dirname(root), escaping), { force: true })
  }
})

test.concurrent('the export refuses a stored reference that escapes the repository', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'groma-hardening-export-'))
  const escaping = `${path.basename(root)}-outside.txt`
  try {
    await cp(path.resolve(import.meta.dir, '../test/fixtures/source-view'), root, { recursive: true })
    await writeFile(path.join(root, 'groma/systems/shop/containers/api/components/orders.md'), componentMarked(escaping))
    await writeFile(path.join(path.dirname(root), escaping), 'secret outside content')
    const git = Bun.spawn(['git', 'init', '--quiet', root], { stdout: 'ignore', stderr: 'pipe' })
    expect(await git.exited).toBe(0)
    await expect(exportWebViewer(root, path.join(root, 'site'))).rejects.toThrow(/escapes the repository/)
  } finally {
    await rm(root, { recursive: true, force: true })
    await rm(path.join(path.dirname(root), escaping), { force: true })
  }
})

// The island's builders ask the page for nodes; this stub records every innerHTML write so the
// test can prove repo content reaches only text nodes. It stays in this file because the
// repository check runs bun test --parallel, which gives each test file its own globals.
interface StubNode {
  style: { setProperty: (name: string, value: string) => void }
  classList: { contains: (name: string) => boolean; toggle: (name: string, on: boolean) => void }
  dataset: Record<string, string>
  attributes: Record<string, string>
  children: unknown[]
  textContent?: string
  addEventListener: () => void
  setAttribute: (name: string, value: string) => void
  append: (...children: unknown[]) => void
  querySelector: () => StubNode
}

const htmlWrites: string[] = []

Object.assign(globalThis, {
  document: {
    createElement(tag: string): unknown {
      if (tag === 'template') {
        const template: { content?: { parsed: string }; innerHTML?: string } = {}
        Object.defineProperty(template, 'innerHTML', {
          set(value: string) { template.content = { parsed: value } },
        })
        return template
      }
      const node: StubNode = {
        style: { setProperty() {} },
        classList: { contains: () => false, toggle() {} },
        dataset: {},
        attributes: {},
        children: [],
        addEventListener() {},
        setAttribute(name: string, value: string) { node.attributes[name] = value },
        append(...children: unknown[]) { node.children.push(...children) },
        querySelector: () => stubElement(),
      }
      Object.defineProperty(node, 'innerHTML', {
        set(value: string) { htmlWrites.push(value) },
      })
      return node
    },
    createTextNode(text: string): unknown {
      return { textContent: text }
    },
  },
})

function stubElement(): StubNode {
  const node: StubNode = {
    style: { setProperty() {} },
    classList: { contains: () => false, toggle() {} },
    dataset: {},
    attributes: {},
    children: [],
    addEventListener() {},
    setAttribute() {},
    append() {},
    querySelector: () => stubElement(),
  }
  Object.defineProperty(node, 'innerHTML', {
    set(value: string) { htmlWrites.push(value) },
  })
  return node
}

const ATTACK = '<img src=x onerror=alert(1)>'

function pinWith(taskId: string) {
  return {
    key: `task ${taskId}`, assignee: null, taskId, title: 'Order the lines', status: 'Doing',
    draft: false, terminal: false, done: 0, total: 2, elementId: 'orders', colour: 'var(--pin)',
  }
}

test.concurrent('an island chip renders an attacker task id as text, never as HTML', () => {
  const node = chip(pinWith(ATTACK), undefined, () => {}, { attach() {} })
  const label = Array.from(node.children).find(child => (child as unknown as StubNode).textContent === ATTACK)
  expect(label).toBeDefined()
  expect((node.children[0] as { parsed?: string }).parsed).toContain('badge')
  expect(htmlWrites.join('|')).not.toContain(ATTACK)
})

test.concurrent('a status pill renders an attacker status as text, never as HTML', () => {
  const presses: string[] = []
  const node = statusButton(ATTACK, true, () => presses.push('toggled'))
  const text = Array.from(node.children).find(child => (child as unknown as StubNode).textContent === ATTACK)
  expect(text).toBeDefined()
  expect((node.children[0] as { parsed?: string }).parsed).toContain('<svg')
  expect((node as unknown as { attributes: Record<string, string> }).attributes['aria-pressed']).toBe('true')
  expect(htmlWrites.join('|')).not.toContain(ATTACK)
})
