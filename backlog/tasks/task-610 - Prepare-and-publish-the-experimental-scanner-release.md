---
id: TASK-610
title: Prepare and publish the experimental scanner release
status: Done
assignee:
  - '@codex'
created_date: '2026-10-15 22:17'
updated_date: '2026-10-17 19:16'
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
- [x] #2 The release candidate passes Windows, Linux and macOS CI, and the existing package build and fresh-checkout checks pass for all five release targets.
- [x] #3 A draft GitHub release identifies the exact candidate commit and uses the last eight releases user-facing changelog format, without internal verification steps.
- [x] #4 After maintainer approval, npm and GitHub publication completes and actual public packages pass fresh installation and restore checks; built and manually exercised targets are recorded separately.
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
1. Qualify Groma 0.7.0 at 4ed1aba77feec9319418f1c9f909fe0f6413143d with the repository check and Windows/Linux/macOS CI. Its tree matches tested source f2f06033.
2. Publish all 28 prepared scanner, SDK and runtime package versions. Run the existing release workflow for all five scanner and CLI targets and GitHub assets. Never republish an accepted exact npm version.
3. Verify public metadata, tarballs and latest tags. Install public groma.md@0.7.0 in an empty home and compare its native binary with the checksum-verified release download. Exercise ten public scanners through fresh installation and an independent checkout restore. Record local macOS ARM64 execution separately from five-target CI execution.
4. Require real public npm Action scan/export and committed-comparison smoke plus Windows/Linux/macOS checks before merging Action PR #8. Publish Action v1.2.0 at its qualified merge and move v1.
5. Record release links, versions, checks and remaining account-maintenance approvals. No product changes belong in this final release record.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The candidate CLI version is 0.7.0 so its declared API satisfies Dart >=0.7.0 during manual builds, fresh-checkout checks and eventual publication. The first build-only workflow reproduced a packaged TypeScript native-compiler symbol failure on both Linux architectures and macOS; all other 21 scanner package checks pass on those hosts. This actual release blocker will be fixed before publication.

Prepared Groma 0.7.0, all six new scanner identities, C public metadata, Dart >=0.7.0 and patch versions for the 16 existing scanners plus author contract. bun.lock changes only the 17 matching workspace versions; formatting and all other manifest values are preserved. The existing local build path passes bun run check: lint/typecheck, 16 Node tests, 874 Bun tests, 62 optional skips, zero failures and 3558 assertions (/tmp/groma-release610-versioned-check.log). Own specification/quality review confirms these are publication identity changes, with no scanner inference change or new test. The first five-platform workflow passes repository validation and all other 21 package checks on Linux/macOS but finds the TypeScript SDK/worker mismatch tracked in TASK-611. Platform artifact qualification, publication and the concrete draft review remain pending.

TASK-611 fixes the TypeScript SDK/worker mismatch; build-only run 38817786034 passes validation and all 22 packaged fresh-checkout scenarios on macOS ARM64, Linux x64/ARM64 and Windows x64/ARM64. The original source candidate 5a6a0ff9 and the final 79d53153 candidate differ only by TASK-612 test/record changes, not scanner package inputs. All 13 PR matrices pass Windows, Linux and macOS; TASK-612 also passes its controlled Windows full suite with 100 repeated cases (maximum 1025.95 ms). Source PRs through Mojo are merged. Version metadata and the worker packaging fix stay open until their exact npm versions exist, because architecture export restores those manifest versions. The exact merged main architecture workflow 38826009978 passes every comparison, export and deployment; main CI 38825821199 is running. Six 0.1.0 tarballs are assembled and audited for entry points, licenses and parser/worker contents; Dart includes all five workers. The two outdated C/Dart platform notes now distinguish five-target fixture execution from macOS-only real-project trials. Dart copies its guide into the npm README, so that text must be refreshed in the prepared artifact before publication; no code or native worker changes. Both npm browser login windows expired without completion; no packages or GitHub release have been published. The v0.7.0 draft uses the last eight releases user-facing format and remains draft pending its concrete maintainer review. Fresh public install/second-checkout restore scripts are prepared but cannot run before publication.

