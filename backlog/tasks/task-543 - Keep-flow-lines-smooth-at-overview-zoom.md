---
id: TASK-543
title: Keep flow lines smooth at overview zoom
status: Done
assignee:
  - '@codex'
created_date: '2026-10-05 09:35'
updated_date: '2026-10-05 09:57'
labels: []
dependencies: []
references:
  - map
modified_files:
  - src/viewers/web/iso/painting/style.ts
type: bug
ordinal: 628000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Opening a flow at the high-level overview makes its animated lines flicker. Selecting Next shows smooth animation. Restore smooth route motion in the initial flow overview without changing flow selection or step navigation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Opening a flow at overview zoom shows continuous moving dashes without flicker.
- [x] #2 Next and step navigation retain the existing flow highlight and smooth line animation.
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
1. Reproduce actor -> first flow view in Chrome and the scaled Slidev iframe using live compositor frames. 2. In the existing map style, let the browser manage the parent camera layer while flow tracing is active; retain the dedicated animated route layer. Keep ordinary camera caching and all flow membership, geometry, timing, and step navigation unchanged. 3. Verify repeated first-flow openings, Next, return to overview, and animation frame timing in Chrome. Existing flow and camera coverage remains sufficient; add no decorative CSS/source-text tests. 4. Run bun run check and perform the implementer specification and quality reviews.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Confirmed Chrome is the reported browser; user also reports the issue in the Slidev talk and on other PCs. Current Slidev flow demo points to localhost:4801 and falls back to saved stills while that server is unavailable. Direct and actor-to-flow Chrome checks for Scan project source show steady requestAnimationFrame timing (about 120 Hz, no frames over 40 ms in sampled intervals). Investigating rendered dashes rather than changing flow state.

Reproduced through the real Slidev GromaFrame by temporarily proxying localhost:4801 to the existing localhost:4747 map, with no talk-file changes. Recording compositor frames after actor -> first flow step found 50 of 80 sampled frames missing the long line. Paused animation and forced screenshots mask the failure. Removing only route promotion did not fix it (24/40 missing); ordinary SVG strokes compensated by camera scale kept all 40/40 visible while retaining both promoted layers. This is presentation inside the existing Map painting component; OKF records and C4 element/relationship meaning remain unchanged. The fix depends only on drawing scale, not project, language, or flow identity.

Correction after repeated-transition verification: changing stroke rendering only refreshed the drawing temporarily; flicker returned after another actor-to-flow zoom (22/35 missing). Deferred cache promotion and promoting the SVG itself did not reliably fix it either. Letting the browser manage the parent camera layer only while data-tracing is set, while retaining the existing route layer, kept all 40/40 frames visible after a repeated opening zoom. No source changes had been made during these temporary browser A/B checks.

Final verification used a fresh createWebMapSession with scan:false on localhost:4801 so both HTML styles and browser code came from current source, with no injected browser overrides or changes to the talk. Repeating the actor -> first-flow zoom kept lines visible in all 50/50 captured compositor frames. Standalone Chrome Next focused relationship:10 then relationship:37 while preserving all four lit relationships. Clear focus returned to the overview with all four lines; Escape removed tracing and restored the normal transform cache. A settled second-step sample ran 145 frames in 1.2 seconds, with no frame over 40 ms. Before/after frame evidence and the screenshot are under /tmp/groma-flow-543. Full bun run check passed: 16 Node tests; 759 Bun tests passed, 48 skipped, 0 failures. The initial sandboxed check was stopped after process-lifecycle tests were denied ps; the full permitted rerun passed. Existing lint warnings remain unrelated. No groma files changed.

Implementer specification and quality reviews passed. Flow activation owns data-tracing; the existing map stylesheet overrides only the inline camera promotion hint while that state is active and retains the route surface promotion. A junior developer can find the rule beside the route-layer style and follow its scope from setLitRoutes. No new state, module, test, dependency, stored knowledge, or navigation behavior is introduced. Public behavior is restored, so no product contract update is needed. The two-line CSS change is below the substantial-change review threshold; no separate review agents are required. Other current edits in docs/viewers/web/index.md and src/viewers/web/chrome/empty.ts belong to TASK-544 and were left untouched.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Stopped first-flow line flicker in Chrome by allowing the browser to manage the parent camera layer while tracing is active, retaining the dedicated animated route layer. Verified in the live Slidev iframe with 50/50 visible line frames after the opening zoom; Next, overview return, and normal camera caching remain correct. bun run check passed. Restart running Groma processes and reload the browser to load the updated HTML styles.
<!-- SECTION:FINAL_SUMMARY:END -->
