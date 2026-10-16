---
id: TASK-613
title: Place connected containers near their component endpoints
status: Done
assignee:
  - '@codex'
created_date: '2026-10-16 06:03'
updated_date: '2026-10-16 14:24'
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
- [x] #4 The PR includes the task record and an updated rendered map for human review.
- [x] #5 Remove the reproduced dense-graph placement slowdown while preserving endpoint-aware placement, verified with comparative timings and complete placement comparisons.
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
1. Preserve the local positions of actual relationship endpoints when lifting links between sibling subtrees; use those positions for candidate placement, path costs and force alignment. Keep the change in the shared sheet with no scanner-specific interpretation or stored metadata.
2. Preserve endpoint locality in the final flow composition. Apply its entry/mediator/core columns only to a recorded flow with an intermediate container, rather than treating independent fan-out leaves as a chain.
3. Coverage: the user-approved rule is that siblings serving one local region stay near that region. The reproduced wrong result is workers spread around a large parent because leaf endpoints are discarded. Existing sheet tests cover spacing, determinism, immutability and flow columns, but not this locality. Add one minimum synthetic architecture with a large host, nearby connection endpoints and three separate helpers, including an actor entry to exercise final composition; prove the locality assertion fails before the fix.
4. Run focused sheet tests, inspect the approved project map, perform one cold simplicity review, and run bun run check. Perform specification and quality reviews myself, then one full-context complexity review as required by AGENTS.md.
5. Verify the shared TUI flow with tui-test, capture and open a static web map for review, include only task-owned source and architecture changes, then create and attach the PR.
6. Preserve endpoint-aware placement while reducing repeated calculation: skip duplicate clamped candidates in first-seen order, stop scoring when the nonnegative partial cost cannot improve the best candidate, and index rectangles with numeric buckets that yield each entry once. Measure the original main algorithm, the unoptimized PR and the optimized version on the reported dense graphs. Compare complete placements against the saved unoptimized PR for the same synthetic worlds, fixtures and project model; rerun focused and repository checks and update PR #160. No new timing test is needed: existing tests cover locality/spacing/routing, while exact comparisons and comparative measurements verify this behavior-preserving reduction without unstable clock assertions.

OKF/C4: preserve the existing readable Markdown concepts and links and the true container/component ownership. Endpoint coordinates are temporary shared-sheet geometry, not new metadata, architecture elements or ownership. This rule uses only recorded relationships and works independently of scanner or language; absent relationship evidence remains absent.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The locality regression failed before the fix because a helper was far from its source region. Its initial same-edge envelope assertion was stricter than the approved rule: adjacent edges around a nearby corner can also satisfy locality. Replaced that assertion with distance to the actual region, measured against the region and helper sizes. All three workers on the approved map now occupy neighboring slots above Language analysis.

Cold simplicity review passed with no blocking or material findings. Applied its optional test simplification: resolve every expected helper explicitly so a missing helper cannot silently shorten the locality check. Focused checks passed 42 tests; the first full bun run check passed lint, TypeScript, Node tests and 794 Bun tests (54 skipped because optional scanner runtimes are absent). No scanner contracts or architecture records changed.

Specification review: the approved project map places Rust, C# and Go in neighboring slots above Language analysis; all retained source and C4 ownership remains unchanged. The generic regression passes after the change and the final assertion fails against the original sheet code in an isolated temporary baseline. Existing tests verify spacing, route capacity, deterministic output and immutable architecture. Quality review: traced placeWorld -> lifted endpoint offsets -> grow/path scoring -> balance -> final composition -> routing; responsibilities and centre-relative offsets are explicit, all changed files stay below 500 lines, lint reports no new complexity warnings, and no scanner identity is interpreted. The second full bun run check passed (794 Bun tests, 54 optional-runtime skips), plus Node tests, lint and types. tui-test verified the root worker row at 120x36 and 200x60, details, container drill-down, arrow navigation and returning to root. Actual web painters generated overview.png and workers.png under /private/tmp/groma-613-review; static export is served locally on port 4391. No scanner was run, no Groma-owned architecture files changed, and existing shared-sheet components own all modified source files.

Final full-context complexity review passed with no blockers or material simplification recommendations. After rebasing onto current origin/main, bun run check passed again: lint, TypeScript, Node tests and 875 Bun tests, with 62 existing optional-runtime skips. Refreshed static export and the overview/worker images from that final branch. Implementation is ready for Alex to review; the task stays In Progress until that human review.

