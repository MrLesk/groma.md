# Experimental native AOT builds

Shipping releases still use the verified Bun 1.4.4 bytecode build. Bun's native
compiler was introduced in [PR 45631](https://github.com/oven-sh/bun/pull/45631),
merged on 2026-10-27. This qualification still uses the verified experimental pin.
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
installation invoke the executable with `BUN_BE_BUN=1`. They also retain
`node:vm`, which the installed Python scanner's Pyodide runtime loads from disk. On the pinned compiler,
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
Windows forced termination must match a same-compiler JIT control. The console gate uses the project-prescribed `tui-test` procedure for root,
details, container/back navigation and resize, retains SVG screenshots and
requires an actual Ctrl+C exit of zero on each native host. Its driver is
`tui-test` 0.1.1, verified against official archive SHA-256 digests; Windows ARM
runs the x64 test driver under emulation while the product remains native ARM64.
Native run 40609596964 passes console navigation, resize and actual Ctrl+C exit0
on all five hosts in trimmed mode, separately from forced termination.
The official-scanner gate installs the package versions declared in the checkout
into temporary consumer projects. It requires actual fixture code evidence,
lint findings identical to a same-compiler JIT control and an exported PNG; a zero scan exit alone is insufficient
because failed scanners can preserve old data. Its artifacts are experimental.
The Linux x64 runner also renders the live map in Chromium using pinned
Playwright CLI 1.62.1 and retains screenshots beside the binaries.
The native web gate also uses published backlog.md@1.55.3 from a temporary npm
prefix: a real task must appear in Groma, then a CLI edit must reach its live
work-source snapshot. The native platform binary is exposed on PATH; no Backlog
release is required for this integration check. Cross-platform results are pending.
The workflow does not publish packages or releases. It runs when its build or
qualification files change in a pull request, or through manual dispatch.

Linux x64 product checks also exercise the packaged official TypeScript scanner,
its SDK worker, live HTML/JS/world/cover routes, filesystem watch refresh,
terminal details and shutdown. Run 40609596964 passes all 22 published official scanner consumers, compiled
assets, web/watch, console and packaging gates on all five native targets in
trimmed mode. Each job then fails the known untrimmed package-manager check. The required full repository check still
has environment and baseline failures, recorded in TASK-632 and PR #189.

The release build keeps explicit `GROMA_BUILD_AOT=0` and `GROMA_BUILD_TRIM=0`
defaults. A reviewed opt-in selects the pinned native compiler. Before upload,
the release job checks self package-manager capability, the compiled scanner
and asset regression, and the existing npm runtime requirements. It cannot
publish the known failing untrimmed AOT artifact through these gates.

Performance needs a release decision too. On the same pinned Linux x64 compiler,
10 plain-view runs after two warmups measured JIT at 175139528 bytes, median
52.62ms and median peak RSS 73408KiB; functional AOT+trim retaining CLI and
node:vm measured 185975624 bytes, 29.83ms and 60942KiB, with identical output.
One clean paired Python lint run measured 1855.36ms under JIT versus 44578.91ms
under AOT, with identical output. Disk-loaded Pyodide WebAssembly remains
interpreted under AOT. Explicitly retaining jit did not improve that probe.
These fixture measurements are not universal performance claims; the Python
regression needs resolution or an explicit release tradeoff before enabling AOT.
