import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { ArchitectureGraph } from '../types.ts'
import type { CodeHistory, HistoryMetrics } from '../component-metrics.ts'
import { sourceIndex } from '../source-index.ts'

const git = promisify(execFile)

interface ComponentChanges {
  id: string
  commits: number
  committers: Set<string>
  pairs: Map<string, number>
}

function parseCommit(record: string, owners: ReadonlyMap<string, string>, components: Map<string, ComponentChanges>) {
  const [, email, ...files] = record.split('\0')
  const touched = new Set<ComponentChanges>()
  for (const file of files) {
    const owner = owners.get(file.replace(/^\n/, ''))
    const component = owner === undefined ? undefined : components.get(owner)
    if (component !== undefined) touched.add(component)
  }
  return { email: email!, touched }
}

function recordCommit(email: string, touched: Set<ComponentChanges>): void {
  for (const component of touched) {
    component.commits += 1
    component.committers.add(email)
    for (const peer of touched) {
      if (peer !== component) component.pairs.set(peer.id, (component.pairs.get(peer.id) ?? 0) + 1)
    }
  }
}

function historyMetrics(component: ComponentChanges): HistoryMetrics {
  return {
    commits: component.commits,
    committers: component.committers.size,
    cochange: [...component.pairs].map(([id, commits]) => ({ id, commits }))
      .sort((a, b) => b.commits - a.commits || a.id.localeCompare(b.id)),
  }
}

/** Read the current branch without blocking the first map paint or persisting measurements. */
export async function readCodeHistory(root: string, world: ArchitectureGraph, window = 500): Promise<CodeHistory | null> {
  try {
    await git('git', ['rev-parse', '--verify', '--quiet', 'HEAD'], { cwd: root })
  } catch {
    return null
  }
  const { stdout } = await git('git', [
    'log', `-n${window}`, '--format=%x1e%H%x00%cE', '--name-only', '-z', '--no-renames', '--diff-merges=first-parent',
  ], { cwd: root, maxBuffer: 64 * 1024 * 1024 })
  const owners = sourceIndex(world.elements).byFile
  const components = new Map<string, ComponentChanges>()
  for (const element of world.elements) {
    if (element.kind === 'component') components.set(element.id, {
      id: element.id, commits: 0, committers: new Set(), pairs: new Map(),
    })
  }
  for (const record of stdout.split('\x1e').slice(1)) {
    const { email, touched } = parseCommit(record, owners, components)
    recordCommit(email, touched)
  }
  return { window, components: Object.fromEntries([...components].map(([id, component]) => [id, historyMetrics(component)])) }
}
