import { homedir } from 'node:os'
import path from 'node:path'

import packageJson from '../../package.json' with { type: 'json' }

import { humanInstructionGuides } from '../instructions.ts'
import { pluginPresence } from '../plugin-management.ts'
import { readPluginSettings, type PluginSettings } from '../scanner/modules/settings.ts'

export const documentationUrl = 'https://groma.md'
export const welcomeVersion = packageJson.version

export const welcomeActions = [
  {
    id: 'web',
    command: 'groma web',
    description: 'scan and open the browser map',
  },
  {
    id: 'scan',
    command: 'groma scan',
    description: 'refresh architecture from source',
  },
  { id: 'plugins', command: 'Plugins ›', description: 'Manage project plugins' },
] as const

export const instructionsAction = {
  command: 'groma instructions',
  description: 'read how Groma works',
} as const

export const advancedCommands = [
  {
    command: 'groma lint',
    description: 'report architecture issues',
    content: 'Checks current evidence from installed scanners for possible duplicate logic. Does not change saved architecture. Exit code 1 means findings or a scanner failure; 0 means no findings in available evidence.',
  },
  {
    command: 'groma export <directory>',
    description: 'export a static site',
    content: 'Writes a static snapshot of the stored architecture to <directory>. Serve or upload the output separately. Run the command again to publish an updated snapshot.',
  },
  {
    command: 'groma plugin add <plugin>',
    description: 'bundled id, exact npm/Git source or ./path',
    content: 'Adds a plugin to config.json: a bundled plugin by its id, such as backlog, or a scanner from an exact npm package version, Git source or local directory.',
  },
  {
    command: 'groma plugin install',
    description: 'restore missing plugins',
    content: 'Restores the plugins config.json lists that this computer lacks: downloads scanner packages and installs the Backlog.md CLI.',
  },
  {
    command: 'groma plugin list',
    description: 'show found/missing',
    content: 'Lists every plugin config.json lists and whether this computer has it.',
  },
  {
    command: 'groma plugin remove <id>',
    description: 'remove; keep shared cache',
    content: 'Removes a plugin from config.json. Shared downloaded packages remain cached for other projects.',
  },
  {
    command: 'groma add <thing> <name> …',
    description: 'actor, external, draft, relation, group',
    content: [
      'Declares a person, an external system, or a draft record with its overview, a relation from one id to another, or a group of sibling components.',
      'The scanner never sees those; scanned software is drafted instead.',
    ].join('\n'),
  },
  {
    command: 'groma draft <kind> <name> …',
    description: 'kind, overview, optional draft',
    content: [
      'Drafts a system, container, or component as a ghost at the path it will keep.',
      'Use --draft <id> to file it under a draft record.',
      'Containers and components require --parent.',
    ].join('\n'),
  },
  {
    command: 'groma edit <id> …',
    description: 'id + change options',
    content: 'Changes an element, a draft record, or the project record by id: rename, describe, set technology, tag with a draft, or curate scanned structure.',
  },
  {
    command: 'groma remove <id>',
    description: 'remove an eligible architecture record',
    content: 'Removes a person, external, ghost, component without Code references, unused draft, relation, or group. For scanned components, delete their source files and scan first. Dependencies can still block removal.',
  },
  {
    command: 'groma accept <id>',
    description: 'matched draft id',
    content: 'Accepts a drafted element only after a scan has matched that id.',
  },
  {
    command: 'groma agent-instructions [guide]',
    description: 'guide named in the index',
    content: [
      'Prints the index of Markdown guides for coding agents.',
      'Pass [guide] to print one guide the index names.',
      'This command always stays plain text.',
    ].join('\n'),
  },
] as const

export const instructionsIndex = welcomeActions.length
export const advancedIndex = instructionsIndex + 1

const advancedLabel = 'Advanced commands'
const parameterLegend = '<required> [optional] […more]'
export const nestedPageIndicator = ' ›'

export type WelcomeActionId = typeof welcomeActions[number]['id']

export interface WelcomeModel {
  pluginSettings?: PluginSettings
  /** The names of the plugins config.json lists that this computer lacks. */
  missingPlugins?: string[]
  project: string
  folder: string
  status: string
}

