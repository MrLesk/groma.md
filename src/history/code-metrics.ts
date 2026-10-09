import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { ArchitectureGraph } from '../types.ts'
import type { CodeHistory, HistoryMetrics } from '../component-metrics.ts'

const git = promisify(execFile)

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
  const owners = new Map<string, string>()
  const components: Record<string, HistoryMetrics> = {}
  const committers = new Map<string, Set<string>>()
  const pairs = new Map<string, Map<string, number>>()
  for (const element of world.elements) {
    if (element.kind !== 'component') continue
    components[element.id] = { commits: 0, committers: 0, cochange: [] }
    committers.set(element.id, new Set())
    pairs.set(element.id, new Map())
    for (const reference of element.code) owners.set(reference.file, element.id)
  }
  for (const record of stdout.split('\x1e').slice(1)) {
    const [, email, ...files] = record.split('\0')
    const touched = new Set(files.flatMap(file => {
      const owner = owners.get(file.replace(/^\n/, ''))
      return owner === undefined ? [] : [owner]
    }))
    for (const id of touched) {
      components[id]!.commits += 1
      committers.get(id)!.add(email!)
      const peers = pairs.get(id)!
      for (const peer of touched) {
        if (peer !== id) peers.set(peer, (peers.get(peer) ?? 0) + 1)
      }
    }
  }
  for (const [id, metrics] of Object.entries(components)) {
    metrics.committers = committers.get(id)!.size
    metrics.cochange = [...pairs.get(id)!].map(([peer, commits]) => ({ id: peer, commits }))
      .sort((a, b) => b.commits - a.commits || a.id.localeCompare(b.id))
  }
  return { window, components }
}
