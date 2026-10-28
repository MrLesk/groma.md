---
id: TASK-635
title: Keep map highlight tests out of shared fixtures
status: Done
assignee:
  - '@codex'
created_date: '2026-10-28T01:40:00Z'
updated_date: '2026-10-28T02:05:00Z'
labels: []
dependencies: []
references:
  - test-bun/web-map-highlights.test.ts
  - test-bun/helpers.ts
modified_files:
  - test-bun/web-map-highlights.test.ts
ordinal: 703000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The full macOS AOT readiness check failed in a flow-record test because a five-second project lock had been copied into its temporary fixture. The map-highlight test reads the shared flows fixture directly while other parallel tests copy it. A deterministic reproduction on unchanged main ef21fb4 holds a source fixture read lock, copies the fixture and reproduces groma_busy after five seconds. Existing withFixture isolates reads; use it for this missed test entry point.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Map highlight tests load their architecture from an owned temporary fixture without creating a lock in shared source fixtures
- [x] #2 Existing flow and map-highlight assertions pass under the repository parallel settings without changing lock timeouts or test concurrency
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
Use the existing withFixture helper at web-map-highlights session entry instead of reading the shared fixture directory. Existing assertions already exercise highlights and flows; add no new semantic assertions or generic copying layer. The user-required readiness CI exposed the copied-lock failure and AGENTS requires independent temporary fixtures. Verify the shared source has no lock after these tests, run the affected flow/highlight group with the existing parallel settings, and run the full repository check. Keep product locking and test concurrency/timeouts unchanged.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Reproduced deterministically on unchanged main ef21fb4: holding a shared fixture read lock while withFixture copies it yields groma_busy after5015ms. web-map-highlights was the missed direct reader of flows; use the existing isolated read helper there. No production source, lock timeout, test assertion or concurrency flag changed. Focused flow/highlight/sharing/navigation group passes20tests/111assertions with --parallel=2 --max-concurrency1; shared flows and relationship-pairs sources have no lock afterward. Full required check running. Original macOS failure and targeted retry remain recorded; this fixes its concrete source-isolation cause rather than masking it.

Final local required check after the fixture isolation change: lint/types/Node pass;Bun905pass63skip28fail/996/133.29s, same missing-toolchain/procfs baseline. No source-fixture lock remains. Hosted full CI40616693010 on f22d5ff2e607ed5e8a2e4e68bdc254cbee4375a8 is queued; collect its outcome before completing this task. The one macOS retry on earlier Python source2f is still running; do not repeat it again unchanged.

Final hosted CI40616693010 on f22d5ff2e607ed5e8a2e4e68bdc254cbee4375a8 passes all three native OS jobs: Linux122580733993,macOS122580733701,Windows122580734066. This validates the corrected fixture source under the full repository check. Earlier source2f CI40614894278 also passes its single targeted macOS retry; retain the original copied-lock failure and deterministic unchanged-main reproduction as evidence of the race, not a reason to rely on retries. Final self specification/quality review: existing withFixture owns temporary files and cleanup; the test reads its world before cleanup, then exercises unchanged highlights assertions. No product lock behavior, concurrency, timeout or architecture data changed. All independent implementation/qualification work is now reviewable; broader shipping remains blocked on Blessed integration write access, approved package publication and pinned-compiler untrimmed retention, tracked separately.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Moved map-highlight fixture reads through the existing isolated helper, preventing parallel fixture copies from inheriting a live source lock. The baseline race was reproduced before the fix. Focused20tests/111assertions and full hosted CI on Linux/macOS/Windows pass. Product locking, timeouts and assertions remain unchanged; no new test layer or production behavior was introduced.
<!-- SECTION:FINAL_SUMMARY:END -->
