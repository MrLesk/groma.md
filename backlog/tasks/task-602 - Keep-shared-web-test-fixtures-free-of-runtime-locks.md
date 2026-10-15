---
id: TASK-602
title: 'Make scanner CI reliable across Windows, Linux and macOS'
status: Done
assignee:
  - '@codex'
created_date: '2026-10-15 19:43'
updated_date: '2026-10-15 20:56'
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
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Made the scanner qualification path reliable by isolating shared test fixtures, skipping temporary files removed during repository listing, handling Windows delete-pending contention within the existing lock deadline, and preparing COBOL/Scala packages before timed scanner scenarios. Scanner semantics, assertions, timeouts, OKF metadata and C4 ownership remain unchanged. The full local check and the 1000-iteration Windows concurrency reproduction pass. Platform CI evidence is recorded on the exact PR commits before release.

All flow-fixture readers also use private copies, closing the additional Linux CI race without weakening the flow, navigation or camera checks.
<!-- SECTION:FINAL_SUMMARY:END -->
