---
id: TASK-635
title: Keep map highlight tests out of shared fixtures
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-28T01:40:00Z'
updated_date: '2026-10-28T01:42:00Z'
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
- [ ] #1 Map highlight tests load their architecture from an owned temporary fixture without creating a lock in shared source fixtures
- [ ] #2 Existing flow and map-highlight assertions pass under the repository parallel settings without changing lock timeouts or test concurrency
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
Use the existing withFixture helper at web-map-highlights session entry instead of reading the shared fixture directory. Existing assertions already exercise highlights and flows; add no new semantic assertions or generic copying layer. The user-required readiness CI exposed the copied-lock failure and AGENTS requires independent temporary fixtures. Verify the shared source has no lock after these tests, run the affected flow/highlight group with the existing parallel settings, and run the full repository check. Keep product locking and test concurrency/timeouts unchanged.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Reproduced deterministically on unchanged main ef21fb4: holding a shared fixture read lock while withFixture copies it yields groma_busy after5015ms. web-map-highlights was the missed direct reader of flows; use the existing isolated read helper there. No production source, lock timeout, test assertion or concurrency flag changed. Focused flow/highlight/sharing/navigation group passes20tests/111assertions with --parallel=2 --max-concurrency1; shared flows and relationship-pairs sources have no lock afterward. Full required check running. Original macOS failure and targeted retry remain recorded; this fixes its concrete source-isolation cause rather than masking it.
<!-- SECTION:NOTES:END -->
