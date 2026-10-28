---
id: TASK-634
title: Keep Python scanner fast in native AOT builds
status: Done
assignee:
  - '@codex'
created_date: '2026-10-28T01:19:00Z'
updated_date: '2026-10-28T01:41:00Z'
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
  - backlog/attachments/task-633/upstream-retention-report.md
ordinal: 702000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The installed Python scanner runs Pyodide in a worker thread. Under Bun AOT it interprets disk-loaded WebAssembly: a clean lint fixture took44.58s versus1.86s under JIT. A same-executable BUN_BE_BUN process with retained JIT completed the same output in2.15s, so a native main process can preserve Python performance without external Bun.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Python scan and source outlining preserve their evidence, diagnostics, failure and timeout behavior without requiring a separately installed runtime
- [x] #2 A native AOT consumer runs the Python fixture through the same executable close to the same-compiler JIT control instead of the reproduced interpreter slowdown
- [x] #3 Stable and native product checks cover the packaged worker on supported native release targets; experimental defaults remain off
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Acceptance criteria have objective verification evidence.
- [x] #2 Relevant checks pass and changes remain task-scoped.
- [x] #3 Public contracts or documentation are updated when behavior changes.
- [x] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Replace the Python worker-thread boundary with one subprocess implementation using the current executable in BUN_BE_BUN mode and IPC request/result, preserving the 120-second limit, parser warnings and errors. Retain jit explicitly for trimmed Groma so this scanner subprocess can compile its disk-loaded WebAssembly; the native main still uses AOT. Use existing Python evidence/outline/parser-warning regression coverage and fresh-checkout packaging checks; they detect missing IPC output, lost warnings, malformed source and external-runtime dependence. Add only a focused packaged AOT timing comparison for the reproduced performance gap, comparing identical evidence against same-compiler JIT. Bump only the scanner package version for changed published contents; do not publish or change root version. Qualify the staged scanner package on all five native release targets before claiming the slowdown fixed. This changes scanner execution plumbing, not OKF/C4 elements or stored architecture.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented one subprocess path using node:child_process.fork with current process.execPath, empty execArgv and BUN_BE_BUN=1. Request/result use IPC; result resolves only after worker close, timeout kills at120s, parser stderr is forwarded separately and preserved in failures. All17 existing Python tests/48assertions pass, including warnings and malformed source; types and changed-file lint pass. Actual AOT+trim consumer with staged0.2.4 passes scan/source evidence/lint exact JIT comparison/export: lint1873msAOT vs1916msJIT. New native timing guard allows3xJIT+1s for scheduling variance but catches old~24x interpreter path. Package0.2.4 and lockfile prepared without publication; CLI remains AOT and trimmed runtime retains jit for its scanner subprocess. Full required check and native results pending.

Clean final-source same-d260 Linux x64 comparison,10 measured runs after2warmups and identical output, no other local builds/tests: JIT175139528bytes/median51.89ms/median peakRSS73294KiB versus AOT+trim retaining cli,node-vm,jit196006600bytes/28.91ms/60500KiB. Python lint with only Git on PATH(no external Bun/Node/Python): JITmedian1848.275ms versus AOTmedian1795.945ms,10 measured after2warmups, identical stdout/stderr and exit0. Raw scratch results groma-python-ready-benchmark.json and groma-python-process-benchmark.json; these supersede older slower/smaller Groma artifacts. Node26.12.1 packaged Python scan also passes. Full required local check lint/types/Node pass;Bun905pass63skip28fail/996/143.46s, same missing-toolchain/procfs baseline. Native run40614894377 already passes22 scanner/evidence/lint/export gates, Python timing, console and Backlog web watch on Linux ARM and macOS ARM; each then fails only known untrimmed pm70. Windows and Linux x64 final evidence still pending when recorded.

Final native run40614894377 on2f30339ffdb6bda3313a51cef2b2f69db22d1a16 passes all trimmed gates on ALL FIVE targets, then each fails exactly untrimmed self pm with70. Python lint native/JIT timings(ms):Linux x64 2037/2205,Linux ARM1824/1941,macOS ARM1746/1996,Windows x64 2387/2704,Windows ARM2215/2398. Every host passes22 actual scanner consumers(21 published plus staged Python0.2.4), source evidence, exact lint findings, PNG export, stable default artifact, bytecode console control, AOT console/Ctrl+C, web/Backlog snapshot and live edit watch, covers, packaged runtime; Linux Chromium passes. Windows forced SIGTERM143 is still compared with the same-runtime control, separate from actual Ctrl+C0. Settled Windows console artifacts12784277063(SHA256fa06aa973468cd4ba367511bd28b7bcd101feae36b9035691d9361cc1e39dc67) were downloaded and visually compared: JIT and AOT resized maps render correctly. Trim without AOT also passes compiled7assertions and staged Python evidence/lint/export; this is independent trim validation, not completion of native AOT mode. No new product changes after tested2f; final regular CI still running.

Explicit timeout/lifecycle probe against the real compiled AOT consumer and packaged adapter: a fixture worker accepts IPC but never returns. At120.06s lint reports the120-second timeout, exits1 and the worker PID no longer exists. Stable Bun1.4.4 compiled Groma also passes staged Python0.2.4 source evidence/lint/export(native2208ms,JIT2476ms), supplementing Node26 and stable17-test coverage. Regular CI40614894278 Linux and Windows pass; macOS has972pass23skip1fail, solely flow records preserve the shared sheet due a5s filesystem-lock timeout. Python tests pass. The failed flow test/filesystem/helper are unchanged by this PR; current isolated6tests25assertions and unchanged-main parallel4-file baseline16tests90assertions pass. No lock/test timeout was changed, no assertion removed. One targeted macOS retry is running after investigation; preserve the initial failure and collect its result rather than retrying repeatedly.

Final self specification/quality review: one current-executable fork path owns requests/results, closes before resolution and keeps diagnostics separate; no external runtime, generic compatibility layer or architecture data changes. Stable17 Python assertions scenarios, Node scan, stable compiled consumer, native all5 consumer/timing gates and explicit120-second stalled-worker cleanup provide scope evidence. The macOS full-suite failure is now deterministically reproduced on unchanged main: web-map-highlights reads shared flows directly, so a parallel fixture copy can inherit its live lock. TASK635 owns the two-line fixture isolation correction. No Python/product code change is needed for that test defect. The original macOS failure remains recorded; one targeted rerun is still running.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Restored Python scan/outline performance in native AOT builds using a subprocess through the current executable, preserving IPC results, diagnostics, errors and the120s bound. All5 native targets pass; Linux median lint is1.80s AOT versus1.85s JIT with no external runtime on PATH. Prepared scanner0.2.4 without publication. CLI remains native AOT; retaining CLI/JIT increases the measured binary to196MB versus175MB bytecode. Untrimmed compiler retention and the separate test-fixture race remain tracked outside this task.
<!-- SECTION:FINAL_SUMMARY:END -->
