---
id: TASK-610
title: Prepare and publish the experimental scanner release
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-15 22:17'
updated_date: '2026-10-17 05:55'
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

The final approved release-audit preparation is qualified on e7149d27: latest main plus TASK-618, release metadata and TASK-611. Bring these existing release PRs up to date without adding other tasks to their deliveries. Keep publication paused and the Action PR draft until public0.7.0 is installable.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The candidate CLI version is 0.7.0 so its declared API satisfies Dart >=0.7.0 during manual builds, fresh-checkout checks and eventual publication. The first build-only workflow reproduced a packaged TypeScript native-compiler symbol failure on both Linux architectures and macOS; all other 21 scanner package checks pass on those hosts. This actual release blocker will be fixed before publication.

Prepared Groma 0.7.0, all six new scanner identities, C public metadata, Dart >=0.7.0 and patch versions for the 16 existing scanners plus author contract. bun.lock changes only the 17 matching workspace versions; formatting and all other manifest values are preserved. The existing local build path passes bun run check: lint/typecheck, 16 Node tests, 874 Bun tests, 62 optional skips, zero failures and 3558 assertions (/tmp/groma-release610-versioned-check.log). Own specification/quality review confirms these are publication identity changes, with no scanner inference change or new test. The first five-platform workflow passes repository validation and all other 21 package checks on Linux/macOS but finds the TypeScript SDK/worker mismatch tracked in TASK-611. Platform artifact qualification, publication and the concrete draft review remain pending.

TASK-611 fixes the TypeScript SDK/worker mismatch; build-only run 38817786034 passes validation and all 22 packaged fresh-checkout scenarios on macOS ARM64, Linux x64/ARM64 and Windows x64/ARM64. The original source candidate 5a6a0ff9 and the final 79d53153 candidate differ only by TASK-612 test/record changes, not scanner package inputs. All 13 PR matrices pass Windows, Linux and macOS; TASK-612 also passes its controlled Windows full suite with 100 repeated cases (maximum 1025.95 ms). Source PRs through Mojo are merged. Version metadata and the worker packaging fix stay open until their exact npm versions exist, because architecture export restores those manifest versions. The exact merged main architecture workflow 38826009978 passes every comparison, export and deployment; main CI 38825821199 is running. Six 0.1.0 tarballs are assembled and audited for entry points, licenses and parser/worker contents; Dart includes all five workers. The two outdated C/Dart platform notes now distinguish five-target fixture execution from macOS-only real-project trials. Dart copies its guide into the npm README, so that text must be refreshed in the prepared artifact before publication; no code or native worker changes. Both npm browser login windows expired without completion; no packages or GitHub release have been published. The v0.7.0 draft uses the last eight releases user-facing format and remains draft pending its concrete maintainer review. Fresh public install/second-checkout restore scripts are prepared but cannot run before publication.

Final candidate e7149d27 passes bun run check:16 Node,897 Bun,62 optional skips,0 failures,3693 Bun assertions. Build-only workflow39006640891 passes validation and scanner package/fresh-checkout checks on all5hosts:macOS ARM64,Linux x64/ARM64,Windows x64/ARM64. Its d972eda9 scanner/package inputs are unchanged in e7149d27; the latter only fixes current-config Backlog conflicts, explicit web upgrade diagnostics and their regressions. All5CLI binaries cross-compile from e7149d27; macOS ARM64 actually executes0.7.0. Final3OS candidate CI39007672020 is running.

Actual0.7binary qualification: all6public0.1.0scanners pass fresh install and independent second-checkout restore with emptyHOME/Git-onlyPATH, deterministic observations, useful outlines and unchanged source/config. Real official0.6.6binary upgrade preserves scanner selection/options and authored description/ownership, registers the installedBacklog1.53.0and reads its task, then explicit updates/rescan succeed. Default-enabled updates scan successfully on registry503and disconnected registry; a scan exits while registry work is held. Web2D,hidden relationships and selected element survive saving automatic updates and reload. PublicJava0.2.2/TypeScript0.2.3/Angular0.2.3pass source-only callforpapers revision1cb6783f3379664e3f176e72c5419064ce24dbfd withGit-onlyPATH:665Java,530TypeScript,844Angularfiles; repeated evidence/Markdown and post-initialization source bytes unchanged.

ActiondraftPR8 at9fa29bc passes current Windows/Linux/macOS unit CI and actual-candidate fresh/warm scan-export and committed comparison. Comparison executes no project scanner and changes no config. It stays draft/unmerged until publicGroma0.7.0passes the real npm smoke. Publication remains paused. All6newpackages and18updateduploads were accepted earlier; Java0.2.2is now visible. Four older target versions,NASM/COBOL/Scala/Kotlin0.1.1,still404and need the previously identified protected npm publisher verification. No package,GitHubrelease orActiontag was published in this follow-up.
<!-- SECTION:NOTES:END -->