export interface WelcomeSheet {
  commandWidth: number
  descriptionWidth: number
  innerWidth: number
}

export interface WelcomeRow {
  command: string
  description: string
  selected: boolean
  dim: boolean
  opensPage: boolean
}

export interface InstructionView {
  title: string
  description: string
  content: string
}

export const instructionViews: InstructionView[] = humanInstructionGuides.map(guide => ({
  title: guide.title,
  description: guide.description,
  content: guide.content,
}))

function displayFolder(repositoryRoot: string): string {
  const root = path.resolve(repositoryRoot)
  const home = homedir()
  return root === home || root.startsWith(`${home}${path.sep}`)
    ? `~${root.slice(home.length)}`
    : root
}

export async function loadWelcomeModel(repositoryRoot: string): Promise<WelcomeModel> {
  const root = path.resolve(repositoryRoot)
  return {
    project: path.basename(root),
    folder: displayFolder(root),
    status: 'Architecture ready',
    pluginSettings: await readPluginSettings(root),
    // An unreadable config.json is already reported by the plugin settings notice.
    missingPlugins: await pluginPresence(root).then(plugins => plugins.filter(plugin => !plugin.present).map(plugin => plugin.name), () => []),
  }
}

/** The plugins config.json lists that this computer lacks and how to restore them, or nothing when it has them all. */
export function missingPluginsSummary(model: WelcomeModel): string | undefined {
  return model.missingPlugins?.length ? `${model.missingPlugins.join(', ')} · groma plugin install` : undefined
}

export function welcomeSheet(model: WelcomeModel): WelcomeSheet {
  const context = ` project: ${model.project} │ folder: ${model.folder} │ status: ${model.status} `
  const rows = [
    ...launcherRows(0),
    ...advancedRows(),
    ...instructionRows(0),
  ]
  const commands = rows.map(row => (
    `${row.command}${row.opensPage ? nestedPageIndicator : ''}`
  ))
  const descriptions = rows.map(row => row.description)
  const commandWidth = Math.max(...commands.map(command => command.length + 2))
  const descriptionWidth = Math.max(...descriptions.map(description => description.length))
  const innerWidth = Math.max(context.length, commandWidth + descriptionWidth + 5)
  return {
    commandWidth,
    descriptionWidth: innerWidth - commandWidth - 5,
    innerWidth,
  }
}

export async function renderPlainWelcome(repositoryRoot: string): Promise<string> {
  const model = await loadWelcomeModel(repositoryRoot)
  const missing = missingPluginsSummary(model)
  return [
    `groma.md v${welcomeVersion}`,
    'architecture in Git',
    `docs: ${documentationUrl}`,
    '',
    `project: ${model.project}`,
    `folder: ${model.folder}`,
    `status: ${model.status}`,
    ...(missing ? [`missing plugins: ${missing}`] : []),
    '',
    ...welcomeActions.map(action => `${action.command} — ${action.description}`),
    `${instructionsAction.command} — ${instructionsAction.description}`,
    '',
    `${advancedLabel} — ${parameterLegend}`,
    ...advancedCommands.map(command => `${command.command} — ${command.description}`),
  ].join('\n')
}

export function launcherRows(selectedIndex: number): WelcomeRow[] {
  const rows: WelcomeRow[] = welcomeActions.map((action, index) => ({
    command: action.command,
    description: action.description,
    selected: index === selectedIndex,
    dim: false,
    opensPage: false,
  }))
  rows.push({
    ...instructionsAction,
    selected: selectedIndex === instructionsIndex,
    dim: false,
    opensPage: true,
  }, {
    command: advancedLabel,
    description: parameterLegend,
    selected: selectedIndex === advancedIndex,
    dim: false,
    opensPage: true,
  })
  return rows
}

export function advancedRows(selectedIndex = 0): WelcomeRow[] {
  return advancedCommands.map((command, index) => ({
    command: command.command,
    description: command.description,
    selected: selectedIndex === index + 1,
    dim: false,
    opensPage: false,
  }))
}

export function instructionRows(selectedIndex: number): WelcomeRow[] {
  return instructionViews.map((guide, index) => ({
    command: guide.title,
    description: guide.description,
    selected: selectedIndex === index + 1,
    dim: false,
    opensPage: false,
  }))
}
