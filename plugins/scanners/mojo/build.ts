import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('./', import.meta.url))

/** Both maintainers and consumers use the checked-in portable parser; rebuilding its grammar is a separate update. */
export async function buildPackage(destination: string): Promise<void> {
  await mkdir(path.join(destination, 'dist'), { recursive: true })
  await cp(path.join(root, 'grammar/tree-sitter-mojo.wasm'), path.join(destination, 'dist/tree-sitter-mojo.wasm'))
  await cp(fileURLToPath(import.meta.resolve('web-tree-sitter/web-tree-sitter.wasm')),
    path.join(destination, 'dist/web-tree-sitter.wasm'))
  const built = await Bun.build({ entrypoints: [path.join(root, 'src/index.ts')],
    outdir: path.join(destination, 'src'), target: 'node', format: 'esm', naming: 'index.js' })
  if (!built.success) throw new AggregateError(built.logs, 'Mojo scanner build failed')
  const { dependencies: _, ...manifest } = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'))
  await writeFile(path.join(destination, 'package.json'), `${JSON.stringify({ ...manifest,
    files: ['src', 'dist', 'LICENSE', 'THIRD-PARTY-NOTICES.txt'],
    groma: { scanner: { ...manifest.groma.scanner, entry: './src/index.js' } },
  }, null, 2)}\n`)
  await cp(path.join(root, '../../../LICENSE'), path.join(destination, 'LICENSE'))
  await cp(path.join(root, 'THIRD-PARTY-NOTICES.txt'), path.join(destination, 'THIRD-PARTY-NOTICES.txt'))
}

if (import.meta.main) {
  const output = path.resolve(process.argv[2] ?? path.join(root, 'dist/package'))
  await buildPackage(output)
  await cp(path.join(output, 'dist'), path.join(root, 'dist'), { recursive: true })
  console.log(output)
}
