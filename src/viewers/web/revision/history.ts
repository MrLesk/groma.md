import { compareArchitecture, ownedFiles } from '../../../history/comparison.ts'
import { readGitText, withGitRevision } from '../../../history/revisions.ts'
import { readSourceTexts } from '../../../history/snapshots.ts'
import { loadMapRoot } from '../runtime.ts'
import type { WebRevision } from '../payload.ts'

/** Historical architecture is immutable: share each in-flight read for the lifetime of the web session. */
export function createRevisionHistory(repositoryRoot: string) {
  const snapshots = new Map<string, ReturnType<typeof read>>()

  async function read(revision: WebRevision) {
    return withGitRevision(repositoryRoot, revision.id, async root => {
      const map = await loadMapRoot(root)
      if (map.project === null) throw new Error('No Groma architecture in this commit')
      const sources = await readSourceTexts(root, ownedFiles(map.world))
      return { map, sources }
    })
  }

  function snapshot(revision: WebRevision) {
    let pending = snapshots.get(revision.id)
    if (pending === undefined) {
      pending = read(revision)
      snapshots.set(revision.id, pending)
    }
    return pending
  }

  // A comparison also needs files that were present but not owned on the other side.
  const extraSources = new Map<string, Promise<string | undefined>>()
  async function sourcesAt(revision: WebRevision, files: string[]) {
    const { sources } = await snapshot(revision)
    await Promise.all(files.filter(file => !Object.hasOwn(sources, file)).map(async file => {
      const key = `${revision.id}:${file}`
      let pending = extraSources.get(key)
      if (pending === undefined) {
        pending = readGitText(repositoryRoot, revision.id, file)
        extraSources.set(key, pending)
      }
      sources[file] = await pending
    }))
    return sources
  }

  async function compare(from: WebRevision, to: WebRevision) {
    const [before, after] = await Promise.all([snapshot(from), snapshot(to)])
    const files = [...new Set([...ownedFiles(before.map.world), ...ownedFiles(after.map.world)])]
    const [oldSources, newSources] = await Promise.all([sourcesAt(from, files), sourcesAt(to, files)])
    const { world, components, relationships } = compareArchitecture(before.map.world, after.map.world, oldSources, newSources)
    return { project: after.map.project, world, comparison: { from, components, relationships } }
  }

  /** Git's newest-first list defines the same ordering as the revision picker, never commit timestamps. */
  async function range(revisions: WebRevision[], from: string, to: string): Promise<WebRevision[]> {
    const start = revisions.findIndex(revision => revision.id === from)
    const end = revisions.findIndex(revision => revision.id === to)
    if (end < 0 || start <= end) throw new Error('Choose an older start commit and a newer end commit')
    const ordered = revisions.slice(end, start + 1).reverse()
    const compatible: WebRevision[] = []
    for (const revision of ordered) {
      try {
        await snapshot(revision)
        compatible.push(revision)
      } catch {
        // An older Markdown contract is not a frame the current reader can play.
      }
    }
    if (compatible[0]?.id !== from || compatible.at(-1)?.id !== to) {
      throw new Error('Both playback endpoints must have readable Groma architecture')
    }
    return compatible
  }

  return { snapshot, compare, range }
}
