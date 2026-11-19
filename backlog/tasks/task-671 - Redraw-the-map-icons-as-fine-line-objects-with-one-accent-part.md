---
id: TASK-671
title: Redraw the map icons as fine line objects with one accent part
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-19T18:23:00Z'
updated_date: '2026-11-19T21:10:00Z'
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
  - src/viewers/web/iso/painting/buildings.ts
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
- [ ] #3 An icon lies on the line of its name, one gap before the text, on a roof and before a title: a standing object stands on the name's baseline and a lying one is centred on the name's line. On an actor's round roof the icon lies above the name, centred over it
- [ ] #4 An icon is sized from the letters of its name and changes with them: a title's icon follows the title's size step when the map is zoomed
- [ ] #5 An icon is drawn whenever its name is drawn, at every zoom
- [ ] #6 An icon has one drawing, its object: it stands on a tilted map, and the same object is drawn flat in the 2D view, the hierarchy rows, the details title and the Icon field
- [ ] #7 No icon's drawing before a title reaches a building on the surface behind it, at any size of the title
- [ ] #8 On a small object the quiet inner lines fade out and the outline and the accent stay
- [ ] #9 An object shows only the faces turned to the reader at every orbit angle, and a curved wall shows no line between its segments
- [ ] #10 The Light, Dark and Blueprint themes and the export covers draw the same objects
- [ ] #11 The web map documentation describes the look, the accent and how an icon follows its name and the view
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
1. Part model (icons/parts.ts): one prism, a flat outline pushed along one axis. Pushed along z it is a box, cylinder or rounded plate; along y an upright panel facing south. A ball is the only other part. A part or a mark can belong to the accent.
2. Visible faces (iso/painting/icon-faces.ts): from the reader's direction (towardsReader, beside project() in projection/project.ts) decide which walls and which end of a prism face the reader, join walls along a curve into one face, shade a face by screen side like a building, and order parts back to front. The painter (iso/painting/icons.ts) only lays those points on the screen.
3. Look (iso/painting/style.ts, scale.ts): quiet lines a little brighter than the map's outlines, faces a little off paper, the accent in ink. A colored element hands its color to the accent through --icon-accent in the browser and through explicit rules on a cover. One list of the authored color variables serves the zone reset and the comparison reset.
4. An icon is part of its name (sheet/measure.ts, iso/painting/text.ts, names.ts): its box is ICON_RATIO (0.9) font sizes wide, centred on the middle of the name's capitals, one gap before the text, on a roof's first line and before a title. A title's box is laid out with the title, so it follows the title's size step. A round roof centres its name, so there the box lies above the name, centred over it (iconAbove and roofIconSlot in sheet/measure.ts own that rule; the footprint, the name's place and the painter all read it). Nothing is drawn larger than its box, and no rule hides an icon while its name is drawn.
5. One drawing per icon (icons/objects.ts, iso/painting/icons.ts): its object. objects.ts says whether an object stands or lies. On a tilted map it is drawn in the box and turns with the map; a standing object has its front on the name's baseline (ICON_BASELINE in sheet/measure.ts, standsForward in icons.ts) and a lying one is centred. In the 2D view and in the panes flatSvg draws the same parts from the front (a standing object) or from above (a lying one), centred in the box. Between a tilted view and the plan view one drawing fades into the other.
6. Camera (iso/painting/icon-camera.ts): two rules follow the camera scale, each written once as a function for a still and once as the stylesheet expression for the live map: the line width, and the opacity of the quiet inner lines of a small object.
7. Objects (icons/objects.ts): all 23, one accent each.
8. Tests (test-bun/architecture-icons.test.ts), each with its rule, the wrong result it detects and the gap it closes. Kept: a roof name starts after its icon; an object stays inside its footprint. From rules the owner stated on 2026-11-19: "an icon follows the view of the map" (wrong: the flat drawing on a tilted map, or the object in the plan view; nothing tested which drawing a view gets); "the flat drawing of every icon is its own object and shows the accent" (wrong: a flat drawing that loses the accent; the flat drawings were untested); "an icon is sized from the letters of its name and lies on the name's line, at every size of a title" (wrong: a fixed size, or a box off the line; the layout's icon box was untested); "no icon drawing before a title reaches what stands on the surface behind it" (wrong: a taller object or a larger ratio lets a drawing cover a building; nothing tied the artwork's height to the layout's empty ground); "on a round roof the icon lies above the name, centred over it" (rule: his words about the actors, "the icons could go below or above the text here"; wrong: the name's letters under the icon, or the icon off centre; the existing roof test covered only the row layout of a box roof; checked that it fails when the name is not moved down and when the box is not centred). From this task's objects that turn with the map: "a prism shows the faces turned to the reader, and a curved wall is one face" (wrong: far walls drawn, or a line between the segments of a cylinder).
9. Docs: the Icons entry of docs/viewers/web/index.md and the icon wording in docs/component-markdown.md.
10. Verification: a specimen sheet of every object standing and flat; groma's own map with an icon on every element and group (uncommitted demo data) in the Iso, 2D and Layers views, Dark and Light, from the opening zoom to roofs up close; actors, external systems, components, titles of groups, containers and the system; the hierarchy rows and details title; selection and a click on an icon; the Edit form; covers.
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

2026-11-19, the owner on the actors in the 2D view, where names were drawn without their icons: "why do we remove the icons while the text stays. you must understand the icons should follow the same rule of the text. I still see that you have differences. the icons could go below or above the text here". Then: "can you add correct icons to all groma components and verify everything yourself?". His decisions: an icon follows the same rule as its text, so it is drawn whenever the name is; on an actor's roof it may lie above or below the name. Cause: icons had their own fade below 8 screen pixels, and an actor's name is 11 plane pixels, so its icon was gone at zooms where the name was still drawn. Built: that fade is removed (icon-camera.ts, style.ts, icons.ts), and no rule hides an icon while its name is drawn; on a round roof the icon lies above the name, centred over it, and the roof grows to hold both (iconAbove and roofIconSlot in sheet/measure.ts). Coordinator's choices: above, not below; the gap between icon and name is the one used before a name; only a round roof does this, a pill keeps its icon before the name.
Verification of this round. Every element and group of groma's own map got a fitting icon through groma edit (155 records, 21 of the 23 names; uncommitted demo data in the review copy). Walked on the exported map and the live review map: Iso, 2D and Layers views, Dark and Light, from the opening zoom to roofs up close; actors (icon above the name in every view), external systems, component roofs with one and two lines, titles of groups, containers and the system; a specimen sheet of all 23 objects standing and flat at three sizes; hierarchy rows and the details title; a click on an icon hits its own element; a selected component draws its icon in the highlight like its name; the Edit form offers no icon and the 23 flat drawings and previews a pick on the actor's roof; the cover draws. bun run check: 1009 pass, 67 skip, 0 fail, the lint output unchanged.
Not committed: the icons on groma's own records. The Groma architecture workflow reads a pull request's groma folder with a released groma.md, and no release knows groma.icon yet.
<!-- SECTION:NOTES:END -->
