import path from 'node:path'

/**
 * Whether a stored code reference stays inside the repository root: absolute paths and `..`
 * segments would turn the viewer into a reader of arbitrary files.
 */
export function containedReference(root: string, file: string): boolean {
  return file !== '' && path.resolve(root, file).startsWith(path.resolve(root) + path.sep)
}
