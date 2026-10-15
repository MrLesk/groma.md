---
id: TASK-609
title: Keep concurrent architecture profile reads reliable on Windows
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-15 20:21'
updated_date: '2026-10-15 20:23'
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
Use a temporary manual Windows CI diagnostic to expose the error currently caught by loadProjectProfile and repeat the existing loadMapRoot flow on a private fixture. Do not infer the cause from the generic export message. Once reproduced, fix only the responsible flow and extend existing coverage when the exact failure and coverage gap are known. Preserve OKF project metadata and C4 meanings; this task concerns reading existing data, not adding architecture concepts.

The real Windows diagnostic failed at iteration 12 with EPERM from open(groma/.groma.lock, wx), hidden by loadProjectProfile. The lock is owned by exclusive file creation and deletion, not an OS-held advisory lock. Test the smallest correction: close its file handle immediately after exclusive creation and leave the file present until release. Existing separate-process exclusion, timeout and protected-write tests verify ownership. The same 1000-iteration Windows diagnostic will establish whether this resolves the observed error before finalizing it.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Before-fix Windows reproduction: https://github.com/MrLesk/groma.md/actions/runs/38801290449 . Log /tmp/groma-profile-diagnostic-windows.log records EPERM from acquire at iteration 12. No production behavior has been changed based only on the generic export error.
<!-- SECTION:NOTES:END -->
