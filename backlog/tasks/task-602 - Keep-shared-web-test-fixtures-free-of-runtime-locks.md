---
id: TASK-602
title: 'Make scanner CI reliable across Windows, Linux and macOS'
status: Done
assignee:
  - '@codex'
created_date: '2026-10-15 19:43'
updated_date: '2026-10-15 22:14'
labels: []
dependencies: []
references:
  - test-bun/web-theme.test.ts
  - test-bun/web-sharing.test.ts
  - 'https://github.com/MrLesk/groma.md/actions/runs/38794894560'
  - src/repository-listing.ts
  - src/groma-filesystem.ts
  - .github/workflows/ci.yml
  - test-bun/helpers.ts
  - test-bun/flows.test.ts
  - test-bun/flow-navigation.test.ts
  - test-bun/plain-view.test.ts
  - test-bun/web-flow-activation.test.ts
  - test-bun/web-selection-camera.test.ts
  - test-bun/kotlin-scanner.test.ts
  - test-bun/web-revisions.test.ts
  - test-bun/java-scanner.test.ts
  - test-bun/java-outline.test.ts
  - test-bun/java-duplicates.test.ts
  - src/history/revisions.ts
modified_files:
  - test-bun/web-theme.test.ts
  - test-bun/web-sharing.test.ts
  - src/repository-listing.ts
  - test-bun/scanner-source-listing.test.ts
  - .github/workflows/ci.yml
  - test-bun/cobol-scanner.test.ts
  - test-bun/scala-scanner.test.ts
  - src/groma-filesystem.ts
  - test-bun/filesystem-access.test.ts
  - test-bun/helpers.ts
  - test-bun/flows.test.ts
  - test-bun/flow-navigation.test.ts
  - test-bun/plain-view.test.ts
  - test-bun/web-flow-activation.test.ts
  - test-bun/web-selection-camera.test.ts
  - test-bun/kotlin-scanner.test.ts
  - test-bun/java-duplicates.test.ts
  - test-bun/java-outline.test.ts
  - test-bun/java-scanner.test.ts
  - src/history/revisions.ts
type: bug
ordinal: 672000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Cross-platform qualification of the scanner PRs reproduced shared-fixture lock contamination, source-listing races when temporary files disappear, Windows lock contention reported as EPERM during deletion, and COBOL/Scala build work exhausting runtime-test budgets. Correct these concrete failures in one CI prerequisite so every scanner PR is verified on a base containing all corrections.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Web theme and sharing tests take Groma locks only in per-test temporary projects, preserving existing assertions and concurrent execution.
- [x] #2 Repository listing omits files removed before stat while retaining stable source and physical symlink selection.
- [x] #3 Concurrent Windows architecture and profile reads preserve a valid profile; the existing exclusive lock, deadline, nested access and protected-write rules remain effective.
- [x] #4 CI builds COBOL and Scala packages before timed scanner scenarios; supplied-package and ordinary local-build paths retain every assertion and existing timeout.
- [x] #5 Focused regressions and the full repository check pass without test retries, assertion removal or longer timeouts, and CI retains required Windows, Linux and macOS coverage.
- [x] #6 Every test that reads the shared flow fixture takes its Groma lock in a private temporary copy, preserving all flow assertions and concurrent execution.
- [x] #7 CI builds the Kotlin package before its timed scanner scenario, preserving the ordinary local build path, assertions and timeout.
- [x] #8 CI builds the Java package once before all three packaged Java scenarios; runtime assertions and existing timeouts remain unchanged.
- [x] #9 Git history loads a complete temporary archive before extraction, reports Git or tar failures, and preserves the selected snapshot and current checkout.
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
1. Give every shared-fixture reader its own copy; existing concurrent sharing/theme/export/detach tests cover the result. 2. Use an optional stat for each listed path. The isolated disappearing-file regression must fail before and pass after; existing listing tests retain source/symlink rules. 3. Keep the existing exclusive-file lock and bounded wait, treating the reproduced Windows-only EPERM as contention while deletion is pending. Extend the existing protected-read test to observe the valid project profile; retain cross-process exclusion and timeout tests. 4. Build COBOL and Scala artifacts in separate CI steps and reuse the existing native-package test pattern. Run both test paths without new assertions or timeout changes. 5. Run focused checks, the complete repository check and exact-head Windows/Linux/macOS CI. These changes preserve OKF Markdown, C4 meanings and source ownership; existing filesystem and test-package owners retain responsibility. No new architecture concept or storage format is introduced.

The Linux PR154 run reproduced an orphan lock in the flow fixture too. Route all five flow-fixture reader files through one temporary-copy helper in existing test helpers, including the plain-view record path. Existing flow, navigation, camera, authoring and scanner-copy tests already prove the supported outcomes; retain their assertions and use them concurrently. No new assertion or test is needed for this fixture-lifecycle correction. Verify no flow reader can create a lock in the shared source, run the focused files and the full check, then repeat CI for the updated PR stack.

