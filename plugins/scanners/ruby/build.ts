import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('./', import.meta.url))

/** Ship the parser with the scanner; consumers never install Ruby or compile a grammar. */
export async function buildPackage(destination: string): Promise<void> {
  await mkdir(path.join(destination, 'dist'), { recursive: true })
  const require = createRequire(import.meta.url)
  const grammar = path.dirname(require.resolve('tree-sitter-ruby/package.json'))
  await cp(path.join(grammar, 'tree-sitter-ruby.wasm'), path.join(destination, 'dist/tree-sitter-ruby.wasm'))
  await cp(fileURLToPath(import.meta.resolve('web-tree-sitter/web-tree-sitter.wasm')),
    path.join(destination, 'dist/web-tree-sitter.wasm'))
  const built = await Bun.build({ entrypoints: [path.join(root, 'src/index.ts')],
    outdir: path.join(destination, 'src'), target: 'node', format: 'esm', naming: 'index.js' })
  if (!built.success) throw new AggregateError(built.logs, 'Ruby scanner build failed')
  const { dependencies: _, devDependencies: __, ...manifest } = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'))
  await writeFile(path.join(destination, 'package.json'), `${JSON.stringify({ ...manifest,
    files: ['src', 'dist', 'LICENSE', 'TREE-SITTER-LICENSE', 'RUBY-GRAMMAR-LICENSE', 'INFLECTION-LICENSE', 'README.md'],
    groma: { scanner: { ...manifest.groma.scanner, entry: './src/index.js' } },
  }, null, 2)}\n`)
  await cp(path.join(root, '../../../LICENSE'), path.join(destination, 'LICENSE'))
  await cp(path.join(path.dirname(require.resolve('web-tree-sitter')), 'LICENSE'), path.join(destination, 'TREE-SITTER-LICENSE'))
  await cp(path.join(grammar, 'LICENSE'), path.join(destination, 'RUBY-GRAMMAR-LICENSE'))
  await cp(path.join(path.dirname(require.resolve('inflection/package.json')), 'LICENSE'), path.join(destination, 'INFLECTION-LICENSE'))
  await cp(path.join(root, '../../../docs/scanners/ruby/index.md'), path.join(destination, 'README.md'))
}

if (import.meta.main) {
  const destination = path.resolve(process.argv[2] ?? path.join(root, 'dist/package'))
  await buildPackage(destination)
  console.log(destination)
}

