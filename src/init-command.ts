import { stat } from 'node:fs/promises'
import { join } from 'node:path'

import { loadArchitecture } from './architecture-reader.ts'
import { backlogInitialized, initializeBacklog } from './work/backlog-cli.ts'
import { createClackInitUi } from './init-command-ui.ts'
import {
  initializeGroma,
  type GromaInitInput,
  type GromaInitResult,
  gromaInitialization,
  type GromaInitPrompts,
} from './initialize.ts'
import { formatScanSummary, scanRepository } from './scanner.ts'
import { NOT_INITIALIZED, type GromaDirectory } from './groma-filesystem.ts'
import { c4Kind } from './okf-profile.ts'
import { addPlugin } from './plugins/management.ts'
import { readGromaConfig } from './config.ts'
import { setupScanners, type ScannerSetupUi } from './scanner/modules/setup.ts'

export interface InitCommandInput {
  directory?: string
  interactive: boolean
  projectName?: string
  repositoryRoot: string
  /** The caller scans and opens a viewer afterwards, so the wizard skips its scan and viewer questions. */
  opensViewer?: boolean
}

export interface InitCommandUi extends ScannerSetupUi {
  cancel(message: string): void
  confirmInit(): Promise<boolean | undefined>
  confirmOpenWeb(): Promise<boolean | undefined>
  confirmScan(): Promise<boolean | undefined>
  confirmUseBacklog(): Promise<boolean | undefined>
  directory(): Promise<GromaDirectory | undefined>
  error(message: string): void
  install(message: string, operation: () => Promise<boolean>): Promise<boolean>
  intro(): Promise<void> | void
  note(message: string, title: string): void
  outro(message: string): void
  projectName(current?: string): Promise<string | undefined>
}

export interface RepositoryInitDependencies {
  backlogAvailable(): boolean
  backlogInitialized(repositoryRoot: string): Promise<boolean>
  gitInitialized(repositoryRoot: string): Promise<boolean>
  initializeBacklog(repositoryRoot: string, projectName: string): Promise<boolean>
  initializeGit(repositoryRoot: string): Promise<boolean>
}

export interface InitCommandDependencies extends RepositoryInitDependencies {
  /** Adds Backlog.md to config.json and installs its CLI when missing. */
  addBacklog(repositoryRoot: string): Promise<void>
  error(message: string): void
  output(message: string): void
  scan(repositoryRoot: string): ReturnType<typeof scanRepository>
  setupScanners: typeof setupScanners
  ui: InitCommandUi
}

export interface InitCommandActions {
  openWeb(): Promise<void>
}

export interface RepositoryInitResult extends GromaInitResult {
  /**
   * What became of Backlog.md, which is set up only for a project whose config.json lists it:
   * - `unselected`: config.json lists no work source;
   * - `unavailable`: Backlog.md is listed but the `backlog` CLI is not installed;
   * - `unchanged`, `initialized` or `failed`: Backlog.md is listed and the CLI was asked.
   */
  backlog: 'unselected' | 'unavailable' | 'unchanged' | 'initialized' | 'failed'
}

class InitializationCancelled extends Error {}

const clackUi = createClackInitUi()

async function pathExists(filename: string): Promise<boolean> {
  try {
    await stat(filename)
    return true
  } catch {
    return false
  }
}

async function gitInitialized(repositoryRoot: string): Promise<boolean> {
  return pathExists(join(repositoryRoot, '.git'))
}

async function initializeGit(repositoryRoot: string): Promise<boolean> {
  try {
    const child = Bun.spawn(['git', 'init', '--quiet'], {
      cwd: repositoryRoot,
      stdin: 'ignore',
      stdout: 'ignore',
      stderr: 'ignore',
    })
    return await child.exited === 0
  } catch {
    return false
  }
}

const defaultDependencies: InitCommandDependencies = {
  addBacklog: async repositoryRoot => { await addPlugin(repositoryRoot, 'backlog') },
  backlogAvailable: () => Bun.which('backlog') !== null,
  backlogInitialized,
  error: message => console.error(message),
  gitInitialized,
  initializeBacklog,
  initializeGit,
  output: message => console.log(message),
  scan: scanRepository,
  setupScanners,
  ui: clackUi,
}

