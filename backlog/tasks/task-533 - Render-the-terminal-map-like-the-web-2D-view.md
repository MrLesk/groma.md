---
id: TASK-533
title: Render the terminal map like the web 2D view
status: Done
assignee:
  - '@claude'
created_date: '2026-10-01 05:37'
updated_date: '2026-10-02 18:45'
labels: []
dependencies: []
references:
  - projection
  - tui-navigation
  - tui-paint
  - flow
  - work-model
  - screen
  - src-view-host
modified_files:
  - src/viewers/tui/projection-sheet.ts
  - src/viewers/tui/projection.ts
  - src/viewers/tui/projection-routes.ts
  - src/viewers/tui/navigation-spatial.ts
  - src/viewers/tui/navigation.ts
  - src/viewers/tui/terminal-viewer.ts
  - src/viewers/tui/molecules/building.ts
  - src/viewers/tui/molecules/surface.ts
  - src/viewers/tui/molecules/work-marker.ts
  - src/viewers/tui/molecules/route.ts
  - src/viewers/tui/organisms/world.ts
  - src/viewers/tui/projection-root.ts
  - src/viewers/tui/projection-container.ts
  - src/viewers/tui/molecules/row.ts
  - test-bun/root-layout.test.ts
  - test-bun/projection.test.ts
  - test-bun/container-layout.test.ts
  - test-bun/projection-routes.test.ts
  - test-bun/large-world.test.ts
  - test-bun/navigation.test.ts
  - test-bun/flow-navigation.test.ts
  - test-bun/work.test.ts
  - groma/systems/groma-md/containers/cli/components/projection.md
  - groma/systems/groma-md/containers/cli/components/tui-paint.md
  - docs/viewers/tui/index.md
  - docs/viewers/tui/validation.md
  - docs/viewers/tui/interaction-spec.md
  - src/viewers/tui/flow.ts
  - src/viewers/tui/work/model.ts
  - src/viewers/tui/panes/view.ts
  - test-bun/routes.test.ts
  - test-bun/chrome.test.ts
  - test-bun/unidentified-container.test.ts
  - src/viewers/tui/projection-warp.ts
  - src/viewers/tui/projection-spacing.ts
  - src/viewers/tui/atoms/lines.ts
  - src/viewers/tui/projection-motion.ts
  - src/viewers/tui/paint.ts
  - src/viewers/tui/layout.ts
  - src/viewers/tui/panes/screen.ts
  - src/viewers/tui/atoms/border.ts
  - groma/relationships.md
  - src/viewers/tui/atoms/text.ts
  - src/viewers/tui/navigation-tree.ts
  - src/viewers/tui/navigation-search.ts
  - src/viewers/tui/navigation-details.ts
