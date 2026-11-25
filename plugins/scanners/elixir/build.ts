import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('./', import.meta.url))
const repository = path.join(root, '../../..')

/** Ship the parser with the scanner; consumers never install Elixir, Erlang or Mix, or compile a grammar. */
export async function buildPackage(destination: string): Promise<void> {
  await mkdir(path.join(destination, 'dist'), { recursive: true })
  const require = createRequire(import.meta.url)
  const grammar = path.dirname(require.resolve('tree-sitter-elixir/package.json'))
  await cp(path.join(grammar, 'tree-sitter-elixir.wasm'), path.join(destination, 'dist/tree-sitter-elixir.wasm'))
  await cp(fileURLToPath(import.meta.resolve('web-tree-sitter/web-tree-sitter.wasm')),
    path.join(destination, 'dist/web-tree-sitter.wasm'))
  const built = await Bun.build({ entrypoints: [path.join(root, 'src/index.ts')],
    outdir: path.join(destination, 'src'), target: 'node', format: 'esm', naming: 'index.js' })
  if (!built.success) throw new AggregateError(built.logs, 'Elixir scanner build failed')
  const { dependencies: _, devDependencies: __, ...manifest } = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'))
  await writeFile(path.join(destination, 'package.json'), `${JSON.stringify({ ...manifest,
    files: ['src', 'dist', 'LICENSE', 'TREE-SITTER-LICENSE', 'ELIXIR-GRAMMAR-LICENSE', 'ELIXIR-GRAMMAR-NOTICE', 'README.md', 'validation.md'],
    groma: { scanner: { ...manifest.groma.scanner, entry: './src/index.js' } },
  }, null, 2)}\n`)
  await cp(path.join(repository, 'LICENSE'), path.join(destination, 'LICENSE'))
  await cp(path.join(path.dirname(require.resolve('web-tree-sitter')), 'LICENSE'), path.join(destination, 'TREE-SITTER-LICENSE'))
  // The grammar is Apache-2.0: its license and the notice from its repository travel with the parser.
  await cp(path.join(grammar, 'LICENSE'), path.join(destination, 'ELIXIR-GRAMMAR-LICENSE'))
  await cp(path.join(root, 'ELIXIR-GRAMMAR-NOTICE'), path.join(destination, 'ELIXIR-GRAMMAR-NOTICE'))
  await cp(path.join(repository, 'docs/scanners/elixir/index.md'), path.join(destination, 'README.md'))
  await cp(path.join(repository, 'docs/scanners/elixir/validation.md'), path.join(destination, 'validation.md'))
}

if (import.meta.main) {
  const destination = path.resolve(process.argv[2] ?? path.join(root, 'dist/package'))
  await buildPackage(destination)
  console.log(destination)
}
