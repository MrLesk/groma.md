---
id: TASK-579
title: Update Bun to 1.4.3 and refresh package dependencies
status: Done
assignee:
  - '@codex'
created_date: '2026-10-11 09:51'
updated_date: '2026-10-11 10:00'
labels: []
dependencies: []
references:
  - package.json
  - bun.lock
  - .github/workflows/ci.yml
  - .github/workflows/release.yml
  - .github/workflows/architecture.yml
modified_files:
  - package.json
  - .github/workflows/ci.yml
  - .github/workflows/release.yml
  - .github/workflows/architecture.yml
  - bun.lock
type: chore
ordinal: 655000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Update the main Groma package dependencies after checking releases and breaking changes, and use Bun 1.4.3 in development and CI. Scanner, example, and workspace package manifests stay unchanged. Preserve current compiler families and existing behavior; do not adopt new Bun features.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The main package manager and workflow Bun pins use 1.4.3; Bun types stay on the latest published release.
- [x] #2 Only main-package dependency versions change, with official breaking-change checks and any version exceptions recorded; scanner and example manifests remain unchanged.
- [x] #3 Existing supported behavior passes bun run check, and the standalone executable builds and passes focused smoke checks.
- [x] #4 A focused pull request contains only this task and required changes.
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
1. Compare only root package.json dependencies with registry dist-tags and official release notes. Keep workspace links, scanner manifests, and examples unchanged. 2. Check OpenTUI, compiler tooling, package patches, and runtime requirements before selecting versions; preserve the existing TypeScript 7.1 preview family. 3. Update root versions and Bun pins, recording each path immediately, then regenerate the lockfile. 4. Use existing tests for this behavior-preserving upgrade; add no new tests unless a specific supported regression exposes a coverage gap. Run bun run check, build, and focused executable/TUI smoke checks. 5. Review the diff, record verification, commit only task files, and open the requested PR.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Alex narrowed the scope to the main Groma package.json. Do not update scanner or example manifests. Alex also confirmed keeping the current TypeScript compiler families.

Release review: @opentui/core 0.6.0 changes suspend/resume to promises and makes terminal teardown asynchronous (https://github.com/anomalyco/opentui/releases/tag/v0.6.0). src/welcome.ts currently resolves the next action immediately after suspend(), so adopting 0.6.0 needs source changes outside this package-only scope. Use newest 0.5.x, 0.5.17. Its intervening releases contain fixes and no declared API migration. ignore 7.0.12 fixes gitignore matching and linear-time pattern normalization (https://github.com/kaelzhang/node-ignore/compare/7.0.10...7.0.12). Biome 2.5.15 is a patch; changed/removed rule options are nursery rules not enabled here (https://github.com/biomejs/biome/releases/tag/@biomejs%2Fbiome@2.5.15). @types/node 26.6.5 adds styleText hex color and pledgedSrcSize declarations within the existing major. Keep @types/bun 1.4.2, the newest published release. Refresh root TypeScript within its existing 7.1 preview family to 7.1.0-dev.20261011.1; leave the scanner compiler versions unchanged. All other non-workspace root packages already match latest stable registry versions. Keep the existing Parcel watcher patch and supported Node/Bun engine ranges.

Verification on macOS arm64 with Bun 1.4.3: bun run check passed (16 Node tests; 776 Bun tests passed, 51 optional scanner/package tests skipped, 0 failures). Lint produced one warning and two informational diagnostics in unchanged files; type checking passed with 7.1.0-dev.20261011.1. bun install --frozen-lockfile reported no changes. GROMA_BUILD_OUTFILE=/tmp/groma-task-579/groma bun run build passed. The compiled CLI passed --version, --help, agent-instructions, and view --plain from a temporary project outside the checkout. tui-test snapshots confirmed root map rendering, details pane, and 200x60 rendering; Ctrl+C exited. Screenshot evidence is under /tmp/groma-task-579. All plugins/ and packages/ lockfile declarations are unchanged, with the TypeScript scanner still resolving 7.1.0-dev.20260924.1 separately from root tooling. TypeScript preview package exports remove the unstable/ prefix, but the root uses only the tsc command; scanner SDK imports retain their pinned old package. git diff --check passed; git status --short groma/ is empty. Self specification and quality review found no scope or supported-flow blocker: package.json owns direct dependencies, bun.lock records their exact resolved packages, and workflow pins select the same Bun runtime. No source or architecture behavior changed, so no contract edits or new tests were needed.

Opened https://github.com/MrLesk/groma.md/pull/126 from codex/bun-1-4-3-dependencies to main. PR contains only the root dependency updates, regenerated lockfile, Bun workflow pins, and this task record. The local full check passed; CI is the cross-platform verification after push.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Updated the main package and workflow pins to Bun 1.4.3. Refreshed OpenTUI to 0.5.17, ignore to 7.0.12, Biome to 2.5.15, Node types to 26.6.5, and root TypeScript to the newest existing 7.1 preview. OpenTUI 0.6.0 needs terminal lifecycle source changes, so it remains outside this package-only PR; Bun types 1.4.2 are still latest. Scanner and example files and versions are unchanged. bun run check passed (792 tests passed total, 51 optional skips), frozen install and standalone build passed, and compiled CLI and terminal smoke checks passed. No new Bun features were adopted. PR: https://github.com/MrLesk/groma.md/pull/126
<!-- SECTION:FINAL_SUMMARY:END -->
