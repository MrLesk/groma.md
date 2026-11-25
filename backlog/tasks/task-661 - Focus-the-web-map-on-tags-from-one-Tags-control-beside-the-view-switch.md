---
id: TASK-661
title: Focus the web map on tags from one Tags control beside the view switch
status: Done
assignee:
  - '@claude'
created_date: '2026-11-18T06:54:00Z'
updated_date: '2026-11-18T07:51:00Z'
labels:
  - personalization
milestone: m-6
dependencies:
  - TASK-659
references:
  - src/tag-selection.ts
  - src/viewers/web/chrome/tag-focus.ts
  - src/viewers/web/chrome/map-view.ts
  - src/viewers/web/url.ts
documentation:
  - docs/viewers/web/index.md
  - docs/component-markdown.md
modified_files:
  - docs/component-markdown.md
  - docs/viewers/web/index.md
  - groma/systems/groma-md/containers/export/components/c4-filter.md
  - src/tag-selection.ts
  - src/viewers/web/chrome/map-view.ts
  - src/viewers/web/chrome/shortcuts.ts
  - src/viewers/web/chrome/tag-focus.ts
  - src/viewers/web/iso/camera/session.ts
  - src/viewers/web/organisms/hierarchy.ts
  - src/viewers/web/organisms/tag-row.ts
  - src/viewers/web/page.ts
  - src/viewers/web/render.ts
  - src/viewers/web/url.ts
  - test-bun/tag-selection.test.ts
  - src/viewers/web/chrome/tag-list.ts
