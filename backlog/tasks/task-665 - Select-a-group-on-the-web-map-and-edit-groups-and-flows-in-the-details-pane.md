---
id: TASK-665
title: Select a group on the web map and edit groups and flows in the details pane
status: Done
assignee:
  - '@claude'
created_date: '2026-11-18T22:00:00Z'
updated_date: '2026-11-21T22:08:00Z'
labels:
  - personalization
milestone: m-6
dependencies:
  - TASK-664
references:
  - src/viewers/web/selection.ts
  - src/viewers/web/url.ts
  - src/viewers/web/render.ts
  - src/viewers/web/flow/reader.ts
  - src/viewers/web/organisms/relationship-details.ts
  - src/viewers/web/authoring.ts
  - src/viewers/web/iso/painting/ground.ts
  - src/sheet/types.ts
modified_files:
  - docs/component-markdown.md
  - docs/viewers/web/index.md
  - groma/systems/groma-md/containers/export/components/button.md
  - groma/systems/groma-md/containers/export/components/organisms-details.md
  - src/sheet/place.ts
  - src/sheet/types.ts
  - src/viewers/web/atoms/fact-row.ts
  - src/viewers/web/authoring.ts
  - src/viewers/web/comparison/control.ts
  - src/viewers/web/editing/gestures.ts
  - src/viewers/web/flow/reader.ts
  - src/viewers/web/iso/camera/camera.ts
  - src/viewers/web/iso/painting/ground.ts
  - src/viewers/web/iso/painting/map.ts
  - src/viewers/web/iso/painting/style.ts
  - src/viewers/web/organisms/commands.ts
  - src/viewers/web/organisms/details.ts
  - src/viewers/web/organisms/group-details.ts
  - src/viewers/web/organisms/selection-details.ts
  - src/viewers/web/organisms/writes.ts
  - src/viewers/web/page.ts
  - src/viewers/web/render.ts
  - src/viewers/web/search/session.ts
  - src/viewers/web/selection.ts
  - src/viewers/web/tags/tag-row.ts
  - src/viewers/web/url.ts
  - test-bun/web-map-highlights.test.ts
  - test-bun/web-selection.test.ts
