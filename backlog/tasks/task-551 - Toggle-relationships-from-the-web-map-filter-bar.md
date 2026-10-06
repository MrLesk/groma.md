---
id: TASK-551
title: Toggle relationships from the web map filter bar
status: Done
assignee:
  - '@codex'
created_date: '2026-10-06 08:18'
updated_date: '2026-10-06 08:29'
labels: []
dependencies: []
references:
  - c4-filter
documentation:
  - docs/viewers/web/index.md
modified_files:
  - features/map-filters.feature
  - src/viewers/web/chrome/c4-filter.ts
  - test-bun/web-c4-filter.test.ts
  - docs/viewers/web/index.md
  - groma/systems/groma-md/containers/export/components/c4-filter.md
type: feature
ordinal: 635000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Developers can already hide C4 element kinds from the floating map filter bar. They need the same direct control over relationship lines when inspecting architecture.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The existing map filter bar includes a Relationships toggle with the same pressed, hover, focus, and keyboard behavior as the element toggles; relationships start visible.
- [x] #2 Turning Relationships off hides every map relationship, including highlighted routes; turning it on restores the routes allowed by the current element filters without changing layout, camera, selection, or stored architecture.
- [x] #3 The relationship choice stays active across map updates and Iso, 2D, and Layers changes for the current page, in live and exported maps.
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
1. Add a Gherkin scenario for hiding and restoring relationships through the existing map filters.
2. Extend the existing web map-filter control and its page-local hidden set with a relationship filter. Keep the same button renderer, styles, repaint callback, and scene projection; filter routes before painting so highlighted lines and hit targets obey the setting. No model or layout changes.
3. Extend the existing filter test file: the user-requested rule is independent relationship visibility across Iso, 2D, Layers, and refreshed scenes. A wrong result would leave routes visible, remove architecture bodies, mutate geometry, or restore endpoints hidden by another filter. Existing coverage tests only element kinds; add the smallest route-toggle case alongside it, and verify actual button interaction in the browser.
4. Update the web guide and the existing Map filters architecture explanation. Run focused filter tests and bun run check, inspect the browser control, and perform specification and quality reviews.
5. Run the requested full-context complexity review, report material recommendations, and keep task-owned changes ready for confirmation and commit.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementation: the existing Map filters component owns a fifth Relationships button and one shared page-local hidden set. Relationship filtering removes routes before painting; enabling it uses the existing visible-endpoint rule. No model, layout, persistence, or OKF metadata was added. The button descriptors also bind their actions, removing the previous unchecked DOM-value cast.

Verification:
- Focused filter suite: 4 pass, 0 fail, 88 assertions.
- Full bun run check: passed. Biome and TypeScript passed; Node 16 pass; Bun 765 pass, 50 skip, 0 fail. The first sandboxed run could not start local servers, FSEvents watchers, or ps; rerunning with the required access passed without code changes. Existing lint notices are outside this task.
- Live browser: all five controls start visible. Click, Enter, and Space toggle Relationships. Hiding removed 9 routes while preserving 15 bodies, camera transforms, and selection. Selecting a relationship while hidden kept routes absent and details available.
- With Actors hidden, showing Relationships restored 5 routes rather than all 9.
- Hidden state survived 2D and Layers changes and an observed architecture update in a disposable fixture.
- Exported map: 9 routes became 0 with 15 bodies retained, remained hidden across a view change, and returned to 9 through the keyboard toggle.
- git diff --check passed. The web guide, Gherkin scenario, and existing architecture component explain the final behavior.

Reviews: implementer specification and quality reviews passed. The requested full-context reviewer found no material findings and recommended keeping the approach: one domain component owns controls, state, and scene filtering, with no extra abstraction or file split. The change is ready for Alex to review before Done and commit/push.

Alex approved the implementation and requested commit and push on 2026-10-06. The full-context review had no findings requiring an architecture change.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added a Relationships arrow button to the existing web map filter bar. It hides all relationship routes and restores only those allowed by the other filters, while preserving architecture bodies, camera, selection, and stored records. The page-local choice works in live and exported maps across view changes. Updated documentation and added one behavior test. Full repository checks and browser verification passed; complexity review recommends keeping the implementation.
<!-- SECTION:FINAL_SUMMARY:END -->
