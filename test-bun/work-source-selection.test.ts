import { expect, test } from 'bun:test'
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { addPlugin, removePlugin } from '../src/plugin-management.ts'
import { readScannerConfig, writeScannerConfig } from '../src/scanner/modules/config.ts'
import { configuredWorkSource, workSourceSession } from '../src/work-sources.ts'

async function project(range = '*') {
  const root = await mkdtemp(path.join(os.tmpdir(), 'groma-work-selection-'))
  await cp(path.resolve(import.meta.dir, '../test/fixtures/flows'), root, { recursive: true })
  await mkdir(path.join(root, 'adapter'))
  await writeFile(path.join(root, 'adapter/package.json'), JSON.stringify({
    name: 'work-source-fixture', version: '1.0.0', type: 'module',
    groma: { workSource: { id: 'backlog', entry: './index.js', compatibility: { groma: range } } },
  }))
  await writeFile(path.join(root, 'adapter/index.js'), range === '*' ? `
    import { appendFileSync } from 'node:fs'
    export default { id: 'backlog', readiness: () => ({ status: 'found' }), create(root) {
      return {
        read: async () => { appendFileSync(root + '/calls', 'read\\n'); return { statuses: [], defaultStatus: '', items: [{ id: 'WORK-1' }] } },
        readItem: async id => ({ id }),
        watch: () => { appendFileSync(root + '/calls', 'watch\\n'); return { close: () => appendFileSync(root + '/calls', 'close\\n') } },
      }
    } }
  ` : 'throw new Error("An incompatible adapter must never be imported")')
  return root
}

test.concurrent('work-source selection controls reads and closes its watch when removed', async () => {
  const root = await project()
  let watch: { close(): Promise<void> } | undefined
  try {
    await writeScannerConfig(root, { scanners: [] })
    const session = await workSourceSession(root)
    watch = session.watch(() => {})
    expect((await session.read()).items).toEqual([])
    await expect(readFile(path.join(root, 'calls'), 'utf8')).rejects.toThrow()
    await addPlugin(root, './adapter')
    await session.reconfigure()
    expect((await session.read()).items[0]?.id).toBe('WORK-1')
    await removePlugin(root, 'backlog')
    await session.reconfigure()
    expect((await session.read()).items).toEqual([])
    expect((await readFile(path.join(root, 'calls'), 'utf8')).trim().split('\n')).toEqual(['watch', 'read', 'close'])
  } finally { await watch?.close(); await rm(root, { recursive: true, force: true }) }
})

test.concurrent('a work-source version mismatch blocks loading before plugin code executes', async () => {
  const root = await project('>=99.0.0')
  try {
    await writeScannerConfig(root, { scanners: [], workSources: [{ id: 'backlog', source: './adapter' }] })
    const selection = await configuredWorkSource(root)
    expect(selection?.status).toBe('blocked')
    expect(selection?.message).toContain('>=99.0.0')
  } finally { await rm(root, { recursive: true, force: true }) }
})

test.concurrent('a second work-source entry is rejected before either adapter loads', async () => {
  const root = await project()
  try {
    await writeScannerConfig(root, { scanners: [], workSources: [
      { id: 'backlog', source: './adapter' }, { id: 'other', source: './other' },
    ] })
    await expect(readScannerConfig(root)).rejects.toThrow('at most one work source')
  } finally { await rm(root, { recursive: true, force: true }) }
})
