import { readFile, realpath } from 'node:fs/promises'
import { runtimeCertificates, withCertificateTrust } from '../certificate-trust.ts'
import { packageManagerCertificates } from '../scanner/modules/package-trust.ts'

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

async function succeeds(command: string[], cwd?: string, environment = process.env): Promise<boolean> {
  try {
    const child = Bun.spawn(command, { cwd, env: environment, stdin: 'ignore', stdout: 'ignore', stderr: 'ignore' })
    return await child.exited === 0
  } catch {
    return false
  }
}

/** Resolve only public effective CAs through the selected native npm, preserving its global-context precedence. */
async function npmCertificates(): Promise<string[]> {
  const executable = Bun.which('npm')
  if (executable === null) throw new Error('Cannot locate npm to read its CA configuration.')
  const source = `
    const fs = require('node:fs'), path = require('node:path');
    const executable = process.argv[1], directory = path.dirname(executable);
    const candidates = [executable.endsWith('npm-cli.js') ? executable : '',
      path.join(directory, 'node_modules/npm/bin/npm-cli.js')];
    const cli = candidates.find(candidate => candidate && fs.existsSync(candidate));
    if (!cli) throw new Error('Cannot locate the native npm CLI.');
    const root = path.resolve(path.dirname(cli), '..');
    const Config = require(path.join(root, 'node_modules/@npmcli/config'));
    const { definitions, flatten, shorthands, nerfDarts } = require(path.join(root, 'node_modules/@npmcli/config/lib/definitions'));
    const config = new Config({ npmPath: root, definitions, flatten, shorthands, nerfDarts,
      argv: [process.execPath, cli, '--global'], warn: false });
    config.load().then(() => {
      // npm ignores unreadable cafiles. Reject only an effective selection; a higher inline CA may replace it.
      let selectedFile;
      for (const { data } of config.data.values()) for (const key of Object.keys(data)) {
        if (key === 'ca') selectedFile = undefined;
        else if (key === 'cafile' && data[key]) selectedFile = data[key];
      }
      if (selectedFile) fs.readFileSync(selectedFile);
      process.stdout.write(JSON.stringify(config.flat.ca ?? null));
    }).catch(() => { process.stderr.write('Cannot read native npm CA configuration.'); process.exitCode = 1; });
  `
  const child = Bun.spawn(['node', '-e', source, await realpath(executable)], {
    env: { ...process.env, NPM_CONFIG_UPDATE_NOTIFIER: 'false' }, stdout: 'pipe', stderr: 'pipe',
  })
  const [code, stdout] = await Promise.all([
    child.exited, new Response(child.stdout).text(), new Response(child.stderr).text(),
  ])
  if (code !== 0) throw new Error("Could not read npm's effective CA configuration through its native CLI.")
  const selected: unknown = JSON.parse(stdout)
  if (selected === null) return runtimeCertificates()
  if (typeof selected === 'string') return [selected]
  if (Array.isArray(selected) && selected.every(value => typeof value === 'string')) return selected
  throw new Error('Native npm returned an unsupported CA configuration.')
}

async function installerCertificates(installer: PackageInstaller): Promise<string[]> {
  if (installer === 'bun') return packageManagerCertificates(process.cwd())
  if (installer === 'brew') {
    const file = process.env.CURL_CA_BUNDLE ?? process.env.SSL_CERT_FILE
    return file ? [await readFile(file, 'utf8')] : runtimeCertificates()
  }
  return npmCertificates()
}

/** Installs the current Backlog.md CLI, or updates an installed one when `upgrade` is set. */
export async function installBacklogCli(upgrade: boolean): Promise<void> {
  const installer = await packageInstaller()
  if (installer === undefined) throw new Error('Install bun, npm or Homebrew to install the Backlog.md CLI.')
  const command = installationCommand(installer, upgrade)
  const certificates = await installerCertificates(installer)
  await withCertificateTrust(certificates, async (cafile, environment) => {
    if (installer !== 'brew') command.push(`--cafile=${cafile}`)
    if (installer === 'npm') command.push('--strict-ssl=true')
    if (!await succeeds(command, undefined, { ...process.env, ...environment })) {
      throw new Error(`Could not run ${command.join(' ')}.`)
    }
  })
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