The Windows PR147 run also timed out while building Kotlin inside its 120-second scanner scenario. Move Kotlin compilation into CI preparation and copy the supplied package into the test-owned temporary directory, matching COBOL and Scala. Existing Kotlin scenario assertions cover the unchanged behavior, so no new test is needed. Check both package paths and the full repository suite. Diagnose the separate web-history timeout with a temporary Windows-only timing branch before choosing any change to that flow.

The final Windows MQL5 job reproduced the same build-budget problem in java-duplicates.test.ts, which creates a bundled Java runtime inside its 120-second lint scenario. Audit all JVM package callers and prepare Java once before tests as well. Reuse the supplied package in the three existing packaged Java scenarios (scanner, outline and duplicates); preserve worker-level tests, every assertion and existing timeout. No new test is needed because those existing scenarios already exercise packaging, installation, scanning, outlines and lint. Run both supplied and local-build paths, full check and exact-head platform CI.

macOS job 116684772768 reproduced an unhandled EPIPE while git archive streamed into tar during the existing web-history scenario. Replace the live pipe with a completed temporary archive beside the extracted tree, then extract using a relative tar path for Windows. The existing history and comparison scenarios already verify selected source, architecture, unsupported revisions and checkout immutability; no new test or assertion is needed. This changes temporary delivery only, with no OKF or C4 semantic change. Run the existing history/export checks and the complete repository check, then verify each updated PR head on all three platforms.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The controlled reproduction copied a private fixture while its Groma lock was held, then released the original lock. The copied .groma.lock remained and the independent project failed with GromaBusyError. Theme tests and both direct shared-fixture reads in sharing tests now use temporary copies, so they cannot create transient lock files in the shared fixture sources. Existing assertions and concurrency remain unchanged.

Own specification and quality reviews pass: all lock-taking calls in the two affected test files receive a per-test temporary project; cleanup is in finally blocks, all original assertions and concurrent settings remain, and no production code or timeout changed. The controlled copied-lock reproduction failed as expected. Focused checks pass 13 tests/112 assertions across five concurrent files. The complete repository check passes 16 Node tests and 803 Bun tests, 54 opt-in skips, zero failures and 3,085 assertions (/tmp/groma-task602-check.log). Shared empty-project and source-view fixture directories contain no remaining lock; git status --short groma/ is empty. No product contract changed, so no product documentation update is needed.

Consolidated the separately investigated TASK-603, TASK-604 and TASK-609 corrections into this single CI prerequisite. This keeps every scanner PR above the same corrected base. Their before-failure logs and local checks remain evidence; final acceptance depends on the complete consolidated change.

Final Windows correction is the two-line error classification in the existing exclusive-file acquisition loop. The original file-lock semantics and deadline remain intact. The unchanged 1000-iteration real Windows reproduction now passes: https://github.com/MrLesk/groma.md/actions/runs/38802252725 . Failed handle/directory candidates are excluded from this task. Exact-head PR CI remains the user-required release gate and will be recorded in each PR Checks section; it is separate from the committed implementation record, so adding the CI link does not itself change the tested commit.

The consolidated prerequisite on the current PR117/main base passes bun run check: lint/typecheck, 16 Node tests and 804 Bun tests (54 optional skips, zero failures, 3089 assertions); /tmp/groma-task602-consolidated-current-check.log. COBOL and Scala artifacts were rebuilt from that exact base before the passing run. The earlier local artifacts predated main parser fixes and were discarded, not used as release evidence. Own specification review confirms all five implementation criteria. Own quality review traces Git listing -> optional stat, filesystem acquisition -> existing bounded contention wait, private fixture reads, and explicit package build -> unchanged scanner scenario. Each fix stays in its existing owner; no architecture field, parser change, test retry, timeout increase or suppressed assertion was added. The child mock is isolated; the missing-file regression fails before and passes after; the Windows reproduction passes 1000 iterations; existing mutual exclusion and index tests pass. git status --short groma/ is empty. Exact-head CI results remain the release gate in the PR descriptions.

CI run 38803693752 failed in flow authoring when its temporary fixture copy contained a lock created by another flow-fixture reader. The first five tests in flows.test.ts and four viewer test files directly read that same fixture while other tests copy it. This is the same reproduced shared-fixture contamination as the earlier theme/sharing failure.

