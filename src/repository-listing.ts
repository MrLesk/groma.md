import { existsSync, lstatSync, realpathSync } from 'node:fs'
import path from 'node:path'

/**
 * The repository files that exist, tracked and untracked, less the ones Git ignores while `useGitignore` holds: the
 * boundary scanner discovery and every scan select from. A symlink to another listed file is the same physical file,
 * so only the file it points to is listed.
 */
export async function repositoryListing(repositoryRoot: string, useGitignore = true): Promise<string[]> {
  const child = Bun.spawn([
    'git', '-C', repositoryRoot, 'ls-files', '-z', '--cached', '--others', ...(useGitignore ? ['--exclude-standard'] : []),
  ], { stdout: 'pipe', stderr: 'pipe' })
  const [code, stdout, stderr] = await Promise.all([
    child.exited, new Response(child.stdout).text(), new Response(child.stderr).text(),
  ])
  if (code !== 0) throw new Error(stderr.trim() || `git ls-files exited ${code}`)
  const files = new Set(stdout.split('\0').filter(Boolean))
  const physicalRoot = realpathSync(repositoryRoot)
  return [...files].filter(file => {
    const location = path.join(repositoryRoot, file)
    // A listed temporary file can disappear while Git's output is being read.
    const entry = lstatSync(location, { throwIfNoEntry: false })
    if (!entry) return false
    return !entry.isSymbolicLink()
      || (existsSync(location) && !files.has(path.relative(physicalRoot, realpathSync(location)).split(path.sep).join('/')))
  }).sort()
}
