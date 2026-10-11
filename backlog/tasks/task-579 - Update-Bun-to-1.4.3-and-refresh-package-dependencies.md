---
id: TASK-579
title: Update Bun to 1.4.3 and refresh package dependencies
status: Done
assignee:
  - '@codex'
created_date: '2026-10-11 09:51'
updated_date: '2026-10-11 10:11'
labels: []
dependencies: []
references:
  - package.json
  - bun.lock
  - .github/workflows/ci.yml
  - .github/workflows/release.yml
  - .github/workflows/architecture.yml
  - src/welcome.ts
  - src/view-host.ts
  - src/viewers/tui/terminal-viewer.ts
  - src/viewers/tui/scanner-settings.ts
  - src/init-command-ui.ts
modified_files:
  - package.json
  - .github/workflows/ci.yml
  - .github/workflows/release.yml
  - .github/workflows/architecture.yml
  - bun.lock
  - test-bun/terminal-lifecycle.test.ts
  - src/welcome.ts
  - src/cli.ts
  - src/viewers/tui/terminal-viewer.ts
  - src/view-host.ts
  - src/viewers/tui/scanner-settings.ts
type: chore
ordinal: 655000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Update main Groma dependencies and Bun workflow pins to 1.4.3. Include the latest OpenTUI and the terminal lifecycle/rendering fixes needed to preserve welcome, map, init, and scanner settings behavior. Scanner and example packages remain unchanged. Preserve current compiler families and do not adopt unrelated Bun features.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The main package manager and workflow Bun pins use 1.4.3; Bun types stay on the latest published release.
- [x] #2 Main dependencies include OpenTUI 0.6.0, with its breaking APIs handled in existing terminal owners; scanner and example packages remain unchanged.
- [x] #3 Welcome-to-action handoff and terminal close wait for OpenTUI transitions, while map, init, and settings still render and navigate correctly.
- [x] #4 bun run check, a standalone build, and focused terminal smoke checks pass; PR 126 contains the task-scoped changes.
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
1. Check OpenTUI 0.6.0 release notes and all affected renderer APIs and existing test coverage. 2. Update root OpenTUI and lockfile, then fix lifecycle/resource API breaks in their existing terminal owners; record each file immediately. 3. Add or extend only tests that close a concrete lifecycle regression gap, after recording the rule and missing coverage. Use existing rendering/navigation coverage and tui-test for real terminal verification. 4. Run bun run check, build the standalone executable, and exercise welcome handoff, map, details, container, resize, and settings. 5. Self-review the supported flow, update task evidence and PR description, and push to PR 126.

Regression coverage: Alex authorized preserving terminal flows while upgrading OpenTUI. Current tests cover navigation models but do not mount welcome/viewer renderers or check transition completion. A controlled suspend promise must prevent a selected welcome action from resolving early. A controlled renderer.closed promise must prevent welcome cancellation and viewer.closed from finishing before terminal restoration. Add one concurrent renderer-owned test for suspension and one parameterized close test for welcome/map; no shared mocks or live groma data. Confirm these fail before the lifecycle fix. The installed OpenTUI 0.6.0 test API provides per-renderer mock input and dispose(), which awaits closed. Bun 1.4.3 lifecycle documentation matches the declared runner; keep current runner options.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Alex narrowed the scope to the main Groma package.json. Do not update scanner or example manifests. Alex also confirmed keeping the current TypeScript compiler families.

