---
id: TASK-671
title: Redraw the map icons as fine line objects with one accent part
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-19T18:23:00Z'
updated_date: '2026-11-19T19:21:00Z'
labels:
  - personalization
milestone: m-6
dependencies: []
references:
  - src/viewers/web/icons/objects.ts
  - src/viewers/web/icons/parts.ts
  - src/viewers/web/iso/painting/icons.ts
  - src/viewers/web/iso/painting/icon-camera.ts
  - src/viewers/web/iso/painting/style.ts
modified_files:
  - src/viewers/web/icons/parts.ts
  - src/viewers/web/iso/painting/icon-faces.ts
  - src/viewers/web/iso/painting/icons.ts
  - src/viewers/web/iso/painting/icon-camera.ts
  - src/viewers/web/icons/objects.ts
  - src/viewers/web/iso/painting/style.ts
  - src/viewers/web/iso/painting/scale.ts
  - src/viewers/web/iso/painting/names.ts
  - docs/viewers/web/index.md
  - test-bun/architecture-icons.test.ts
  - groma/systems/groma-md/containers/export/components/map.md
  - src/viewers/web/iso/projection/project.ts
  - src/sheet/measure.ts
  - src/viewers/web/iso/painting/text.ts
  - src/viewers/web/iso/painting/ground.ts
