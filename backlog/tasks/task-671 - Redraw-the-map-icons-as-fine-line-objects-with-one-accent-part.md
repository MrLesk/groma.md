---
id: TASK-671
title: Redraw the map icons as fine line objects with one accent part
status: Done
assignee:
  - '@claude'
created_date: '2026-11-19T18:23:00Z'
updated_date: '2026-11-21T12:25:00Z'
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
  - src/viewers/web/icons/objects/people.ts
  - src/viewers/web/icons/objects/clients.ts
  - src/viewers/web/icons/objects/compute.ts
  - src/viewers/web/icons/objects/traffic.ts
  - src/viewers/web/icons/objects/data.ts
  - src/viewers/web/icons/objects/messaging.ts
  - src/viewers/web/icons/objects/security.ts
  - src/viewers/web/icons/objects/watching.ts
  - src/viewers/web/icons/objects/tooling.ts
  - src/viewers/web/icons/objects/ai.ts
  - src/viewers/web/icons/objects/media.ts
  - src/viewers/web/icons/objects/commerce.ts
  - src/viewers/web/icons/objects/shapes.ts
  - src/viewers/web/icons/objects/shared-outlines.ts
  - src/viewers/web/organisms/choice-field.ts
  - src/viewers/web/organisms/icon-picker.ts
  - src/write-commands.ts
  - src/architecture-model.ts
type: enhancement
ordinal: 714000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The owner judged the first icon artwork on the live map on 2026-11-19 and rejected it: the objects were crude, the icon before a container title was enlarged until it stood larger than the buildings, and white screens and heavier lines made icons the brightest things on a grey map. The same day he pointed to the look he wants: fine isometric line drawings, quiet faces, and one part of each object picked out in an accent. This task redraws the icons in that look, makes an icon follow the name it stands before, and replaces the first 23 names with 141 generic names in 13 kinds.

The owner's decisions. 2026-11-19: the look; an icon lies in line with its text, is sized from it and is drawn whenever the text is. 2026-11-20: an icon is drawn once, as map geometry; the Iso and Layers views look at it from the map's angle and the 2D view looks at it from straight above with upright panels laid flat; the hierarchy, the details and the Icon field show the drawing of the 2D view; the switch between the two is hard and no line fades with the zoom; an object needs no base plate. 2026-11-21: the names are generic architecture parts that fit any repository, never Groma's own; they are derived from ten curated open source projects of different kinds, and Groma's own map uses a subset of them; after seeing all 141 drawings in both views he answered "Yes, land them".

