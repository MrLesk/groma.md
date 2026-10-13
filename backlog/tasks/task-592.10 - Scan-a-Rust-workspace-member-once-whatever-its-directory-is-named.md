---
id: TASK-592.10
title: Scan a Rust workspace member once whatever its directory is named
status: Done
assignee:
  - '@claude'
created_date: '2026-10-11 16:52'
updated_date: '2026-10-13 18:43'
labels: []
dependencies: []
references:
  - plugins/scanners/rust/src/project.ts
documentation:
  - docs/scanners/rust/index.md
modified_files:
  - test-bun/rust-workspace.test.ts
  - plugins/scanners/rust/src/project.ts
parent_task_id: TASK-592
type: bug
ordinal: 667000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`rustProjects` in `project.ts` walks the sorted list of `Cargo.toml` paths and marks members as covered only after their workspace manifest is visited. A member directory that sorts before the root `Cargo.toml` (a name that starts with a digit or sorts below "Cargo.toml", such as `01-first`, `Alpha` or `CLI`) is therefore scanned on its own, together with its path dependencies, and again inside the workspace. Reproduced: a workspace with members `01-first` (depends on `Alpha`), `Alpha` and `crates/*` yields 3 roots and 14 operations for 8 functions; the same layout with lowercase names yields 1 root and 8 operations.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A workspace yields the same roots and operations whatever its member directories are named.
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
1. Reproduce with the audit harness on probes rs2 and rs2b (rs2: 3 roots, 14 operations for 8 functions; rs2b: 1 root, 8 operations).
2. Change only `rustProjects` in plugins/scanners/rust/src/project.ts, the one owner of project selection. It works in two steps. First every workspace manifest among the scanner's files claims its members, through the existing `members`. Then the projects are the manifests no other manifest claims. No project is chosen while claims are still collected, so the order of the files cannot change the result.
   - `members` also names a workspace's own package, so a manifest does not claim itself: a workspace root that is also a package stays one project.
   - Only a manifest with a `[workspace]` table is searched for members. A plain package has none, and one search per package costs manifests x files (measured: 0.9 s for 500 crates and 50,000 files, per call; `rustProjects` runs three times per scan).
   - A manifest Cargo cannot read claims nothing, as before; reading it as a project reports why.
   - No change to the native worker, to `members`, or to `readRustProject`.
3. Cases compared with the committed walk, in sorted and in reversed file order (scratch probe): members after the workspace, a path member, a nested workspace the outer one excludes, a member Cargo's `exclude` names, a standalone package next to a workspace, two standalone packages, a workspace root that is also a package, a manifest that is not TOML. Every result equals the committed sorted result except where a member sorts before its workspace, which is the defect. A workspace root listed as a member of another workspace is not supported: Cargo rejects it (`cargo metadata`: multiple workspace roots found in the same workspace).
4. Test decisions, two tests in test-bun/rust-workspace.test.ts on the existing fixture, no worker needed:
   a. 'a workspace is one project when its members are listed before its manifest'.
      - Rule and authority: a workspace member is scanned only inside its workspace wherever the files list it. Authority: the failure reproduced in this task (probe rs2) and the guide's sentence that each workspace is scanned once. The scanner contract promises no file order.
      - Wrong result it catches: `rustProjects` returns a member listed before its workspace's `Cargo.toml` as a project of its own, which gives extra roots and repeated operations.
      - Coverage gap: the only project selection assertion (the implicit path members test) hands over the files with the workspace manifest first. The new test hands over the same files reversed, so every member comes first. Together the two orders put each member before its workspace once, whatever order the repository listing uses.
   b. 'a workspace root that is also a package is a project'.
      - Rule and authority: the guide's sentence that each workspace is scanned once; the two step selection must keep this result.
      - Wrong result it catches: the root manifest claims itself through its own package, no project is left, and nothing is scanned.
      - Coverage gap: no test selects projects in a world whose workspace root is also a package (the one such world, in rust-scanner.test.ts, calls `scanRustSource` directly). Checked by removing the self claim guard: no existing test failed.
