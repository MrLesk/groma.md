import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('./', import.meta.url))
const require = createRequire(import.meta.url)

/** Ship the JavaScript parser and both WebAssembly assets; consumers need no R or build tool. */
export async function buildPackage(destination: string): Promise<void> {
  const dist = path.join(destination, 'dist')
  await mkdir(dist, { recursive: true })
  const built = await Bun.build({
    entrypoints: [path.join(root, 'src/index.ts')], outdir: path.join(destination, 'src'),
    target: 'bun', format: 'esm', naming: 'index.js',
  })
  if (!built.success) throw new Error(built.logs.join('\n'))
  const runtime = require.resolve('web-tree-sitter/tree-sitter.wasm')
  const grammar = path.dirname(require.resolve('@davisvaughan/tree-sitter-r/package.json'))
  await cp(runtime, path.join(dist, 'tree-sitter.wasm'))
  await cp(path.join(grammar, 'tree-sitter-r.wasm'), path.join(dist, 'tree-sitter-r.wasm'))
  await cp(path.join(path.dirname(runtime), 'LICENSE'), path.join(destination, 'TREE-SITTER-LICENSE'))
  await cp(path.join(grammar, 'LICENSE'), path.join(destination, 'R-GRAMMAR-LICENSE'))
  await cp(path.join(root, '../../../LICENSE'), path.join(destination, 'LICENSE'))
  await cp(path.join(root, '../../../docs/scanners/r/index.md'), path.join(destination, 'README.md'))
  await cp(path.join(root, '../../../docs/scanners/r/validation.md'), path.join(destination, 'validation.md'))
  const { dependencies: _, devDependencies: _dev, ...manifest } = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'))
  await writeFile(path.join(destination, 'package.json'), `${JSON.stringify({
    ...manifest, groma: { scanner: { ...manifest.groma.scanner, entry: './src/index.js' } },
  }, null, 2)}\n`)
}

if (import.meta.main) {
  const destination = path.resolve(process.argv[2] ?? path.join(root, 'dist/package'))
  await buildPackage(destination)
  await cp(path.join(destination, 'dist'), path.join(root, 'dist'), { recursive: true })
  console.log(destination)
}
