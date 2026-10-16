---
id: TASK-613
title: Place connected containers near their component endpoints
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-16 06:03'
updated_date: '2026-10-16 06:19'
labels: []
dependencies: []
references:
  - src/sheet/place.ts
  - src/sheet/pack.ts
  - src/sheet/pack-forces.ts
  - src/sheet/pack-paths.ts
  - src/sheet/compose.ts
modified_files:
  - test-bun/sheet-locality.test.ts
  - src/sheet/place.ts
  - src/sheet/pack.ts
  - src/sheet/pack-forces.ts
  - src/sheet/pack-paths.ts
  - test-bun/pack-forces.test.ts
  - src/sheet/compose.ts
  - docs/product-model.md
type: bug
ordinal: 673000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The map spreads separate workers around a large application even when their connections land in one local region. Review confirmed that lifting relationships discards the participating component positions. Keep this placement rule in the shared sheet, independent of project names, programming languages and scanner implementations.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Sibling containers connected to nearby components of another container are placed together near that component region, including the approved three-worker map.
- [x] #2 Placement uses the recorded architecture graph and preserves C4 ownership, authored groups, clear spacing, connection capacity, deterministic output and world immutability.
- [x] #3 Scanner evidence and plugin contracts are unchanged; no architecture or placement decision branches on a scanner identity or implementation.
- [ ] #4 The PR includes the task record and an updated rendered map for human review.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [x] #2 Relevant checks pass and changes remain task-scoped.
- [x] #3 Public contracts or documentation are updated when behavior changes.
- [x] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Preserve the local positions of actual relationship endpoints when lifting links between sibling subtrees; use those positions for candidate placement, path costs and force alignment. Keep the change in the shared sheet with no scanner-specific interpretation or stored metadata.
2. Preserve endpoint locality in the final flow composition. Apply its entry/mediator/core columns only to a recorded flow with an intermediate container, rather than treating independent fan-out leaves as a chain.
3. Coverage: the user-approved rule is that siblings serving one local region stay near that region. The reproduced wrong result is workers spread around a large parent because leaf endpoints are discarded. Existing sheet tests cover spacing, determinism, immutability and flow columns, but not this locality. Add one minimum synthetic architecture with a large host, nearby connection endpoints and three separate helpers, including an actor entry to exercise final composition; prove the locality assertion fails before the fix. Extend only if a supported failure remains.
4. Run focused sheet tests, inspect the approved project map, perform one cold simplicity review, and run bun run check. Perform specification and quality reviews myself, then one full-context complexity review as required by AGENTS.md.
5. Verify the shared TUI flow with tui-test, capture and open a static web map for review, include only task-owned source and architecture changes, then create and attach the PR.
OKF/C4: preserve the existing readable Markdown concepts and links and the true container/component ownership. Endpoint coordinates are temporary shared-sheet geometry, not new metadata, architecture elements or ownership. This rule uses only recorded relationships and works independently of scanner or language; absent relationship evidence remains absent.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The locality regression failed before the fix because a helper was far from its source region. Its initial same-edge envelope assertion was stricter than the approved rule: adjacent edges around a nearby corner can also satisfy locality. Replaced that assertion with distance to the actual region, measured against the region and helper sizes. All three workers on the approved map now occupy neighboring slots above Language analysis.

Cold simplicity review passed with no blocking or material findings. Applied its optional test simplification: resolve every expected helper explicitly so a missing helper cannot silently shorten the locality check. Focused checks passed 42 tests; the first full bun run check passed lint, TypeScript, Node tests and 794 Bun tests (54 skipped because optional scanner runtimes are absent). No scanner contracts or architecture records changed.

Specification review: the approved project map places Rust, C# and Go in neighboring slots above Language analysis; all retained source and C4 ownership remains unchanged. The generic regression passes after the change and the final assertion fails against the original sheet code in an isolated temporary baseline. Existing tests verify spacing, route capacity, deterministic output and immutable architecture. Quality review: traced placeWorld -> lifted endpoint offsets -> grow/path scoring -> balance -> final composition -> routing; responsibilities and centre-relative offsets are explicit, all changed files stay below 500 lines, lint reports no new complexity warnings, and no scanner identity is interpreted. The second full bun run check passed (794 Bun tests, 54 optional-runtime skips), plus Node tests, lint and types. tui-test verified the root worker row at 120x36 and 200x60, details, container drill-down, arrow navigation and returning to root. Actual web painters generated overview.png and workers.png under /private/tmp/groma-613-review; static export is served locally on port 4391. No scanner was run, no Groma-owned architecture files changed, and existing shared-sheet components own all modified source files.

Final full-context complexity review passed with no blockers or material simplification recommendations. After rebasing onto current origin/main, bun run check passed again: lint, TypeScript, Node tests and 875 Bun tests, with 62 existing optional-runtime skips. Refreshed static export and the overview/worker images from that final branch. Implementation is ready for Alex to review; the task stays In Progress until that human review.
<!-- SECTION:NOTES:END -->
