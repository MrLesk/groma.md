---
id: TASK-603
title: Keep repository listing stable when temporary files disappear
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-15 20:10'
updated_date: '2026-10-15 20:13'
labels: []
dependencies: []
references:
  - src/repository-listing.ts
  - test-bun/scanner-source-listing.test.ts
modified_files:
  - test-bun/scanner-source-listing.test.ts
  - src/repository-listing.ts
type: bug
ordinal: 653000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Windows CI exposed a plugin installation action that silently resolved after discovery failed. A local reproduction confirms repositoryListing can list groma/.groma.lock, see it exists, then fail with ENOENT when a concurrent Groma read releases the lock before lstat. The user's cross-platform CI gate requires fixing this supported concurrent-read flow.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Repository listing omits a file removed before its stat, while preserving existing selected files and symlink ownership rules.
- [ ] #2 The existing listing tests and complete repository check pass; the current PR head passes Windows, Linux and macOS CI before release.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [x] #3 Public contracts or documentation are updated when behavior changes.
- [x] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Keep disappearance handling inside repositoryListing, which owns the physical file list. Use one stat per file that can report absence, instead of a separate exists/stat sequence. This changes no OKF metadata, C4 element, or architecture ownership rule. Extend the existing source-listing test for a file removed between Git listing and filesystem inspection: the observed ENOENT must fail before the fix, and stable source must still be returned afterward. Existing tests already cover ignored files and physical symlink identity; retain them.

The controlled regression removes a real temporary file immediately before lstat, using a mocked filesystem call in an isolated child process. That keeps the deletion point deterministic and leaves all parallel tests untouched. The child still runs real Git listing and filesystem operations. A separate real concurrent-lock stress run reproduced the same ENOENT at iteration 238.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
A real concurrent Groma lock/read loop failed before the fix with ENOENT at iteration 238 and completed all 300 discovery calls after it. The deterministic child-process regression also failed before and passed after. Focused listing/discovery/installation checks pass: 20 tests, 74 assertions. Full bun run check passes lint/typecheck, 16 Node tests and 780 Bun tests (51 optional skips, 0 failures, 2907 assertions); /tmp/groma-task603-check.log. Implementer specification review confirms deleted temporary files are omitted and existing source/symlink semantics stay intact. Quality review traced Git listing -> optional stat -> physical-identity filter; the child mock is isolated, the failure assertion is meaningful, and no abstraction, retry or timeout was added. Windows/Linux/macOS PR verification remains pending. No live groma changes.
<!-- SECTION:NOTES:END -->