type: enhancement
ordinal: 618000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Alex rejected the fixed-scale terminal map: at 120x36 the root showed a sliver of one container and no overview. The terminal must show the web 2D map's nested structure and relative placement, be usable at terminal sizes, and look and move like the approved reference video (clear framed boxes, junction-joined connectors with arrowheads, moving pulses). Approach: semantic zoom over the shared sheet. Each depth opens at most one container, places shapes so nesting and neighbour order survive while every box gets the cells its name needs, and routes the drawn ends with core's router.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Opening the map shows the whole root architecture: actor, system and external islands with their containers at their shared-sheet relative positions and nesting, readable at 120x36 with the default panes for this repository
- [x] #2 Enter on a container zooms into it: its groups and components appear at their shared relative positions with readable names, sibling containers, actors and externals stay collapsed around it in their shared directions, and Backspace zooms out; both changes animate
- [x] #3 Core routes the relationships between the drawn ends on the terminal plan; routes join their visible ends with box-drawing junctions and arrowheads; the selection's routes light in the brand green and stay still, and only a lit flow's legs move from source to target
- [x] #4 Keyboard, mouse, hierarchy and search selection, flows and Work highlights keep working at both depths
- [x] #5 Real terminal captures at 120x36 and 200x60 for this repository and a small fixture show readable, non-overlapping boxes and connections; the viewer guide describes the delivered map
- [x] #6 Opening a different element in the details pane always starts on its first tab (What); a key that keeps the selection keeps the tab
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
1. Depth (projection.ts, projection-sheet.ts): root draws islands, containers collapsed with name and component count, and island buildings. A component scope opens one container; when the opened container does not fit the map, only the selected component's group is open and the other groups stand collapsed for their members. Depth derives from level, selection and map size; each depth is placed once per sheet and routed once when drawn.
2. Placement (projection-spacing.ts): one pass per axis in sheet order keeps each edge at a small proportional position unless a span pushes it: box text sizes, parent insets, and sibling gaps on the axis that separates them (diagonal siblings by columns unless rows hold far more sheet). Solid boxes take their natural size inside their span.
3. Routes (projection-routes.ts): core's routeAll on the drawn terminal rectangles, collapsed shapes as building ends, one route per directed pair of drawn ends and one two-way route per opposite pair. Rounding keeps each end run a cell off its frame (jogging halfway when one run serves both ends), clips routes to where they first meet their frames, keeps ports off corners and moves runs off frame lines within two cells.
4. Painting (organisms/world.ts, molecules/*, atoms/lines.ts): one line canvas merges frames and routes into junction glyphs; open surfaces write names on their front edge, collapsed boxes their name over their count; selection heavy green with its routes green; flows bold with accented ends; arrowheads; pulses only along a lit flow; task markers in top borders.
5. Motion and camera (projection-motion.ts, terminal-viewer.ts): depth and world changes morph, camera changes glide, wheel and drag pan instantly and hold until the selection changes; a fitting map is centred, a larger one keeps the selection in a comfort margin. Panes open details from 140 and the hierarchy from 180 columns.
6. Navigation (navigation-spatial.ts): root arrows choose the nearest drawn box; container arrows the nearest component or collapsed group (opening it on its nearest member), else the neighbouring container; Enter and Backspace zoom.
7. Verify with tests on minimum worlds and real fixtures, live captures at 120x36 and 200x60, the cold simplicity review and the end-of-task complexity review; update the viewer guide.

Test decisions. Existing terminal-map tests encoded the rejected fixed-scale rules (exact components at root, identical geometry across scopes, row-based root arrows), so they were replaced: root depth (no component inside a collapsed container), container depth (groups and components inside the opened container, others collapsed), group accordion (two-group world, small and large map), sibling order and name room, route pairs and two-way merge, route drawability on openclaw-view and large-world at every depth (reproduced off-frame ends and a route through a box before the rounding fixes), map click on collapsed groups, spatial root arrows, flow and work stand-ins at both depths, large-world reachability with the map size.

Details tab (Alex's review): every selection path goes through syncTree, which now receives the state before the change and starts a newly opened element on What, as the web details do; openTaskRow joins that path. Test: one navigation test moves from a component on How to its neighbour (expects What) and presses an arrow that cannot move (expects How kept). Today the tab is kept, because every component offers How.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Takes over the uncommitted fixed-scale attempt (three columns per sheet cell): at 120x36 its root showed a sliver of one container. Its sheet-wide drawing, exact anchors and removed row/card layouts were the starting point; the fixed scale, camera and painter were replaced.

Correction history:
- A global monotone axis map preserved every order but stacked unrelated columns (this repo's root 124x54); constraints now apply only between neighbours, at the cost of diagonal neighbours shifting on their free axis (a monotone map would grow the root to 113x48 and stop fitting 120x36).
- Spacing with route constraints coupled every group a long route passes (the 74-component container reached 415x131); routes are now computed after placement.
- Reusing sheet routes clipped to collapsed ends sent routes through other containers; core's routeAll now routes each depth on the terminal rectangles.
- Core routes in half-cell lanes; rounding to cells put runs on frames, ends off frames and a route through a box. Port-aware rounding, end clipping, a halfway jog and a two-cell clearing search fixed them (measured over 5419 routes in 195 depths of 12 worlds: 0 off-frame ends, 0 routes through boxes, 39 runs briefly along a frame line).
- Containers too large for the map stretched collapsed groups; solid boxes now take their natural size and only the selected component's group opens.
- Review fixes: pan glide direction, pans applied instantly, task markers always in the top border, selection routes lit off-screen, one collapsed flag, one stand-in rule, spacing and warp merged, placement and routing cached separately.
- The scan recorded the new files as four new components (lines, projection motion, spacing, warp); they were combined into projection and tui-paint with groma edit --combine, and both descriptions rewritten.

Verification: bun run check passes (Biome, TypeScript, 16 Node tests, 749 viewer tests). Live groma view captures: this repo's whole root at 120x36 (115x24 plan, details folded) and 200x60 with both panes; Groma application opened on its first group at both sizes; openclaw-view and keycloak roots; flow lighting with pulses; zoom morph frames; arrow navigation across islands and into collapsed groups. Known limit: a container with hundreds of components and no groups is reached only by panning.

Alex's review: arrows may animate only while a flow is lit. Removed the selection pulse window (4 s after each selection change and on open); pulses now run only while the lit action is a flow. Verified with a live recording on keycloak: an arrow move repaints once for its glide and then rests; a lit flow keeps repainting with its pulses. No test added: the rule is one condition in the viewer's frame loop, no existing test drives the live viewer, and a unit test would only restate it.

Alex's review: a newly opened element now always starts its details on What. syncTree, which every selection path calls (map arrows, Enter/Backspace, clicks, hierarchy, search, following a relationship, and now opening a task's architecture reference), receives the state before the change and keeps the tab only for the same element, matching the web details rule. Regression test fails with the old keep-if-available rule and passes now. Verified live on keycloak at 140x40: Admin REST API on How, Right opens Public HTTP APIs on What. bun run check passes (750 viewer tests, 16 Node tests).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The terminal map is now semantic zoom over the shared sheet. Root draws actor, system and external islands with collapsed containers (name and component count). Enter opens one container in place, with neighbours collapsed around it; a container too large for the map opens only the selected component's group. A per-axis placement keeps nesting and neighbour order while giving each box room for its name, and core's router routes each depth on the terminal rectangles. One line canvas joins frames and routes with box-drawing junctions and arrowheads. Selection routes light green and stay still, only a lit flow's routes pulse, zooms and pans animate, and a newly opened element's details start on What. This repository's whole root fits 120x36. Verified: bun run check (750 viewer tests, 16 Node tests), live captures at 120x36 and 200x60 for this repository, openclaw-view and keycloak, flow, work, wheel, drag and details-tab checks, a still-map recording, and a route-quality sweep (5419 routes, 0 off-frame ends, 0 through boxes). Diagonal neighbours may shift on their free axis, and a group-less container of hundreds of components is reached by panning.
<!-- SECTION:FINAL_SUMMARY:END -->
