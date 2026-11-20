---
id: TASK-642
title: Keep high-zoom map hovers visible without Safari pan stutter
status: Done
assignee:
  - '@codex'
created_date: '2026-10-28T21:36:00Z'
updated_date: '2026-10-28T21:46:00Z'
labels: []
dependencies: []
references:
  - 'https://github.com/MrLesk/groma.md/issues/185'
  - src/viewers/web/iso/camera/layer.ts
  - src/viewers/web/iso/painting/style.ts
  - test-bun/web-camera-layer.test.ts
documentation:
  - docs/viewers/web/index.md
modified_files:
  - test-bun/web-camera-layer.test.ts
  - src/viewers/web/iso/camera/layer.ts
priority: high
type: bug
ordinal: 700000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
GitHub issue #185 reports blank regions after hovering the 2D map at roughly 400% zoom in GPU-rendered Chrome and Edge. Disabling the forced camera layer fixes the reporter reproduction. Permanent camera promotion also prevents a measured Safari pan-start stutter, so the fix must preserve that behavior.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 At high zoom, hovering buildings and routes keeps the 2D map drawn in Chromium without forced camera caching at rest.
- [x] #2 Safari retains smooth pan starts after idle and after zoom, with sharp rendering after zoom settles.
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
1. Keep the fix in createCameraLayer. Chromium is identified by its Chrome/Chromium user-agent token, including Edge; iOS browser tokens such as CriOS still use WebKit and keep the existing cache. The compositor defect has no feature-support test. Preserve all non-Chromium behavior, especially Safari promotion, identity transform, zoom-out drawing and post-zoom rebuild. No architecture or stored knowledge changes are required.
2. Extend existing camera tests with browser inputs and the full initial-draw, pan, zoom, settle and next-pan lifecycle. Authority: issue #185 and the explicit Safari no-stutter requirement. Wrong results: Chromium is promoted again after settling; Safari releases its cache between gestures or stops rebuilding sharp after zoom. Existing tests check draw timing only and cannot catch these cache transitions. Use independent layers and painter callbacks, with no shared mutable browser state.
3. Validate a static map in native Chrome and Safari, including high-zoom hovering and pan starts after idle/zoom. Run focused tests and bun run check with the declared runtime versions. Review the final diff, record evidence and limitations, then commit and push a task-only PR.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementation and review: createCameraLayer selects auto promotion for Chrome/Chromium tokens (including desktop Edge). Its existing transform, draw/settle lifecycle and event flow stay in the same owner. Only promoted layers request the post-zoom rebuild, so Chromium cannot be promoted again by the next animation frame. Safari and iOS WebKit retain the prior promotion and zoom rebuild. The implementation has no new modules, dependencies, browser registry, version gates or architecture concepts. Existing OKF/C4 and navigation semantics are unchanged.
Regression evidence: the new Chrome and Edge cases fail against the original camera implementation (transform instead of auto); the existing and Safari cases pass. With the fix all eight focused tests pass. Cache-change capture detects a Safari release during pan and preserves the auto/transform rebuild after zoom. Each test owns its layer and browser input.
Browser evidence: local static exports of the same 1-system, 5-container, 116-component map were opened in native Chrome and Safari. Chrome remained drawn after 18 building/route hover targets at 596%, then repeated pan/fit/zoom and more hovering at 642%; computed camera will-change remained auto. The original Windows GPU blanking was not independently reproduced on this macOS host. Chrome CDP pan sampling measured roughly 83 ms on both baseline and fixed exports, so these samples show no new difference and are not evidence of absolute smoothness.
Safari evidence: native wheel gestures on the baseline 2D overview recorded three completed pan-start samples of 18 ms. The fixed overview recorded four 17 ms samples; after a settled 596% zoom, 25/17/17 ms; after zoom-out and returning to the isometric overview, 27/17/17 ms. The sampler measures the worst animation-frame interval in the first 150 ms after a wheel gesture. Camera promotion remained transform with no between-gesture changes, and the settled 596% view was visually sharp. Initial native-control timeouts were resolved by opening the test tab through Safari's toolbar. The temporary Safari tab was closed afterward.
Validation: bun run check passed with Bun 1.4.4 (38afee6c8), Node 26.12.1 and TypeScript 7.1.0-beta: 26 Node tests, 945 Bun pass, 64 Bun skipped, 0 failures. Two existing lint warnings and two existing information notices are outside the changed files. An initial reused node_modules tree caused unrelated TypeScript scanner errors; an isolated frozen-lockfile install resolved them without repository dependency changes. git diff --check passes; groma/ has no changes.
Specification and quality review passed. The tested result satisfies the two acceptance criteria within the available browser environment. A junior developer can follow the browser-specific decision and existing lifecycle in layer.ts, with its regression cases in the existing camera test file. No public behavior or Markdown contract change requires a documentation revision. This is a small rendering fix, so the implementer performed the simplicity review without separate agents. No blocking finding remains.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fixed #185 by letting Chromium manage the camera layer without a forced cache. Safari keeps its persistent cache and post-zoom rebuild. Regression tests fail on the original Chromium policy and pass with the fix. Native Chrome high-zoom hover checks, Safari pan/zoom comparisons and the full repository check pass. The reporter's Windows GPU environment was not available; validation details and timings are in Implementation Notes.
<!-- SECTION:FINAL_SUMMARY:END -->
