---
id: TASK-609
title: Keep concurrent architecture profile reads reliable on Windows
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-15 20:21'
updated_date: '2026-10-15 20:28'
labels: []
dependencies: []
references:
  - src/project-profile.ts
  - src/groma-filesystem.ts
  - src/viewers/web/runtime.ts
  - test-bun/web-export.test.ts
  - test-bun/filesystem-access.test.ts
modified_files:
  - .github/workflows/ci.yml
  - src/groma-filesystem.ts
  - test-bun/filesystem-access.test.ts
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
Keep the existing exclusive-file lock and its bounded wait. Windows can return EPERM while deletion of the previous lock is still pending; handle that Windows-only result as contention in the same wait loop used for EEXIST. Other platforms/errors, the five-second deadline, nested access and release semantics stay unchanged. Extend the existing protected-read scenario to assert that the concurrently read valid profile survives. Validate separate-process exclusion, timeout and exports, then repeat the 1000-iteration real Windows reproduction. No new lock representation, metadata, C4 concept, recovery layer or test retry.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Before-fix Windows reproduction: https://github.com/MrLesk/groma.md/actions/runs/38801290449 . Log /tmp/groma-profile-diagnostic-windows.log records EPERM from acquire at iteration 12. No production behavior has been changed based only on the generic export error.

Closing the lock handle immediately did not resolve the Windows failure: https://github.com/MrLesk/groma.md/actions/runs/38801607492 reproduced both EPERM during acquisition and ENOENT on release. Replacing the file primitive with atomic directory creation is now under test; do not treat the failed handle-only candidate as the final fix.

The directory candidate also hit Windows EPERM at iteration 285 (run38801864070), so changing the lock representation does not address the underlying delete-pending state. Microsoft documents that recreating a file pending deletion can return ERROR_ACCESS_DENIED: https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfilea . Return to the existing file lock and classify the reproduced Windows EPERM within its already bounded contention wait. The directory candidate passed local checks but is not accepted.
<!-- SECTION:NOTES:END -->
