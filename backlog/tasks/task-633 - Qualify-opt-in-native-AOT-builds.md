---
id: TASK-633
title: Qualify opt-in native AOT builds
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-27T23:16:00Z'
updated_date: '2026-10-27T23:22:00Z'
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
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented opt-in GROMA_BUILD_AOT=1 and independent GROMA_BUILD_TRIM=1 in scripts/build.ts; AOT disables bytecode and permits installed scanner imports. Stable Bun 1.4.4 rejects each unsupported flag before preparing assets; experimental builds reject a different embedded runtime. Direct AOT+trim and x64 baseline-target smoke pass guides/plain view/local scanner dependency/scan/lint/export. Direct AOT baseline-target compiled regression passes all 8 assertions. Trim-only build compiles and smoke passes independently. Downloaded native compiler archives for all five existing release platforms from Buildkite build 133944, verified their published SHA-1 artifact digests, and recorded SHA-256 of both archives and extracted executables plus full commit/revision in scripts/aot-compiler.json. Linux binary SHA matches prior provenance. The existing patched-Node/TLS/checksum runtime preparation now has explicit --aot mode; default stable release pins remain unchanged. Host Node 24 correctly fails the patched-version check. Downloaded official Node 26.12.1 with its published SHA-256 for local validation. Its managed-proxy tunnel timed out on the live Buildkite request; with only the network stream supplied from the already verified local archive, extraction, executable SHA-256 and exact compiler revision verification succeed. A tampered archive is rejected before extraction. The native workflow is separate from publishing, covers native Linux x64/arm64/macOS arm64/Windows x64/arm64, preserves x64 baseline targets, and will run both compiled scanner and packaged-runtime checks in each AOT mode. YAML parses and has five targets. Full required repository check is running; native CI results remain open.

First native CI run 40601608609 starts all five native runners. Compiler preparation returned HTTP 403 on Linux and macOS. Reproduced the exact cause with the same Buildkite artifact URL: empty User-Agent gets HTTP 403, explicit groma-native-build-qualification gets HTTP 200/application-zip. Added an identifying User-Agent to the verified downloader, retaining TLS and checksum verification. This is a download-protocol fix, not a compiler/platform failure. Full required check after build-option implementation: lint/types/Node tests pass; Bun suite 905 pass, 63 skip, 28 fail of 996, matching the earlier missing-toolchain/baseline watcher failure count. The extra scanner-update timing failure from the prior run did not recur. AOT and AOT+trim direct compiled regression both pass 8 assertions; trim-only and baseline-target full CLI smoke pass.
<!-- SECTION:NOTES:END -->