Final candidate e7149d27 passes bun run check:16 Node,897 Bun,62 optional skips,0 failures,3693 Bun assertions. Build-only workflow39006640891 passes validation and scanner package/fresh-checkout checks on all5hosts:macOS ARM64,Linux x64/ARM64,Windows x64/ARM64. Its d972eda9 scanner/package inputs are unchanged in e7149d27; the latter only fixes current-config Backlog conflicts, explicit web upgrade diagnostics and their regressions. All5CLI binaries cross-compile from e7149d27; macOS ARM64 actually executes0.7.0. Final3OS candidate CI39007672020 is running.

Actual0.7binary qualification: all6public0.1.0scanners pass fresh install and independent second-checkout restore with emptyHOME/Git-onlyPATH, deterministic observations, useful outlines and unchanged source/config. Real official0.6.6binary upgrade preserves scanner selection/options and authored description/ownership, registers the installedBacklog1.53.0and reads its task, then explicit updates/rescan succeed. Default-enabled updates scan successfully on registry503and disconnected registry; a scan exits while registry work is held. Web2D,hidden relationships and selected element survive saving automatic updates and reload. PublicJava0.2.2/TypeScript0.2.3/Angular0.2.3pass source-only callforpapers revision1cb6783f3379664e3f176e72c5419064ce24dbfd withGit-onlyPATH:665Java,530TypeScript,844Angularfiles; repeated evidence/Markdown and post-initialization source bytes unchanged.

ActiondraftPR8 at9fa29bc passes current Windows/Linux/macOS unit CI and actual-candidate fresh/warm scan-export and committed comparison. Comparison executes no project scanner and changes no config. It stays draft/unmerged until publicGroma0.7.0passes the real npm smoke. Publication remains paused. All6newpackages and18updateduploads were accepted earlier; Java0.2.2is now visible. Four older target versions,NASM/COBOL/Scala/Kotlin0.1.1,still404and need the previously identified protected npm publisher verification. No package,GitHubrelease orActiontag was published in this follow-up.

Alex explicitly approved publishing Groma0.7 and the Action after final-review fixes. TASK620/PR167 is merged as6c4dbe64, treeequal to qualified68966159; full localcheck16Node898Bun62skip0fail3703assertions, all3CI39031763726 and architecturegreen, targeted Astra re-review clean. Draft414337787 now has tagv0.7.0 and exacttarget6c4dbe64; its user-facing notes were reviewed against the prior eight releases, and Alex said to proceed. Existing four pending package sources, contracts and language guides have no diff from qualified5a6a0ff9 and assembled artifacts contain all5platform directories. Fresh npmwhoami401 requires a new browser login; the login window was opened in the default browser. No release has been published yet.

All four manual npm0.1.1 uploads succeeded after fresh login and NASM publish approval; npm reused the approval for COBOL/Scala/Kotlin. Public verification finds27of28 tarballs ready; Kotlin0.1.1 is in its public package index but its actual tarball still404. No accepted version was republished. Main6c4dbe64 post-merge CI39032379645 failed in Windows fixture deletion (EBUSY), not a scanner package check; TASK621/PR168 now waits for its detached test worker before deletion without product changes/retries/timeouts/assertion removal. Full check16Node898Bun62skip0fail3703assertions and all3OS/architecture39057894307 pass. PR168 merged4ed1aba7; treea5049809 exactly matches qualifiedf2f06033. Draft414337787 now targets4ed1aba7 asv0.7.0 and remains unpublished pending package readiness. Main post-fix CI39058705756 is running. Action draft415906493 isv1.2.0, still unpublished; public install acceptance variants are prepared at /tmp/groma-release07-final-public-first.ts and restore.ts for the actual release binary. The separate npm protected-settings verification for already-approved Scala/Kotlin publishers is open; futureNASM/COBOLpermission remains pending and does not block the accepted manual uploads.