type: enhancement
ordinal: 714000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The owner judged the first icon artwork on the live map on 2026-11-19 and rejected it: the objects were crude, the icon before a container title was enlarged until it stood larger than the buildings, and white screens and heavier lines made icons the brightest things on a grey map. The same day he pointed to the look he wants: fine isometric line drawings, quiet faces, and one part of each object picked out in an accent. This task redraws the 23 objects in that look and makes an icon follow the size of the name it stands before. The owner decided the direction (fine isometric line objects, an accent, a new pull request on top of the personalization stack). Every other rule here and every acceptance criterion is the coordinator's reading and waits for his verdict on the live map.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every named icon's object is drawn in lines of one fine width over quiet faces, and one part or the few marks that draw one thing are its accent
- [ ] #2 The accent is drawn in ink; on an element or group with an authored color the accent takes that color and the rest of the object stays neutral
- [ ] #3 Every icon has the same slot size wherever it stands, on a roof or before a title, and no icon is drawn larger than its slot
- [ ] #4 In the Iso view a title's object stands clear of its surface at every zoom: it covers neither the surface, nor a building on it, nor a neighbouring surface
- [ ] #5 When a title's object would be too small to read, the icon lies flat beside the title at the title's size, and stands up again when the map is zoomed in; a roof's icon fades out instead
- [ ] #6 On a small object the quiet inner lines fade out and the outline and the accent stay
- [ ] #7 An object shows only the faces turned to the reader at every orbit angle, and a curved wall shows no line between its segments
- [ ] #8 The Light, Dark and Blueprint themes and the export covers draw the same objects
- [ ] #9 The web map documentation describes the look, the accent, the one size and the title rules
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
1. Part model (icons/parts.ts): one prism, a flat outline pushed along one axis, replaces the box and the upright prism. Pushed along z it is a box, cylinder or rounded plate; along y an upright panel facing south. A part or mark can belong to the accent.
2. Visible faces (iso/painting/icon-faces.ts): from the reader's direction (towardsReader, beside project() in projection/project.ts) decide which walls and which end of a prism face the reader, join walls along a curve into one face, shade a face by screen side like a building, and order parts back to front. The painter (iso/painting/icons.ts) only lays those points on the screen.
3. Look (iso/painting/style.ts, scale.ts): quiet lines a little brighter than the map's outlines, faces a little off paper, the accent in ink. A colored element hands its color to the accent through --icon-accent in the browser and through explicit rules on a cover. One list of the authored color variables serves the zone reset and the comparison reset.
4. One size (sheet/measure.ts): ICON_SIDE is the slot of every icon, three cells. roofIconSlot and nameCells read it, so roofs and title bands make room for it.
5. Clear ground (sheet/measure.ts, iso/painting/text.ts): a title's slot lies TITLE_ICON_CLEARANCE slot sides in front of its surface and away from the band's west end. An object covers the ground behind it on screen by its height times CELL_HEIGHT / 2; the test holds every object under the clearance and every title band to slot plus clearance.
6. No enlargement (iso/painting/icon-camera.ts, icons.ts, style.ts): the landmark rule is deleted. A title's icon has a second place, the mark on the title's line; below 14 to 20 screen pixels of slot the object gives way to the flat glyph there. --icon-standing (camera scale) and --icon-flat (view pitch) decide the share of object and glyph in the browser; a still computes the same numbers.
7. Objects (icons/objects.ts): all 23 redrawn with one accent each; the three tallest lowered so every object keeps air under its surface.
8. Tests (test-bun/architecture-icons.test.ts). Kept: a roof name starts after its slot; an object stays inside its footprint (now read from the painter's own bounds). Changed: the landmark test becomes "a title icon can lie flat beside its title and a roof icon cannot" (authority: rule 3 approved by the owner on 2026-11-19; wrong result: a title icon with no flat drawing vanishes when zoomed out, or a roof icon draws a second copy). New: "no icon object covers the surface behind its title, and every title band holds the slot with its clear ground" (authority: rule 2 approved the same day; wrong result: a taller object or a larger slot silently brings the overlap back; gap: nothing tied the artwork's height to the layout's clear ground). New: "a prism shows the faces turned to the reader, and a curved wall is one face" (authority: this task's fine line objects that turn with the map; wrong result: far walls drawn, or a line between the segments of a cylinder; gap: nothing tested which faces are drawn).
9. Docs: the Icons entry of docs/viewers/web/index.md.
10. Verification: specimen sheets of every object in the three themes and from four orbit angles; groma's own map with icons on every level (uncommitted demo) at the opening zoom, mid zoom and close, Dark and Light; covers; selection; a click on a standing object; the Edit form preview; 2D and Layers views; the accent's color while comparing.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-11-19, owner on the live map. Two reactions to the first commit: a zone title's icon overlapped a building behind it ("can we avoid these overlaps", then "we need to find a solution that works always on any repo"), and icons were not one size at the same zoom (an actor's was hard to spot). He approved three rules to try ("Yes, build it", "yeah let's try"): one slot size for every icon; a title's icon stands clear of its surface; no icon is enlarged, and a title's icon lies flat beside the title when zoomed out. Cause of both: the slot was sized from the name's font (titles 37 to 144 pixels, an actor's roof 11), and a title's slot lay at the surface's edge while an object covers the ground behind it on screen (about 1.22 times its height). Values that are the coordinator's choice: the slot is 3 cells, the largest that fits a group's title band together with its clear ground; the object gives way to the flat mark between 14 and 20 screen pixels; the mark is 1.2 font sizes wide. The clear ground is guaranteed for the default view only; in the Layers view an orbit turns the objects and the same room is not reserved on every side.
Reviews (cold simplicity review and full-context review, one round on the first commit). Fixed: the ball lost its constant line width (an ellipse again); a colored icon kept its color while comparing revisions (one list of the authored color variables now serves both resets); parts apart on both ground axes were drawn in list order (the chip's front pins); faces are shaded by screen side like buildings, not by compass side; the part is a Prism and block() draws a filled mark, so "solid" names one thing; the unused x axis is gone; the reader's direction sits beside project(); the gate's opening is written once; the magnifier's handle no longer overlaps its lens; the test reads the painter's own bounds. The landmark enlargement the cold review found in conflict with a criterion is deleted by the rules above. Left as it is, on the full-context review's advice: marks stay in footprint coordinates, the icon rules stay in style.ts.

2026-11-19, own critical pass after the rules were built. Checked on groma's own map (uncommitted demo icons on every level), Dark and Light: at the opening zoom title icons lie flat and nothing is enlarged; zoomed in the objects stand in the outer band and none touches its surface, a building or a border (the zone the owner flagged included); actor, component and external icons are the size of title icons; a click on a standing object selects its surface and selection turns its lines to the highlight; the accent of a colored container turns to ink while comparing; the 2D view shows glyphs only and the Layers view objects; covers draw flat marks. bun run check: 1006 pass, 67 skip, 0 fail, no new lint warning.
Known limits, reported to the owner. A relationship route that runs through a title band is drawn over the standing object, as it is over title letters: routes are a layer above everything on the ground, and the planner cannot avoid a slot whose place depends on the title's zoom step. The clear ground holds for the default view; an orbit in the Layers view turns the objects. An icon that is only previewed in the Edit form stands in the room its name has now, so on a roof or a narrow title it can stand over the start of the name until it is saved.
<!-- SECTION:NOTES:END -->
