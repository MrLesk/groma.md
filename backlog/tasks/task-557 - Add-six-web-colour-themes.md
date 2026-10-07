---
id: TASK-557
title: Add six web colour themes
status: Done
assignee:
  - '@codex'
created_date: '2026-10-07 17:00'
updated_date: '2026-10-07 17:06'
labels: []
dependencies: []
references:
  - src/viewers/web/atoms/theme.ts
  - src/viewers/web/page.ts
modified_files:
  - src/viewers/web/atoms/theme.ts
  - src/viewers/web/page.ts
  - src/viewers/web/startup/page.ts
  - test-bun/web-theme.test.ts
  - test-bun/web-sharing.test.ts
  - docs/viewers/web/index.md
  - src/viewers/web/url.ts
ordinal: 640000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Architecture maps need palettes that suit different projects, including a dark electric-blue and cyan palette inspired by the Teslatlas app icon.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Six additional themes are selectable and remembered in the web viewer.
- [x] #2 New themes survive shared query URLs and publication paths, including setup and exported covers.
- [x] #3 Existing Auto, Light, Dark and Blueprint choices keep working.
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
Extend the existing palette registry and derive page/setup CSS from it. Keep the current theme picker, URL and cover mechanisms. Extend existing URL and sharing tests because their hardcoded old choices miss unsupported new themes; verify actual switching in a browser and run the repository check.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Focused viewer checks: 14 pass, 0 fail with the repository runner options. Chrome browser checks passed for all 9 palettes: picker, saved choice, reload and setup screen. Full check: lint, typecheck and 32 Node tests pass; Bun suite 756 pass, 51 skip, 17 fail, all Java/Scala/COBOL scanner failures due to missing Java runtime. No scanner changes. Browser screenshots retained outside source.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added Teslatlas, Solar, Ocean, Forest, Plum and Sand to the existing theme menu, shared URLs, startup CSS and exported covers. Registry-derived CSS keeps the page and setup consistent. Focused and browser checks pass; full suite requires a Java runtime for unrelated scanners.
<!-- SECTION:FINAL_SUMMARY:END -->
