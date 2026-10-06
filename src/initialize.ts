import { initializeAgentInstructions } from './agent-instructions.ts'
import {
  GromaFileSystem,
  type GromaDirectory,
} from './groma-filesystem.ts'
import {
  type ProjectProfile,
  parseProjectProfile,
  renderProjectProfile,
  saveProjectProfile,
} from './project-profile.ts'

export interface GromaInitInput {
  projectName?: string
  directory?: string
}

export interface GromaInitPrompts {
  projectName(current?: string): Promise<string>
  directory(): Promise<string>
}

export interface GromaInitResult {
  directory: GromaDirectory
  projectName: string
  status: 'initialized' | 'unchanged' | 'updated'
}

/** A storage folder alone is not a project; both initialization records must exist. */
export function gromaInitialization(repositoryRoot: string): { directory?: GromaDirectory; initialized: boolean } {
  const filesystem = GromaFileSystem.find(repositoryRoot)
  return {
    directory: filesystem?.directory,
    initialized: filesystem?.exists('index.md') === true && filesystem.exists('project.md'),
  }
}

async function existingProjectProfile(
  filesystem: GromaFileSystem | undefined,
): Promise<ProjectProfile | undefined> {
  if (filesystem === undefined || !filesystem.exists('project.md')) return undefined
  const sourceFilename = filesystem.sourceFilename('project.md')
  return parseProjectProfile(
    await filesystem.read('project.md'),
    sourceFilename,
  )
}

async function requiredProjectName(
  supplied: string | undefined,
  current: string | undefined,
  prompts: GromaInitPrompts | undefined,
): Promise<string> {
  const selected = supplied ?? (prompts === undefined
    ? current
    : await prompts.projectName(current))
  const projectName = selected?.trim()
  if (!projectName) {
    throw new Error('project name is required when Groma is not initialized')
  }
  return projectName
}

async function requiredDirectory(
  supplied: string | undefined,
  prompts: GromaInitPrompts | undefined,
): Promise<string> {
  const directory = (supplied ?? await prompts?.directory())?.trim()
  if (!directory) {
    throw new Error('--directory is required when Groma is not initialized')
  }
  return directory
}

export async function initializeGroma(
  repositoryRoot: string,
  input: GromaInitInput = {},
  prompts?: GromaInitPrompts,
): Promise<GromaInitResult> {
  const existing = GromaFileSystem.find(repositoryRoot)
  if (existing !== undefined && input.directory !== undefined) {
    GromaFileSystem.initialize(repositoryRoot, input.directory)
  }
  const storedProfile = await existingProjectProfile(existing)
  const projectName = await requiredProjectName(
    input.projectName,
    storedProfile?.title,
    prompts,
  )
  const requestedDirectory = existing?.directory
    ?? await requiredDirectory(input.directory, prompts)
  const filesystem = GromaFileSystem.initialize(
    repositoryRoot,
    existing === undefined ? requestedDirectory : input.directory,
  )

  const status = await filesystem.withAccess(async () => {
    const current = await existingProjectProfile(filesystem)
    const status = current === undefined ? 'initialized' : current.title === projectName ? 'unchanged' : 'updated'
    if (current === undefined) {
      await filesystem.write('project.md', await renderProjectProfile({ title: projectName, overview: `Architecture for ${projectName}.` }))
    } else if (status === 'updated') {
      await saveProjectProfile(repositoryRoot, { ...current, title: projectName })
    }
    await filesystem.refreshIndex()
    return status
  })
  await initializeAgentInstructions(repositoryRoot)

  return {
    directory: filesystem.directory,
    projectName,
    status,
  }
}
