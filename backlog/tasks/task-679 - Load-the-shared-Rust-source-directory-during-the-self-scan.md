---
id: TASK-679
title: Load the shared Rust source directory during the self-scan
status: Done
assignee:
  - '@codex'
created_date: '2026-11-23T19:09:00Z'
updated_date: '2026-11-23T19:15:00Z'
labels: []
dependencies: []
references:
  - plugins/scanners/rust/src/project.ts
modified_files:
  - test-bun/rust-workspace.test.ts
  - plugins/scanners/rust/src/project.ts
  - docs/scanners/rust/index.md
  - plugins/scanners/rust/package.json
  - bun.lock
priority: high
type: bug
ordinal: 716000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The Rust scanner passes the whole repository to rust-analyzer before it filters 12 Rust files in the Groma self-scan. Unrelated trees and build products take several seconds to walk.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Scanning the selected Rust sources of the Groma repository avoids loading unrelated repository trees and returns the same observation.
- [x] #2 Shared path modules and calls across Rust workspace members stay visible from every relevant crate.
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
Pass rust-analyzer one common directory enclosing the selected Rust sources. Keep the same directory for every crate so shared path modules remain visible. Update the Rust project-input description and its package version. Existing workspace tests verify evidence for shared modules and calls, but keep them at the repository root, so they cannot detect a return to traversing unrelated directories. Add one adapter-flow check using the existing shared workspace nested within a repository. Verify the source boundary from the actual worker input, compare complete worker observations on existing fixtures and the self-scan, and run repository checks.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Baseline reproduction on the original checkout with 12 selected Rust files. The local worker from September took 15.425 s with the repository as the engine source root and 0.117 s with the enclosing source directory. The released 0.2.3 worker using rust-analyzer 0.0.358 took 8.716 s and 0.167 s respectively. Each pair returned identical complete bytes. The new nested-workspace worker-input test failed on main by observing the outer repository directory, then passed with the shared directory chosen from the selected Rust source paths.

Built the current Rust worker in isolation with the CI toolchain (Rust 1.99.1, rust-analyzer 0.0.358, macOS arm64). Comparing original and fixed TypeScript adapters with that same worker and identical sources: 14.595 seconds to 0.056 seconds for the real Groma Rust project under concurrent load, with identical 296,146-byte observation JSON (SHA-256 a3d3478d56b1e958513292b7f1753f39cb71e3d253cab7d13a6d1256fe23fc19). The original and updated adapters also returned byte-identical observations on all nine Rust fixture projects tested, including the nested shared workspace, both declared roots, ambiguous shared compilation, and HTTP. All 26 native Rust scanner and workspace tests passed, including the shared-module identity, cross-crate calls and scaling checks. A full self-scan on the task branch changed no architecture file.

Specification and quality review: the host provides repository-relative source candidates to the Rust project reader. That reader picks one enclosing directory for every crate in the same input and leaves the native module graph, evidence extraction, source selection and positions intact. The regression test inspects the engine input on a real nested shared workspace. Existing native tests verify the shared file and both cross-crate calls. Codehygiene reported an existing wide manifest type, two existing wide test assertions, and similarity in the fixture file-writing loop. The nested fixture reuses its existing writer with a single resolved filename and adds no second writer. The updated documentation states the engine input accurately. No C4 or Markdown format concept changed.

Final repository check ran with GROMA_TEST_RUST pointing to the worker built from this checkout. bun run check passed, with 28 Node tests and 969 Bun tests passing, 48 environment-dependent skips and zero failures. The ordinary check without the optional Rust test worker also passed. git diff --check passed and git status --short groma/ was empty.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The Rust adapter now uses the enclosing directory of its selected Rust sources as the shared source root for all crates. On the Groma checkout the isolated current worker took 56 ms instead of 14.6 seconds, with identical evidence. Nine fixture comparisons and the native workspace tests preserved shared path modules, cross-crate calls and the existing scanner outputs. The Rust scanner package is prepared as 0.2.5.
<!-- SECTION:FINAL_SUMMARY:END -->
