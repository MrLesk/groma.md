---
id: TASK-634
title: Keep Python scanner fast in native AOT builds
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-28T01:19:00Z'
updated_date: '2026-10-28T01:24:00Z'
labels: []
dependencies: []
references:
  - plugins/scanners/python/src/index.ts
  - plugins/scanners/python/worker/runtime.ts
  - scripts/build.ts
modified_files:
  - plugins/scanners/python/src/index.ts
  - plugins/scanners/python/worker/runtime.ts
  - scripts/build.ts
  - plugins/scanners/python/package.json
  - bun.lock
  - scripts/qualify-compiled-scanners.ts
  - .github/workflows/aot.yml
  - docs/scanners/python/index.md
  - docs/native-aot.md
ordinal: 702000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The installed Python scanner runs Pyodide in a worker thread. Under Bun AOT it interprets disk-loaded WebAssembly: a clean lint fixture took44.58s versus1.86s under JIT. A same-executable BUN_BE_BUN process with retained JIT completed the same output in2.15s, so a native main process can preserve Python performance without external Bun.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Python scan and source outlining preserve their evidence, diagnostics, failure and timeout behavior without requiring a separately installed runtime
- [ ] #2 A native AOT consumer runs the Python fixture through the same executable close to the same-compiler JIT control instead of the reproduced interpreter slowdown
- [ ] #3 Stable and native product checks cover the packaged worker on supported native release targets; experimental defaults remain off
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Replace the Python worker-thread boundary with one subprocess implementation using the current executable in BUN_BE_BUN mode and IPC request/result, preserving the 120-second limit, parser warnings and errors. Retain jit explicitly for trimmed Groma so this scanner subprocess can compile its disk-loaded WebAssembly; the native main still uses AOT. Use existing Python evidence/outline/parser-warning regression coverage and fresh-checkout packaging checks; they detect missing IPC output, lost warnings, malformed source and external-runtime dependence. Add only a focused packaged AOT timing comparison for the reproduced performance gap, comparing identical evidence against same-compiler JIT. Bump only the scanner package version for changed published contents; do not publish or change root version. Qualify the staged scanner package on all five native release targets before claiming the slowdown fixed. This changes scanner execution plumbing, not OKF/C4 elements or stored architecture.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented one subprocess path using node:child_process.fork with current process.execPath, empty execArgv and BUN_BE_BUN=1. Request/result use IPC; result resolves only after worker close, timeout kills at120s, parser stderr is forwarded separately and preserved in failures. All17 existing Python tests/48assertions pass, including warnings and malformed source; types and changed-file lint pass. Actual AOT+trim consumer with staged0.2.4 passes scan/source evidence/lint exact JIT comparison/export: lint1873msAOT vs1916msJIT. New native timing guard allows3xJIT+1s for scheduling variance but catches old~24x interpreter path. Package0.2.4 and lockfile prepared without publication; CLI remains AOT and trimmed runtime retains jit for its scanner subprocess. Full required check and native results pending.
<!-- SECTION:NOTES:END -->
