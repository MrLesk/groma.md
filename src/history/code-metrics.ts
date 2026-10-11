import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { ArchitectureGraph } from '../types.ts'
import type { CodeHistory, HistoryMetrics } from '../component-metrics.ts'
import { sourceIndex } from '../source-index.ts'

const git = promisify(execFile)

interface ComponentChanges {
  id: string
  commits: number
  /** Author email addresses; their number is the Committers metric. */
  authors: Set<string>
  pairs: Map<string, number>
}

function parseCommit(record: string, owners: ReadonlyMap<string, string>, components: Map<string, ComponentChanges>) {
  const [, author, ...files] = record.split('\0')
  const touched = new Set<ComponentChanges>()
  for (const file of files) {
    const owner = owners.get(file.replace(/^\n/, ''))
    const component = owner === undefined ? undefined : components.get(owner)
    if (component !== undefined) touched.add(component)
  }
  return { author: author!, touched }
}

function recordCommit(author: string, touched: Set<ComponentChanges>): void {
  for (const component of touched) {
    component.commits += 1
    component.authors.add(author)
    for (const peer of touched) {
      if (peer !== component) component.pairs.set(peer.id, (component.pairs.get(peer.id) ?? 0) + 1)
    }
  }
}

function historyMetrics(component: ComponentChanges): HistoryMetrics {
  return {
    commits: component.commits,
    committers: component.authors.size,
    cochange: [...component.pairs].map(([id, commits]) => ({ id, commits }))
      .sort((a, b) => b.commits - a.commits || a.id.localeCompare(b.id)),
  }
}

/**
 * Runs `git log` in `root` over the last `window` commits of the current branch and counts, for every component,
 * the commits and authors that touched its files and the commits it shares with each other component.
 * Returns null when the repository has no commit. Nothing is stored.
 */
export async function readCodeHistory(root: string, world: ArchitectureGraph, window = 500): Promise<CodeHistory | null> {
  try {
    await git('git', ['rev-parse', '--verify', '--quiet', 'HEAD'], { cwd: root })
  } catch {
    return null
  }
  // %aE is the author's address: the committer's (%cE) belongs to the hosting service for a commit merged on its web
  // page. --relative prints paths from `root`, as components record them, also when `root` is below the Git top level.
  const { stdout } = await git('git', [
    'log', `-n${window}`, '--format=%x1e%H%x00%aE', '--name-only', '--relative', '-z', '--no-renames', '--diff-merges=first-parent',
  ], { cwd: root, maxBuffer: 64 * 1024 * 1024 })
  const owners = sourceIndex(world.elements).byFile
  const components = new Map<string, ComponentChanges>()
  for (const element of world.elements) {
    if (element.kind === 'component') components.set(element.id, {
      id: element.id, commits: 0, authors: new Set(), pairs: new Map(),
    })
  }
  for (const record of stdout.split('\x1e').slice(1)) {
    const { author, touched } = parseCommit(record, owners, components)
    recordCommit(author, touched)
  }
  return { window, components: Object.fromEntries([...components].map(([id, component]) => [id, historyMetrics(component)])) }
}
