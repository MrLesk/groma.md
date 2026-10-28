import { expect, test } from 'bun:test'
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { ScanObservation, ScannerPlugin } from '@groma/scanner'
import { buildPackage as buildRuby } from '../plugins/scanners/ruby/build.ts'
import { buildPackage as buildVue } from '../plugins/scanners/vue/build.ts'
import { scannerFiles } from '../src/scanner/modules/selection.ts'
import { httpRelationships } from '../src/http-relationships.ts'

test.concurrent('config-free Vue and Ruby packages derive only source-proven HTTP relationships together', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'groma-ruby-vue-'))
  try {
    const root = path.join(temporary, 'project')
    await cp(path.resolve(import.meta.dir, '../test/fixtures/ruby-coverage'), root, { recursive: true })
    const git = Bun.spawn(['git', 'init', '--quiet', root], { stderr: 'pipe' })
    expect(await git.exited, await new Response(git.stderr).text()).toBe(0)
    const observations = new Map<string, ScanObservation>()
    let vueScanner!: ScannerPlugin
    let vueSelected!: string[]
    for (const [id, build] of [['ruby', buildRuby], ['vue', buildVue]] as const) {
      const artifact = path.join(temporary, id)
      await build(artifact)
      const manifest = JSON.parse(await readFile(path.join(artifact, 'package.json'), 'utf8'))
      const scanner = (await import(pathToFileURL(path.join(artifact, manifest.groma.scanner.entry)).href)).default as ScannerPlugin
      const files = await scannerFiles(root, manifest.groma.scanner)
      await scanner.checkReadiness!(root, {}, files)
      const observation = await scanner.scan(root, {}, files)
      if (observation) observations.set(id, observation)
      if (id === 'vue') { vueScanner = scanner; vueSelected = files }
    }
    const vue = observations.get('vue')
    expect(vue?.files.map(file => file.file) ?? []).toContain('Items.vue')
    expect(vue!.diagnostics.some(diagnostic => diagnostic.code === 'vue-template-codegen')).toBeTrue()
    const combined = [...observations.values()]
    const owners = new Map(combined.flatMap(observation => observation.files.map(file => [file.file, file.file])))
    const rows = httpRelationships(combined, owners).filter(row => row.source === 'Items.vue')
    expect(rows.map(row => [row.source, row.target])).toEqual([['Items.vue', 'app/controllers/api/items_controller.rb']])
    const unresolved = vue!.operations!.find(operation => operation.name === 'unresolved')!
    expect(vue!.httpRequests!.find(request => request.operation === unresolved.id)!.path).toEqual([{ kind: 'unknown' }])
    await writeFile(path.join(root, 'Items.vue'), '<template><button></template>')
    await expect(vueScanner.scan(root, {}, vueSelected)).rejects.toThrow('VUE_SOURCE_INVALID')
  } finally { await rm(temporary, { recursive: true, force: true }) }
}, 60000)