function cancelled(): never {
  throw new InitializationCancelled()
}

function interactivePrompts(ui: InitCommandUi): GromaInitPrompts {
  return {
    projectName: async current => await ui.projectName(current) ?? cancelled(),
    directory: async () => await ui.directory() ?? cancelled(),
  }
}

async function ensureGit(
  repositoryRoot: string,
  dependencies: RepositoryInitDependencies,
): Promise<void> {
  if (await dependencies.gitInitialized(repositoryRoot)) return
  if (await dependencies.initializeGit(repositoryRoot)) return
  throw new Error('Could not initialize Git. Groma setup cannot continue.')
}

/** Runs `backlog init` only for a project whose config.json lists Backlog.md. */
async function initializeSelectedBacklog(
  repositoryRoot: string,
  projectName: string,
  dependencies: RepositoryInitDependencies,
): Promise<RepositoryInitResult['backlog']> {
  const config = await readGromaConfig(repositoryRoot)
  if (!config.workSources.some(work => work.id === 'backlog')) return 'unselected'
  if (!dependencies.backlogAvailable()) return 'unavailable'
  if (await dependencies.backlogInitialized(repositoryRoot)) return 'unchanged'
  return await dependencies.initializeBacklog(repositoryRoot, projectName)
    ? 'initialized'
    : 'failed'
}

/** Shared repository setup used by the terminal wizard and browser setup form. */
export async function initializeRepository(
  repositoryRoot: string,
  input: GromaInitInput,
  overrides: Partial<RepositoryInitDependencies> = {},
  prompts?: GromaInitPrompts,
): Promise<RepositoryInitResult> {
  const dependencies = { ...defaultDependencies, ...overrides }
  await ensureGit(repositoryRoot, dependencies)
  const groma = await initializeGroma(repositoryRoot, input, prompts)
  const backlog = await initializeSelectedBacklog(repositoryRoot, groma.projectName, dependencies)
  return { ...groma, backlog }
}

function settingsSummary(projectName: string, directory: GromaDirectory): string {
  return `Project: ${projectName}\nGroma folder: ${directory}/`
}

function commandReminder(ui: InitCommandUi): void {
  ui.note('Run groma web for the browser map.', 'Open Groma later')
}

/**
 * Asks whether the project uses Backlog.md, with yes preselected. On yes it adds Backlog.md through the plugin flow,
 * which installs the CLI when missing. True when Backlog.md is ready to initialize.
 */
async function chooseBacklog(repositoryRoot: string, dependencies: InitCommandDependencies): Promise<boolean> {
  const ui = dependencies.ui
  const wanted = await ui.confirmUseBacklog()
  if (wanted === undefined) cancelled()
  if (!wanted) return false
  let failure = ''
  const added = await ui.install('Adding Backlog.md', async () => {
    try {
      await dependencies.addBacklog(repositoryRoot)
      return true
    } catch (error) {
      failure = error instanceof Error ? error.message : String(error)
      return false
    }
  })
  if (!added) ui.error(`Could not add Backlog.md. ${failure} Groma setup will continue.`)
  return added
}

/** The wizard's Backlog.md step: offers it to a project without a work source and reports what did not work. */
async function offerBacklog(
  repositoryRoot: string,
  projectName: string,
  status: RepositoryInitResult['backlog'],
  dependencies: InitCommandDependencies,
): Promise<void> {
  let outcome = status
  if (status === 'unselected') {
    if (!await chooseBacklog(repositoryRoot, dependencies)) return
    outcome = await initializeSelectedBacklog(repositoryRoot, projectName, dependencies)
  }
  if (outcome === 'unavailable') {
    dependencies.ui.error('Backlog.md is selected but its CLI is not installed, so it was not initialized. Groma setup will continue.')
  }
  if (outcome === 'failed') {
    dependencies.ui.error('Could not initialize Backlog.md. Groma setup will continue.')
  }
}

