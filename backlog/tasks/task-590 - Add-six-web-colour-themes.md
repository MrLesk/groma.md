---
id: TASK-590
title: Add six web colour themes
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-07 17:00'
updated_date: '2026-10-11 16:11'
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
  - src/viewers/web/sharing/images.ts
ordinal: 640000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Architecture maps need palettes that suit different projects, including a dark electric-blue and cyan palette.
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
Rename the electric-blue/cyan palette to Electric throughout the public theme registry, documentation and PR. Rebuild the website and recheck theme links and covers.
Test note for the maintainer pass. Rule and authority: acceptance criteria 1 and 2, every theme choice survives publication paths and shared URLs and gets a cover image. Wrong result caught: a new theme that the URL reader or the cover export does not know. Gap: the tests named only the original themes, and the first version of this change replaced those names with the implementation's own list, which cannot fail. Smallest change: name the themes literally and add one new theme to each loop.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Focused viewer checks: 14 pass, 0 fail with the repository runner options. Chrome browser checks passed for all 9 palettes: picker, saved choice, reload and setup screen. Full check: lint, typecheck and 32 Node tests pass; Bun suite 756 pass, 51 skip, 17 fail, all Java/Scala/COBOL scanner failures due to missing Java runtime. No scanner changes. Browser screenshots retained outside source.

Renamed the electric-blue/cyan palette to Electric at the owner request; removed product references from public code, documentation, task description and PR. All 14 focused tests and browser checks for all 9 palettes pass after renaming. Website export rebuilt; 57 site tests pass.

Maintainer pass, 11 October 2026: merged main (Bun 1.4.3, OpenTUI 0.6.0) and renumbered this record from TASK-557, which main already uses. A cold simplicity review led to these changes: the theme names are one list (webThemes) that the menu, URL values, page CSS and cover images all read; cssBlock no longer emits color-scheme, so the main viewer keeps its behaviour for Light, Dark and Blueprint and only the startup screen sets it, as before; the theme menu marks are typed without casts; the theme tests name their themes literally again and include one new theme (sand).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added Electric, Solar, Ocean, Forest, Plum and Sand to the existing theme menu, shared URLs, startup CSS and exported covers. Focused and browser checks pass; full suite requires Java for unrelated scanners.
<!-- SECTION:FINAL_SUMMARY:END -->
