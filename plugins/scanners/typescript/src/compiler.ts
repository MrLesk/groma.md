import os from 'node:os'
import { API } from 'typescript/async'

/**
 * The compiler SDK for a repository. Its first request starts the compiler, a Go program, as a child process. Go lets
 * its heap grow to about twice the memory it still uses before it collects garbage. With a memory limit it collects
 * harder as the heap nears the limit instead, so a large program stays under a quarter of the machine's memory, leaving
 * the rest to the scanner and everything else running; scans that stay below the limit cost no extra time. A program
 * whose compiler needs more than the limit still finishes, more slowly. A GOMEMLIMIT set for groma wins. Only the
 * compiler gets the limit: other scanners start Go programs of their own while this one runs.
 */
export function compilerApi(repositoryRoot: string): API {
  const limit = `${Math.floor(os.totalmem() / 4 / 2 ** 20)}MiB`
  return new API({ cwd: repositoryRoot, env: { ...process.env, GOMEMLIMIT: process.env.GOMEMLIMIT ?? limit } })
}
