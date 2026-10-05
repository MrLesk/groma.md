import path from 'node:path'
import { Worker } from 'node:worker_threads'
import { within } from '../../project-scanner.ts'
import { combineObservations, relocateObservation } from '../../observations.ts'
import type { ScanObservation, ScannerPlugin, ScannerSettings } from '@groma/scanner'
import { checkJavaReadiness, readJavaOutline, scanJavaInputs } from './adapter.ts'
import { gradleProjects, withGradleDiagnostics } from './gradle.ts'
import { readJavaInput } from './java-input.ts'
import { summarizeMissingTypes } from './missing-types.ts'

/** Maven and Gradle project directories among the files, with the Gradle declarations only a Gradle run could resolve. */
async function javaProjects(root: string, files: readonly string[]) {
  const maven = files.filter(file => path.posix.basename(file) === 'pom.xml')
  const gradle = await gradleProjects(root, files)
  const directories = new Set([...maven.map(file => path.dirname(path.join(root, file))), ...gradle.directories])
  return { directories: [...directories].sort(), diagnostics: gradle.diagnostics }
}

/**
 * The files the build compiles, before exclusions: the candidates under each project's main source roots, never its
 * test sources, read the way the scan reads them.
 */
async function javaInputs(root: string, directories: string[], candidates: readonly string[]) {
  const inputs = await Promise.all(directories.map(async directory => {
    const project = within(root, directory, candidates)
    const input = await readJavaInput(directory, project.files)
    return input ? { key: project.key, input } : undefined
  }))
  return inputs.filter(input => input !== undefined)
}

async function javaSources(root: string, _settings: ScannerSettings, candidates: readonly string[]): Promise<string[]> {
  const projects = await javaProjects(root, candidates)
  const inputs = await javaInputs(root, projects.directories, candidates)
  return [...new Set(inputs.flatMap(({ key, input }) => input.files.map(file => path.posix.join(key, file))))].sort()
}

/** Keep Java preparation and observation parsing independent of other scanners' compiler work. */
async function scanJava(root: string, files: readonly string[]): Promise<ScanObservation | undefined> {
  const worker = new Worker(new URL(`./worker${path.extname(new URL(import.meta.url).pathname)}`, import.meta.url), {
    workerData: { root, files },
  })
  try {
    return await new Promise((resolve, reject) => {
      worker.once('message', resolve)
      worker.once('error', reject)
    })
  } finally { await worker.terminate() }
}

/** The host worker owns one complete Java scan, including project-local evidence and build diagnostics. */
export async function scanJavaProjects(root: string, files: readonly string[]) {
  const projects = await javaProjects(root, files)
  const inputs = await javaInputs(root, projects.directories, files)
  const observations = await scanJavaInputs(root, inputs.map(project => project.input))
  const observation = combineObservations(observations.map((observation, index) => ({
    key: inputs[index]!.key, observation: relocateObservation(observation, inputs[index]!.key),
  })))
  return withGradleDiagnostics(summarizeMissingTypes(observation), projects.diagnostics)
}

export default {
  id: 'java',
  readCodeStructure: readJavaOutline,
  checkReadiness: async (root, _settings, files) => {
    const projects = await javaProjects(root, files)
    if (!projects.directories.length) throw new Error('java: No supported project declaration was found.')
    await checkJavaReadiness(root)
    await javaInputs(root, projects.directories, files)
  },
  listSourceFiles: javaSources,
  scan: (root, _settings, files) => scanJava(root, files),
} satisfies ScannerPlugin
