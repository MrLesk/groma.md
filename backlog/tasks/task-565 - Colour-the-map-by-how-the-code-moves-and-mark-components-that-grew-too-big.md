---
id: TASK-565
title: Colour the map by how the code moves and mark components that grew too big
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-07 23:16'
updated_date: '2026-10-11 16:14'
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
  - test-bun/code-metrics.test.ts
  - src/viewers/web/page.ts
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
- [x] #1 Acceptance criteria have objective verification evidence.
- [x] #2 Relevant checks pass and changes remain task-scoped.
- [x] #3 Public contracts or documentation are updated when behavior changes.
- [x] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Keep metric colouring in the live browser overlay. Limit its solid side fills to face polygons and leave draft ghosts hollow; preserve file-extension facade patterns, all metric choices, themes and None restoration.
2. Split building decoration, legend painting and guarded history requests into named operations. Group component measurement objects directly for the unchanged ten-file/four-times-median rule. Reuse sourceIndex ownership and one concrete accumulator per component for Git commit, committer and co-change counts. Extract inspected-element detail painting from the dispatcher.
3. Verify the reported ghost/facade failures through computed browser styles using a temporary minimum fixture. Existing theme, export, revision and details tests do not exercise the live metric CSS; the focused browser regression will detect solid ghost fills or lost facade URLs without freezing decorative source text.
4. Add minimum runtime measurement and Git history tests only where existing coverage has no count/window/co-change/outlier assertions. The supported authority is AC1/AC3/AC4; failures are double-counted file touches, wrong distinct committers or pairs, ignored window, and changed ten-file/four-times-median eligibility. Reuse existing minimum architecture fixtures and temporary Git roots.
5. Run focused regressions, a cold simplicity review, implementer specification and quality reviews, a full-context complexity review, and bun run check. Curate only task-caused architecture records through Groma and record each changed path immediately.
6. Finalize objective evidence and create the authorized local task commit. No push, publication or release tag.

7. Maintainability pass on the review findings A to K of PR 123. Behaviour changes are limited to three decided corrections: (A) a measure whose container median is 0 marks no component; (C) Committers counts distinct author addresses, not the address that created the commit; (D) git log runs with --relative, so a project below the Git top level is counted. The rest keeps behaviour: (B) the metric legend stacks its lines so the colour scale has width; (E) the history window variable no longer shadows the browser's window; (F) the two scale end colours are defined once and the gradient, outlier mark and label ink derive from them; (G) the control exports its CSS and the page includes it; (H) the after-paint delay has a name; (I) component metrics are computed once per loaded elements snapshot; (J) verify that a newer history request supersedes an older one; (K) import grouping in the terminal details pane. The four metrics, the 500-commit default, the 4x and ten-file thresholds and the blue-to-orange scale stay as built.

8. Tests: extend the two existing tests in test-bun/code-metrics.test.ts, no new test. (a) Zero median. Rule and authority: review decision A, refining AC4. Wrong result caught: a ten-file component is marked for a measure in which its siblings have nothing, the same predicate that marked two components sharing one relationship. Gap: the only zero-median case compared equal zeros; it becomes one component above a zero median. (b) Author addresses. Rule and authority: review decision C, AC1. Wrong result caught: commits by two authors merged by one committer count as one person. Gap: the fixture gave author and committer the same address; every fixture commit now has one fixed committer and its own author. (c) Project below the Git top level. Rule and authority: review decision D, AC1. Wrong result caught: every count is 0 because git log printed paths relative to the Git top level. Gap: the fixture project was the Git top level; it moves one directory below it.
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

Review-fix scope is authorized by Alex through the parent agent. Runtime metrics remain evidence about existing C4 components and create no OKF records or new C4 types. Ordinary Markdown remains unchanged; the existing live Code measurements component owns browser interpretation. Source ownership and file-extension patterns remain language-independent; no future framework or cache is added.

Review fixes: metric side selectors now match only .face.left/.face.right; ghosts receive no data-metric attribute or tint variable. Building decoration, legend painting and guarded delayed history reads have named operations. Outlier groups hold the ComponentMetrics objects directly with the unchanged files >=10, measure > median and measure >=4*median predicate. Git history reuses sourceIndex.byFile and one accumulator per component; parsing, recording and output are separate. The details dispatcher delegates inspected-element rendering.
Focused evidence: 17 tests passed across code-metrics, source-index, inspect-details, web-theme, web-export and web-revisions (122 assertions). New count/window/co-change and threshold tests are parallel-safe and each owns its temporary Git root/in-memory minimum world. Chromium computed-style checks passed all metrics, hollow ghosts, facade URLs, three themes, None restoration, configurable window, co-change links/navigation, outlier details and delayed reads with at least two animation frames and an existing rendered map. The same browser regression fails against the recorded original PR head at a filled ghost. No browser page errors or architecture Markdown mutation.
Cold simplicity review (GPT-6.1 Sol, xhigh, task/diff/repository only) found no blockers or material simplifications. Implementer specification review matches the original AC1-AC6 scope: formulas/window, choices/themes, pairs/details, exact threshold, live/static boundary and existing documentation stay intact. Quality review traced browser entry -> measurement/history owners -> decoration/details; new tests detect derived wrong counts/thresholds, not wording. All five changed source/test files pass focused Biome with no complexity warnings; typecheck passes; render.ts is 482 lines. No camera/pattern-surface structure was changed. groma scan created no components and left git status --short groma/ empty; C#/Go/Java/Rust workers were unavailable and retained their prior scanner data. Full repository check is running.

