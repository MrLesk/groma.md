import os from 'node:os'
import { API } from 'typescript/async'

/**
 * The compiler SDK for a repository. Its first request starts the compiler, a Go program, as a child process. Go lets
 * its heap grow to about twice the memory it still uses before it collects garbage. With a memory limit it collects
 * harder as the heap nears the limit instead, which keeps the compiler near or below a quarter of the machine's memory
 * and leaves the rest to the scanner and everything else running; scans that stay below the limit cost no extra time.
 * A program whose compiler needs more than the limit still finishes, much more slowly. A GOMEMLIMIT already in groma's
 * environment wins. Only the compiler gets the limit: other scanners start Go programs of their own while this one runs.
 *
 * The SDK accepts `env` only through patches/typescript@7.1.0-beta.patch. When the SDK is upgraded, recreate that patch
 * with `bun patch typescript`; removing `env` here instead would silently drop the limit.
 */
export function compilerApi(repositoryRoot: string): API {
  const limit = `${Math.floor(os.totalmem() / 4 / 2 ** 20)}MiB`
  return new API({ cwd: repositoryRoot, env: { ...process.env, GOMEMLIMIT: process.env.GOMEMLIMIT ?? limit } })
}
