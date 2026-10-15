import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('./', import.meta.url))

/** Both WASM files are bundled assets. Building and scanning need no MetaTrader toolchain. */
export async function buildPackage(output: string): Promise<void> {
  await mkdir(output, { recursive: true })
  const bundle = await Bun.build({ entrypoints: [path.join(root, 'src/index.ts')], outdir: path.join(output, 'src'),
    target: 'node', format: 'esm', naming: { entry: 'index.js', asset: '[name].[ext]' } })
  if (!bundle.success) throw new AggregateError(bundle.logs, 'MQL5 scanner build failed')
  const { dependencies: _, ...manifest } = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'))
  await writeFile(path.join(output, 'package.json'), `${JSON.stringify({ ...manifest,
    files: ['src', 'LICENSE', 'THIRD-PARTY-NOTICES.txt', 'README.md'],
    groma: { scanner: { ...manifest.groma.scanner, entry: './src/index.js' } },
  }, null, 2)}\n`)
  await cp(path.join(root, '../../../LICENSE'), path.join(output, 'LICENSE'))
  await cp(path.join(root, '../../../docs/scanners/mql5/index.md'), path.join(output, 'README.md'))
  const require = createRequire(import.meta.url)
  const runtimeLicense = path.join(path.dirname(require.resolve('web-tree-sitter')), 'LICENSE')
  await writeFile(path.join(output, 'THIRD-PARTY-NOTICES.txt'), [
    await readFile(path.join(root, 'assets/PROVENANCE.md'), 'utf8'),
    await readFile(path.join(root, 'assets/tree-sitter-mql5.LICENSE'), 'utf8'),
    await readFile(path.join(root, 'assets/tree-sitter-cpp.LICENSE'), 'utf8'),
    await readFile(path.join(root, 'assets/tree-sitter-c.LICENSE'), 'utf8'),
    await readFile(runtimeLicense, 'utf8'),
  ].join('\n\n'))
}

if (import.meta.main) {
  const output = process.argv[2] ?? path.join(root, 'dist/package')
  await rm(output, { recursive: true, force: true })
  await buildPackage(output)
  console.log(output)
}
