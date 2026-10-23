import { chmod, copyFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import packageJson from '../package.json' with { type: 'json' }

const root = fileURLToPath(new URL('..', import.meta.url))
const platformPackages = [
  'groma.md-linux-x64', 'groma.md-linux-arm64', 'groma.md-darwin-arm64',
  'groma.md-windows-x64', 'groma.md-windows-arm64',
]

/** Stage only the launcher and its runtime requirements, independently of build tools. */
export async function packageCli(destination: string, version: string): Promise<void> {
  await mkdir(destination, { recursive: true })
  await copyFile(path.join(root, 'scripts/npm/cli.cjs'), path.join(destination, 'cli.cjs'))
  for (const file of ['README.md', 'LICENSE']) await copyFile(path.join(root, file), path.join(destination, file))
  const { name, description, license, author, homepage, repository, bugs, keywords } = packageJson
  await writeFile(path.join(destination, 'package.json'), `${JSON.stringify({
    name, version, description, license, author, homepage, repository, bugs, keywords,
    engines: { node: '>=16.20.2' },
    bin: { groma: 'cli.cjs' },
    files: ['cli.cjs', 'package.json', 'README.md', 'LICENSE'],
    optionalDependencies: Object.fromEntries(platformPackages.map(name => [name, version])),
  }, null, 2)}\n`)
}

/** npm filters CPU metadata using Node's architecture, which can be x64 under Rosetta. */
export async function packagePlatform(destination: string, version: string, platform: {
  name: string; os: string; cpu: string; binary: string
}): Promise<void> {
  await mkdir(destination, { recursive: true })
  const binary = platform.os === 'win32' ? 'groma.exe' : 'groma'
  await copyFile(platform.binary, path.join(destination, binary))
  if (platform.os !== 'win32') await chmod(path.join(destination, binary), 0o755)
  await copyFile(path.join(root, 'LICENSE'), path.join(destination, 'LICENSE'))
  await writeFile(path.join(destination, 'package.json'), `${JSON.stringify({
    name: platform.name, version, description: 'Groma standalone architecture CLI', license: packageJson.license,
    repository: packageJson.repository,
    os: [platform.os], cpu: platform.os === 'darwin' ? ['arm64', 'x64'] : [platform.cpu],
    files: [binary, 'package.json', 'LICENSE'],
  }, null, 2)}\n`)
}

if (import.meta.main) {
  const [kind, destination, version, name, os, cpu, binary] = process.argv.slice(2)
  if (kind === 'wrapper' && destination && version) await packageCli(destination, version)
  else if (kind === 'platform' && destination && version && name && os && cpu && binary) {
    await packagePlatform(destination, version, { name, os, cpu, binary })
  } else throw new Error('Usage: scripts/package-cli.ts wrapper|platform <directory> <version> [name os cpu binary]')
}
