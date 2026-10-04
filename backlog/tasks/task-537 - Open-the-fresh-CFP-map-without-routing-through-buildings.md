---
id: TASK-537
title: Open the fresh CFP map without routing through buildings
status: Done
assignee:
  - '@codex'
created_date: '2026-10-04 01:10'
updated_date: '2026-10-04 16:28'
labels: []
dependencies: []
references:
  - relationships
modified_files:
  - test-bun/route-nudge.test.ts
  - src/sheet/route/nudge.ts
priority: high
type: bug
ordinal: 622000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A first scan of Call for Papers completes, but preparing its map throws Shared sheet routing safety for seven Angular-to-Java relationships. The same failure exists before the Keycloak performance changes. Alex requires the complete CFP map to open. Fix the measured routing defect using the reproduced source revision 55587399548fbd4e4cae8b07f6dd686a0a3c5412 and the saved full world in /private/tmp/groma-regression536/callforpapers-after.json, preserving architecture meaning and all relationships.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The reproduced complete fresh CFP architecture opens as a usable Groma web map with all 1230 elements and 118 relationships retained.
- [x] #2 Every drawn CFP relationship avoids component silhouettes and overlapping path segments, without suppressing the routing safety check or omitting relationships.
- [x] #3 Existing supported map behavior remains deterministic; the Keycloak architecture and map remain correct and its initial-scan performance is preserved.
- [x] #4 The focused regression checks and bun run check pass after the fix.
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
1. Reproduce the seven routing failures from the complete saved CFP world and trace initial paths, channel spacing and finishing passes to the first invalid geometry. Keep all components and relationships, and retain the final safety check.
2. Fix the measured cause inside Map connections, using its existing geometry and path operations. This is a drawing fix: OKF Markdown, source ownership and C4 elements/relationships remain the semantic authority. No new architecture concept, metadata, special CFP rule, fallback or reduced map is needed. The same geometry rule must hold independently of repository language.
3. Inspect existing route coverage and add the smallest abstract geometry regression for the reproduced cause. Record the authority, concrete wrong result and existing coverage gap before changing a test. Prove it fails before the fix and passes after it.
4. Verify the complete CFP map, unchanged architecture/relationships and route safety, and open it through the real web viewer. Compare other audited maps and Keycloak against saved data; rerun the initial scan timing only if scan code is affected or a timing concern remains. Run focused routing checks and bun run check. Perform implementer specification and quality reviews; this bounded bug fix uses the implementer's simplicity review unless its scope grows.

Regression test decision: the reproduced CFP failure and the documented drawing rule in docs/viewers/web/index.md require separated route lanes to avoid component silhouettes while retaining minimum spacing. The current route-nudge coverage checks only two paths sharing one roomy or narrow channel; it does not cover several bundles whose neighbouring tight chains compress together. The concrete incorrect result is that premature termination leaves a lane inside a building. Add one abstract geometry case to the existing route-nudge tests, reduced from 118 routes and 1227 buildings to 13 simplified paths and four obstacles, with generic endpoint names and no application architecture or source data. Assert clear component silhouettes and zero shared path length after spacing; do not assert a round count, exact coordinates or prose. Check that this case fails with the current 16-round stop before applying the fix.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The full CFP reproduction traced every stage. Search and the first vertical spacing pass were clear. Horizontal spacing stopped with seven violated constraints, and the final vertical pass produced the seven reported building crossings. A fixed 16-round cap stopped the gap calculation too early. A diagnostic copy reached its existing stopping rule after 366 rounds for the shared CFP channels; the other two axis passes needed four rounds each. Diagnostics are in /private/tmp/groma-cfp537/trace-converged.log and trace.json.

The fix removes only that premature round cap in src/sheet/route/nudge.ts and retains the existing gap adjustment, minimum spacing, stop-on-no-significant-change rule, and final safety checks. The existing Map connections component owns this drawing behavior. It does not change OKF Markdown, C4 elements or relationships, scanner inference, storage, or public APIs. It uses geometry already required by the viewer, with no repository- or language-specific branch.

One regression was added to the existing route-nudge test file after documenting its authority and coverage gap in the plan. Its abstract geometry was reduced to 13 simplified paths and four obstacles. The test fails before the fix with two paths entering obstacles and passes after it. It asserts clear silhouettes and zero shared path length, rather than a loop count or exact positions. The before-fix log is /private/tmp/groma-cfp537/regression-before.log. All 24 focused routing tests pass; /private/tmp/groma-cfp537/focused.log records them.

The complete CFP map retains all 1230 elements and 118 relationships and draws all 118 routes. Every route is orthogonal, no route crosses a component silhouette, and shared path length is zero. Its live web payload is exactly equal to the independently checked world and sheet. The browser at http://localhost:63339 opens the map, container navigation and Fit work, and no browser errors were reported. Evidence: /private/tmp/groma-cfp537/map-verification.json, cfp-live.json and cfp-map.png.

The complete Keycloak, Backlog.md, Gemini CLI and Groma maps are exactly equal to their saved pre-fix scenes and retain all relationships with clear silhouettes and no shared segments. This drawing-only fix does not affect the initial scan path. The prior complete fresh Keycloak scan measurements remain 9.715825s and 9.943169s; no new scan timing is claimed. The single-map CFP measurements were about 1.72s independently and 2.29s in the live web session; these are observations, not a general timing guarantee.

bun run check passed: Biome and TypeScript completed, 16 Node tests passed, and 752 Bun tests passed with 48 skips and no failures. Existing lint warnings are outside the two changed files. The full log is /private/tmp/groma-cfp537/check.log.

Implementer reviews passed. Specification review verified each acceptance criterion against the complete map, browser interaction, scene comparisons and full check. Quality review followed web loading through sheet placement, route construction, axis spacing, gap adjustment, settlement and the final safety checks to the visible map. The changed behavior remains owned by nudge.ts; no layer, dependency or exported API was added. Both files remain below 500 lines, and the changed function passes the complexity check. The regression's before-fix failure proves that its geometry checks detect the reported defect without relying on application names or live architecture. The bounded two-line production fix and one existing-file regression use the implementer's simplicity review; no separate architecture review is required.

Implementation is ready for Alex's review. Task status and a commit remain pending his completion confirmation under AGENTS.md.

Alex approved delivery by explicitly requesting commit and push on 2026-10-04. The final routing and full-repository checks are already recorded above; no code has changed since they passed. This task changes existing Map connections source and one existing test file, so it creates no standalone architecture component. Commit only those two files and this task record, separately from TASK-536 and unrelated working-tree files.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fixed CFP map startup by allowing the existing route-spacing calculation to finish instead of cutting it off after 16 rounds. The complete 1230-element map now opens with all 118 connections, clear component silhouettes and no shared path segments. Added a reduced geometry regression that fails before the fix. Keycloak and three other audited maps are unchanged. Browser verification and bun run check pass (16 Node and 752 Bun passes, 48 skips, no failures). No scanner, architecture contract or public API changes. Alex approved delivery and requested commit and push on 2026-10-04.
<!-- SECTION:FINAL_SUMMARY:END -->
