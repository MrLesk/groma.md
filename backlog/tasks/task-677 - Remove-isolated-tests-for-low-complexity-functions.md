---
id: TASK-677
title: Remove isolated tests for low-complexity functions
status: Done
assignee:
  - '@codex'
created_date: '2026-11-22T18:29:00Z'
updated_date: '2026-11-22T18:42:00Z'
labels: []
dependencies: []
references:
  - test-bun/camera.test.ts
  - src/viewers/tui/projection-camera.ts
  - test-bun/building-port-attachment.test.ts
  - test-bun/chrome.test.ts
  - test-bun/file-diff.test.ts
  - test-bun/first-scan-curation.test.ts
  - test-bun/inspect-details.test.ts
  - test-bun/iso-map.test.ts
  - test-bun/large-world.test.ts
  - test-bun/npm-packaging.test.ts
  - test-bun/project-review.test.ts
  - test-bun/relationship-text.test.ts
  - test-bun/route-nudge.test.ts
  - test-bun/route-order.test.ts
  - test-bun/scanner-composition.test.ts
  - test-bun/scanner-settings.test.ts
  - test-bun/search.test.ts
  - test-bun/sheet-route.test.ts
  - test-bun/swift-scanner.test.ts
  - test-bun/tree.test.ts
  - test-bun/web-duplicates.test.ts
  - test-bun/web-embedding.test.ts
  - test-bun/web-flow-activation.test.ts
  - test-bun/web-frame.test.ts
  - test-bun/web-layer-mode.test.ts
  - test-bun/web-map-controls.test.ts
  - test-bun/web-selection.test.ts
  - test-bun/web-sheet-morph.test.ts
  - test-bun/web-shell.test.ts
  - test-bun/web-startup.test.ts
  - test-bun/web-stats.test.ts
  - test-bun/work-pins.test.ts
  - test-bun/work-selection.test.ts
  - test-bun/work-status-filter.test.ts
  - test-bun/work.test.ts
documentation:
  - AGENTS.md
modified_files:
  - test-bun/building-port-attachment.test.ts
  - test-bun/camera.test.ts
  - test-bun/chrome.test.ts
  - test-bun/file-diff.test.ts
  - test-bun/first-scan-curation.test.ts
  - test-bun/inspect-details.test.ts
  - test-bun/iso-map.test.ts
  - test-bun/large-world.test.ts
  - test-bun/npm-packaging.test.ts
  - test-bun/project-review.test.ts
  - test-bun/relationship-text.test.ts
  - test-bun/route-nudge.test.ts
  - test-bun/route-order.test.ts
  - test-bun/scanner-composition.test.ts
  - test-bun/scanner-settings.test.ts
  - test-bun/search.test.ts
  - test-bun/sheet-route.test.ts
  - test-bun/swift-scanner.test.ts
  - test-bun/tree.test.ts
  - test-bun/web-duplicates.test.ts
  - test-bun/web-embedding.test.ts
  - test-bun/web-flow-activation.test.ts
  - test-bun/web-frame.test.ts
  - test-bun/web-layer-mode.test.ts
  - test-bun/web-map-controls.test.ts
  - test-bun/web-selection.test.ts
  - test-bun/web-sheet-morph.test.ts
  - test-bun/web-shell.test.ts
  - test-bun/web-startup.test.ts
  - test-bun/web-stats.test.ts
  - test-bun/work-pins.test.ts
  - test-bun/work-selection.test.ts
  - test-bun/work-status-filter.test.ts
  - test-bun/work.test.ts
type: chore
ordinal: 711000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Apply the testing rule in AGENTS.md to the existing Groma suite. Use the production function as the unit of measurement so small test callbacks do not hide coverage of a complete user flow.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Dedicated single-function unit tests with a cccc cognitive score below six are removed unless the tested behavior depends on a regular expression.
- [x] #2 Tests of supported flows, regular-expression behavior, and functions outside the cutoff keep their coverage.
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
1. Inventory Node, Bun, and native scanner tests. Trace fixture helpers and measure the production functions with cccc.
2. Remove isolated checks for scores 0–5 and their unused test setup. Keep regex-dependent and supported flow coverage. Track each changed test file.
3. Compare every surviving Node and Bun test declaration with the base commit. Run the full repository check and review changed lines with Code Hygiene.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Measured the production sources with cccc 1.9.2. Reviewed Node and Bun test declarations, including conditional aliases, and the native C# scanner tests. Direct assertions on a helper qualify. Tests that run a complete scanner, compare scanner observations through the duplicate-detection pipeline, or drive viewer actions across steps keep their coverage. Regex-dependent tests such as Maven and Gradle parsing also stay. The cutoff includes scores 0 through 5 and excludes 6.

Compared all 181 tracked Node and Bun test files with commit 12f329c7. The removed cases covered 44 distinct functions. All 809 remaining test declarations have byte-for-byte identical bodies. Five files contained only removed cases. Two cases checked two simple helpers independently. The corner-routing test still checks that the order carried from one line is used on the next.

Measured functions by cognitive score

- 0 — `assignFixedPorts`, `duplicateGroups`, `isLoopbackWebHost`, `orbitPose`, `ownsDetails`, `pluginGroups`, `projectBounds`, `routeTouches`, `scrollOffset`, `surfaceLabelLayout`, `touchedElements`.
- 1 — `ArchitectureSearch.find`, `awaitsCuration`, `detailsScrollOffset`, `detailsTabAfterSelection`, `interpolatePose`, `listenForEmbeddedViews`, `nudgeRoutes`, `openWorkSelection`, `orderBuildingFans`, `sameSheet`, `scannerRecommendationCount`, `showsRelationshipText`, `toggleFlowActivation`, `toggleWorkSelection`, `windowsSwiftPackageRoot`, `workStatusFilters`.
- 2 — `LineRuns.crossings`, `detailsTabAfterWork`, `project`, `readMapControls`, `shortcut`.
- 3 — `platformPackageName`, `projectFileDiff`, `promotedPeer`, `scannerWarning`.
- 4 — `c4Counts`, `detailsTabs`, `formatScanReport`, `mapFrame`, `wheelAction`, `workView`.
- 5 — `flowReturn`, `tweenSheet`.

Validation used the versions declared in package.json, Bun 1.4.4 and Node 26.12.1. The first attempt exposed a missing tree-sitter-elixir package and an obsolete nested TypeScript development build. A frozen-lockfile install and moving that obsolete local copy aside restored the declared SDK. The full bun run check then passed. Node reported 26 passes. Bun reported 901 passes, 67 skips, and zero failures. Code Hygiene reported no findings on the 12 modified lines in the 29 surviving edited test files. git diff --check passed. The diff changes only test files and this task record.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Removed 57 isolated tests for 44 production functions scoring 0–5 and deleted five test files that became empty. Regex-dependent tests and supported flow coverage remain. All 809 remaining Node and Bun test declarations match the base commit byte for byte. The repository check passed with 927 tests passing, 67 skipped, and zero failures.
<!-- SECTION:FINAL_SUMMARY:END -->
