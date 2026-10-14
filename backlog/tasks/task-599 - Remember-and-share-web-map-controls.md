---
id: TASK-599
title: Remember and share web map controls
status: Done
assignee:
  - '@codex'
created_date: '2026-10-14 19:38'
updated_date: '2026-10-14 19:54'
labels: []
dependencies: []
references:
  - src/viewers/web/url.ts
  - src/viewers/web/chrome/map-view.ts
  - src/viewers/web/chrome/c4-filter.ts
  - src/viewers/web/render.ts
modified_files:
  - features/map-filters.feature
  - src/viewers/web/chrome/c4-filter.ts
  - src/viewers/web/chrome/map-view.ts
  - src/viewers/web/url.ts
  - src/viewers/web/render.ts
  - test-bun/web-map-controls.test.ts
  - docs/viewers/web/index.md
  - groma/systems/groma-md/containers/export/components/c4-filter.md
  - groma/systems/groma-md/containers/export/components/shell.md
type: feature
ordinal: 671000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Developers lose the chosen web map projection and visibility filters when they reload a page. A copied link must reproduce those controls for another reader even when that reader has different saved preferences.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Choosing Iso, 2D, or Layers and the map visibility filters saves those choices in browser localStorage and restores them after a page reload.
- [x] #2 Explicit URL values take precedence over saved choices; missing map-control URL values use saved choices or the existing defaults, and the URL then contains the effective projection and complete visibility choice.
- [x] #3 Changing the map controls updates the shareable URL; another browser opening that URL gets the same projection and filters, including all-visible defaults.
- [x] #4 Live maps and static exports use the same behavior, with the existing architecture, selection, and navigation preserved.
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
1. Extend the existing map-view control domain with one typed configuration for projection and hidden map filters, using the same compact values for URL and localStorage. URL values win independently; missing values use the saved configuration, then Iso/all-visible defaults.
2. Extend the existing view URL reader/writer and initialize the map motion and filter control before the first projection. Save and synchronize both tab and F2 changes, filter clicks, and explicit embedded views through the same path.
3. Add the supported reload/share scenarios to features/map-filters.feature before implementation and update the web guide.
4. Test authority and gap: the user requires reload persistence and recipient-independent sharing; current URL/theme and scene-filter tests do not cover map controls. Add a focused test of saved restoration, partial URL precedence, explicit all-visible sharing, all projection/filter round trips, and a filter-control click updating actual visibility. Wrong precedence or omitted defaults must fail. Reuse current fixture and motion/filter coverage for geometry and navigation.
5. Run focused checks, verify the browser controls and reload/share flow in a static fixture export, and run bun run check. Perform specification/quality review and the requested full-context complexity review.
6. Check task-scoped architecture changes, finalize the task, commit only this task on shared main, push that commit to a dedicated remote PR branch, and create the PR using the repository template.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementation: chrome/map-view.ts owns one typed projection/filter configuration and its shared URL/localStorage representation. url.ts carries those controls with the existing ViewState. render.ts restores them before the first projection and synchronizes tabs, F2, filter clicks, and explicit embedded views. Motion remains the projection owner; the filter control remains the visibility owner. No new source module, dependency, stored OKF concept, or C4 element. Preferences have no repository or language-specific IDs.
Acceptance evidence: storage tests cover last-choice restoration; URL tests cover independent precedence, missing-value defaults, every projection and filter kind, and explicit all-visible sharing over different recipient preferences. A filter-control test verifies restored buttons and actual scene visibility. Existing tests retain geometry, source-world immutability, and selection/source URL behavior. Browser checks on a fixture export verified reload, bare-link restoration, copied-link precedence, explicit defaults, and F2 synchronization.
Verification: bun run check passed on the final reviewed code in a clean Git verification copy at /tmp/groma-task599-final-verification: Biome and scrollbar lint, TypeScript, 16 Node tests, and 793 Bun tests passed; 54 Bun tests skipped; zero failures. Log: /tmp/groma-task599-reviewed-check.log. The full suites also passed in shared main. Its direct typecheck sees ignored generated scanner dist/lib declarations and fails in unchanged terminal-lifecycle.test.ts:39; the clean baseline and final task copy both typecheck. No check configuration or terminal code was changed.
Reviews: implementer specification and quality reviews passed. Full-context complexity reviewer recommended keeping the architecture and found no blocking defect. Applied both bounded simplifications: remove assertions that retested unchanged motion and rename the filter callback to onChange. The targeted re-review found no regression. Web guide, Gherkin scenarios, and the existing Map controls/Map filters architecture overviews describe the final behavior. No task-created standalone architecture component needs combining.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Web maps now remember Iso, 2D, Layers and all five visibility filters in localStorage. Explicit view/hide URL values override saved preferences; missing values are filled and defaults are written, so copied links reproduce the controls. Live and static maps share the behavior. Browser checks, the complete repository check in a clean Git copy, and complexity review passed.
<!-- SECTION:FINAL_SUMMARY:END -->
