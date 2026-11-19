---
id: TASK-671
title: Redraw the map icons as fine line objects with one accent part
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-19T18:23:00Z'
updated_date: '2026-11-19T20:39:00Z'
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
  - src/viewers/web/icons/glyphs.ts
  - src/viewers/web/icons/glyph-element.ts
  - docs/component-markdown.md
  - src/icons.ts
  - src/viewers/tui/tree.ts
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
- [ ] #3 An icon lies on the line of its name, one gap before the text, on a roof and before a title: a standing object stands on the name's baseline and a lying one is centred on the name's line
- [ ] #4 An icon is sized from the letters of its name and changes with them: a title's icon follows the title's size step when the map is zoomed
- [ ] #5 An icon has one drawing, its object: it stands on a tilted map, and the same object is drawn flat in the 2D view, the hierarchy rows, the details title and the Icon field
- [ ] #6 No icon's drawing before a title reaches a building on the surface behind it, at any size of the title
- [ ] #7 On a small object the quiet inner lines fade out and the outline and the accent stay
- [ ] #8 An object shows only the faces turned to the reader at every orbit angle, and a curved wall shows no line between its segments
- [ ] #9 The Light, Dark and Blueprint themes and the export covers draw the same objects
- [ ] #10 The web map documentation describes the look, the accent and how an icon follows its name and the view
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
4. An icon is part of its name (sheet/measure.ts, iso/painting/text.ts, names.ts): its box is ICON_RATIO font sizes wide and centred on the middle of the name's capitals, on a roof's first line and before a title. A title's box is laid out with the title, so it follows the title's size step. The landmark enlargement is deleted: nothing is drawn larger than its box.
5. The view decides the drawing (iso/painting/icons.ts): the object on a tilted map, the flat glyph in the plan view, one fading into the other between the two.
6. In line (iso/painting/icon-faces.ts drawingSpan and drawingOffset): an object rises on screen, so it stands a little in front of its box and its drawing, not its foot, is centred on the box.
7. Objects (icons/objects.ts): all 23 redrawn with one accent each; the three tallest kept low.
8. Tests (test-bun/architecture-icons.test.ts). Kept: a roof name starts after its icon; an object stays inside its footprint (read from the painter's own bounds). New, each from a rule the owner stated on 2026-11-19: "an icon follows the view of the map" (wrong result: a flat glyph on a tilted map, or an object in the plan view; gap: nothing tested which drawing a view gets); "an icon is sized from the letters of its name and lies on the name's line, at every size of a title" (wrong result: a fixed size, or a box off the line; gap: the layout's icon box was untested); "no icon drawing before a title reaches what stands on the surface behind it" (wrong result: a taller object or a larger ratio lets a drawing cover a building; gap: nothing tied the artwork's height to the layout's empty ground). New, from this task's fine line objects that turn with the map: "a prism shows the faces turned to the reader, and a curved wall is one face" (wrong result: far walls drawn, or a line between the segments of a cylinder).
9. Docs: the Icons entry of docs/viewers/web/index.md.
10. Verification: specimen sheets of every object in the three themes and from four orbit angles; groma's own map with icons on every level (uncommitted demo) at the opening zoom, mid zoom and close; titles, roofs of actors, components and external systems; the 2D view; covers; selection and a click on an object; the accent's color while comparing.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-11-19, owner on the live map. Two reactions to the first commit: a zone title's icon overlapped a building behind it ("can we avoid these overlaps", then "we need to find a solution that works always on any repo"), and icons were not one size at the same zoom (an actor's was hard to spot). He approved three rules to try ("Yes, build it", "yeah let's try"): one slot size for every icon; a title's icon stands clear of its surface; no icon is enlarged, and a title's icon lies flat beside the title when zoomed out. Cause of both: the slot was sized from the name's font (titles 37 to 144 pixels, an actor's roof 11), and a title's slot lay at the surface's edge while an object covers the ground behind it on screen (about 1.22 times its height). Values that are the coordinator's choice: the slot is 3 cells, the largest that fits a group's title band together with its clear ground; the object gives way to the flat mark between 14 and 20 screen pixels; the mark is 1.2 font sizes wide. The clear ground is guaranteed for the default view only; in the Layers view an orbit turns the objects and the same room is not reserved on every side.
Reviews (cold simplicity review and full-context review, one round on the first commit). Fixed: the ball lost its constant line width (an ellipse again); a colored icon kept its color while comparing revisions (one list of the authored color variables now serves both resets); parts apart on both ground axes were drawn in list order (the chip's front pins); faces are shaded by screen side like buildings, not by compass side; the part is a Prism and block() draws a filled mark, so "solid" names one thing; the unused x axis is gone; the reader's direction sits beside project(); the gate's opening is written once; the magnifier's handle no longer overlaps its lens; the test reads the painter's own bounds. The landmark enlargement the cold review found in conflict with a criterion is deleted by the rules above. Left as it is, on the full-context review's advice: marks stay in footprint coordinates, the icon rules stay in style.ts.

2026-11-19, own critical pass after the rules were built. Checked on groma's own map (uncommitted demo icons on every level), Dark and Light: at the opening zoom title icons lie flat and nothing is enlarged; zoomed in the objects stand in the outer band and none touches its surface, a building or a border (the zone the owner flagged included); actor, component and external icons are the size of title icons; a click on a standing object selects its surface and selection turns its lines to the highlight; the accent of a colored container turns to ink while comparing; the 2D view shows glyphs only and the Layers view objects; covers draw flat marks. bun run check: 1006 pass, 67 skip, 0 fail, no new lint warning.
Known limits, reported to the owner. A relationship route that runs through a title band is drawn over the standing object, as it is over title letters: routes are a layer above everything on the ground, and the planner cannot avoid a slot whose place depends on the title's zoom step. The clear ground holds for the default view; an orbit in the Layers view turns the objects. An icon that is only previewed in the Edit form stands in the room its name has now, so on a roof or a narrow title it can stand over the start of the name until it is saved.

2026-11-19, later. The owner saw the three rules live and rejected two of them. His words: "wait why does it change from flat to iso so weirdly?", "also it's absolutely not in line with the text", "why do we have both flat and iso versions of the icons. did I approve that?", then the model he wants: "we have an iso map and we have a 2d map. the icons should follow that switch and the icons should be in line with the text... like every other icon with their label and also follow the text size and change when text size changes. it's much easier than you think". These are his decisions: an icon follows the view (object in Iso, flat glyph in 2D); it lies in line with its text; its size follows the text size and changes with it. Removed again: the one slot size for every icon, the clear ground before a title and the flat mark on the tilted map (pushed in 42356d27), with their constants and tests.
Built in their place, coordinator's choices: the box is 1.2 font sizes (ICON_RATIO), the largest whole tenth at which the tallest drawing stays inside the two cells of empty ground a surface keeps along its edge, at every title size (most: 33 of 48 plane pixels, a system title zoomed far out); the gap to the text is 0.4 font sizes; the drawing, not the foot, is centred on the line, because an object rises on screen (drawingOffset in icon-faces.ts); the three tallest objects stay lowered. Consequence told to the owner: a roof icon is now as small as its roof's name (an actor's name is 11 plane pixels, so its icon is about 13), smaller than the 30 he found hard to spot; the size of roof names is the lever.

2026-11-19, the owner on the label model. "yes but in iso is still not in line. 2d is perfectly aligned except idk why you are not using the same icon but flatten it. you went to create a separate icon for 2d for no reason when you can just rotate the iso one", then "the icon in the iso sits on a line below the \"browser\". given that when we switch between 2d and iso we just rotate, you shouldn't do anything special to have the icon aligned with the text correctly". His decisions: one icon, the 2D one is the same object flattened; in the Iso view the icon sits on the text's line with no special placement. Built: the hand-drawn glyph set (icons/glyphs.ts) is deleted; flatSvg in iso/painting/icons.ts draws an object from its front (an object that stands) or from above (one that lies), with the same parts, marks and accent, for the 2D view and the panes; objects.ts says for each object whether it stands or lies. The centring of an object's drawing that I had added (the cause of "sits on a line below") is removed. A standing object now stands with its front on the name's baseline (ICON_BASELINE in sheet/measure.ts, from the same line metrics as the text), which is my reading of "sits on the line" and needs his eyes. The box is 0.9 font sizes (my number): the largest tenth at which every object stays inside the empty ground behind a title at every title size.
Verification of this round: bun run check 1008 pass, 67 skip, 0 fail; the Browser map and Groma application titles in the Iso view (foot on the baseline) and the 2D view (same drawing, flat); hierarchy rows with the flat drawings; external systems and actors.
<!-- SECTION:NOTES:END -->
