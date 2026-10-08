---
id: TASK-563
title: Play the architecture's history between two commits on the web map
status: To Do
assignee: []
created_date: '2026-10-07 23:16'
updated_date: '2026-10-08 15:31'
labels:
  - senior
dependencies: []
references:
  - history-revisions
  - revision-control
  - presentation
  - map
  - camera
  - render
  - src-core
  - web-server
  - web-page
type: feature
ordinal: 3
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A Play button on the web map. The person picks a start commit and an end commit among the revisions Groma.md can read, presses Play, and the map walks through the commits one by one: buildings appear, grow, move and get connected, with the commit's subject and date shown while it plays. There is a speed choice and a Stop. At the end the map shows the comparison from start to end. This turns the timelapse people saw in talks into a feature of the product.

Build on revisions and snapshots (src/history/revisions.ts, src/history/snapshots.ts), the revision picker (src/viewers/web/revision/), comparisons with retained positions (src/history/comparison.ts, src/viewers/web/comparison/), view motion (src/viewers/web/iso/view-motion/) and URL state (src/viewers/web/url.ts).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The revision control lets a person choose a start and an end commit among the readable revisions, and Play walks from start to end one revision at a time, with Stop and a speed choice. The URL carries the range so a link reopens it.
- [ ] #2 Each step morphs the map from the previous revision's layout to the next with retained positions, the way the comparison keeps positions, and the step's short id, subject and date show while it plays.
- [ ] #3 Playback stays smooth: a revision is read once per session and cached, upcoming revisions load ahead, and a range of fifty commits plays without reloading the page or blocking the map.
- [ ] #4 When playback reaches the end, the map shows the comparison from the start to the end commit with its changes bar and stepper.
- [ ] #5 A reduced-motion preference steps without animation. The static export and the terminal viewer are unchanged.
- [ ] #6 Playback visits only compatible revisions, in commit order, from the chosen start commit to the chosen end commit.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->
