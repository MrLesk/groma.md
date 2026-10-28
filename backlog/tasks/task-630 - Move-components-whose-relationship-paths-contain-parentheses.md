---
id: TASK-630
title: Move components whose relationship paths contain parentheses
status: Done
assignee:
  - '@codex'
created_date: '2026-10-25T10:07:00Z'
updated_date: '2026-10-25T10:13:00Z'
labels: []
dependencies: []
references:
  - 'https://github.com/MrLesk/groma.md/issues/131'
  - src/relationship-storage.ts
  - src/curate-rename.ts
modified_files:
  - test-bun/source-relationships.test.ts
  - src/curate-rename.ts
  - src/relationship-storage.ts
type: bug
ordinal: 699000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A component move fails when a derived relationship points to a route-group source path such as app/(tabs)/index.tsx. Stored link generation and move rebasing disagree about valid Markdown destinations.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Moving a component with a derived relationship to app/(tabs)/index.tsx succeeds and keeps the same source and target files.
- [x] #2 Relationship links written by Groma and links rebased by a move use consistent Markdown-safe destinations.
- [x] #3 The supported regression fails before the fix, passes after it, and bun run check passes.
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
1. Extend the existing source-relationship curation coverage with a callback provider under src/(tabs)/index.tsx; verify that moving its source owner fails before the fix. Authority: issue #131 and the Markdown contract require relative links to retain their endpoints when the owning document moves. Existing move coverage uses plain paths, so it misses a valid route-group destination. The smallest new test observes successful movement, the destination parent, and unchanged directed file connections.
2. Make relationship storage encode link destinations like move rebasing does, and let rebasing recognize the existing valid balanced-parenthesis destinations from the reported flow. Keep ownership and relationship semantics unchanged.
3. Run focused relationship/rename tests and bun run check; review the supported flow against acceptance criteria and quality requirements, then create a separate pull request including this task record.
OKF/C4: source links remain ordinary Markdown inside the existing OKF element; no C4 element, boundary, relationship meaning, or metadata is added. Core still owns relationship endpoints and document relocation. This path handling is independent of language or framework.

Exercise the same move with both the stored destination and the literal balanced-parenthesis destination reported in #131, so fixing only future writes cannot leave the reported existing document unable to move.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The two new route-group move cases reproduced the exact failure before the fix: after relocation, the stored target resolved inside groma/systems/src/(tabs)/index.tsx and was rejected as an architecture concept. The change recognizes the reported balanced-parenthesis destination and percent-encodes newly written relationship destinations with the same encoding already used by move rebasing.

Validation: the two route-group regression cases failed before the source change and pass after it. All 27 focused relationship, rename and system-curation tests pass. bun run check passed: lint/typecheck, 26 Node tests, 932 Bun tests, 63 opt-in skips, zero failures (Bun 1.4.3, Node 24.11.1 on this host). Existing lint reports two warnings and two infos outside this change. git diff --check passed; no groma/ files changed.
Implementer specification review: all three acceptance criteria and project Definition of Done have evidence. This restores the documented relocation behavior and adds no public command or metadata contract.
Implementer quality/simplicity review: editArchitecture delegates relocation to withMovedLinks, which now recognizes the reported literal route-group destination; relationship storage writes the same percent-encoded destination form as relocation. The reloaded graph confirms the target parent and directed source-file connections. Both tests own temp roots and fail for the actual broken result. No separate review agents are required for this small fix. No supported-flow blockers remain.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Component moves retain relationships to route-group source paths such as src/(tabs)/index.tsx. New relationship links percent-encode their destinations consistently with move rebasing; rebasing also handles the literal balanced-parenthesis links from the reported failure. Verified failure before the fix, 27 focused tests passing, and the complete repository check passing with 26 Node and 932 Bun tests (63 opt-in skips).
<!-- SECTION:FINAL_SUMMARY:END -->
