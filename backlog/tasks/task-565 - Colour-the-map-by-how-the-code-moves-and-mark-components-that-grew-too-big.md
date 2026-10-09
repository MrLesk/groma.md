---
id: TASK-565
title: Colour the map by how the code moves and mark components that grew too big
status: Done
assignee:
  - '@codex'
created_date: '2026-10-07 23:16'
updated_date: '2026-10-09 08:02'
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
  - src/component-metrics.ts
  - src/history/code-metrics.ts
  - src/viewers/web/metrics/control.ts
  - src/viewers/web/metrics/details.ts
  - src/viewers/web/map-session.ts
  - src/viewers/web/render.ts
  - src/viewers/tui/panes/details.ts
  - docs/viewers/web/index.md
  - code-measurements
modified_files:
  - src/component-metrics.ts
  - src/history/code-metrics.ts
  - src/viewers/web/map-session.ts
  - src/viewers/web/metrics/details.ts
  - src/viewers/web/metrics/control.ts
  - src/viewers/web/render.ts
  - src/viewers/tui/panes/details.ts
  - docs/viewers/web/index.md
  - groma/systems/groma-md/containers/cli/components/code-metrics.md
  - groma/systems/groma-md/containers/cli/components/component-metrics.md
  - groma/systems/groma-md/containers/cli/components/details.md
  - groma/systems/groma-md/containers/cli/components/metrics-control.md
  - groma/systems/groma-md/containers/cli/components/src-core.md
  - groma/systems/groma-md/containers/cli/components/history-revisions.md
  - groma/systems/groma-md/containers/export/components/metrics-control.md
  - groma/systems/groma-md/containers/export/components/details.md
  - groma/systems/groma-md/containers/export/components/code-measurements.md
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
- [x] #1 When a live map loads, Groma.md counts for every component the commits and the distinct committers that touched its files in the last 500 commits (a setting), from git log, in the background after the first paint. A repository without history shows no metrics.
- [x] #2 A Colour by control offers None, Commits, Committers, Co-change and Instability. Buildings take a tint from the chosen metric that reads the same in light, dark and blueprint, with a legend that explains the scale. None restores today's map.
- [x] #3 Co-change counts for each pair of components the commits that touched both. A component's details list its top co-changing components and mark the pairs that have no relationship between them.
- [x] #4 A component far above its container's median in files, lines of code or connections (at least four times the median and at least ten files) gets an outlier mark on the building and a line in the details pane naming the measure. The terminal details pane shows the same line.
- [x] #5 The metrics and the control stay out of the static export and are never written to the architecture Markdown.
- [x] #6 docs/viewers/web/index.md describes the Colour by control, its metrics, the history window and the outlier rule.
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
1. Add pure runtime component measurements: unique files, lines, relationship degree, instability, and container-median outliers. Add a Git log reader for commit/committer and co-change counts.
2. Expose a live metrics endpoint. Fetch after first browser paint; keep window and colouring in a live-only control, decorate buildings and component details, and add the shared outlier line to terminal details.
3. Document formulas, history window, outlier threshold, and export exclusion. Run no installs, builds or tests per stage instruction; review code and curate scanner output using groma scan.
4. Perform the required simplicity and complexity reviews, record evidence and limitations, and check completed acceptance criteria without changing status or committing.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Cold simplicity review passed with no blocking findings. Accepted its documentation placement improvement: live code measurements are a top-level section before static publication. Source review traces Git reads, runtime measurement ownership, browser-only decoration and shared terminal outliers. No tests, builds, installs or commits run, per instruction.

AC6: docs/viewers/web/index.md now documents all five Colour by choices, distinct committer emails, pair co-change sum and top five links, instability formula, session-local 500-commit window, the ten-file/four-times-median outlier rule, and live/static boundaries. Task-scoped git diff --check passed. groma scan completed (created 0, refreshed 116; 38 repository-wide findings); curated only this task’s new files, merging runtime measurements into src-core and Git counts into history-revisions, with a described Code measurements component under Browser map.

AC1 implementation review: /metrics.json reads current-map ownership through readCodeHistory; git log is limited to the requested positive-integer window (default 500), counts each touched component once per commit and distinct committer emails, and returns no history for an unborn/non-Git repository. The browser schedules the read after two animation frames and a task. Merge commits use their first-parent diff. No executable verification was run.

AC2 implementation review: live-only Settings controls offer None, Commits, Committers, Co-change and Instability. Fixed RGB scale values serve all themes, graph instability spans 0–1, other metrics use the maximum component value, and None removes transient SVG tint attributes. Legend labels the selected metric and scale. Visual verification was not run.

AC3 implementation review: a per-commit Set deduplicates component touches, each distinct pair is counted once in both component lists, and details link the top five peers by shared-commit count with a no-relationship marker when neither directed relationship exists.

AC4 implementation review: shared componentMetrics compares files, measured lines and directed neighbour counts independently against all siblings in the containing container, with at least ten unique files and at least four times the median. The browser adds an orange triangle and details line; terminal details uses the same outlierLine and offsets the action cursor by the inserted wrapped lines. Runtime and terminal visual verification were not run.

AC5 implementation review: no runtime measurement is added to stored documents or shared export payloads. The browser creates its measurement control only for live delivery and hides it on historical/comparison views; published delivery cannot request the metrics endpoint. Export execution was not run.

Implementer specification and quality source reviews passed; the final full-context complexity review also reported no blocking findings and clear ownership. All implementation acceptance criteria are checked based on source review; executable, visual and performance verification remain explicitly unperformed under the stage instruction. Definition of Done verification/check items remain unchecked. Shared file edits preserved other agents’ changes in render.ts, map-session.ts and terminal details. No status change or commit made.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented live Colour by metrics with a configurable 500-commit history window, consistent tint scale and legend, linked co-change rankings, instability and container-median outlier marks/details. Terminal details share the outlier rule. Static delivery has no metric controls/data. Documented the behavior, ran groma scan, and curated task-owned architecture into existing owners plus Browser map Code measurements. Source reviews and git diff --check passed; no installs, builds, tests, runtime/visual validation, or commits were performed, as requested.
<!-- SECTION:FINAL_SUMMARY:END -->
