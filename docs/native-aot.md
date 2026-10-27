# Experimental native AOT builds

Shipping releases still use the verified Bun 1.4.4 bytecode build. Bun's native
compiler is experimental in [PR 45631](https://github.com/oven-sh/bun/pull/45631).
Do not publish an experimental artifact as a release before native qualification.

From the repository root, install dependencies with stable Bun, then prepare the
pinned native compiler with patched Node.js 26.12.1 or later:

```bash
bun install --frozen-lockfile
node scripts/prepare-bun-runtime.cjs --aot
```

The preparation command prints the executable path. In GitHub Actions it also
sets `GROMA_BUILD_EXECUTABLE_PATH` and adds its directory to `PATH`. Outside CI,
run the printed executable directly:

```bash
GROMA_BUILD_AOT=1 /path/to/verified/bun scripts/build.ts
GROMA_BUILD_AOT=1 GROMA_BUILD_TRIM=1 /path/to/verified/bun scripts/build.ts
```

`GROMA_BUILD_TRIM=1` also works without AOT; that build retains bytecode. The
running compiler must support each requested flag. Experimental builds embed
that same compiler, so omit `GROMA_BUILD_EXECUTABLE_PATH` locally. AOT enables
loading installed scanner code and dependencies from disk. No scanner package
or product feature is removed to make trimming succeed.

Trimmed builds explicitly retain Bun's command line because scanner lookup and
installation invoke the executable with `BUN_BE_BUN=1`. On the pinned compiler,
untrimmed AOT drops that capability and cannot install npm scanners. This is an
open shipping blocker for that mode. The native workflow checks it explicitly;
an artifact from a failed qualification is diagnostic, not a release candidate.
Keeping the whole command line also makes Groma larger than the same-compiler
JIT build. Narrow package-manager retention requires upstream compiler work.

The compiler pin in `scripts/aot-compiler.json` records Buildkite build 133944,
full commit d260d7d51ba4280c836a600df2123f42986c8669, archive and executable
SHA-256 digests, and revision 1.4.4-canary.1+d260d7d51. The archives were checked
against Buildkite's artifact digests before recording these SHA-256 values.
Updating the compiler requires updating and verifying the entire pin.

The separate **Experimental native AOT qualification** workflow builds on native
Linux x64/arm64, macOS arm64 and Windows x64/arm64 runners, preserving the release
matrix's x64 baseline targets. Both AOT modes run the compiled local-scanner,
guide, export/PNG and packaged-runtime checks, plus live web assets, covers,
source watching and process termination. POSIX shutdown must exit gracefully;
Windows forced termination must match a same-compiler JIT control. Windows
console Ctrl+C and full terminal interaction remain separate qualification gates.
Its artifacts are experimental.
The Linux x64 runner also renders the live map in Chromium using pinned
Playwright CLI 1.62.1 and retains screenshots beside the binaries.
The workflow does not publish packages or releases. It runs when its build or
qualification files change in a pull request, or through manual dispatch.

Linux x64 product checks also exercise the packaged official TypeScript scanner,
its SDK worker, live HTML/JS/world/cover routes, filesystem watch refresh,
terminal details and shutdown. Other native targets need their own results;
Linux success does not qualify them. The required full repository check still
has environment and baseline failures, recorded in TASK-632 and PR #189.
