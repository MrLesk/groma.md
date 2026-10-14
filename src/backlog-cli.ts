import { realpath } from 'node:fs/promises'

/**
 * The Backlog.md command-line tool, which the bundled Backlog.md work source reads tasks through. groma.md installs
 * it when a project's config.json lists Backlog.md, and runs `backlog init` for a new project.
 */

export type PackageInstaller = 'brew' | 'bun' | 'npm'

/** The command that installs the current Backlog.md CLI, or brings an older one up to date. */
export function installationCommand(installer: PackageInstaller, upgrade: boolean): string[] {
  if (installer === 'brew') return ['brew', upgrade ? 'upgrade' : 'install', 'backlog-md']
  if (installer === 'npm') return ['npm', 'install', '--global', 'backlog.md@latest']
  return ['bun', 'add', '--global', 'backlog.md@latest']
}

/** The package manager that installed groma.md, read from the path of the running executable. */
export function inferPackageInstaller(executablePath: string): PackageInstaller | undefined {
  const normalized = executablePath.replaceAll('\\', '/').toLowerCase()
  if (normalized.includes('/.bun/install/global/')) return 'bun'
  if (normalized.includes('/cellar/') || normalized.includes('/homebrew/')) return 'brew'
  if (normalized.includes('/node_modules/')) return 'npm'
  return undefined
}

async function currentExecutablePath(): Promise<string> {
  const filename = process.argv[1]
  if (filename === undefined) return ''
  return realpath(filename).catch(() => filename)
}

/** The package manager groma.md was installed with, else the first of bun, npm and brew on the PATH. */
export async function packageInstaller(): Promise<PackageInstaller | undefined> {
  const inferred = inferPackageInstaller(await currentExecutablePath())
  if (inferred) return inferred
  return (['bun', 'npm', 'brew'] as const).find(installer => Bun.which(installer) !== null)
}

async function succeeds(command: string[], cwd?: string): Promise<boolean> {
  try {
    const child = Bun.spawn(command, { cwd, stdin: 'ignore', stdout: 'ignore', stderr: 'ignore' })
    return await child.exited === 0
  } catch {
    return false
  }
}

/** Installs the current Backlog.md CLI, or updates an installed one when `upgrade` is set. */
export async function installBacklogCli(upgrade: boolean): Promise<void> {
  const installer = await packageInstaller()
  if (installer === undefined) throw new Error('Install bun, npm or Homebrew to install the Backlog.md CLI.')
  const command = installationCommand(installer, upgrade)
  if (!await succeeds(command)) throw new Error(`Could not run ${command.join(' ')}.`)
}

export function backlogInitialized(repositoryRoot: string): Promise<boolean> {
  return succeeds(['backlog', 'config', 'get', 'projectName'], repositoryRoot)
}

export function initializeBacklog(repositoryRoot: string, projectName: string): Promise<boolean> {
  return succeeds([
    'backlog', 'init', projectName,
    '--defaults',
    '--integration-mode', 'cli',
    '--auto-open-browser', 'false',
    '--agent-instructions', 'agents',
  ], repositoryRoot)
}
