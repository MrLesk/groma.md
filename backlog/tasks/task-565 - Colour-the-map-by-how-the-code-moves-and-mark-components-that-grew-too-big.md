---
id: TASK-565
title: Colour the map by how the code moves and mark components that grew too big
status: To Do
assignee: []
created_date: '2026-10-07 23:16'
updated_date: '2026-10-08 15:31'
labels:
  - intermediate
dependencies: []
references:
  - src-core
  - history-revisions
  - shell
  - c4-filter
  - settings-control
  - map
  - organisms-details
  - screen
  - iso-project
type: feature
ordinal: 5
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Buildings already show size: floors are files, height is lines, width and depth are connections. Colour is the free channel. A Colour by control tints buildings by a metric computed from Git when the map loads: commits, committers, co-change (components that change in the same commits) and instability from the relationships. A legend explains the scale and the numbers show in the details pane. Separately, a component far above the others in its container in files, lines or connections gets an outlier mark, because parts that keep growing and keep changing are where things break. Like line counts, these are runtime measurements: they are never written to the Markdown.

Build on line counts computed at load (src/core.ts), git reads (src/history/revisions.ts), the map chrome controls (src/viewers/web/chrome/), building styles (src/viewers/web/iso/painting/style.ts) and the details panes (web src/viewers/web/organisms/details.ts, terminal src/viewers/tui/panes/details.ts).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 When a live map loads, Groma.md counts for every component the commits and the distinct committers that touched its files in the last 500 commits (a setting), from git log, in the background after the first paint. A repository without history shows no metrics.
- [ ] #2 A Colour by control offers None, Commits, Committers, Co-change and Instability. Buildings take a tint from the chosen metric that reads the same in light, dark and blueprint, with a legend that explains the scale. None restores today's map.
- [ ] #3 Co-change counts for each pair of components the commits that touched both. A component's details list its top co-changing components and mark the pairs that have no relationship between them.
- [ ] #4 A component far above its container's median in files, lines of code or connections (at least four times the median and at least ten files) gets an outlier mark on the building and a line in the details pane naming the measure. The terminal details pane shows the same line.
- [ ] #5 The metrics and the control stay out of the static export and are never written to the architecture Markdown.
- [ ] #6 docs/viewers/web/index.md describes the Colour by control, its metrics, the history window and the outlier rule.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->
