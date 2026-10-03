---
id: TASK-534
title: Match the code panel opacity to other panels
status: Done
assignee:
  - '@codex'
created_date: '2026-10-03 20:51'
updated_date: '2026-10-03 20:55'
labels: []
dependencies: []
references:
  - source-control
modified_files:
  - src/viewers/web/source/view.ts
type: bug
ordinal: 619000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Opening a source file currently replaces the shared translucent details background with a solid background and removes blur, so the code panel looks different from the other map panels.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The code panel uses the shared panel background opacity and blur in every theme.
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
1. Remove the file-open background override so source and diff views inherit the shared details panel surface. 2. Verify the rendered page background and blur in light, dark and blueprint themes; run bun run check. This is a styling fix; no new tests are needed because decorative CSS assertions would freeze implementation details.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Removed one CSS override in source/view.ts. Browser verification of a temporary page rendered by renderPage confirmed the code panel and hierarchy have identical computed backgrounds: 35% opacity in light and dark, 78% in blueprint, with blur(14px) in all three themes. The first repository check was blocked by sandbox restrictions on local servers and file watchers; rerunning with the required access. Own review confirms the shared details CSS owns the surface and the source panel only owns file layout; no public contract or documentation changes are needed.

bun run check passed with the required local server and watcher access: lint, type checking, Node tests and Bun tests completed successfully; Bun reported 750 pass, 48 skip, 0 fail. Specification and quality review passed: the one-line removal restores the shared panel surface, introduces no new responsibilities, and changes no source loading or navigation behavior.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Removed the solid-background and no-blur override from the code panel so it uses the same theme-aware surface as other panels. Verified matching computed background opacity and blur in light, dark and blueprint browser previews. bun run check passed. No new tests or public contract changes were needed.
<!-- SECTION:FINAL_SUMMARY:END -->