PR created and attached to the Codex chat: https://github.com/MrLesk/groma.md/pull/160. Verified the PR contains exactly this task record, five shared-sheet source files, the relevant product documentation and two test files. The PR embeds the updated worker map at https://github.com/user-attachments/assets/9d97eec6-dff3-4f27-a505-9b95ba1165cc. All acceptance criteria and Definition of Done items have evidence; status remains In Progress pending Alex reviewing the rendered map.

The user requested retaining good placement and performance after the fresh review reproduced a dense-graph slowdown. That review found no blocking correctness defect across 200 synthetic graphs and four fixtures, and no scanner/language-specific assumptions. The optimization remains temporary shared-sheet calculation, with no OKF/C4 or scanner-contract changes.

Candidate deduplication alone reduced the 100-node complete graph from roughly 3 seconds to roughly 0.5 seconds, but the old placement was around 0.19 seconds. Continuing within the approved performance scope: use distance and bend cost as a nonnegative lower bound to reject candidates that cannot improve the current best, before querying obstacle paths. Preserve candidate order and the original full-score arithmetic.

Exact placement comparison passed for the same 200 synthetic worlds and the approved project model. The lower-bound pruning preserves the original arithmetic and candidate order. CPU profiling showed that spatial-bucket queries dominate the remaining dense-graph cost. Reuse the numeric nested-map pattern already present in pack-forces.ts to avoid constructing a string key for every bucket lookup; this changes only indexing, not which entries are visited or their order.

Numeric bucket indexing reduced the complete 100-node graph to about 275 ms (old main about 171 ms in the same run). Profile-guided final reduction: yield each indexed entry once from the first bucket shared with the query. The existing consumers already ignore repeated identities or combine identical path bits, so removing repeated bucket visits preserves results and first-occurrence order. Verify complete placement equality again after this change.

After numeric bucket indexing, the separate distance-bound pass had no meaningful timing benefit. Removed it and its extra methods. The final scoring keeps only exact full-cost prefix pruning: because every remaining term is nonnegative, a candidate already matching or exceeding the best cannot win. Numeric candidate coordinates avoid string keys. Bucket queries yield an entry only at the coordinate-wise maximum of its starting bucket and the query starting bucket, preserving first occurrence and avoiding duplicate visits.

Final performance verification: the 100-component complete graph (4,950 connections) has a median placement time of 225.88 ms, down from about 2,985 ms for the unoptimized PR; original main is 179.66 ms in the same comparison. Medians for 50/75 components are 39.84/107.85 ms, against original main 34.17/84.55 ms. The large fixture improves from 45.02 to 37.68 ms. Complete placements and routes match the saved unoptimized PR for 200 seeded synthetic worlds, four fixtures and the approved project model; the rendered worker image is byte-identical. All 42 focused tests pass. Final bun run check passes lint, types, Node tests and 875 Bun tests, with 62 existing optional-runtime skips.

Targeted re-review of the original performance finding passes with no findings. The reviewer independently checked 3,000 bucket queries against 300 rectangles, including negative and fractional coordinates and exact boundaries, with no missing or duplicate overlaps. Implementer specification re-review confirms AC5 while preserving AC1-4. Quality re-review traced candidate generation -> clamp/deduplication -> nonnegative cost pruning -> unique bucket queries; first-candidate tie order and full-score arithmetic are preserved. No scanner, metadata, C4 boundary or product behavior changes were added by this optimization; no new complexity warnings or files over 500 lines. No groma/ files changed. Refreshed the review export and map image from this revision.

Alex accepted proceeding on 2026-10-16 and explicitly authorized merging PR #160 once Codex review approves, fixing relevant review findings first. All acceptance criteria and Definition of Done items already have verification evidence. Marking the implementation Done records that human acceptance; GitHub merge remains conditional on successful Codex review and CI for the final PR head.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Shared-sheet placement retains actual relationship endpoint positions through growth, path costs, alignment and final flow composition. Rust, C# and Go workers now occupy neighboring slots above Language analysis. Scanner contracts, C4 ownership and stored architecture metadata are unchanged. Candidate deduplication, exact cost pruning and unique numeric bucket queries preserve those placements while reducing the reproduced 100-component dense case from about 3 seconds to 226 ms (original main about 180 ms). Complete placement comparisons, focused tests, full repository checks and the targeted performance review pass. Alex accepted proceeding to merge; PR #160 awaits successful Codex review and CI on its final head.
<!-- SECTION:FINAL_SUMMARY:END -->
