import type { WorkItem } from '@groma/work-source'
import Fuse from 'fuse.js/basic'

import { ancestorPaths, createArchitectureSearch, fuzzyMatching, type ArchitectureSearchResult } from '../../../search.ts'
import type { AnnotatedElement, AnnotatedGroup } from '../../../types.ts'

export type WebSearchResult =
  | ({ kind: 'architecture' } & ArchitectureSearchResult)
  | {
    kind: 'group'
    group: AnnotatedGroup
    /** Ancestor titles from the architecture root to the container of the group's members. */
    path: readonly string[]
    score: number
  }
  | { kind: 'task'; task: WorkItem; score: number }

function taskIndex(tasks: readonly WorkItem[]) {
  return new Fuse(tasks, {
    ...fuzzyMatching,
    keys: [
      { name: 'title', weight: 0.7 },
      { name: 'id', weight: 0.3 },
    ],
  })
}

/**
 * Stored groups by title and id, each with the path to its container. All members of a group have the same
 * container (docs/component-markdown.md, Groups), so the path of the first member is the group's.
 */
function groupIndex(groups: readonly AnnotatedGroup[], elements: readonly AnnotatedElement[]) {
  const pathOf = ancestorPaths(elements)
  const records = groups.map(group => {
    const member = elements.find(element => element.group === group.id)
    return { group, path: member === undefined ? [] : pathOf(member) }
  })
  return new Fuse(records, {
    ...fuzzyMatching,
    keys: [
      { name: 'group.title', weight: 0.7 },
      { name: 'group.id', weight: 0.3 },
    ],
  })
}

/** Combines core architecture search with the stored groups and with summaries supplied by an optional work plugin. */
export function createWebSearch(
  elements: readonly AnnotatedElement[], groups: readonly AnnotatedGroup[], tasks: readonly WorkItem[],
) {
  const architecture = createArchitectureSearch(elements)
  const storedGroups = groupIndex(groups, elements)
  let work = taskIndex(tasks)

  return {
    updateTasks(tasks: readonly WorkItem[]) {
      work = taskIndex(tasks)
    },
    find(query: string): WebSearchResult[] {
      const pattern = query.trim()
      if (pattern.length === 0) return []
      const results: WebSearchResult[] = [
        ...architecture.find(pattern).map(result => ({ kind: 'architecture' as const, ...result })),
        ...storedGroups.search(pattern).map(({ item, score }) => ({ kind: 'group' as const, ...item, score: score! })),
        ...work.search(pattern).map(({ item, score }) => ({ kind: 'task' as const, task: item, score: score! })),
      ]
      return results.sort((left, right) => left.score - right.score)
    },
  }
}
