import { existsSync, lstatSync, realpathSync } from 'node:fs'
import path from 'node:path'

/**
 * boundary scanner discovery and every scan select from. A symlink stays listed only when it resolves inside the
 * repository to a file that is not itself listed: a symlink to a listed file is that same file, listed once, and a
 * symlink leaving the repository, or one with no target at all, is not listed at all.
 */
export async function repositoryListing(repositoryRoot: string, useGitignore = true): Promise<string[]> {
  const child = Bun.spawn([
    'git', '-C', repositoryRoot, 'ls-files', '-z', '--cached', '--others', ...(useGitignore ? ['--exclude-standard'] : []),
  ], { stdout: 'pipe', stderr: 'pipe' })
  const [code, stdout, stderr] = await Promise.all([
    child.exited, new Response(child.stdout).text(), new Response(child.stderr).text(),
  ])
  if (code !== 0) throw new Error(stderr.trim() || `git ls-files exited ${code}`)
  const files = new Set(stdout.split('\0').filter(file => file && existsSync(path.join(repositoryRoot, file))))
  const physicalRoot = realpathSync(repositoryRoot)
  return [...files].filter(file => {
    const location = path.join(repositoryRoot, file)
    if (!lstatSync(location).isSymbolicLink()) return true
    // A vanished target between the existence check and the read must not fail the listing as an unhandled ENOENT.
    let target: string
    try { target = path.relative(physicalRoot, realpathSync(location)).split(path.sep).join('/') } catch { return false }
    const inside = target !== '' && !target.startsWith('..') && !path.isAbsolute(target)
    return inside && !files.has(target)
  }).sort()
}