Release review: @opentui/core 0.6.0 changes suspend/resume to promises and makes terminal teardown asynchronous (https://github.com/anomalyco/opentui/releases/tag/v0.6.0). src/welcome.ts currently resolves the next action immediately after suspend(), so adopting 0.6.0 needs source changes outside this package-only scope. Use newest 0.5.x, 0.5.17. Its intervening releases contain fixes and no declared API migration. ignore 7.0.12 fixes gitignore matching and linear-time pattern normalization (https://github.com/kaelzhang/node-ignore/compare/7.0.10...7.0.12). Biome 2.5.15 is a patch; changed/removed rule options are nursery rules not enabled here (https://github.com/biomejs/biome/releases/tag/@biomejs%2Fbiome@2.5.15). @types/node 26.6.5 adds styleText hex color and pledgedSrcSize declarations within the existing major. Keep @types/bun 1.4.2, the newest published release. Refresh root TypeScript within its existing 7.1 preview family to 7.1.0-dev.20261011.1; leave the scanner compiler versions unchanged. All other non-workspace root packages already match latest stable registry versions. Keep the existing Parcel watcher patch and supported Node/Bun engine ranges.

Verification on macOS arm64 with Bun 1.4.3: bun run check passed (16 Node tests; 776 Bun tests passed, 51 optional scanner/package tests skipped, 0 failures). Lint produced one warning and two informational diagnostics in unchanged files; type checking passed with 7.1.0-dev.20261011.1. bun install --frozen-lockfile reported no changes. GROMA_BUILD_OUTFILE=/tmp/groma-task-579/groma bun run build passed. The compiled CLI passed --version, --help, agent-instructions, and view --plain from a temporary project outside the checkout. tui-test snapshots confirmed root map rendering, details pane, and 200x60 rendering; Ctrl+C exited. Screenshot evidence is under /tmp/groma-task-579. All plugins/ and packages/ lockfile declarations are unchanged, with the TypeScript scanner still resolving 7.1.0-dev.20260924.1 separately from root tooling. TypeScript preview package exports remove the unstable/ prefix, but the root uses only the tsc command; scanner SDK imports retain their pinned old package. git diff --check passed; git status --short groma/ is empty. Self specification and quality review found no scope or supported-flow blocker: package.json owns direct dependencies, bun.lock records their exact resolved packages, and workflow pins select the same Bun runtime. No source or architecture behavior changed, so no contract edits or new tests were needed.

Opened https://github.com/MrLesk/groma.md/pull/126 from codex/bun-1-4-3-dependencies to main. PR contains only the root dependency updates, regenerated lockfile, Bun workflow pins, and this task record. The local full check passed; CI is the cross-platform verification after push.

Alex explicitly requested the latest OpenTUI and fixes for its breaking changes in PR 126. This supersedes the earlier 0.5.17 exception and authorizes source changes required by OpenTUI. It does not authorize scanner package upgrades.

OpenTUI 0.6.0 implementation: welcome awaits suspend() before exposing the selected action and awaits renderer.closed on cancel. WelcomeSession.close() is asynchronous and its CLI owner awaits it before reopening or finishing. The terminal viewer returns the renderer completion promise directly, removing its premature independent close promise. Viewer setup failure and standalone settings cleanup await terminal restoration. Existing FrameBuffer, palette, and rendering APIs still type-check and run without changes. No scanner package files or versions changed.

Verification after the OpenTUI fixes on macOS arm64 / Bun 1.4.3: all three new lifecycle tests failed before the fix (early action/close completion) and passed afterward. bun run check passed: 16 Node tests and 779 Bun tests passed, 51 optional skips, zero failures. A frozen install made no changes. Standalone build passed. Real compiled tui-test flows passed: welcome -> settings child -> welcome -> quit; map root -> container -> arrow selection -> details -> resize to 200x60 -> Ctrl+C. Visually inspected screenshots in /tmp/groma-task-579-opentui. git diff --check passed and groma/ stayed unchanged. Self specification and quality review found no blocker. The implementation keeps cleanup with the existing resource owners and removes an unnecessary close promise. Each concurrent test owns its renderer and controlled transition; assertions prove ordering rather than exact copy or layout. No new architecture concepts, contracts, scanner APIs, or runner options were added.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Updated Bun pins to 1.4.3 and main-package dependencies, including latest OpenTUI 0.6.0. Welcome actions now wait for terminal suspension; welcome, map, and standalone settings wait for terminal restoration before reporting completion or reusing streams. Added three focused lifecycle regressions that failed before the fix and now pass. bun run check passed (795 tests passed total, 51 optional skips), frozen install and standalone build passed, and compiled welcome/settings handoff, map navigation, resize, and exit passed tui-test. Scanner and example package files and versions are unchanged. PR: https://github.com/MrLesk/groma.md/pull/126
<!-- SECTION:FINAL_SUMMARY:END -->