type: feature
ordinal: 708000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The tag UI of the web map was hard to find and showed the same thing twice. The list of tags sat at the bottom of the hierarchy pane, where the product owner did not notice it, and a focused tag appeared a second time as a floating chip under the view switch. A focus could only mean any of these tags. On 2026-11-17 and 2026-11-18 the owner asked for tagging to be thought through from scratch; three independent proposals and three critiques agreed on one horizontal control beside a view switch moved to the left, with no tag chips on the map until a tag is focused. This task builds that control for reading: focusing, excluding and sharing a focus. Writing tags on several elements, tags on groups and flows, and renaming or selecting from the list are separate follow-up work and stay out of this task.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 On a map whose elements carry at least one tag, the view switch stands at the top-left corner of the map area, above the level filter, and a Tags button stands beside it, in the Iso, 2D and Layers views. An architecture without tags shows no Tags button
- [x] #2 Tags opens one list: a find field, then every tag in use in alphabetical order with the number of elements that carry it. Typing narrows the rows. Escape or a click outside closes the list. The key T opens it with the find field focused, unless a field is being typed in
- [x] #3 A click on a row toggles the focus on that tag and leaves the list open. Every focused tag shows as a chip beside Tags, and the x on a chip ends that tag's focus
- [x] #4 While the pointer is on a row, or the keyboard highlights it, the map shows what toggling that row would light, without moving the camera and without changing the URL. Leaving the row or closing the list restores the map
- [x] #5 With two or more focused tags an any or all switch stands beside the chips. any lights what matches at least one focused tag, all only what matches every one of them, by the existing rule that a tag on a system or container takes everything inside it
- [x] #6 Each row has a not control that excludes the tag. An excluded tag shows as a not chip with x. Whatever an excluded tag selects recedes, and with only excluded tags everything else stays lit
- [x] #7 The URL carries the whole focus: tag= for each focused tag, match=all, and not= for each excluded tag. Opening that link shows the same focus
- [x] #8 The Tags section of the hierarchy pane and the floating chip under the view switch no longer exist. A tag in the Tags row of the details pane toggles the same focus
- [x] #9 docs/viewers/web/index.md and the focusing section of docs/component-markdown.md describe the control, the any, all and not rule, and the URL parameters
- [x] #10 The map page keeps its desktop layout and its minimum width of 900 px. In a window that narrow with both panes open, the view switch and the Tags button still fit between the panes, the chips scroll sideways inside their bar, and the list stays inside the window
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
1. src/tag-selection.ts: TagFocus (the focused tags, any or all, the excluded tags) and selectByTags, which matches each element against its own and its ancestors' tags. The filtered export's subsetByTags reads the same rule.
2. src/viewers/web/url.ts: reads and writes tag=, match=all and not=.
3. src/viewers/web/chrome/tag-focus.ts owns the committed focus and the bar (the Tags button, a chip per focused or excluded tag, the any or all switch). It paints what the focus lights on the map, the task pins and the hierarchy rows, because a preview has to repaint those three without a full view repaint.
4. src/viewers/web/chrome/tag-list.ts is the list: the find field, one row per tag, the keyboard highlight and the preview of the row under the pointer or the highlight.
5. chrome/map-view.ts and page.ts: the view switch and the tag control share one toolbar at the map's top-left corner. The Tags section of the hierarchy pane and the floating chip are removed.
6. render.ts wires the control and stays at 500 lines. To pay for the lines, the camera session reads the map frame itself (camera.focus takes the fit function).
7. Docs: docs/viewers/web/index.md and the focusing section of docs/component-markdown.md.
8. Tests, in test-bun/tag-selection.test.ts. Rule and authority: acceptance criteria 5, 6 and 7 of this task. (a) all across a tag on a container and a tag on one of its components: a wrong rule would match nothing or the whole container; no test covered all. (b) an excluded tag removes a match and the parents kept only for it: a wrong rule would keep the excluded part lit; no test covered exclusion in the focus. (c) only excluded tags light everything else: a wrong rule would light nothing; no coverage. (d) the link round trip carries match and not and drops unknown tags: a wrong reader would lose the mode or the exclusions; the earlier test covered tag= only and was extended. No DOM tests: the repository has no DOM harness; the control was checked on the live map.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-11-18. Built as a trial of delegating to codex (model gpt-6.2-astra) at the owner's request, from a written brief with the mock pictures and explicit readability rules. First pass, 29 minutes at max effort: the whole control, readable, type-checked, with rule tests. I reviewed it as a junior reader and on a live map and sent one round of notes; second pass, 8 minutes at xhigh: all notes addressed. What the notes were: (1) my brief wrongly said the page has a phone layout, so codex added a viewport meta tag and phone rules that changed the whole page on phones; removed, and criterion 10 now states the real floor, the page's minimum width of 900 px. (2) After an arrow key, typing no longer narrowed the list, because the highlight moved the keyboard focus; the focus now stays in the find field. (3) Key handling mixed a test and an action in one condition; rewritten as one switch. (4) One function returned both the previewed and the kept selection and the camera read it; split in two. Then one review round, a cold simplicity review and a full-context review, both by separate agents, merged into one list and applied by me: the row's choice button is stretched over the row so no other row button needs stopPropagation; clearing the keyboard highlight no longer wipes a preview the pointer owns; the unnamed layout probe for a hidden HUD became the named hudVisible check in render.ts; the narrow-toolbar rules for the tag control moved into the tag control's own styles so they no longer depend on stylesheet order; hierarchy's lit became tagSelection; fitTagFocus and an unrequested dedupe of repeated tags (with its test) were removed. Not applied, left as follow-ups for the next tag task: a tags/ folder that groups tag-focus, tag-list, tag-row and tags-field; one type for TagFilter and TagFocus.
Live checks on the final code (own architecture, 1920 wide, dark theme unless said): view switch at x 384 above the level filter and Tags beside it in Iso, 2D and Layers; a copy of the flows fixture, which has no tags, shows no Tags button and T does nothing. The list: alphabetical rows with counts; typing w leaves web and work; T opens it with the find field focused; Escape and a click on the map close it. Pointer on terminal: rows recede, URL and zoom unchanged, and the preview survives the find field losing focus; leaving restores. A click at the count toggles terminal, writes tag=terminal, frames it and leaves the list open; the chip's x ends it. Arrow down highlights a row with the focus still in the find field, previews it, and Enter toggles it. Two tags show the switch; all writes match=all. not on scanning writes not=scanning and shows the outlined chip; a click on not does not toggle the row. Links: tag=terminal&tag=map&match=all&not=web in Layers restores the chips and the pressed all; not=scanning alone shows only the excluded chip. A details chip toggles the same focus and shows pressed. At a 900 px window with both panes open the toolbar spans x 304 to 516, the view switch shows icons only, the chips scroll inside the bar (the house 4 px scrollbar shows) and the list spans the toolbar. Light theme and 2D checked with a focused and an excluded chip. bun run check on the final code: 972 Bun and 28 Node tests, 0 failures.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The web map focuses on tags from one control. The view switch moved to the top-left corner of the map area, above the level filter, and a Tags button beside it opens the one list of tags: a find field and a row per tag with its count. A click or Enter on a row toggles the focus; each focused tag is a chip beside Tags. Pointing at a row or highlighting it with the arrow keys previews that focus without moving the camera or changing the URL. From two tags on, an any or all switch decides the match, and not on a row excludes a tag, shown as an outlined chip. The link carries tag=, match=all and not=. The Tags section of the hierarchy pane and the floating chip under the view switch are gone; the Tags row of the details pane toggles the same focus.

Code: src/tag-selection.ts holds the one matching rule (TagFocus, selectByTags) and the filtered export reads it too. chrome/tag-focus.ts owns the committed focus and the bar; chrome/tag-list.ts is the list with its highlight and preview. The camera session now reads the map frame itself, which paid for the wiring lines in render.ts.

Verification: bun run check passes (972 Bun and 28 Node tests, 0 failures). Every acceptance criterion was exercised on a live map; see the notes. Rule tests cover any, all, not and the link round trip.

How it was built: codex (gpt-6.2-astra) wrote it from a brief in two passes; I reviewed, verified and applied one merged review round.

Not in this task: writing tags on several elements, tags on groups and flows, and select and rename from the list. Follow-ups noted by the review: group the web tag code in a tags/ folder, and merge TagFilter with TagFocus.
<!-- SECTION:FINAL_SUMMARY:END -->
