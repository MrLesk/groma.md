import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('./', import.meta.url))

/** Bundle JavaScript and copy the parser WASM imports. This package is the same on every host. */
export async function buildPackage(destination: string): Promise<void> {
  await mkdir(destination, { recursive: true })
  const result = await Bun.build({ entrypoints: [path.join(root, 'src/index.ts')],
    outdir: path.join(destination, 'dist'), target: 'bun', format: 'esm', naming: 'index.js' })
  if (!result.success) throw new Error(result.logs.join('\n'))
  const require = createRequire(import.meta.url)
  await cp(path.join(root, '../../../LICENSE'), path.join(destination, 'LICENSE'))
  await cp(path.join(path.dirname(require.resolve('web-tree-sitter')), 'LICENSE'), path.join(destination, 'TREE-SITTER-LICENSE'))
  await cp(path.join(path.dirname(require.resolve('tree-sitter-cpp/package.json')), 'LICENSE'), path.join(destination, 'CPP-GRAMMAR-LICENSE'))
  const { dependencies: _, devDependencies: __, ...manifest } = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'))
  await writeFile(path.join(destination, 'package.json'), `${JSON.stringify({ ...manifest,
    exports: './dist/index.js', files: ['dist', 'LICENSE', 'TREE-SITTER-LICENSE', 'CPP-GRAMMAR-LICENSE', 'README.md'],
    groma: { scanner: { ...manifest.groma.scanner, entry: './dist/index.js' } },
  }, null, 2)}\n`)
  await cp(path.join(root, '../../../docs/scanners/cpp/index.md'), path.join(destination, 'README.md'))
}

if (import.meta.main) {
  const destination = process.argv[2] ?? path.join(root, 'dist/package')
  await rm(destination, { recursive: true, force: true })
  await buildPackage(destination)
  console.log(destination)
}
