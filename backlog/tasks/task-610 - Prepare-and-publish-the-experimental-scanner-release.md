---
id: TASK-610
title: Prepare and publish the experimental scanner release
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-15 22:17'
updated_date: '2026-10-17 05:32'
labels: []
dependencies: []
references:
  - plugins/scanners/c/package.json
  - plugins/scanners/dart/package.json
  - packages/scanner/package.json
  - bun.lock
documentation:
  - docs/scanners/publishing.md
modified_files:
  - packages/scanner/package.json
  - plugins/scanners/c/package.json
  - plugins/scanners/dart/package.json
  - plugins/scanners/javascript/package.json
  - plugins/scanners/java/package.json
  - plugins/scanners/scala/package.json
  - plugins/scanners/kotlin/package.json
  - plugins/scanners/nasm/package.json
  - plugins/scanners/cobol/package.json
  - plugins/scanners/typescript/package.json
  - plugins/scanners/angular/package.json
  - plugins/scanners/vue/package.json
  - plugins/scanners/react/package.json
  - plugins/scanners/python/package.json
  - plugins/scanners/php/package.json
  - plugins/scanners/rust/package.json
  - plugins/scanners/go/package.json
  - plugins/scanners/csharp/package.json
  - plugins/scanners/swift/package.json
  - bun.lock
  - package.json
  - docs/scanners/c/index.md
  - docs/scanners/dart/index.md
type: chore
ordinal: 679000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The six new scanners and the fixes accumulated since v0.6.6 must reach npm and the Groma CLI together. npm cannot replace an existing version, so changed existing packages need new patch versions. First publication also requires complete platform artifacts, maintainer npm approval and a concrete release draft.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 All six new scanner packages have public names, first versions and accurate Groma API requirements; each changed existing package has an unused patch version.
- [ ] #2 The release candidate passes Windows, Linux and macOS CI, and the existing package build and fresh-checkout checks pass for all five release targets.
- [ ] #3 A draft GitHub release identifies the exact candidate commit and uses the last eight releases user-facing changelog format, without internal verification steps.
- [ ] #4 After maintainer approval, npm and GitHub publication completes and actual public packages pass fresh installation and restore checks; built and manually exercised targets are recorded separately.
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
1. Preserve current main workflow scheduling while retaining all qualified scanner preparation and test gates. 2. Audit npm versions and source changes since publication, make C public, give changed packages new patch versions, and set the Dart minimum to the CLI revision that supplies selected pubspec metadata to outlines. Refresh matching workspace lock entries. Version metadata needs no new tests: existing repository and packaged install/restore scenarios cover the unchanged behavior; dry-run packs verify publishable contents. 3. Commit one release-preparation task and PR; verify the final Windows/Linux/macOS matrix and five-target package builds. 4. Merge the dependency chain in order, preserving each Backlog task. Assemble complete first-publication artifacts, publish with maintainer npm authentication, and configure trusted publishing only if approved. 5. Prepare a concrete v0.7.0 draft with the established user-facing headings, bold-label bullets and Full Changelog link; show it for the documented maintainer review before publishing the GitHub release. 6. After approval, run the existing release workflow and verify public install/restore behavior.

The npm/source audit also finds that all existing scanner packages carry README documentation changed by the new plugin commands/configuration, and several share changed outline/entry helpers. Give all 16 existing official scanners patch versions, plus the author contract, so no package reuses stale bundled code or instructions. New scanners remain 0.1.0; only Dart needs >=0.7.0 because it depends on selected pubspec metadata supplied to outlines by TASK-601.

For the approved final qualification, combine current main and TASK-618 with release metadata PR157 and TypeScript packaging PR158 in codex/release-07-qualification. Run the existing build-only release workflow with publish_scanners=false, the required repository check, native CLI builds and supported upgrade/Backlog/restore/offline/map-control journeys. This branch is qualification only, not publication or a replacement release PR; integrate the qualified source into the existing release stack after its gates pass.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The candidate CLI version is 0.7.0 so its declared API satisfies Dart >=0.7.0 during manual builds, fresh-checkout checks and eventual publication. The first build-only workflow reproduced a packaged TypeScript native-compiler symbol failure on both Linux architectures and macOS; all other 21 scanner package checks pass on those hosts. This actual release blocker will be fixed before publication.

Prepared Groma 0.7.0, all six new scanner identities, C public metadata, Dart >=0.7.0 and patch versions for the 16 existing scanners plus author contract. bun.lock changes only the 17 matching workspace versions; formatting and all other manifest values are preserved. The existing local build path passes bun run check: lint/typecheck, 16 Node tests, 874 Bun tests, 62 optional skips, zero failures and 3558 assertions (/tmp/groma-release610-versioned-check.log). Own specification/quality review confirms these are publication identity changes, with no scanner inference change or new test. The first five-platform workflow passes repository validation and all other 21 package checks on Linux/macOS but finds the TypeScript SDK/worker mismatch tracked in TASK-611. Platform artifact qualification, publication and the concrete draft review remain pending.

TASK-611 fixes the TypeScript SDK/worker mismatch; build-only run 38817786034 passes validation and all 22 packaged fresh-checkout scenarios on macOS ARM64, Linux x64/ARM64 and Windows x64/ARM64. The original source candidate 5a6a0ff9 and the final 79d53153 candidate differ only by TASK-612 test/record changes, not scanner package inputs. All 13 PR matrices pass Windows, Linux and macOS; TASK-612 also passes its controlled Windows full suite with 100 repeated cases (maximum 1025.95 ms). Source PRs through Mojo are merged. Version metadata and the worker packaging fix stay open until their exact npm versions exist, because architecture export restores those manifest versions. The exact merged main architecture workflow 38826009978 passes every comparison, export and deployment; main CI 38825821199 is running. Six 0.1.0 tarballs are assembled and audited for entry points, licenses and parser/worker contents; Dart includes all five workers. The two outdated C/Dart platform notes now distinguish five-target fixture execution from macOS-only real-project trials. Dart copies its guide into the npm README, so that text must be refreshed in the prepared artifact before publication; no code or native worker changes. Both npm browser login windows expired without completion; no packages or GitHub release have been published. The v0.7.0 draft uses the last eight releases user-facing format and remains draft pending its concrete maintainer review. Fresh public install/second-checkout restore scripts are prepared but cannot run before publication.

Alex approved the complete release-audit follow-ups. TASK-618 source5d79dc19 and Action draftPR8 are prepared; the Action will merge only after public Groma0.7.0 is available. This isolated candidate includes latest main30a5fe6a, TASK-618, metadata177a5b0d and worker packaging57a2971a. Publication remains paused. Old task notes predate the six first publications; authoritative current progress is /tmp/groma-release-working-state.json, which records six public0.1.0packages and four older package authorization blockers. No old candidate or draft target will be published.

Public metadata rechecked on17October:Java0.2.2 is visible. NASM/COBOL/Scala/Kotlin0.1.1 still return404, so the prior publishing authorization blocker remains. This qualification run publishes nothing. Action draftPR8 corrected its Windows Git-path assertion and now passes unit CI on Windows/Linux/macOS at e31b999. GromaPR165 architecture comparison/deployment pass; platform source CI is still running.
<!-- SECTION:NOTES:END -->
