# R scanner validation

Executed on macOS arm64 on 25 October 2026 for TASK-629. These are local
package checks, not a published release or qualification of other platforms.
The package used tree-sitter-r 1.3.0 and web-tree-sitter 0.25.10.

## Public repositories

Each repository was cloned with `git clone --depth 1` into
`/tmp/groma-r-scanner-629/repos/<name>`. No R package installation, project
build, or project code execution ran. The exact checked revisions and
observed top-level function counts follow.

| Repository | Commit | R source files | Named functions | Verified source anchor |
| --- | --- | ---: | ---: | --- |
| [dplyr](https://github.com/tidyverse/dplyr) | `d5e94e7fa8fd4a5f79c1a707d1842216bb4c691f` | 109 | 820 | `R/filter.R:216`, `filter` |
| [ggplot2](https://github.com/tidyverse/ggplot2) | `b638d654c8189db82a62307fefa84b1da1819da5` | 213 | 895 | `R/plot.R:106`, `ggplot` |
| [Shiny](https://github.com/rstudio/shiny) | `bbc43849f06059f5daa7310ea0f40ec901f0ed0f` | 151 | 718 | `R/shinyapp.R:74`, `shinyApp` |
| [Plumber](https://github.com/rstudio/plumber) | `393920505f289f914150d57e06d97347556a55dc` | 87 | 227 | `R/pr.R:37`, `pr` |
| [targets](https://github.com/ropensci/targets) | `06cae18bf0306ee98ce2f6f0a647e26410ddca22` | 288 | 1,398 | `R/tar_target.R:422`, `tar_target` |
| [data.table](https://github.com/Rdatatable/data.table) | `e24d1b891f219c241a0975b434e2eae26092fd86` | 75 | 459 | `R/data.table.R:44`, `data.table` |
| [rlang](https://github.com/r-lib/rlang) | `b4a2a057ea67613cc13cdbaed9eb0c421400e96a` | 77 | 1,236 | `R/env.R:97`, `env` |

Six repositories passed with the package's default file selection. Shiny's
default scan failed at `inst/app_template/app.R:27`: the file contains
`{{...}}` HTML template sections, not valid R. Its recorded successful scan
adds `inst/app_template/` to that repository's configured exclusions. The
scanner has no Shiny-specific default or template fallback.

The local qualification command was:

```sh
bun plugins/scanners/r/build.ts /tmp/groma-r-scanner-629/package
bun /tmp/groma-r-scanner-629/qualify.ts
```

The harness uses `scannerFiles` from the existing selection module and the
built package's manifest. It checks readiness, scans twice, compares complete
observations, compares inventory with `listSourceFiles`, and reads each
table anchor through `readCodeStructure`. The reported line is checked against
the source. SHA-256 hashes of all selected inputs remain equal, and
`git status --porcelain` remains empty in every checkout. The raw results
are recorded locally in `/tmp/groma-r-scanner-629/results.json`.

For another checkout, the same scanner API sequence is:

```ts
const files = await scannerFiles(repository, manifest.groma.scanner)
await scanner.checkReadiness(repository, {}, files)
const first = await scanner.scan(repository, {}, files)
const repeated = await scanner.scan(repository, {}, files)
const outline = await scanner.readCodeStructure(repository, [{ file, symbols: [name] }])
```

These checks verify source inventory and direct function declarations. They
do not verify runtime correctness, package exports, S3/S4/R6 behavior, call
resolution, framework relationships, or execution boundaries.

## Focused checks

`bun test --max-concurrency 1 test-bun/r-scanner.test.ts` passes both tests.
The tests check selected source and package membership, direct function
recognition and source lines, invalid-source rejection, discovery, and a
built package in an empty environment with network fetches rejected.
The fixture contains code that throws if executed; parsing never runs it.
The isolated package scan repeats identically and leaves its source unchanged.