The coordinator's choices, not his decisions: which names and kinds the list holds, how each object is drawn, every constant, the wording of the acceptance criteria, and the Icon field's kind names, filter box and named pick, which he saw as a mock before they were built.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Every named icon's object is drawn in lines of one fine width over quiet faces, and one part or the few marks that draw one thing are its accent
- [x] #2 The accent is drawn in ink; on an element or group with an authored color the accent takes that color and the rest of the object stays neutral
- [x] #3 An icon lies on the line of its name, one gap before the text, on a roof and before a title: on a tilted map the object stands with its front on the name's baseline, and seen from above its drawing is centred in the icon's box. On an actor's round roof the icon lies above the name, centred over it
- [x] #4 An icon is sized from the letters of its name and changes with them: a title's icon follows the title's size step when the map is zoomed
- [x] #5 An icon is drawn whenever its name is drawn, at every zoom
- [x] #6 An icon has one drawing, its object, built from parts on a footprint like the map: the Iso and Layers views look at it from the map's angle, and the 2D view, the hierarchy rows, the details title and the Icon field look at it from straight above with its upright panels laid flat. Between the two the icon switches at once
- [x] #7 No icon's drawing before a title reaches a building on the surface behind it, at any size of the title
- [x] #8 An icon is the same drawing at every size: only the width of its lines follows the zoom
- [x] #9 An object shows only the faces turned to the reader at every orbit angle, and a curved wall shows no line between its segments
- [x] #10 The Light, Dark and Blueprint themes and the export covers draw the same objects
- [x] #11 The icon list holds 141 names in 13 kinds. Every name is a generic kind of part that any architecture can have, and every name has an object whose accent shows from both views
- [x] #12 The Icon field of the Edit form lists the icons under the names of their kinds. A box filters them by icon name or kind name, a pick the filter hides stays picked, and the field's title names the pick
- [x] #13 groma edit --help lists the icon names one kind per line, and an unknown name is refused with a pointer to that list
- [x] #14 The web map documentation and the Markdown contract describe the look, the accent, the names by kind, and how an icon follows its name and the view
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
1. Part model (icons/parts.ts): one prism, a flat outline pushed along one axis. Pushed along z it is a box, cylinder or rounded plate; along y an upright panel that faces south. A ball is the only other part. A part or a mark can belong to the accent.
2. Visible faces (iso/painting/icon-faces.ts): from the reader's direction (towardsReader, beside project() in projection/project.ts) decide which walls and which end of a prism face the reader, join walls along a curve into one face, shade a face by screen side like a building, and order parts back to front. laidFlat gives the parts as the view from above shows them: a part on the ground stays as it is, and every upright panel is laid flat with its face up, all panels of one object around one line and one height. A laid panel lies at the height of its lowest point and one whole unit higher for every panel that stood behind it, so the panel the tilted views show in front lies on top. The painter (iso/painting/icons.ts) only lays those points on the screen.
3. Look (iso/painting/style.ts, scale.ts): quiet lines a little brighter than the map's outlines, faces a little off paper, the accent in ink. A colored element hands its color to the accent through --icon-accent in the browser and through explicit rules on a cover. One list of the authored color variables serves the zone reset and the comparison reset.
4. An icon is part of its name (sheet/measure.ts, iso/painting/text.ts, names.ts): its box is ICON_RATIO (0.9) font sizes wide, one gap before the text, on a roof's first line and before a title. A title's box is laid out with the title, so it follows the title's size step. A round roof centres its name, so there the box lies above the name, centred over it (iconAbove and roofIconSlot in sheet/measure.ts). Nothing is drawn larger than its box, and no rule hides an icon while its name is drawn.
5. One drawing per icon (iso/painting/icons.ts): iconSvg draws the object from the map's view below PLAN_PITCH and its plan (planSvg) from that pitch up, with no blend between them. On a tilted map the object stands with its front on the name's baseline (ICON_BASELINE in sheet/measure.ts, standsForward); the plan is centred in the box. The panes draw planSvg (icons/glyph-element.ts).
6. Camera (iso/painting/icon-camera.ts): one rule follows the camera scale, the line width, written once as a function for a still and once as the stylesheet expression for the live map.
7. Names and objects (src/icons.ts, icons/objects/): ICON_KINDS names 141 icons in 13 kinds. One file per kind holds that kind's objects, typed by the kind's names, so a missing or misspelled name fails the type check. objects/shared-outlines.ts holds the outlines that several kinds draw, and icons/objects.ts joins the kinds.
8. Icon field (organisms/choice-field.ts, organisms/icon-picker.ts): a choice can name its heading. The choice field lists such choices under their headings, below a box that filters them by label or heading, and names the pick in its title. The filter only hides choices; a hidden choice keeps its radio button, so the pick is still sent.
9. Names in the terminal (src/write-commands.ts, src/architecture-model.ts): groma edit --help ends with the names, one kind per line, and the refusal of an unknown name points to that list.
10. Tests (test-bun/architecture-icons.test.ts), each with its rule, the wrong result it detects and the gap it closes. Kept: a roof name starts after its icon; an object stays inside its footprint. From rules the owner stated on 2026-11-19 and 2026-11-20: "an icon follows the view of the map" (wrong: the plan on a tilted map, or the standing object in the plan view; nothing tested which drawing a view gets); "the plan of every icon object shows the accent" (wrong: an accent on a face only the tilted view shows, so the drawing from above loses what the object is about; with 141 objects a walk does not catch every one); "an icon is sized from the letters of its name and lies on the name's line, at every size of a title" (wrong: a fixed size, or a box off the line; the layout's icon box was untested); "no icon drawing before a title reaches what stands on the surface behind it" (wrong: a taller object or a larger ratio lets a drawing cover a building; nothing tied the artwork's height to the layout's empty ground); "on a round roof the icon lies above the name, centred over it" (wrong: the name's letters under the icon, or the icon off centre; the existing roof test covered only the row layout of a box roof). From this task's objects that turn with the map: "a prism shows the faces turned to the reader, and a curved wall is one face" (wrong: far walls drawn, or a line between the segments of a cylinder). From the owner's rule that an icon is one drawing in every view, and a failure the cold review reproduced in cdn, dns and translate: "where two panels overlap, the plan shows in front the one the tilted map shows in front" (wrong: the 2D drawing lays a back panel over the front one and cuts the accent; the accent test only counts accent shapes, so it passed; checked that the test fails on the former rule and on the rule the review proposed, and passes on the final one). No test for the Icon field or the help text: the repository has no browser test harness, the field was walked on the live map, and the help text is wording.
11. Docs: the Icons entry and the Element fields entry of docs/viewers/web/index.md, and the Icons section of docs/component-markdown.md with the names by kind.
12. Verification: a sheet of all 141 objects from both views; Groma's own map with icons on its elements and groups (demo data on the review map, not committed) in the Iso, 2D and Layers views; the hierarchy rows and the details title; the Edit form's Icon field with its filter; groma edit --help and a refused name; bun run check.
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

