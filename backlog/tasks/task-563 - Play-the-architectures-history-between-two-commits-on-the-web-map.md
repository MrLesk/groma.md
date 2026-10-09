---
id: TASK-563
title: Play the architecture's history between two commits on the web map
status: Done
assignee:
  - '@codex'
created_date: '2026-10-07 23:16'
updated_date: '2026-10-09 08:01'
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
modified_files:
  - src/viewers/web/revision/history.ts
  - src/viewers/web/map-session.ts
  - src/viewers/web/data.ts
  - src/viewers/web/revision/playback.ts
  - src/viewers/web/revision/control.ts
  - src/viewers/web/render.ts
  - src/viewers/web/revision/view.ts
  - docs/viewers/web/history-playback.md
  - groma/systems/groma-md/containers/cli/components/history.md
  - groma/systems/groma-md/containers/export/components/playback.md
  - groma/systems/groma-md/containers/cli/components/web-server.md
  - groma/systems/groma-md/containers/export/components/revision-control.md
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
- [x] #3 Public contracts or documentation are updated when behavior changes.
- [x] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add a live-only playback controller to the existing two-commit revision selection, with Play/Stop, speed, commit metadata and persistent range URLs. 2. Cache historical snapshots and owned source text in the web session, select compatible commits in existing Git order, and preload upcoming step comparisons. 3. Reuse comparison layout, keyed map morphing and reduced-motion handling for each step; finish with the selected full-range comparison. 4. Update the web guide, inspect the supported flow and task-scoped diff without running builds or tests, then scan and curate new files under their existing responsibilities. No new tests: the user explicitly prohibits running tests; record verification limits rather than claiming performance evidence.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Shared-file coordination: TASK-562 also records data.ts and map-session.ts; TASK-565 records map-session.ts, render.ts and the web index; TASK-568 records map-session.ts. Playback uses separate imports, endpoint and URL hunks and preserves their work. Playback documentation is a separate page to avoid overlapping edits to the web index.

Implemented Play/Stop and 0.5×/1×/2×/4× speed in the live revision control; the selected range remains in the URL and header while a caption identifies each frame. The web session caches architecture and source snapshots; playback filters unreadable revisions in Git list order and preloads the next two comparisons. Completion restores the full-range comparison. Existing comparison layout, keyed map morphing and reduced-motion behavior are reused. Static export and terminal code were not changed. Specification and quality review traced revision selection -> compatible range -> cached snapshots -> prefetched comparison frames -> map application -> final comparison. Type checking (tsc --noEmit), focused Biome lint and git diff --check pass; the one reported complexity warning is in the existing paintDetailsState function, outside this change. No builds or tests were run, as instructed. No browser automation tool is available in this session, so interactive behavior and fifty-commit smoothness remain unverified; acceptance criteria are not checked without that evidence. Architecture scan completed, and history.ts/playback.ts were combined into Web host/Revision selector with their responsibilities documented.
<!-- SECTION:NOTES:END -->
