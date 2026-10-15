---
id: TASK-609
title: Keep concurrent architecture profile reads reliable on Windows
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-15 20:21'
updated_date: '2026-10-15 20:25'
labels: []
dependencies: []
references:
  - src/project-profile.ts
  - src/groma-filesystem.ts
  - src/viewers/web/runtime.ts
  - test-bun/web-export.test.ts
modified_files:
  - .github/workflows/ci.yml
  - src/groma-filesystem.ts
type: bug
ordinal: 655000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Current Windows CI failed the existing working-tree export test with No Groma architecture in this snapshot even though its source-view fixture contains a valid project profile. loadMapRoot reads the architecture and profile concurrently, and loadProjectProfile hides the underlying error. Diagnose this real supported export failure and make the smallest correction that preserves profile and locking semantics.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Working-tree export keeps the valid project profile while the architecture and profile are read concurrently on Windows.
- [ ] #2 The affected export and filesystem checks pass without removed assertions, increased timeouts or retries.
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
Use atomic creation/removal of the existing .groma.lock path as a directory. The Windows file-open primitive reproduced EPERM; closing its handle still reproduced EPERM and ENOENT on release. Keep the existing bounded lock wait, nested access and timeout behavior. GromaFileSystem.list hides the root lock directory, so architecture traversal and generated OKF index links continue to see only architecture data. Existing cross-process exclusion, protected-write and index tests verify those invariants; replay the 1000-iteration Windows profile reproduction. Add a focused concurrent profile/architecture read scenario only if existing coverage leaves that supported result unobserved. No new metadata, C4 concept, recovery behavior or compatibility path.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Before-fix Windows reproduction: https://github.com/MrLesk/groma.md/actions/runs/38801290449 . Log /tmp/groma-profile-diagnostic-windows.log records EPERM from acquire at iteration 12. No production behavior has been changed based only on the generic export error.

Closing the lock handle immediately did not resolve the Windows failure: https://github.com/MrLesk/groma.md/actions/runs/38801607492 reproduced both EPERM during acquisition and ENOENT on release. Replacing the file primitive with atomic directory creation is now under test; do not treat the failed handle-only candidate as the final fix.
<!-- SECTION:NOTES:END -->
