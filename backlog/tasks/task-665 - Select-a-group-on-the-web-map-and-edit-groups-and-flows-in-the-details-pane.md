---
id: TASK-665
title: Select a group on the web map and edit groups and flows in the details pane
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-18T22:00:00Z'
updated_date: '2026-11-18T22:00:00Z'
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
type: feature
ordinal: 712000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Groups are the records authors shape most by hand, and the web map can create one (the Group entry of several selected components) but can neither show it, change it nor remove it: a group has no pane, and its title, description, overview and tags can be changed only with groma edit. A flow has a reading pane without Edit. This task makes a group selectable on the map by the name of its zone, gives it a pane, and gives the group pane and the flow pane the Edit every record's pane has, so a person can tag a group or a flow where they read it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A click on the name of a group's zone on the web map selects the group, and its zone takes the selected look. A click on the zone's ground does what it does today
- [ ] #2 A group is selected alone: a shift-click on a group's name selects only the group, and a shift-click on an element while a group is selected selects only that element
- [ ] #3 The URL names a selected group as group=<id>. Opening that link selects the group and frames its members. An id that names no group is ignored
- [ ] #4 The group pane reads Group above the title and shows the title, the description and overview when present, the group's tags as a Tags row whose tags toggle the map's focus, and its members, each of which selects that component
- [ ] #5 On the current revision of a live map the group pane offers Edit with Title, Description, Overview and Tags, stored by Save through the write view every pane uses. The Edit view offers Remove, which deletes the group record and leaves its members in place
- [ ] #6 On the current revision of a live map the flow pane offers Edit with Title, Description, Overview and Tags, stored by Save. The Steps table is not edited in the web map
- [ ] #7 Reading stores nothing, and a map that is not live or shows another revision offers no Edit on either pane
- [ ] #8 docs/viewers/web/index.md (the table of writes, the URL parameters, selecting a group and its pane) and docs/component-markdown.md (Groups, Flows) describe it
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
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