2026-11-20 and 2026-11-21, the model and the set. The owner on the flat drawings: "all icons must be redrawn, once, in 3d. for iso we rotate the camera iso, for 2d we rotate the camera in front, in hierarchy we use the same as 2d". A front view does not work for every object, and his answer was his own model: icons are "drawn into the map like we do for the buildings", with a hard switch between the views ("I wouldn't add anything extra for the icons") and "Not all icons need to have a plate at the bottom". On the hierarchy drawing whose inner lines faded: "you can't say it's the same icon just because the same code draws it but one of the parameters makes its output different", and on the drawing without the fade: "it's actually better I like it this way". On the names: "these should be generic architecture icons that work across infinite repos", then "we need way more icons": curate ten open source projects with live Groma, list the icons their parts need, look at other icon sets, make Groma's own map use a subset, "Only then start drawing them".
Built: the flag that said whether an object stands or lies and the drawing from the front are gone; laidFlat lays upright panels flat for the view from above; the line fade is gone from icon-camera.ts and style.ts; 141 names in 13 kinds, one file of objects per kind. Agents curated ten open source projects with live Groma and 549 of their parts were given an icon name, which gave 125 names; 16 more come from a survey of other icon sets. Three names kept their name and changed their drawing: storage is a bucket (its former drawing is backup), and service and cache were redrawn (their former drawings are server and chip). Coordinator's choices: every name, kind and drawing; crate for a shipping container, so the C4 word stays free.

2026-11-21, landing. The owner saw all 141 from both views and on the live map and answered "Yes, land them". Added for the landing: the Icon field lists the icons by kind under a box that filters them, and names the pick in its title (he saw a mock first; the title of the Color field names its pick the same way); groma edit --help lists the names one kind per line, and the refusal of an unknown name points there where it printed every name before; the flat list of names is private to src/icons.ts.
Reviews (cold simplicity review and full-context review, run together, one round). Defect, fixed: in the plan a laid panel lay at its lowest point only, so in cdn, dns and translate the back panel covered the front one and cut the accent, while the tilted views showed the accent in front. The rule the review proposed (lie at the depth the panel stood at) repaired those and broke audio and broadcast. Final rule: a laid panel lies at its lowest point and one whole unit higher for every panel that stood behind it; among 31 pairs of overlapping panels in the 141 objects the plan now stacks every pair as the tilted home view does, and only the 2D drawings of cdn, dns and translate changed from what the owner saw (a script compared every drawing before and after; no tilted drawing changed). A test now holds that rule. Also fixed: the comment that said the order of an object's parts does not matter (the painter keeps the list's order where it cannot tell); globe marks and the star moved to the one kind that draws them; the ellipse takes its step from the arc step and says how flat it may be; comments and the class icon-flat left from the removed front drawing (now icon-plan); a pane takes the icon rules directly (paneIconCss is gone); a choice names its heading, not its group, because a group is an architecture record; the heading takes the look of a field's title from the write form; the kind building is now tooling, because a building is the map's word for a component's box (the owner saw the heading as building; the rename is the coordinator's). Left as they are: the ball part and the east mark face each serve one object (core, crate), and removing them means redrawing two drawings the owner approved; a name listed in two kinds is not guarded (the names are unique today).

Verification. bun run check: 1010 pass, 67 skip, 0 fail; Node suite 28 pass; lint output unchanged (2 warnings and 2 notes in files this task does not touch). A script over the list: 13 kinds, 141 distinct names, an object for each, and an accent seen from the map's angle and from above for each. Review map (Groma's own map with 155 icons as demo data, not committed): 6 icons on colored surfaces draw the accent in that color and 149 draw it in ink; at 50, 271 and 9978 percent zoom the same 155 icons with the same 1436 shapes are drawn wherever their names are, every part opaque, only the line width changes (0.6 to 1 pixel); Iso, 2D and Layers; Dark, Light and Blueprint; an export wrote its four covers. Icon field: no icon, then 13 kinds; typing data leaves the data kind and datacenter; a pick the filter hides is still sent and saved (camera to database and back); Enter with text typed does not save and Escape cancels the form as in its other fields; Tab from the box reaches the first icon left and the arrow keys pick; three selected components with different icons show mixed; a group's form has the same field; the footer still spans the pane. groma edit --help prints the 13 lines, and --icon bogus is refused with the pointer and exit code 1.
Not committed: the icons on Groma's own records, for the reason above (the architecture workflow reads the groma folder with a released groma.md).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Each map icon is now one object built from parts on a footprint, like the map. The Iso and Layers views look at it from the map's angle; the 2D view, the hierarchy rows, the details title and the Icon field look at it from straight above, with upright panels laid flat. The icon switches at once between the two, and only the width of its lines follows the zoom. The first 23 names are replaced by 141 generic names in 13 kinds, derived from ten curated open source projects, with one file of objects per kind. The Icon field lists the icons by kind under a box that filters them and names the pick in its title; groma edit --help lists the names by kind.

Verified by bun run check (1010 pass, 67 skip, 0 fail), a script over all 141 objects (an object and an accent seen from both views for each), and a walk of the review map in the Iso, 2D and Layers views and the Dark, Light and Blueprint themes; an export wrote its covers.

Changed after the owner's "Yes, land them": the 2D drawings of cdn, dns and translate (their front panel now lies on top, as the tilted views show it), and the kind building is named tooling, because a building is the map's word for a component's box.

Known limit: a relationship route that runs through a title band is drawn over the icon, as over the title's letters. Groma's own map carries no icons until a released groma.md knows groma.icon.
<!-- SECTION:FINAL_SUMMARY:END -->