The flow-fixture correction passes 35 concurrent tests and 309 assertions across the five readers plus scanner installation, removal and detach. The complete bun run check passes lint/typecheck, 16 Node tests and 804 Bun tests, with 54 optional skips, zero failures and 3089 assertions (/tmp/groma-task602-flow-fixture-check.log). Own specification review confirms every flow-fixture reader now uses its own temporary root. Own quality review follows test -> withFixture -> copy -> original read -> finally cleanup; every original assertion and concurrent setting is retained. The shared flow fixture has no lock after verification, git diff --check passes, and groma/ is unchanged. This test-lifecycle fix adds no product behavior or architecture concepts.

Current Windows PR147 job 116667121209 timed out in the Kotlin package scenario and web-history scenario. Passing sibling Windows runs complete Kotlin in 25-50 seconds and web history in about 2.8-3.2 seconds. Temporary branch codex/ci-timeout-diagnostics records stage timings with the same test assertions and limits while Go compilation overlaps; diagnostic code will not enter the release PRs.

The Kotlin supplied-package and ordinary local-build paths both pass the unchanged 28 assertions. The full prerequisite check passes lint/typecheck, 16 Node tests and 804 Bun tests, 54 optional skips, zero failures and 3089 assertions (/tmp/groma-task602-kotlin-check.log). Own specification and quality reviews confirm that CI prepares the same package, each scenario owns a copied artifact, and assertions and timeouts are unchanged. The Windows diagnostic passed five complete runs with Go compilation overlapping: history took 2.4-3.1 seconds; the first Kotlin build took 78.4 seconds, versus 11.4-12.6 seconds afterward. No history defect was reproduced and its implementation and assertions remain unchanged. Diagnostic run: https://github.com/MrLesk/groma.md/actions/runs/38807948702. The diagnostic workflow and timing statements remain outside the PRs. Exact-head platform CI remains the final release gate.

Windows job 116676629036 passed the MQL5 and other new scanner scenarios but timed out in the existing Java duplicate-code scenario while it built and used a full package. This extends the confirmed JVM build/test separation correction to Java. No scanner semantics, test assertions or time budgets change.

All three Java package scenarios pass both paths: the supplied package and ordinary local builds each pass 11 tests and 49 assertions. The full prerequisite check passes lint/typecheck, 16 Node tests and 804 Bun tests, 54 optional skips, zero failures and 3089 assertions (/tmp/groma-task602-java-check.log). Own specification and quality reviews confirm that each test copies the prepared package into its own temporary artifact directory, worker-level compilation checks remain intact, and every assertion and timeout is preserved. All JVM package-build sites were audited; Java joins COBOL, Scala and Kotlin in explicit CI preparation. Scanner implementation files and groma/ remain unchanged. Final platform evidence will be recorded on the resulting PR heads.

macOS job 116684772768 reproduced an unhandled EPIPE in the live git archive to tar pipe. History now writes a complete archive beside a separate snapshot tree, extracts using a relative tar path, loads the tree and removes the entire temporary directory in finally. The focused history/comparison/export checks pass 11 tests and 127 assertions. The complete prerequisite check passes lint/typecheck, 16 Node tests and 804 Bun tests, 54 optional skips, zero failures and 3089 assertions (/tmp/groma-task602-history-archive-check.log). Own specification review confirms selected source and architecture, unsupported revision reporting and checkout immutability remain covered. Own quality review follows one sequential archive/extract/load/cleanup flow; Git and tar failures reject normally, no live write pipe remains, and the archive cannot become snapshot source. No test assertions, retries or timeouts changed. This removes custom process coordination and adds no architecture concept. git diff --check passes and groma/ is unchanged. Exact-head platform CI remains the final release gate.

Release integration carries the newly committed TASK-605 main workflows into the scanner prerequisite. Keep its native package and validation parallel groups. Prepare COBOL, Scala, Java and Kotlin sequentially between those groups, preserving the already-qualified build commands, supplied-package variables and test limits. No scanner implementation changes. Repeat exact-commit platform CI for the combined workflows before merging.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Made the scanner qualification path reliable by isolating shared test fixtures, skipping temporary files removed during repository listing, handling Windows delete-pending contention within the existing lock deadline, and preparing COBOL/Scala packages before timed scanner scenarios. Scanner semantics, assertions, timeouts, OKF metadata and C4 ownership remain unchanged. The full local check and the 1000-iteration Windows concurrency reproduction pass. Platform CI evidence is recorded on the exact PR commits before release.

All flow-fixture readers also use private copies, closing the additional Linux CI race without weakening the flow, navigation or camera checks.

Kotlin now follows the same prepared-package CI path as COBOL and Scala, so downloads and compilation do not consume its runtime-scenario budget.

Java packaging is also prepared once before the three packaged Java scenarios, completing the CI separation for JVM scanner runtime construction.

History snapshots now extract from a completed temporary archive, fixing the macOS broken pipe while preserving error reporting, isolated source and cleanup.
<!-- SECTION:FINAL_SUMMARY:END -->
