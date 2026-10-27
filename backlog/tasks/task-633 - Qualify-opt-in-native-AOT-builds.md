---
id: TASK-633
title: Qualify opt-in native AOT builds
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-27T23:16:00Z'
updated_date: '2026-10-27T23:31:00Z'
labels: []
dependencies: []
references:
  - scripts/build.ts
  - scripts/prepare-bun-runtime.cjs
  - .github/workflows/release.yml
modified_files:
  - scripts/build.ts
  - scripts/aot-compiler.json
  - scripts/prepare-bun-runtime.cjs
  - .github/workflows/aot.yml
  - docs/native-aot.md
  - scripts/qualify-compiled-web.ts
ordinal: 701000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The actual build script still emits bytecode builds and requires a scratch wrapper for native compilation. Release qualification needs repeatable opt-in AOT and trim modes, scanner disk loading and native checks on every existing release target without changing publication defaults.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Default build and release behavior remain unchanged; opt-in AOT and trim modes reject an unsupported compiler or a mismatched runtime
- [ ] #2 Opt-in AOT and AOT+trim pass compiled smoke with disk-loaded scanners and embedded assets
- [ ] #3 Native qualification covers every release OS and architecture with verified compiler provenance and records real results or concrete blockers
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
Use the existing build entry point with explicit opt-in environment flags, bytecode disabled for AOT, scanner disk imports enabled, and current compiler/runtime identity enforced. Check compiler capability before accepting experimental flags. Add native qualification outside the publishing workflow, using pinned Buildkite artifacts and checksums for the existing five release targets. Reuse compiled scanner and package runtime smoke coverage. Test defaults and unsupported-mode errors locally, then execute native CI and record platform gates.

Extend native delivery qualification beyond the existing CLI/export regression: the user explicitly requires real web, native watching and shutdown on supported targets. Existing compiled-scanner and packaging checks do not start the compiled HTTP server or cause a watched source change. Add a small consumer qualification script using the same flows fixture and a disk-loaded scanner/dependency; verify embedded HTML/JS, world JSON, all cover images, a new source component after watching, and graceful shutdown in each native CI mode.

Run a real Chromium rendering gate on the Linux x64 hosted runner, where the browser can be downloaded independently of this scratch environment. Use pinned Playwright CLI 1.62.1 without adding a product dependency; wait for the JavaScript-rendered map SVG and retain the screenshot as qualification evidence. Other native runners retain the HTTP/watch/shutdown gate.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented opt-in GROMA_BUILD_AOT=1 and independent GROMA_BUILD_TRIM=1 in scripts/build.ts; AOT disables bytecode and permits installed scanner imports. Stable Bun 1.4.4 rejects each unsupported flag before preparing assets; experimental builds reject a different embedded runtime. Direct AOT+trim and x64 baseline-target smoke pass guides/plain view/local scanner dependency/scan/lint/export. Direct AOT baseline-target compiled regression passes all 8 assertions. Trim-only build compiles and smoke passes independently. Downloaded native compiler archives for all five existing release platforms from Buildkite build 133944, verified their published SHA-1 artifact digests, and recorded SHA-256 of both archives and extracted executables plus full commit/revision in scripts/aot-compiler.json. Linux binary SHA matches prior provenance. The existing patched-Node/TLS/checksum runtime preparation now has explicit --aot mode; default stable release pins remain unchanged. Host Node 24 correctly fails the patched-version check. Downloaded official Node 26.12.1 with its published SHA-256 for local validation. Its managed-proxy tunnel timed out on the live Buildkite request; with only the network stream supplied from the already verified local archive, extraction, executable SHA-256 and exact compiler revision verification succeed. A tampered archive is rejected before extraction. The native workflow is separate from publishing, covers native Linux x64/arm64/macOS arm64/Windows x64/arm64, preserves x64 baseline targets, and will run both compiled scanner and packaged-runtime checks in each AOT mode. YAML parses and has five targets. Full required repository check is running; native CI results remain open.

First native CI run 40601608609 starts all five native runners. Compiler preparation returned HTTP 403 on Linux and macOS. Reproduced the exact cause with the same Buildkite artifact URL: empty User-Agent gets HTTP 403, explicit groma-native-build-qualification gets HTTP 200/application-zip. Added an identifying User-Agent to the verified downloader, retaining TLS and checksum verification. This is a download-protocol fix, not a compiler/platform failure. Full required check after build-option implementation: lint/types/Node tests pass; Bun suite 905 pass, 63 skip, 28 fail of 996, matching the earlier missing-toolchain/baseline watcher failure count. The extra scanner-update timing failure from the prior run did not recur. AOT and AOT+trim direct compiled regression both pass 8 assertions; trim-only and baseline-target full CLI smoke pass.

Second native run 40601764572: Linux arm64 and macOS arm64 complete successfully in both AOT modes; Linux x64 baseline completes smoke and uploads artifacts. Both Windows targets are still running. Local packaged C and C++ WASM scanners and packaged JavaScript scanner pass scan/plain view/lint/full export in both modes. AOT Groma plus the AOT+trim Backlog executable also pass the actual bundled work-source bridge: initial tasks appear, edits update the live world in ~102ms, SIGTERM exits 0, and watcher subprocesses do not remain. Full headless-browser verification remains open: installed Playwright has no browser, and its Chromium download returns an invalid/truncated archive in this environment; HTTP and source-level DOM suites are passing, but they are not described as a browser pass.

All five native targets pass the first complete CLI/export/packaged-runtime matrix in run 40601764572 on source 4dec346c9f1952d5237122b5830336054c3d1cfc, with AOT and AOT+trim on each: Linux x64 baseline, Linux arm64, macOS arm64, Windows x64 baseline and Windows arm64. This proves those smoke flows only. Added a consumer qualification script for the remaining native web/watch/shutdown gate; it passes locally against AOT+trim baseline target and is being added to both native CI modes. Playwright browser CDN responds HTTP 200 text/html Site Unavailable instead of the Chromium ZIP in this environment, so a full browser pass is still not claimed.

The new compiled web/watch qualification passes on Linux x64 against both AOT modes, including embedded font CSS, all three PNG covers, installed dependency loading, a new source component after native watching, and SIGTERM exit 0. The two pre-existing watcher test failures are now specifically qualified as a scratch PID-namespace limitation: process.pid=5, /proc/self/status NSpid=126544/5, ps -p 5 returns no process while process.kill(5,0) succeeds. Those tests use ps to assert a second watcher is alive; this environment reports the outer process namespace through procfs. Actual compiled two-process Backlog/Groma watch shutdown succeeds, so no product workaround was added. Required check for the added qualification script is running under Node 26.12.1 and Bun 1.4.4.

The required check after adding web qualification completed lint/types and Node tests under patched Node 26.12.1; Bun suite has 904 passes, 63 skips and 29 failures, with the known scanner-update timing failure recurring alongside the earlier 28 environment/baseline failures. Added a pinned Chromium rendering gate on the Linux x64 hosted runner to avoid treating the scratch browser-download restriction as a product failure. It waits for the JS-created map SVG and retains screenshots; other native targets keep the web/watch/shutdown checks. Final required check is running after this qualification-only change.
<!-- SECTION:NOTES:END -->
