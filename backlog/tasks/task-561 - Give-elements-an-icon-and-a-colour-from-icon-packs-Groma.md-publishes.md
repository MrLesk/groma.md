---
id: TASK-561
title: 'Assign icons to actors, systems, containers and components'
status: Done
assignee:
  - '@claude'
created_date: '2026-10-07 23:16'
updated_date: '2026-11-10T08:26:00Z'
labels:
  - personalization
milestone: m-6
dependencies: []
references:
  - src/icons.ts
  - src/viewers/web/icons/objects.ts
  - src/viewers/web/icons/glyphs.ts
  - src/viewers/web/iso/painting/icons.ts
  - src/sheet/measure.ts
  - src/architecture-model.ts
  - src/edit.ts
  - src/viewers/web/organisms/icon-picker.ts
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
  - src/viewers/web/iso/painting/icon-camera.ts
  - src/viewers/web/iso/painting/names.ts
  - src/viewers/web/organisms/instant-choice.ts
  - src/viewers/web/organisms/color-swatches.ts
type: feature
ordinal: 1
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
An architecture author gives an actor, system, external system, container or component one named icon that says what kind of thing it is, so readers recognize it on the map. Groma presentation metadata under groma owns the name; C4 boundaries stay unchanged and ordinary Markdown readers keep title, description, body and links. A group carries no icon: an icon says what an element is, and a group is a name on its members, not an element. Icon packs, vendor logos, uploads and automatic inference are outside this task.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 An author can assign, change, and clear an icon on an actor, system, external system, container, and component through a documented Groma authoring action.
- [x] #2 The web map shows each assigned icon on its element in the Iso, 2D and Layers views, in the hierarchy and in the details.
- [x] #3 Assignments survive reloads and scans and remain the same when the UI theme changes.
- [x] #4 The documented storage uses Groma presentation metadata without changing C4 containment, and no icon is assigned automatically.
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
1. Store one icon name per element in groma.icon; src/icons.ts lists the 23 generic names (people, applications, running parts, data, other). groma edit --icon sets and clears it; it follows the same path as groma.color (model validation, emitter, edit guards, combine refusal, plain view, comparison).
2. Draw every name twice. An object (src/viewers/web/icons/objects.ts, built with parts.ts from boxes, upright prisms and balls in a 1 x 1 footprint) is projected with the map's own boxFaces and curvedFaces, so it turns with the map in Iso and Layers. A flat glyph (icons/glyphs.ts) is drawn in the 2D view, the hierarchy rows, the details title and the picker. Icon parts carry their own classes (icon-part, icon-top, icon-left, icon-right, icon-line, icon-solid, icon-screen), so no building rule reaches them; they read the element's tint variables, so they take its authored color.
3. Position is automatic: the icon stands in a square slot before the element's name. sheet/measure.ts owns the slot (roofIconSlot for roofs, TITLE_ICON_LEAD and surfaceLabelLayout for title bands), so a roof or band grows and the name never lies under the icon. iso/painting/names.ts draws each name together with its icon from that one slot.
4. Camera rules live in iso/painting/icon-camera.ts, each as a function for a still image and as the stylesheet expression for the live map, side by side: the icon before a system's or container's title is a landmark that is enlarged to stay readable when the map is zoomed out; a roof icon shrinks with the map and fades out when tiny; inner lines fade on small objects; line width follows the icon's screen size.
5. Details pane: an Icon grid applies a choice at once through the shared edit write. The Color row and the Icon grid share organisms/instant-choice.ts.
6. Tests. (a) Rule: an author sets, changes and clears an icon, an unknown name and the project record are refused, and edits and scans keep it; authority: acceptance criteria 1 and 3; failure caught: icon lost by a scan or an invalid name stored; gap: no icon coverage existed; one test beside the color edit test. (b) Rule: a name starts after its icon slot and the building grows to hold both; authority: Alex's statement that positioning is automatic; failure caught: icon drawn over the name; one painter-level test on a three-element world. (c) Rule: a container icon is a landmark and a component icon is not; failure caught: component icons flooding the overview. (d) Rule: every object stays inside its footprint; failure caught: an object standing on the name beside it. The cold review removed a test of landmarkZoom because it restated the function.
7. Docs: component-markdown Icons section and field table, product-model, web viewer index, agent describe guide, agent instruction line.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-11-10. Decision record. Alex left the artwork open (animated isometric, static isometric or flat) and on 2026-11-10 asked to see icons that are made nice, isometric or flat, saying earlier icon notes were obsolete. I decided: static isometric objects in the tilted views and flat glyphs in the 2D view and the panes, both drawn by me in code, no animation, no icon pack. Reasons: an object built from the map's own faces belongs to the map and turns with it; the 2D view and the panes need a flat drawing anyway; only lit flows animate on the map. Groups carry no icon by decision: an icon says what an element is.
Verification on groma's own map (icons assigned on every level in a scratch copy, never committed): objects on component, actor and external roofs and before system and container titles in Iso and Layers; glyphs in 2D, hierarchy rows, the details title and the picker; a click in the picker applied and cleared an icon at once; Light and Dark; the cover shows the container icons.
Groma's own map sets no icon in this branch: the architecture comparison job reads pull requests with the released groma.md, which rejects a new groma field until the next release.
Reviews. Cold review and full-context review ran on the first snapshot. Fixed from them: icon parts no longer share the buildings' face classes (hover, draft, comparison and colored covers repainted them); parts are drawn back to front with a part over what it stands on (the cache chip's front pins were covered); only title icons are landmarks (an enlarged roof icon left its roof); the camera rules sit side by side in icon-camera.ts and the still path now fades inner lines by the same ramp as the live map; one slot function and one painter per name kind; a still is a named option; wall marks only type-check on boxes; cylinder renamed from round; Color row and Icon grid share one control. Left for Alex: a table of authored name fields (color and icon are now two hand-kept copies of the same path), and whether the live map should use the painter path for camera rules so one mechanism remains.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
An actor, system, external system, container or component can carry one of 23 named icons in groma.icon, set with groma edit --icon or the Icon grid in the web details pane. The web map draws each name as an isometric object built from the map's own boxes and cylinders in the Iso and Layers views, and as a flat glyph in the 2D view, the hierarchy rows and the details title. The icon stands in a slot the layout reserves before the name. The icon before a system's or container's title stays readable when the map is zoomed out; roof icons shrink with the map and fade out when tiny. Covers draw the same icons.
Verified: bun run check passes (28 Node tests, 959 Bun tests, 64 environment-dependent skips, 0 failures); icons assigned on every level of a scratch copy of groma's own map and inspected in Iso, 2D, Layers, Light, Dark and the cover; the picker applied and cleared an icon at once.
Not included: icons on groups (by decision), icon packs, vendor logos, animation, icons in the terminal map (plain output prints the name). Groma's own map sets no icon until a release knows the field. Open for Alex: his verdict on the artwork, a table for authored name fields, and whether the live map should use the painter path for the camera rules.
<!-- SECTION:FINAL_SUMMARY:END -->
