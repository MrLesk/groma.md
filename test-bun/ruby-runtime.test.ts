import { expect, test } from 'bun:test'
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseScanObservation, type ScannerPlugin } from '@groma/scanner'
import { buildPackage } from '../plugins/scanners/ruby/build.ts'
import { scannerFiles } from '../src/scanner/modules/selection.ts'
import { createScannerRegistry } from '../src/scanner/registry.ts'
import { loadAnnotatedArchitecture, reconcileScanObservations } from '../src/core.ts'
import { loadArchitecture } from '../src/architecture-reader.ts'
import { withMeaning, writeDocument } from '../src/markdown-emitter.ts'

const fixture = path.resolve(import.meta.dir, '../test/fixtures/ruby-coverage')
const database = 'config/database.yml'

test.concurrent('packaged Rails production configuration becomes persisted storage and hosted queue evidence', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'groma-ruby-runtime-'))
  const root = path.join(temporary, 'project')
  try {
    await cp(fixture, root, { recursive: true })
    await cp(path.resolve(import.meta.dir, '../test/fixtures/empty-project'), root, { recursive: true })
    expect(await Bun.spawn(['git', 'init', '--quiet', root]).exited).toBe(0)
    await buildPackage(path.join(temporary, 'scanner'))
    const scanner = (await import(pathToFileURL(path.join(temporary, 'scanner/src/index.js')).href)).default as ScannerPlugin
    const manifest = JSON.parse(await readFile(path.join(temporary, 'scanner/package.json'), 'utf8'))
    const selected = await scannerFiles(root, manifest.groma.scanner)
    expect(selected).toContain(database)
    expect(selected).toContain('config/deploy.yml')
    const observation = parseScanObservation(JSON.stringify(await scanner.scan(root, {}, selected)))
    expect(observation).toMatchObject({
      dataStores: [{ entry: 'config.ru', file: database, environment: 'production', technology: 'PostgreSQL',
        databases: [{ role: 'primary', name: 'service_data' }, { role: 'queue', name: 'service_jobs' }] }],
      hostedServices: [{ entry: 'config.ru', environment: 'production', name: 'Solid Queue', host: 'Puma' }],
    })
    await reconcileScanObservations(root, [observation])
    const model = await loadAnnotatedArchitecture(root)
    const storage = model.elements.find(element => element.code.some(code => code.file === database))!
    expect(storage.kind).toBe('container')
    expect(storage.runtimeConfiguration).toContain('production')
    const application = model.elements.find(element => element.code.some(code => code.file === 'config.ru'))!
    const applicationId = application.kind === 'container' ? application.id : application.parent!
    expect(model.elements.find(element => element.id === applicationId)!.runtimeConfiguration).toContain('Solid Queue')
    expect(storage.id).not.toBe(applicationId)
    expect(model.relationships.some(row => row.source === application.id && row.target === storage.id)).toBeTrue()
    // The fixture declares three launches; the commented job role adds none.
    expect(model.elements.filter(element => element.kind === 'container')).toHaveLength(4)
    const documents = await loadArchitecture(root)
    const appDocument = documents.documents.find(document => (document.frontmatter.groma as { id: string }).id === applicationId)!
    const appPath = path.join(root, appDocument.sourceFilename)
    const authored = withMeaning(await readFile(appPath, 'utf8'), { description: 'Authored application responsibility' })
    await writeDocument(root, appDocument.sourceFilename, authored)
    expect(authored).toContain('Solid Queue')
    expect(authored).toContain('config/deploy.yml')
    const summary = await reconcileScanObservations(root, [observation])
    expect(summary.created).toBe(0)
    expect(await readFile(appPath, 'utf8')).toContain('Authored application responsibility')
    const reloaded = await loadAnnotatedArchitecture(root)
    expect(reloaded.elements.find(element => element.code.some(code => code.file === database))!.id).toBe(storage.id)
    await writeFile(path.join(root, 'config/deploy.yml'), 'env:\n  clear: {}\n')
    const disabled = (await scanner.scan(root, {}, selected))!
    expect(disabled.hostedServices).toEqual([])
    await reconcileScanObservations(root, [disabled])
    expect(await readFile(appPath, 'utf8')).not.toContain('Solid Queue')
    const registry = createScannerRegistry([{ plugin: { id: 'ruby', async scan() { return observation } },
      included: () => true, excluded: file => file === 'config/deploy.yml' }])
    const filtered = await registry.collectObservations(root)
    expect(filtered.observations[0]!.hostedServices).toEqual([])
    const omitted = (await scanner.scan(root, {}, selected.filter(file => file !== database)))!
    expect(omitted.dataStores).toEqual([])
  } finally { await rm(temporary, { recursive: true, force: true }) }
}, 60000)
