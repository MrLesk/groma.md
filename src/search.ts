import Fuse from 'fuse.js/basic'

import { compareSemanticElements } from './element-order.ts'
import type { AnnotatedElement } from './types.ts'

export interface ArchitectureSearchResult {
  element: AnnotatedElement
  /** Ancestor titles from the architecture root to the element's parent. */
  path: readonly string[]
  /** Match distance, with zero representing an exact match. */
  score: number
}

export interface ArchitectureSearch {
  find(query: string): ArchitectureSearchResult[]
}

/**
 * How closely a query must match. Every index whose results are ranked in one list by score uses these
 * options, so that the scores compare.
 */
export const fuzzyMatching = { threshold: 0.35, ignoreLocation: true, includeScore: true } as const

/** Gives each of `elements` its ancestor titles, from the architecture root to the element's parent. */
export function ancestorPaths(elements: readonly AnnotatedElement[]): (element: AnnotatedElement) => string[] {
  const byId = new Map(elements.map(element => [element.representationId, element]))
  return element => {
    const path: string[] = []
    let parent = element.parent === null ? undefined : byId.get(element.parent)
    while (parent !== undefined) {
      path.unshift(parent.title)
      parent = parent.parent === null ? undefined : byId.get(parent.parent)
    }
    return path
  }
}

/** One semantic architecture index shared by every viewer. */
export function createArchitectureSearch(
  elements: readonly AnnotatedElement[],
): ArchitectureSearch {
  const pathOf = ancestorPaths(elements)
  const records = [...elements].sort(compareSemanticElements).map(element => {
    const path = pathOf(element)
    return { element, path, pathText: path.join(' ') }
  })
  const fuse = new Fuse(records, {
    ...fuzzyMatching,
    keys: [
      { name: 'element.title', weight: 0.55 },
      { name: 'element.id', weight: 0.25 },
      { name: 'pathText', weight: 0.15 },
      { name: 'element.overview', weight: 0.05 },
    ],
  })

  return {
    find(query) {
      const pattern = query.trim()
      if (pattern.length === 0) return []
      return fuse.search(pattern).map(({ item, score }) => ({
        element: item.element,
        path: item.path,
        score: score!,
      }))
    },
  }
}