type: feature
ordinal: 712000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Groups are the records authors shape most by hand, and the web map can create one (the Group entry of several selected components) but can neither show it, change it nor remove it: a group has no pane, and its title, description, overview and tags can be changed only with groma edit. A flow has a reading pane without Edit. This task makes a group selectable on the map by the name of its zone, gives it a pane, and gives the group pane and the flow pane the Edit every record's pane has, so a person can tag a group or a flow where they read it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A group is selected alone: a shift-click on a group's name selects only the group, and a shift-click on an element while a group is selected selects only that element
- [x] #2 The URL names a selected group as group=<id>. Opening that link selects the group and frames its members. An id that names no group is ignored
- [x] #3 The group pane reads Group above the title and shows the title, the description and overview when present, the group's tags as a Tags row whose tags toggle the map's focus, and its members, each of which selects that component
- [x] #4 On the current revision of a live map the group pane offers Edit with Title, Description, Overview and Tags, stored by Save through the write view every pane uses. The Edit view offers Remove, which deletes the group record and leaves its members in place
- [x] #5 On the current revision of a live map the flow pane offers Edit with Title, Description, Overview and Tags, stored by Save. The Steps table is not edited in the web map
- [x] #6 Reading stores nothing, and a map that is not live or shows another revision offers no Edit on either pane
- [x] #7 docs/viewers/web/index.md (the table of writes, the URL parameters, selecting a group and its pane) and docs/component-markdown.md (Groups, Flows) describe it
- [x] #8 A click anywhere on a group's zone on the web map selects the group, also at the zoom the map opens with, and the zone takes the selected look. A click on a building in the zone selects that component, and a draft dropped on the zone still lands in its container
- [x] #9 The pane of a component that is in a group names the group, and a click on that name selects the group
- [x] #10 The view that removes a group says that its components stay
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
1. Zone: src/sheet/types.ts Zone gains the stored group's id, set where the zone is built (src/sheet/place.ts). The name of a group's zone carries that id as its hit target (iso/painting/ground.ts), and the map marks the zone selected (iso/painting/map.ts). The selected look of a zone exists already.
2. Selection and address: a group's id is part of the architecture selection, alone (src/viewers/web/selection.ts). src/viewers/web/url.ts reads and writes group=<id>. render.ts accepts the id and frames the group's members.
3. Group pane: a new organism next to relationship-details.ts paints Group, title, description, overview, the Tags row and the members.
4. Writes: authoring.ts and organisms/writes.ts carry the hooks of a group's pane and a flow's pane. The group pane offers Edit (Title, Description, Overview, Tags) with Remove inside; the flow pane offers Edit (Title, Description, Overview, Tags). Both are built with editEntry and painted with paintWriteEntries.
5. Docs: docs/viewers/web/index.md and docs/component-markdown.md.
6. Tests. Authority: acceptance criteria 2 and 3. (a) The address: a link with group=<id> selects that group and writing the view returns the same link; group= with an element's id or an unknown id selects nothing. Wrong result: the id is dropped or read as a component, so a shared link opens nothing. Gap: no test names a group in a link. (b) Selected alone, only if selection.ts expresses the rule as a function: an additive pick of a group, and of an element while a group is selected. Wrong result: a group in a selection of several, which no pane can paint. No DOM tests.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-11-18. Built by codex (model gpt-6.2-astra) from a brief with the mock of the group pane and checked facts. One pass at max effort, 20 files, the behavior right on the first walk. I restructured its result myself: one named type per pane (GroupWrites, FlowWrites) and one Edit entry per record (groupEditEntry, flowEditEntry over wordingAndTagFields) in place of types and functions named GroupOrFlow that sniffed a property to tell the two apart; the group pane and the flow pane paint their own Edit entry, as the relationship pane does; a clearing branch nobody asked for removed.
Design calls I made without the owner, to confirm: a group is selected by the name of its zone, not by its ground, so the container under it stays as easy to click as before; a group is selected alone; Remove sits inside the group's Edit view, as it does for elements; a flow's Edit has no Steps field and no Remove.
Review round (cold simplicity review and full-context review in parallel, one merged list, applied by me). Two defects, both found by reading and both fixed. (1) The name of a zone carried data-id, so the gestures that draft or relate on the map read a group where they expect an element and refused a drop on the name. The name now carries data-group: IsoMap.hitId reads it for a click, and the new IsoMap.hitElementId gives gestures the surface under the name. (2) My restructuring let an open Edit view survive a switch to another revision; the group pane, the flow pane and the pane of several elements now keep an open view only while they may write. Other items applied: selectOne makes every selection of one target; the two facts of the alone rule are named; prepareDetails takes the selected id; the group link test moved next to the selection tests; the write rule in the docs keeps its sentence that fields change nowhere else; one term, placement group, in comments. To keep render.ts under 500 lines, which ids survive a live update moved to selection.ts and the comparison pane's animation to comparison/control.ts.
Live checks on the final code (own architecture, 1600 by 1000, dark theme, real pointer and keyboard input): a click on the name Plugins selects the group, the URL reads group=cli-plugins, the zone takes the accent outline and name, no building and no slab is selected. The pane reads Group, Plugins, three members; Edit shows Title, Description, Overview, Tags and Remove above them. A description and a tag typed and saved appear in the pane; the tag toggles the map's focus on the three members; a member selects that component. A shift-click on the name while a component is selected selects the group alone, and a shift-click on a building while the group is selected selects the building alone. The flow pane's Edit shows the four fields with Title and Overview required; a typed tag is saved and shown. Remove asks Remove Plugins?, removes the zone, leaves the three buildings and closes the pane. With the Edit view open, switching to an earlier revision returns the pane to reading with no Edit. The name under the pointer resolves to its container for gestures. All test edits were reverted; git shows only the folded code reference.
Checks: bun run check passed on the final code (984 Bun tests and 28 Node tests, 0 failures).

2026-11-19, after the owner tried it: "I cannot select a group on the map" and "I cannot see that a component is part of a group from the component's detail pane". Cause of the first: only the zone's name selected the group. At the zoom the map opens with a name is 20 to 45 px wide and a route often lies on it, so a click on a group landed on its container or a relationship. My walk had only tried it zoomed in, where the name was 200 px wide. Now the whole zone selects its group (the zone carries data-group; buildings in it still select their component; gestures still read the container under it). Second: the pane of a component in a group now has a Group row whose name selects the group. That row and the Tags row are one atom, atoms/fact-row.ts.
Live checks (dark theme): a real click on a zone's ground at the opening zoom (90 percent, zone 59 by 29 px) selects the group; in a foreground browser at 2400 percent a click on the ground of Plugins selects it, a click on a building in it selects the component, a shift-click on the ground while a component is selected selects the group alone, the same in the 2D view, and the Layers view selects through the same target. The element under the ground for gestures is the container cli. From the group pane a member opens the component pane, which reads Group, Map drawing above Tags; a real click on that name opens the group pane again. bun run check: 984 Bun and 28 Node tests, 0 failures.

2026-11-22, walk of the writes of the web map with the owner (review map, dark theme). The view that removes a group asked only "Remove Map drawing?", which leaves open whether its seven components go too. removeEntry in src/viewers/web/organisms/commands.ts now takes what stays, and the group's entry passes "Its components stay.", so the view reads "Remove Map drawing? Its components stay.". Elements and relationships keep the plain question. bun run check on this branch with the change: 28 Node tests and 999 Bun tests pass, 0 fail.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A group is selected on the web map by the name of its zone and has a pane: its wording, its tags and its members. On the current revision of a live map the group pane and the flow pane offer Edit (Title, Description, Overview, Tags) through the write view every pane uses, and a group can be removed from its Edit view. The URL names a selected group as group=<id>.
<!-- SECTION:FINAL_SUMMARY:END -->
