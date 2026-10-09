import { compareReviewPriority } from '../../../criticality.ts'
import { sourceIndex } from '../../../source-index.ts'
import type { ArchitectureGraph } from '../../../types.ts'
import type { TaskFileDiff } from '../../source/diff.ts'

/** Keep each owner's files together; review the riskiest, largest component changes first. */
export function taskReviewFiles(files: readonly TaskFileDiff[], world: ArchitectureGraph): TaskFileDiff[] {
  const index = sourceIndex(world.elements)
  const sizes = new Map<string, number>()
  const key = (file: TaskFileDiff) => index.owner(file.file)?.id ?? file.file
  for (const file of files) sizes.set(key(file), (sizes.get(key(file)) ?? 0) + file.additions + file.deletions)
  return [...files].sort((left, right) => {
    const priority = (file: TaskFileDiff) => ({ criticality: index.owner(file.file)?.criticality, size: sizes.get(key(file))! })
    return compareReviewPriority(priority(left), priority(right)) || key(left).localeCompare(key(right))
      || (right.additions + right.deletions) - (left.additions + left.deletions) || left.file.localeCompare(right.file)
  })
}
