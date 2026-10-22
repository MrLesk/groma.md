import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import packageJson from '../package.json' with { type: 'json' }

const root = fileURLToPath(new URL('..', import.meta.url))
const { platformPackages } = createRequire(import.meta.url)('./npm/install.cjs') as { platformPackages: string[] }

/** Stage the small npm package; postinstall supplies its native command from a platform dependency. */
export async function packageCli(destination: string, version: string): Promise<void> {
  await mkdir(path.join(destination, 'bin'), { recursive: true })
  await copyFile(path.join(root, 'scripts/npm/install.cjs'), path.join(destination, 'install.cjs'))
  for (const file of ['README.md', 'LICENSE']) await copyFile(path.join(root, file), path.join(destination, file))
  // npm creates Unix links and Windows shims before postinstall. No shebang means direct executable shims.
  // The .exe suffix is also used on Unix so one manifest serves every supported platform.
  await writeFile(path.join(destination, 'bin/groma.exe'), '', { mode: 0o755 })
  const { name, description, license, author, homepage, repository, bugs, keywords } = packageJson
  await writeFile(path.join(destination, 'package.json'), `${JSON.stringify({
    name, version, description, license, author, homepage, repository, bugs, keywords,
    bin: { groma: 'bin/groma.exe' },
    scripts: { postinstall: 'node install.cjs' },
    files: ['bin/groma.exe', 'install.cjs', 'package.json', 'README.md', 'LICENSE'],
    optionalDependencies: Object.fromEntries(platformPackages.map(name => [name, version])),
  }, null, 2)}\n`)
}

if (import.meta.main) {
  const [destination, version] = process.argv.slice(2)
  if (destination === undefined || version === undefined) throw new Error('Usage: bun scripts/package-cli.ts <directory> <version>')
  await packageCli(destination, version)
}