Groma v0.7.0 is now published from 4ed1aba77feec9319418f1c9f909fe0f6413143d: https://github.com/MrLesk/groma.md/releases/tag/v0.7.0. Release run 39059377506 completed successfully, including repository checks, all five scanner build/fresh-checkout targets, all five native CLI builds, scanner publication, six CLI npm publication jobs and release assets. Main CI 39058705756 passes Windows, Linux and macOS. All 28 scanner/SDK/runtime versions and their tarballs are publicly downloadable. The public macOS ARM64 binary matches SHA256SUMS (09e842b0aa83f702bb29d2d8994875f10382f615bf2d79a62adbe8184a460c31). It passes all ten scanner fresh-install and independent second-checkout restore scenarios with empty HOME and Git-only PATH: C, C++, Ada, Dart, MQL5, Mojo 0.1.0 and NASM, COBOL, Kotlin, Scala 0.1.1. Useful observations/outlines, repeatability and unchanged source/config are verified. Receipts: /tmp/groma-release07-final-public-first-results.json, /tmp/groma-release07-final-public-restore-results.json and /tmp/groma-release07-final-consumer-results.json. Only macOS ARM64 consumer execution was performed locally; the other four targets passed their CI fixtures. npm is still processing two CLI platform payloads; public wrapper installation and the Action release gate remain pending.

Public npm consumer installation also passed: groma.md@0.7.0 installed into an isolated prefix and empty HOME, its wrapper reports 0.7.0, and its installed macOS ARM64 native binary exactly matches the checksum-verified public GitHub asset. All six CLI npm indexes and tarballs are ready, and each latest tag is 0.7.0. Receipt: /tmp/groma-release07-npm-consumer-results.json. Action public npm validation39061382617 passes Windows/Linux/macOS unit checks plus actual Linux npm install, map export and committed comparison. Its final task-record head9e1ea22 is running the required final PR checks before merge/release.

Action PR8 merged as abbee77b29d752bd5aac6915681d0c628e79e4b1. Its treea1230a460c8ed0f5d7350414ab8477812005c627 equals tested head9e1ea22; final ready-PR run39061508743 passes Windows, Linux, macOS and public npm release-smoke. Actionv1.2.0 is published at that exact merge: https://github.com/MrLesk/groma.md-action/releases/tag/v1.2.0. Movingv1 now points at the same commit. Groma and scanner publication are complete. Separate account maintenance remains: protected npm verification for previously approved Scala/Kotlin trusted-publisher settings expired without any account change; ongoing NASM/COBOL publisher approval is still unanswered. These settings did not block this release because all exact scanner versions were already accepted and publicly verified. No unapproved ongoing permission was granted.

Post-publication Action checks are also green: main run 39061604892 includes public npm smoke, and tag runs 39061632336 (v1.2.0) and 39061636707 (v1) pass all three operating systems. Both release tag refs resolve directly to abbee77b29d752bd5aac6915681d0c628e79e4b1.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Published Groma 0.7.0, six new experimental scanners at 0.1.0, patches for existing scanners, and the scanner SDK/runtime packages. All 28 prepared scanner-related package versions and all six CLI npm payloads are public. GitHub includes five binaries and SHA256SUMS.

Release workflow 39059377506 succeeds, including the repository check and scanner package fixtures on macOS ARM64, Linux x64/ARM64 and Windows x64/ARM64. Source and main CI pass Windows, Linux and macOS. Local public consumer testing executes macOS ARM64: npm CLI installation, checksum equality, and ten scanner fresh-install/independent-restore flows pass with unchanged source/config. Other targets were exercised by CI.

Action v1.2.0 is published after public npm smoke and all three OS checks. Both v1.2.0 and v1 point at qualified merge abbee77b29d752bd5aac6915681d0c628e79e4b1. User-facing notes follow the prior eight releases and omit internal verification steps. Links: https://github.com/MrLesk/groma.md/releases/tag/v0.7.0 and https://github.com/MrLesk/groma.md-action/releases/tag/v1.2.0. Separate protected npm publisher account maintenance remains pending as recorded in the notes.
<!-- SECTION:FINAL_SUMMARY:END -->
