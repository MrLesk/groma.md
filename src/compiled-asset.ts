import { existsSync } from 'node:fs'
import path from 'node:path'

// Bundling flattens modules into the asset root; AOT keeps this module in src/.
// The build always embeds docs/, which identifies the root in either layout.
const embeddedRoot = globalThis.Bun?.isStandaloneExecutable === true
  ? (existsSync(path.join(import.meta.dir, 'docs')) ? import.meta.dir : path.dirname(import.meta.dir))
  : undefined

/**
 * Path of a file the build embedded through `compile.assets`, or undefined when running from source.
 * AOT preserves module directories, so module locations do not identify the asset root.
 */
export function compiledAsset(...parts: string[]): string | undefined {
  return embeddedRoot === undefined ? undefined : path.join(embeddedRoot, ...parts)
}
