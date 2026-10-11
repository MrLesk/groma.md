import { cp, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** Platform-independent SVG package, staged alongside the official scanner packages. */
export async function buildPackage(output: string): Promise<void> {
  const source = fileURLToPath(new URL('.', import.meta.url))
  await mkdir(output, { recursive: true })
  await cp(path.join(source, 'icons'), path.join(output, 'icons'), { recursive: true })
  await cp(path.join(source, 'package.json'), path.join(output, 'package.json'))
  await cp(fileURLToPath(new URL('../../../LICENSE', import.meta.url)), path.join(output, 'LICENSE'))
}
