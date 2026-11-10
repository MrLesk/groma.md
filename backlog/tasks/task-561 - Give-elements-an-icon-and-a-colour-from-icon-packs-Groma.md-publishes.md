---
id: TASK-561
title: 'Assign icons to actors, systems, containers and components'
status: In Progress
assignee:
  - '@claude'
created_date: '2026-10-07 23:16'
updated_date: '2026-11-10T08:11:00Z'
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
modified_files:
  - src/viewers/web/iso/projection/project.ts
  - src/icons.ts
  - src/viewers/web/icons/parts.ts
  - src/viewers/web/icons/objects.ts
  - src/viewers/web/icons/glyphs.ts
  - src/viewers/web/iso/painting/icons.ts
  - src/types.ts
  - src/architecture-model.ts
  - src/core.ts
  - src/sheet/types.ts
  - src/sheet/place.ts
  - src/sheet/measure.ts
  - src/sheet/compose.ts
  - src/viewers/web/iso/painting/text.ts
  - src/viewers/web/iso/painting/buildings.ts
  - src/viewers/web/iso/painting/ground.ts
  - src/viewers/web/iso/painting/scale.ts
  - src/viewers/web/iso/painting/style.ts
  - src/markdown-emitter.ts
  - src/edit.ts
  - src/write-commands.ts
  - src/curate.ts
  - src/plain-world.ts
  - src/history/comparison.ts
  - src/viewers/web/icons/glyph-element.ts
  - src/viewers/web/organisms/icon-picker.ts
  - src/viewers/web/organisms/writes.ts
  - src/viewers/web/authoring.ts
  - src/viewers/web/organisms/details.ts
  - src/viewers/web/organisms/sidebar-row.ts
  - src/viewers/web/organisms/hierarchy.ts
  - src/viewers/tui/tree.ts
  - src/viewers/web/page.ts
  - src/viewers/web/flow/list.ts
  - src/viewers/web/sharing/cover.ts
  - src/viewers/web/comparison/details.ts
  - src/instructions.ts
  - docs/component-markdown.md
  - docs/product-model.md
  - docs/viewers/web/index.md
  - docs/agent-instructions/describe.md
  - test-bun/architecture-icons.test.ts
  - test-bun/editing.test.ts
  - groma/systems/groma-md/containers/cli/components/src-architecture-model.md
  - groma/systems/groma-md/containers/export/components/button.md
  - groma/systems/groma-md/containers/export/components/map.md
  - groma/systems/groma-md/containers/export/components/organisms-details.md
type: feature
ordinal: 1
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
An architecture author gives an actor, system, external system, container or component one named icon that says what kind of thing it is, so readers recognize it on the map. Groma presentation metadata under groma owns the name; C4 boundaries stay unchanged and ordinary Markdown readers keep title, description, body and links. A group carries no icon: an icon says what an element is, and a group is a name on its members, not an element. Icon packs, vendor logos, uploads and automatic inference are outside this task.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 An author can assign, change, and clear an icon on an actor, system, external system, container, and component through a documented Groma authoring action.
- [ ] #2 The web map shows each assigned icon on its element in the Iso, 2D and Layers views, in the hierarchy and in the details.
- [ ] #3 Assignments survive reloads and scans and remain the same when the UI theme changes.
- [ ] #4 The documented storage uses Groma presentation metadata without changing C4 containment, and no icon is assigned automatically.
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
1. Store one icon name per element in groma.icon; src/icons.ts lists the 23 generic names (people, applications, running parts, data, other). groma edit --icon sets and clears it; it follows the same path as groma.color (model validation, emitter, edit guards, combine refusal, plain view, comparison).
2. Draw every name twice. An object (src/viewers/web/icons/objects.ts) is built from boxes, upright prisms and balls in a 1 x 1 footprint and is projected with the map's own boxFaces and curvedFaces, so it turns with the map in Iso and Layers and takes theme tints, the element's authored color and selection. A flat glyph (icons/glyphs.ts) is drawn in the 2D view, the hierarchy rows, the details title and the picker.
3. Position is automatic: the icon stands in a square slot before the element's name. The sheet reserves the slot (roofBlock, nameCells), so a roof or title band grows and the name never lies under the icon. Roof icons for actors, external systems and components; title-band icons for systems and containers.
4. Zoom rules live in scale.ts and the map stylesheet: icons of systems, containers, actors and external systems are landmarks that keep a readable screen size when the map is zoomed out (title icons unbounded, roof icons within their roof); component icons shrink and hide below 14 px; inner lines fade on small objects; line width follows the icon's screen size, not the map weight. A cover has no live stylesheet, so the painter fixes the same rules from the cover's camera scale.
5. Details pane: an Icon grid applies a choice at once through the shared edit write, like the Color row.
6. Tests. (a) Rule: an author sets, changes and clears an icon, an unknown name and a non-element target are refused, and edits and scans keep it; authority: acceptance criteria 1 and 3; failure caught: icon lost by a scan or an invalid name stored; gap: no icon coverage existed; one test beside the color edit test. (b) Rule: a name starts after its icon slot and the building grows to hold both; authority: Alex's statement that positioning is automatic; failure caught: icon drawn over the name; one painter-level test on a three-element world. (c) Rule: a container icon is a landmark and a component icon is not, and a landmark keeps its readable size within its room; authority: plan step 4; failure caught: component icons flooding the overview or a landmark outgrowing its roof. (d) Rule: every object stays inside its footprint; failure caught: an object standing on the name beside it.
7. Docs: component-markdown Icons section and field table, product-model, web viewer index, agent describe guide, agent instruction line.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
State on 2026-11-09: not built. Alex called icons very experimental and is undecided between animated isometric line objects, static isometric objects, and flat glyphs skewed onto the map plane. Three independent proposals were collected from one neutral brief (a fresh Claude agent and two Codex models). All three recommend flat glyphs: one drawing per meaning, laid on the plane beside the element name (so it skews in Iso and is upright in 2D with no second artwork), reused upright in the hierarchy rows (14 to 16 px), the details header (20 to 24 px) and search results, about 11 or 12 generic glyphs, no animation, the stored value a readable word such as database that the terminal can print. Their reasons against isometric objects: they need about 48 px to read, a second flat drawing for 2D, small sizes and the panes, more artwork, and repaint cost if animated. They differ at fit zoom: two add an upright 12 to 14 px marker on every iconed element when its plane slot is too small, the third shows nothing on components at fit and relies on surfaces and search. The earlier agent PR (MrLesk/groma.md#194) drew the glyph only as a prefix of the name on the map, which is invisible at fit zoom and absent from the panes. Open decisions for Alex before building: the artwork style, and whether fit zoom gets upright markers. Group icons have the same storage question as group colors.
<!-- SECTION:NOTES:END -->