5. Verify: the Rust test files with and without the native worker (packaged binary under plugins/scanners/rust/dist, no rebuild), Biome lint on the changed TypeScript, typecheck, and the audit harness: rs2 must equal rs2b apart from the directory names.
6. Guide docs/scanners/rust/index.md is not changed: it already states the rule (each workspace is scanned once).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented in `rustProjects` (plugins/scanners/rust/src/project.ts): every workspace claims its members first, then each `Cargo.toml` no other manifest claims is a project. Native worker, `members` and `readRustProject` are unchanged; the packaged worker was not rebuilt.

Verification (2026-10-11):
- Before the fix: audit harness `bun <scratch>/audit-go-rust/plugin-scan.ts rs2 rs2b` gave rs2 roots=3 operations=14 distinct functions=8, rs2b roots=1 operations=8. The new test 'a workspace is one project when its members are listed before its manifest' failed with app, service and support returned beside the workspace manifest.
- After the fix: rs2 roots=1 operations=8 distinct functions=8, rs2b the same. A scratch diff of the whole plugin scan (roots, files, operations, invocations, diagnostics) with `01-first` and `Alpha` mapped to `first` and `alpha` shows one differing line: the root's name, which is the probe directory itself (rs2, rs2b) because the workspace has no package.
- 'a workspace root that is also a package is a project' passes before and after the fix; it fails (no project returned) when the self claim guard `member !== manifest` is removed, and no other test fails then.
- `bun test --timeout 20000 test-bun/rust-workspace.test.ts test-bun/rust-scanner.test.ts test-bun/declared-source-listing.test.ts`: 12 pass, 16 skip (native), 0 fail.
- The same command with `GROMA_TEST_RUST` set to plugins/scanners/rust/dist/bin/darwin-arm64/groma-rust-scanner: 28 pass, 0 fail.
- `bunx biome lint plugins/scanners/rust/src/project.ts test-bun/rust-workspace.test.ts`: no findings. `bun run typecheck`: passes.
- `bun run check` was not run in this lane; the orchestrator runs it once for all lanes.
- No file under groma/ changed.

Correction history: the first draft of the test added a member directory `0-tool` and asserted its position in the listing; it was replaced by handing over the fixture's files reversed, which tests the rule without depending on how the repository listing sorts.

Not supported, unchanged in kind: a workspace root that another workspace lists as a member. Cargo refuses to build it. Its own members are then claimed by it and it is claimed by the outer workspace, so they are in no project.

Cold junior-maintainer review: no blocking findings. The reviewer ran the real plugin scan on seven workspace layouts in upper/digit and lowercase pairs and in both file orders (an early member with a path dependency, `exclude`, a root package, a standalone package beside the workspace, a cargo-fuzz style opt-out package, two workspaces side by side); each pair gave the same projects, functions and calls. It confirmed by mutation that the second test earns its place: without the `member !== manifest` guard it fails with an empty list while every other non-native test still passes. Applied by the orchestrating session: one comment in `rustProjects` now states the consequence for a workspace that another workspace claims (its members are in no project, a layout Cargo rejects), which only the notes recorded before, and the comment of the reversed-order test was reworded. Verified after these edits: `bun test --timeout 20000 test-bun/rust-workspace.test.ts` and Biome lint on both files.

Verified on the combined working tree with every TASK-592 change and TASK-580 present: `bun run check` exits 0 (Node 16 pass; Bun 785 pass, 53 skip, 0 fail), no file under `groma/` changed, no changed source or test file exceeds 500 lines. Rust suites with the packaged worker: `GROMA_TEST_RUST=<plugin dist worker> bun test --timeout 20000 test-bun/rust-workspace.test.ts test-bun/rust-scanner.test.ts`, 23 pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
`rustProjects` in `project.ts` collects the members of every workspace before it chooses any project, so the projects no longer depend on the order of the manifest list: a member directory that sorts before the root `Cargo.toml` is scanned once, inside its workspace. The probe workspace with members `01-first` and `Alpha` gives 1 root and 8 operations, equal to its lowercase twin (3 roots and 14 operations before). Verified by two selection tests (reversed file order; a root package that must not claim itself), eleven small worlds in both orders, and a cold review with seven layout pairs through the real scan. One outcome changed beyond the defect and is stated in the code: a workspace that another workspace claims leaves its own members in no project, a layout Cargo rejects.
<!-- SECTION:FINAL_SUMMARY:END -->