function completionMessage(
  status: 'initialized' | 'unchanged' | 'updated',
  projectName: string,
): string {
  if (status === 'unchanged') return 'Groma settings unchanged'
  const verb = status === 'updated' ? 'Updated' : 'Initialized'
  return `${verb} Groma project: ${projectName}`
}

/** Offer a first scan and the browser map; a caller that opens its own viewer skips both. */
async function offerFirstScan(
  input: InitCommandInput,
  dependencies: InitCommandDependencies,
  actions: InitCommandActions,
  completed: string,
): Promise<void> {
  const ui = dependencies.ui
  if (input.opensViewer) {
    ui.outro(completed)
    return
  }
  const runScan = await ui.confirmScan()
  if (runScan === undefined) cancelled()
  if (!runScan) {
    commandReminder(ui)
    ui.outro(completed)
    return
  }
  const summary = await dependencies.scan(input.repositoryRoot)
  ui.note(formatScanSummary(summary), 'First scan complete')
  const openWeb = await ui.confirmOpenWeb()
  if (openWeb === undefined) cancelled()
  commandReminder(ui)
  ui.outro(completed)
  if (openWeb) await actions.openWeb()
}

async function hasObservedComponents(repositoryRoot: string): Promise<boolean> {
  const records = await loadArchitecture(repositoryRoot)
  return records.documents.some(document => {
    return c4Kind(document.frontmatter.type) === 'component'
      && document.frontmatter.status === 'stable'
  })
}

export async function runInitCommand(
  input: InitCommandInput,
  actions: InitCommandActions,
  overrides: Partial<InitCommandDependencies> = {},
): Promise<'cancelled' | 'completed'> {
  const dependencies = { ...defaultDependencies, ...overrides }
  const ui = dependencies.ui
  try {
    if (input.interactive) await ui.intro()
    const result = await initializeRepository(
      input.repositoryRoot,
      { projectName: input.projectName, directory: input.directory },
      overrides,
      input.interactive ? interactivePrompts(ui) : undefined,
    )
    const completed = completionMessage(result.status, result.projectName)
    if (!input.interactive) {
      dependencies.output(completed)
      dependencies.output(`Groma folder: ${result.directory}/`)
      await dependencies.setupScanners(input.repositoryRoot, false, ui, dependencies.output)
      return 'completed'
    }

    ui.note(settingsSummary(result.projectName, result.directory), 'Groma settings')
    await offerBacklog(input.repositoryRoot, result.projectName, result.backlog, dependencies)
    if (result.status !== 'initialized' && await hasObservedComponents(input.repositoryRoot)) {
      ui.outro(completed)
      return 'completed'
    }
    if (!await dependencies.setupScanners(input.repositoryRoot, true, ui, dependencies.output)) cancelled()
    await offerFirstScan(input, dependencies, actions, completed)
    return 'completed'
  } catch (error) {
    if (!(error instanceof InitializationCancelled)) throw error
    if (input.interactive) ui.cancel('Initialization cancelled.')
    return 'cancelled'
  }
}

export type FirstRunOutcome = 'ready' | 'declined' | 'missing' | 'cancelled'

/**
 * The terminal viewer's setup entry. Nothing to do when the project records exist;
 * one sentence and a failure without a TTY; on a TTY, the offer to run the init wizard.
 */
export async function ensureInitialized(
  input: InitCommandInput,
  overrides: Partial<InitCommandDependencies> = {},
): Promise<FirstRunOutcome> {
  if (gromaInitialization(input.repositoryRoot).initialized) return 'ready'
  const dependencies = { ...defaultDependencies, ...overrides }
  if (!input.interactive) {
    dependencies.error(NOT_INITIALIZED)
    return 'missing'
  }
  const wanted = await dependencies.ui.confirmInit()
  if (wanted === undefined) {
    dependencies.ui.cancel('Initialization cancelled.')
    return 'cancelled'
  }
  if (!wanted) {
    dependencies.output('Run groma init when you are ready.')
    return 'declined'
  }
  const outcome = await runInitCommand(input, { openWeb: async () => undefined }, overrides)
  return outcome === 'completed' ? 'ready' : 'cancelled'
}
