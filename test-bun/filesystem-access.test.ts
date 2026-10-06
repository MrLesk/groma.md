import { expect, test } from 'bun:test'
import { cp, link, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { loadArchitecture } from '../src/architecture-reader.ts'
import { loadAnnotatedArchitecture } from '../src/core.ts'
import { GromaFileSystem } from '../src/groma-filesystem.ts'
import { writes } from '../src/authoring.ts'

const repository = path.resolve(import.meta.dir, '..')
const stock = 'systems/shop/containers/api/components/stock.md'

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'groma-access-'))
  await cp(path.join(repository, 'test/fixtures/edit'), root, { recursive: true })
  return { root, filesystem: GromaFileSystem.open(root) }
}

test.concurrent('separate CLI processes preserve independent field updates in one checkout', async () => {
  const { root, filesystem } = await fixture()
  const entered = Promise.withResolvers<void>()
  const release = Promise.withResolvers<void>()
  const holding = filesystem.withAccess(async () => { entered.resolve(); await release.promise })
  const processes: ReturnType<typeof Bun.spawn>[] = []
  try {
    await entered.promise
    for (const args of [['--title', 'Inventory'], ['--overview', 'Reserves available items.']]) {
      processes.push(Bun.spawn(['bun', path.join(repository, 'src/cli.ts'), 'edit', 'stock', ...args], {
        cwd: root, stdout: 'pipe', stderr: 'pipe',
      }))
    }
    release.resolve()
    await holding
    expect(await Promise.all(processes.map(process => process.exited))).toEqual([0, 0])
    const element = (await loadAnnotatedArchitecture(root)).elements.find(element => element.id === 'stock')!
    expect(element.title).toBe('Inventory')
    expect(element.overview).toBe('Reserves available items.')
  } finally {
    release.resolve()
    await holding
    for (const process of processes) process.kill()
    await Promise.all(processes.map(process => process.exited))
    await rm(root, { recursive: true, force: true })
  }
})

test.concurrent('a separate process times out without entering the protected write and can proceed after release', async () => {
  const { root, filesystem } = await fixture()
  try {
    const before = await filesystem.read(stock)
    await filesystem.withAccess(async () => {
      const script = `import { GromaFileSystem, GromaBusyError } from ${JSON.stringify(path.join(repository, 'src/groma-filesystem.ts'))};
        try {
          await GromaFileSystem.open(process.cwd()).withAccess(async () => {
            throw new Error('entered an occupied operation');
          }, 20);
          process.exitCode = 2;
        } catch (error) {
          if (!(error instanceof GromaBusyError)) throw error;
          console.log(error.code);
        }`
      const process = Bun.spawn(['bun', '-e', script], { cwd: root, stdout: 'pipe', stderr: 'pipe' })
      expect(await new Response(process.stdout).text()).toContain('groma_busy')
      expect(await process.exited).toBe(0)
      expect(await filesystem.read(stock)).toBe(before)
    })
    await writes.edit(root, { id: 'stock', title: 'After release' })
    expect((await loadAnnotatedArchitecture(root)).elements.find(element => element.id === 'stock')!.title).toBe('After release')
  } finally { await rm(root, { recursive: true, force: true }) }
})

test.concurrent('architecture reads wait until a multi-document change finishes', async () => {
  const { root, filesystem } = await fixture()
  const entered = Promise.withResolvers<void>()
  const release = Promise.withResolvers<void>()
  let holding: Promise<void> | undefined
  try {
    const source = await filesystem.read(stock)
    holding = filesystem.withAccess(async () => {
      await filesystem.write('systems/shop/containers/api/components/duplicate.md', source)
      entered.resolve()
      await release.promise
      await filesystem.removeSource(filesystem.sourceFilename('systems/shop/containers/api/components/duplicate.md'))
    })
    await entered.promise
    const reading = loadArchitecture(root)
    expect(await Promise.race([reading.then(() => 'read'), delay(30, 'waiting')])).toBe('waiting')
    release.resolve()
    await holding
    const records = await reading
    expect(records.documents.filter(document => document.sourceFilename.endsWith('/stock.md'))).toHaveLength(1)
    expect(records.documents.some(document => document.sourceFilename.endsWith('/duplicate.md'))).toBe(false)
  } finally {
    release.resolve()
    await holding
    await rm(root, { recursive: true, force: true })
  }
})

test.concurrent('replacing a document preserves the complete previous file', async () => {
  const { root, filesystem } = await fixture()
  const previous = path.join(root, 'previous-stock.md')
  try {
    const before = await filesystem.read(stock)
    // A second name detects in-place writes without holding a Windows file handle open.
    await link(filesystem.absolute(stock), previous)
    await writes.edit(root, { id: 'stock', title: 'Replacement' })
    expect(await readFile(previous, 'utf8')).toBe(before)
    const element = (await loadAnnotatedArchitecture(root)).elements.find(element => element.id === 'stock')!
    expect(element.title).toBe('Replacement')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