Final verification: bun run check passed (Node: 16 pass; Bun: 778 pass, 51 skip, 0 fail, 2907 assertions across 147 files, 177.38 seconds). Repository Biome reports one pre-existing warning in execution-evidence.test.ts and two existing template-style infos; none is in this task’s changed files. All changed functions are at or below complexity 15 and files at or below 500 lines (largest: render.ts, 482). git diff --check passed.
Chromium validated all 12 metric/theme combinations, hollow draft faces, unchanged facade URL fills, None restoring normal styles, configurable window, co-change links and navigation, outlier details and requests after first rendered map frames. Static delivery produces no metric controls, legend, tint, outliers or metric requests. A separate close-zoom check confirms facade display remains enabled with the same URL fills. Original-head runs independently fail at filled ghosts and replaced facade URLs. Evidence: /private/tmp/pr123-fix-evidence/browser-result.json, browser-closezoom-result.json, browser-before.log, browser-before-facade.log and browser scripts.
tui-test at 200x60 verified the complete wrapped Outlier line on What and How tabs (tui-what.txt, tui-how.txt, tui-how.svg). Two combined close-zoom/navigation scratch runs missed the offscreen click target; visual close-zoom and fitted-map navigation checks were separated without changing product code or tests.
The final full-context complexity review (GPT-6.1 Sol, xhigh) found no blockers or material simplifications. Cold and final reviewers were read-only and separate. Existing documentation already states the restored ghost/facade semantics and unchanged metrics contract; no documentation behavior change was required. No caches, generic framework, compatibility or future behavior were added. No Groma files changed after scanning, so no architecture curation or extra architecture commit paths were needed. Scanner worker availability remains the same limitation as the 51 existing test skips.

Maintainability pass on review findings A to K (2026-10-11). Three decided behaviour corrections: (A) markOutliers in src/component-metrics.ts skips a measure whose container median is 0, so one relationship among unconnected siblings no longer marks anybody; the redundant 'greater than the median' clause is gone because a positive median makes it implied. (C) readCodeHistory reads the author address (%aE) instead of the committer address (%cE), so a hosting service that merges on its web page is not counted as a person; the Committers label stays. (D) git log runs with --relative, so a project below the Git top level gets paths that match its components' files. docs/viewers/web/index.md states the author rule and the zero-median rule.

Behaviour-preserving changes: (B) the metric legend and its lines are blocks again inside #legend, whose 'div' rule had turned them into flex rows and left the colour scale 0px wide. (E) the control's history window variable is historyWindow and its history state is codeHistory, so neither shadows a browser global. (F) the two scale end colours are defined once in src/viewers/web/metrics/control.ts; the gradient, the tint (through the shared mixColour), the outlier mark and the label ink derive from them. The three face rules win by specificity; only the label rule keeps !important and names the rule it beats. (G) the control exports metricsCss and src/viewers/web/page.ts includes it; no style element is injected at run time. Like the other live-only controls' CSS, the rules are now also present, unused, in the static page. (H) the delay is named afterNextPaint. (I) componentMetrics keeps one result per elements snapshot in a WeakMap, as source-index.ts does, so the terminal details pane no longer recomputes on every render. (K) the terminal details import sits in the file's project import group. The readCodeHistory comment now says that it runs git log.

(J) Verified, not changed: refresh() numbers each request and readHistory drops its result or error at every await once a newer request exists, so only the newest request clears the loading state. The server does not cancel a superseded git log; it finishes and its response is discarded. An answer for a newer map generation than the page shows is dropped and the legend keeps 'Reading code history…' until the world event triggers the next read.

Evidence from this pass. Tests: the two extended tests in test-bun/code-metrics.test.ts failed before the fixes (zero-median case returned ['lines of code']; the project below the Git top level returned all zeros; with --relative but %cE the two authors counted as 1) and pass after. Focused run: 55 pass, 0 fail across code-metrics, source-index, inspect-details, web-theme, web-export, web-revisions, web-page-inset, web-sharing, web-startup, web-shell, chrome, navigation, tui-source and work-folding. bun run typecheck passes. bunx biome lint: 1 warning and 2 infos in total, as before the pass, none in a changed file. Headless Chromium (Playwright script outside the repository, minimum fixture): colour scale 326x8px with three stacked lines (0px wide on the previous head), legend hidden on None, gradient between the two end colours, tints identical in light, dark and blueprint, None restores the theme colours, ghosts untouched, facade patterns unchanged, a selected tinted building keeps the label ink, the page stylesheet is the only style element with metric rules, the first read starts after two frames with the map drawn, superseded requests (slow answer, two changes before a paint, late failure) never reach the legend, and the published page has no metric element or request. Terminal: detailsLines printed the Outlier line for the ten-file fixture component on What and How and none for its siblings; tui-test was not run. bun src/cli.ts scan: created 0, refreshed 105, no change under groma/ (C#, Go, Java and Rust workers unavailable, saved data kept). The full bun run check was not run in this pass; the orchestrator runs it. test-bun/code-outline.test.ts fails about three runs in ten on an unmodified copy of the branch head as well: one concurrent test copies the shared fixture while another holds its .groma.lock.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fixed live metric tints so draft ghosts remain hollow and file-type facade patterns keep their meaning. Simplified the metrics control, Git aggregation, outlier grouping and details dispatcher without changing formulas, thresholds, timing, themes or static/Markdown exclusion. Added two parallel-safe domain regressions. Focused tests: 17 pass. Full check: Node 16 pass; Bun 778 pass, 51 existing skips, 0 fail. Chromium verified all metric/theme combinations, None, history window, details/navigation, original-head failures and static exclusion; tui-test verified both outlier detail tabs. Cold simplicity and full-context complexity reviews found no blockers. Scan produced no architecture changes. Created only the authorized local task commit; no push or publication.
<!-- SECTION:FINAL_SUMMARY:END -->
