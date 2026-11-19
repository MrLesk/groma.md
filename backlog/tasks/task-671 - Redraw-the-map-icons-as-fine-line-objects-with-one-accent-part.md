---
id: TASK-671
title: Redraw the map icons as fine line objects with one accent part
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-19T18:23:00Z'
updated_date: '2026-11-19T18:39:00Z'
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
type: enhancement
ordinal: 714000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The owner judged the first icon artwork on the live map on 2026-11-19 and rejected it: the objects were crude, the icon before a container title was enlarged until it stood larger than the buildings, and white screens and heavier lines made icons the brightest things on a grey map. The same day he pointed to the look he wants: fine isometric line drawings, quiet faces, and one part of each object picked out in an accent. This task redraws the 23 objects in that look and makes an icon follow the size of the name it stands before. The owner decided the direction (fine isometric line objects, an accent, a new pull request on top of the personalization stack). Every other rule here and every acceptance criterion is the coordinator's reading and waits for his verdict on the live map.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every named icon's object is drawn in lines of one fine width over quiet faces, and one part or mark of it is its accent
- [ ] #2 The accent is drawn in ink; on an element or group with an authored color the accent takes that color and the rest of the object stays neutral
- [ ] #3 An icon is as large as the slot of the name it stands before at every zoom; no icon is enlarged beyond its slot
- [ ] #4 On a small icon the quiet inner lines fade out and the outline and the accent stay until the icon itself fades
- [ ] #5 An object shows only the faces turned to the reader at every orbit angle, and a curved wall shows no line between its segments
- [ ] #6 The Light, Dark and Blueprint themes and the export covers draw the same objects
- [ ] #7 The web map documentation describes the look, the accent and the size rule
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
1. Part model (icons/parts.ts): one solid, a flat outline pushed along one axis, replaces the box and the upright prism. Pushed along z it is a box, cylinder or rounded plate; along y an upright panel facing south. A part or mark can be the accent.
2. Visible faces (iso/painting/icon-faces.ts): from the view's yaw and pitch decide which walls and which end of a solid face the reader, join walls along a curve into one face, shade a face by the way it is turned, and order parts back to front. The painter (iso/painting/icons.ts) only lays those points on the screen.
3. Look (iso/painting/style.ts, scale.ts): quiet lines a little brighter than the map's outlines, faces a little off paper, the accent in ink. A colored element hands its color to the accent through --icon-accent in the browser and through explicit rules on a cover; the rest of the object no longer takes the color.
4. Size (iso/painting/icon-camera.ts): a landmark's least slot side drops from 34 to 24 screen pixels; lines stay hairlines (0.6 to 1 pixel); quiet inner lines fade between 14 and 26 pixels and accent marks do not fade.
5. Objects (icons/objects.ts): all 23 redrawn with one accent each.
6. Tests. The footprint test keeps its rule (an object never leaves its slot) and reads the new part model. One new test, authority: this task's request for fine line objects that turn with the map. Wrong result it detects: a box drawn from behind showing its far walls, or a cylinder wall drawn as one face per segment (a line between segments). Gap: nothing tested which faces of an object are drawn. Smallest test: face count and tones of one box from two sides and of one cylinder.
7. Docs: the Icons entry of docs/viewers/web/index.md.
8. Verification: specimen sheets of every object in the three themes and from four orbit angles, groma's own map with icons on every level (uncommitted demo), covers, selection, Edit form preview, 2D and Layers views.
<!-- SECTION:PLAN:END -->
