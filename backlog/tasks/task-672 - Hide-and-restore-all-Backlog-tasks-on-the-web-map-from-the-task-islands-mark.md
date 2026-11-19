---
id: TASK-672
title: Hide and restore all Backlog tasks on the web map from the task island's mark
status: Done
assignee:
  - '@claude'
created_date: '2026-11-19T22:43:00Z'
updated_date: '2026-11-20T20:39:00Z'
labels: []
dependencies: []
references:
  - src/viewers/web/work/island.ts
  - src/viewers/web/work/summary.ts
  - src/work/status-filter.ts
documentation:
  - docs/product-model.md
  - docs/viewers/web/index.md
modified_files:
  - src/work/status-filter.ts
  - src/viewers/web/work/island.ts
  - src/viewers/web/work/summary.ts
  - src/viewers/web/render.ts
  - test-bun/work-status-filter.test.ts
  - docs/product-model.md
  - docs/viewers/web/index.md
type: enhancement
ordinal: 709000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Hiding the Backlog tasks on the web map today takes opening the task island and switching each status off, and bringing them back means remembering which statuses were on. Alex wants one click for both directions, on the Backlog mark of the folded island (the small pill at the map's bottom centre that shows the mark and a count).

His words, 2026-11-19: "toggle directly any backlog task from the minimized floating icon"; "make the backlog logo border of the groma green when we are toggling on backlog tasks and like it is now with just the counter when it's toggled off"; "save the previous backlog filter selection so that toggling removes the task from the map but toggling back on, restores tasks and filters".

Today the mark is not a control: only the fold control beside it is a button, and the island tells the map which statuses to show. The count on the mark is the number of tasks in the enabled statuses.

Readings by the agent that wrote this task, not confirmed by Alex: (1) while tasks are off the count keeps the number the saved status filters select, because he asked for the mark to look as it does now; (2) the saved filters live as long as the page, as the filters do today, and are not stored across reloads. Not decided: how the status buttons of the open island look while tasks are off. Show Alex a picture of the folded and the open island in both states before finishing.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A click on the Backlog mark of the folded task island removes every task pin and task highlight from the web map, and the next click shows them again
- [x] #2 Turning tasks back on restores the status filters exactly as they were when tasks were turned off: the same statuses are enabled and the same pins return
- [x] #3 While tasks are on, the Backlog mark is lit in the theme's highlight color; while they are off, the mark is grey and shows its count as it does today
- [x] #4 A live work update that arrives while tasks are off leaves them off and keeps the saved status filters
- [x] #5 The fold control still opens and folds the island and does not change whether tasks are shown
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
1. Domain rule in src/work/status-filter.ts: add shownWorkStatuses(enabled, tasksShown). It returns the enabled statuses while tasks are on and none while they are off. It never changes the filter state, so the saved choice returns untouched.
2. Task island (src/viewers/web/work/island.ts): keep tasksShown as one boolean beside statusFilters. One function, showOnMap, sends shownWorkStatuses(...) to the map; the status click, the mark click and paint() (the live work update) all call it, so no path can send the saved statuses while tasks are off. The chip strip uses the same statuses.
3. The mark becomes the tasks switch: a button around the Backlog mark, in the folded island (around the count summary) and in the open island (in the label). aria-pressed carries on/off. While tasks are on the mark is lit: its image is used as a mask and var(--highlight) fills the shape; while they are off it is the grey image as before. The island keeps its size in both states. While tasks are off the status filters are disabled and dimmed and keep their saved pressed state.
4. Map highlights (src/viewers/web/render.ts): the island exposes tasksShown; paintMapState highlights no task while it is false, so active tasks keep their state and their highlights return with the pins. The island asks the map to paint task highlights again after a mark click.
5. Summary (src/viewers/web/work/summary.ts): the count keeps using the saved enabled statuses; the tip says hidden instead of shown while tasks are off.
6. Docs: docs/product-model.md and docs/viewers/web/index.md describe the switch.
7. Verify the five acceptance criteria on a live map in the dark theme, then show Alex the folded and open island with tasks on and off before the pull request.

Tests (one, extending test-bun/work-status-filter.test.ts):
- Rule and authority: AC #2 and AC #4, from Alex's request of 2026-11-19 ("toggling back on, restores tasks and filters"). While tasks are off the map gets no status; a work update in between does not change that; turning tasks on returns exactly the status choice made before.
- Wrong result it detects: tasks off still sending statuses (pins stay), or tasks on returning the default statuses instead of the earlier choice after a work update.
- Gap: existing tests cover the filter choice across snapshots, not the tasks-off value. Smallest test: one case over shownWorkStatuses with a changed choice, a snapshot while off, then on.
- No DOM test: the repository has no browser test environment for web modules; the mark, its lit state and the fold control are verified on the live map.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Built as planned. Verification on the live map (bun src/cli.ts web in this worktree, dark theme, 1440x900, driven by a browser script over the real page), repeated after the lit mark replaced the border:
- AC 1: with one task active, a click on the folded island's mark took 28 pins and 6 task-highlighted map elements to 0 and 0; the next click returned 28 and 6.
- AC 2: after switching Done on and To Do off (217 pins), off showed 0 pins and 0 chips; on returned the same 217 pins and the same three filter states.
- AC 3: on, the mark's fill computed rgb(29, 158, 117), equal to the computed --highlight, with no grey filter; off, the grey image with grayscale(1); count 28 in both.
- AC 4: a Backlog edit of this task while tasks were off repainted the island; it stayed off with 0 pins, 0 highlights and the filter states unchanged, and the later click returned the 217 pins.
- AC 5: the fold control folded and opened the island in both states without changing pins or the switch.

Decision by Alex, 2026-11-20, after seeing the first pictures and the live map: no border around the mark; the Backlog logo itself lights up ("I would have made the backlog logo light up"). AC 3 was reworded to that. He expected an SVG of the logo; neither groma.md nor the Backlog.md checkout has one, and none is needed: the paper of backlog-mark.png is transparent, so the image gives the shape as a mask and the highlight colour fills it.

Choices made while building, not confirmed by Alex yet:
- The count on the mark keeps the number the status filters select while tasks are off; the tip then says hidden instead of shown.
- The switch and the filters live as long as the page; nothing is stored across reloads.
- Open island while tasks are off: the label's Backlog mark is the same switch (so tasks can be turned on without folding), the status filters keep their saved look at half opacity and are disabled, and the chip strip is empty.
- Task highlights are held back, not cleared: active tasks keep their state, the details pane keeps a selected task, and the highlights return with the pins. A task opened from search or a Tasks tab while tasks are off opens in the details pane without a highlight on the map.

Corrections: the first version drew a round border around the mark (first as an ellipse on the taller label mark, then a fixed circle); Alex found its radius odd beside the view switch and chose the lit logo, so the border and its sizing rules are gone. Biome reported cognitive complexity 16 for the summary update after the tip gained its wording branch; the tip text moved into summaryTip.

Environment, not part of the change: this worktree's installed dependencies were stale (bun install --frozen-lockfile, and a stale typescript copy under plugins/scanners/typescript/node_modules set aside) before bun run check could pass. The map ran read-only because the Angular, React and Vue scanner builds are missing here, so no scan ran and groma/ is unchanged.

Non-blocking observations: keyboard focus leaves the switch after a click because the island rebuilds its content, as it already does for the status filters. Backlog stamps updates to the minute, so a second notes-only edit within one minute produces no live update on the map.

Review: Alex looked at the lit-mark pictures and the live map on 2026-11-20, approved the result and asked for the pull request. He did not comment separately on the choices listed above. bun run check passed on the final version: 959 tests passed, 0 failed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The Backlog mark on the task island is now the tasks switch. One click takes every task pin and task highlight off the web map; the next brings them back with the status filters as they were. While tasks are on the mark is lit in the theme's highlight color; while they are off it is grey as before and keeps its count. The switch works on the folded island and on the open island's label.

Why it is built this way: whether tasks are shown is one value beside the status filters, and one function (shownWorkStatuses, reached through the island's showOnMap) decides which statuses the map gets on every click and every live work update, so an update cannot switch hidden tasks back on. Task highlights are held back by the map while the switch is off and return with the pins. The lit mark needs no new asset: the existing image gives the shape as a mask and the highlight color fills it.

Verification: all five acceptance criteria walked on the live map in the dark theme with a browser script (results in Implementation Notes); one new test for the tasks-off rule; bun run check passes.

Limits and follow-ups (none approved as work): the switch and the filters last as long as the page; while tasks are off the status filters cannot change; a task opened from search while tasks are off opens in the details pane without a map highlight; keyboard focus leaves the switch after a click, as it does for the status filters.
<!-- SECTION:FINAL_SUMMARY:END -->
