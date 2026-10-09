import { criticalityOf } from './criticality.ts'
import type { ArchitectureElement } from './types.ts'
import { readFile, realpath, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { compiledAsset } from './compiled-asset.ts'

const instructionFiles = ['AGENTS.md', 'CLAUDE.md'] as const
const managedBlockPattern = /<!-- groma:start -->[\s\S]*?<!-- groma:end -->/g

const managedAgentInstructions = `<!-- groma:start -->
## Groma

This project uses Groma. Before you scan, inspect, or curate architecture, or change files for a Backlog task, run \`groma agent-instructions\` and read the guide it names for that job. When it reports a first scan, ask the user whether they want you to curate the architecture. Do not edit Groma-owned architecture files directly.
<!-- groma:end -->`

/** Printed above the guide index while the stored architecture is still an uncurated first scan. */
export const firstScanAgentNote = 'This architecture is still its first scan: no element has a description or an overview yet. '
  + 'Ask the user whether they want you to curate it.'

/** Guides printed by name; running the command without a name prints the index that routes to them. */
export const agentGuideNames = ['inspect', 'structure', 'describe', 'relationships', 'backlog'] as const

function guideSource(name: string): string | URL {
  return compiledAsset('docs', 'agent-instructions', `${name}.md`)
    ?? new URL(`../docs/agent-instructions/${name}.md`, import.meta.url)
}

/** The index when no guide is named, a named guide's Markdown, or undefined for an unknown name. */
export async function readAgentGuide(name: string | undefined): Promise<string | undefined> {
  if (name !== undefined && !(agentGuideNames as readonly string[]).includes(name)) return undefined
  return (await readFile(guideSource(name ?? 'index'), 'utf8')).trimEnd()
}

function missingFile(error: unknown): boolean {
  return (error as NodeJS.ErrnoException).code === 'ENOENT'
}

async function existingInstructionFiles(repositoryRoot: string): Promise<string[]> {
  const files = await Promise.all(instructionFiles.map(async name => {
    const file = path.join(repositoryRoot, name)
    try {
      return { file, target: await realpath(file) }
    } catch (error) {
      if (missingFile(error)) return undefined
      throw error
    }
  }))
  const targets = new Set<string>()
  return files.flatMap(candidate => {
    if (candidate === undefined || targets.has(candidate.target)) return []
    targets.add(candidate.target)
    return [candidate.file]
  })
}

function reconcileManagedBlock(content: string): string {
  let found = false
  const reconciled = content.replace(managedBlockPattern, () => {
    if (found) return ''
    found = true
    return managedAgentInstructions
  })
  if (found) return reconciled
  if (content.length === 0) return `${managedAgentInstructions}\n`
  return `${content}${content.endsWith('\n') ? '\n' : '\n\n'}${managedAgentInstructions}\n`
}

export async function initializeAgentInstructions(repositoryRoot: string): Promise<void> {
  const existing = await existingInstructionFiles(repositoryRoot)
  const files = existing.length > 0
    ? existing
    : [path.join(repositoryRoot, 'AGENTS.md')]
  await Promise.all(files.map(async file => {
    const content = await readFile(file, 'utf8').catch(error => {
      if (missingFile(error)) return ''
      throw error
    })
    const reconciled = reconcileManagedBlock(content)
    if (reconciled !== content) await writeFile(file, reconciled)
  }))
}

/** Live architecture rules precede the static guide so an agent sees its protected scope. */
export function criticalityInstructions(elements: readonly ArchitectureElement[]): string {
  const byId = new Map(elements.map(element => [element.id, element]))
  return (['critical', 'high'] as const).flatMap(level => {
    const selected = elements.filter(element => criticalityOf(element, byId) === level)
    if (selected.length === 0) return []
    const rule = level === 'critical'
      ? 'Read-only for agents: do not change these elements or their files without explicit permission from a person.'
      : "Explain every change to these elements or their files in the task's implementation notes."
    return [`## ${level === 'critical' ? 'Critical' : 'High'} elements`, rule,
      ...selected.map(element => `- ${element.id} (${element.title})${element.code.length ? `: ${[...new Set(element.code.map(code => code.file))].join(', ')}` : ''}`), '']
  }).join('\n')
}
