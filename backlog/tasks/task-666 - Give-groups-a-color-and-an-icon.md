---
id: TASK-666
title: Give groups a color and an icon
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-19T07:06:00Z'
updated_date: '2026-11-19T07:07:00Z'
labels:
  - personalization
milestone: m-6
dependencies:
  - TASK-662
type: feature
ordinal: 713000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The milestone promises "authored element and group colors", and the product owner said on 2026-11-12 that groups "should be treated equally in terms of personalization": "groups are the one thing people have most control over in groma. they are not generated and they are persistent." TASK-561 and TASK-637 left groups out because a group had no document. Since TASK-657 a group has its own document and since TASK-665 it is selected and edited on the web map, so its color and icon have an owner. Today groma edit <group-id> --color is refused and every zone looks the same. On 2026-11-19 the owner asked to finish the Personalization Update; this is the last primitive its description names.

OKF and C4: a group stays a narrative overlay, not a C4 element or a containment level. Its document stores groma.color and groma.icon with the names an element uses; they are groma.md presentation metadata under groma. An ordinary Markdown reader keeps the title, the text and the member links of the group. groma.md interprets the two names: the zone takes the color and the icon stands before the name of the zone. Members inherit neither: a color and an icon belong to what carries them.

Design by the agent from the design round of 2026-11-12: three independent proposals agreed on storing color and icon on the group record, on the zone taking the color and on the icon standing before the name of the zone; a spike on the live map showed that an enlarged group icon crowds its zone, so the icon follows the size of the name. The owner has not seen the built result yet.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 groma edit <group-id> --color <name> and --icon <name> store the name under groma in the document of the group, an empty value removes it, an unknown name is refused with the allowed names, and a flow still refuses both
- [ ] #2 The web map paints the ground and the outline of the zone of a colored group in that color, in Iso, 2D and Layers and in every theme. A member keeps its own look. Selection, lit flows, tag focus and comparison read as they do on an uncolored zone
- [ ] #3 The icon of a group stands before the name of its zone at the size of the name, and the name band of the zone makes room for it. The 2D view draws the flat glyph
- [ ] #4 The group pane shows the icon beside the title. Its Edit view offers Color and Icon as the Edit view of an element does, and shows the pick on the zone before Save
- [ ] #5 A static export and a filtered export keep the color and the icon of an exported group
- [ ] #6 docs/component-markdown.md, docs/viewers/web/index.md and the agent instructions say that a group takes a color and an icon, and the records of TASK-561 and TASK-637 no longer say that a group carries none
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
1. Model: a group carries a color and an icon (ArchitectureGroup, AnnotatedGroup). resolveGroups reads groma.color and groma.icon with the same name checks an element uses, from one place.
2. Writes: editGroup takes color and icon; src/edit.ts allows them for a group and still refuses them for a flow.
3. Sheet: a Zone carries the color and the icon of its group, and the name cells of the zone make room for the icon.
4. Web painters: the zone gets data-color and draws the icon before its name; the map stylesheet paints the ground and the outline of a colored zone, on the live map and on covers.
5. Web pane: the icon beside the title of the group; Color and Icon in the Edit entry of the group; the appearance preview paints the zone of the selected group.
6. Docs, agent instructions, and the two sentences in the records of TASK-561 and TASK-637.
7. Tests. Authority: the milestone description (authored element and group colors), the owner words of 2026-11-12 and the criteria of this task. (a) Model: a group document with a color and an icon loads with them, and an unknown name is refused; a wrong result is a group refused because its groma mapping holds more than the id (today), or a misspelled name that loads and paints nothing; the group record tests cover id, members and tags only. (b) Edit: groma edit <group-id> --color stores and clears the name and a flow refuses it; a wrong result is the refusal groups get today, or a flow document with a color; no test edits the appearance of a group. (c) Sheet: the zone of a colored group with an icon carries both, its members carry neither, and its name band is wider than without the icon; a wrong result is members painted in the color of their group, or an icon drawn over the name; the sheet tests cover icons of islands, slabs and buildings only. No DOM tests.
<!-- SECTION:PLAN:END -->
