import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

/**
 * The only code in `src/` that reads scanner releases from a package registry or downloads them. The release script
 * (`scripts/scanner-release.ts`) also checks and publishes releases with `npm` itself.
 *
 * Reading a release and downloading it both run Bun's package manager, so the two steps cannot disagree about the
 * registry, a scope's registry, the token or the proxy. Bun reads registries and tokens from the user's `.npmrc`
 * and the proxy from `HTTP_PROXY` / `HTTPS_PROXY`. Never `fetch` a registry: that request would ignore those settings.
 */

/** Groma's own executable is Bun, and `BUN_BE_BUN` makes it act as the `bun` command. */
async function runPackageManager(directory: string, args: string[], registry?: string) {
  const command = [process.execPath, ...args]
  if (registry !== undefined) command.push(`--registry=${registry}`)
  const child = Bun.spawn(command, {
    cwd: directory,
    env: { ...process.env, BUN_BE_BUN: '1' },
    stdout: 'pipe', stderr: 'pipe',
  })
  const [exitCode, stdout, stderr] = await Promise.all([
    child.exited, new Response(child.stdout).text(), new Response(child.stderr).text(),
  ])
  return { exitCode, stdout, stderr }
}

/**
 * One release of a package as its registry publishes it: the fields of that release's package.json, plus `versions`,
 * the version numbers of all releases. Without `version` this is the registry's latest release.
 *
 * An unknown package, a registry error and a network error throw. A version the registry does not list, or a package
 * without versions, returns undefined; the release script's wait relies on that. That case is recognised by Bun's own
 * text "No matching version found", the one place this module depends on another program's wording.
 *
 * The manifest is returned as the registry sent it. `Manifest` is the caller's claim about its shape and nothing
 * validates it, so callers check the fields they use.
 */
export async function readPublishedRelease<Manifest>(
  name: string,
  { version, registry }: { version?: string; registry?: string } = {},
): Promise<(Manifest & { versions: string[] }) | undefined> {
  // Bun looks a package up only from inside a project. A new empty project has no `.npmrc` of its own, so the
  // lookup sees the user's configuration alone, as the download does in its cache directory.
  const project = await mkdtemp(path.join(tmpdir(), 'groma-release-'))
  try {
    await writeFile(path.join(project, 'package.json'), '{}\n')
    const specifier = version === undefined ? name : `${name}@${version}`
    const { exitCode, stdout, stderr } = await runPackageManager(project, ['pm', 'view', specifier, '--json'], registry)
    if (exitCode === 0) return JSON.parse(stdout)
    // Bun prints the unlisted-version answer as JSON on stdout; registry and network errors are text on stderr.
    if (stdout.includes('No matching version found')) return undefined
    throw new Error(`${name}: could not read its published releases. Check the package name, your connection and registry access, then retry.\n${stderr.trim() || `exit ${exitCode}`}`)
  } finally {
    await rm(project, { recursive: true, force: true })
  }
}

/** Download the dependencies of the package.json in `directory`. `source` names them in the error. */
export async function installDependencies(directory: string, source: string, registry?: string): Promise<void> {
  // A release selected by pm view can be newer than install's cached registry manifest.
  const { exitCode, stderr } = await runPackageManager(directory, ['install', '--ignore-scripts', '--no-cache'], registry)
  if (exitCode !== 0) {
    throw new Error(`Could not download ${source}. Check your connection and registry access, then retry.\n${stderr.trim() || `exit ${exitCode}`}`)
  }
}
