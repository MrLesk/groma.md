---
id: TASK-561
title: 'Assign icons to components, containers, systems, and groups'
status: To Do
assignee: []
created_date: '2026-10-07 23:16'
updated_date: '2026-11-09T22:54:00Z'
labels:
  - personalization
milestone: m-6
dependencies: []
references:
  - src/architecture-model.ts
  - src/authoring.ts
  - src/edit.ts
  - src/group.ts
  - src/markdown-emitter.ts
  - src/viewers/web/iso/painting/buildings.ts
documentation:
  - ROADMAP.md
  - docs/component-markdown.md
  - docs/product-model.md
type: feature
ordinal: 1
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
An architecture author can give a component, container, system, or group an icon so readers can recognize it across map views. This task supplies authored visual identity; UI theme selection and authored colors are separate tasks.

The architecture model and existing authoring flow own saved assignments. Groma-specific presentation metadata belongs under groma, while ordinary Markdown readers keep the concept's title, description, body, and links. C4 element boundaries remain unchanged. A group keeps its existing narrative-overlay meaning and gains no parent role or relationships.

Define the smallest documented group metadata ownership needed for one icon assignment. Use current main as the implementation baseline; the partially failed PoC is research material. Package publishing, an icon marketplace, automatic technology inference, and a color legend are outside this task.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 An author can assign, change, and clear an icon on a component, container, system, and group through a documented Groma authoring action.
- [ ] #2 The web map shows each assigned icon on its element or group, including when the containing architecture is opened at the relevant level.
- [ ] #3 Assignments survive reloads and scans and remain the same when the UI theme changes.
- [ ] #4 The documented storage uses Groma presentation metadata without changing C4 containment. A group's icon belongs to the group and does not overwrite icons on its members.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
State on 2026-11-09: not built. Alex called icons very experimental and is undecided between animated isometric line objects, static isometric objects, and flat glyphs skewed onto the map plane. Three independent proposals were collected from one neutral brief (a fresh Claude agent and two Codex models). All three recommend flat glyphs: one drawing per meaning, laid on the plane beside the element name (so it skews in Iso and is upright in 2D with no second artwork), reused upright in the hierarchy rows (14 to 16 px), the details header (20 to 24 px) and search results, about 11 or 12 generic glyphs, no animation, the stored value a readable word such as database that the terminal can print. Their reasons against isometric objects: they need about 48 px to read, a second flat drawing for 2D, small sizes and the panes, more artwork, and repaint cost if animated. They differ at fit zoom: two add an upright 12 to 14 px marker on every iconed element when its plane slot is too small, the third shows nothing on components at fit and relies on surfaces and search. The earlier agent PR (MrLesk/groma.md#194) drew the glyph only as a prefix of the name on the map, which is invisible at fit zoom and absent from the panes. Open decisions for Alex before building: the artwork style, and whether fit zoom gets upright markers. Group icons have the same storage question as group colors.
<!-- SECTION:NOTES:END -->
