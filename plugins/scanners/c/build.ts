import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const directory = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

/** Package the checked-in grammar; normal builds and consumers need no C toolchain. */
export async function buildPackage(output: string): Promise<void> {
  await mkdir(path.join(output, 'dist'), { recursive: true })
  const bundle = await Bun.build({ entrypoints: [path.join(directory, 'src/index.ts')],
    outdir: path.join(output, 'src'), target: 'node', format: 'esm', naming: 'index.js' })
  if (!bundle.success) throw new AggregateError(bundle.logs, 'C scanner adapter build failed')
  const runtime = path.dirname(require.resolve('web-tree-sitter'))
  const grammar = path.dirname(require.resolve('tree-sitter-c/package.json'))
  await copyFile(path.join(runtime, 'web-tree-sitter.wasm'), path.join(output, 'dist/web-tree-sitter.wasm'))
  await copyFile(path.join(directory, 'grammar/tree-sitter-c.wasm'), path.join(output, 'dist/tree-sitter-c.wasm'))
  await copyFile(path.join(directory, '../../../LICENSE'), path.join(output, 'LICENSE'))
  await copyFile(path.join(runtime, 'LICENSE'), path.join(output, 'web-tree-sitter.LICENSE'))
  await copyFile(path.join(grammar, 'LICENSE'), path.join(output, 'tree-sitter-c.LICENSE'))
  const { dependencies: _, devDependencies: __, ...manifest } = JSON.parse(await readFile(path.join(directory, 'package.json'), 'utf8'))
  await writeFile(path.join(output, 'package.json'), `${JSON.stringify({ ...manifest,
    files: ['src', 'dist', 'LICENSE', 'web-tree-sitter.LICENSE', 'tree-sitter-c.LICENSE'],
    groma: { scanner: { ...manifest.groma.scanner, entry: './src/index.js' } },
  }, null, 2)}\n`)
}

if (import.meta.main) {
  const output = process.argv[2] ?? path.join(directory, 'dist/package')
  await buildPackage(output)
  console.log(output)
}
