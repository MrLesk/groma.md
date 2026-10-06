---
id: TASK-553
title: Share source ownership lookups and map task file references
status: Done
assignee:
  - '@codex'
created_date: '2026-10-06 09:49'
updated_date: '2026-10-06 10:00'
labels: []
dependencies: []
references:
  - src-architecture-model
  - src-work-pins
  - src-core
  - relationship-markdown
  - task-diff-control
  - scan-evidence
  - src-lint-command
modified_files:
  - features/work-summary.feature
  - src/source-index.ts
  - src/work/pins.ts
  - src/source-relationships.ts
  - src/relation.ts
  - src/relationship-inference.ts
  - src/relationship-storage.ts
  - src/lint-command.ts
  - src/plain-world.ts
  - src/viewers/web/task-diff/view.ts
  - test-bun/work-pins.test.ts
  - test-bun/source-index.test.ts
  - docs/agent-instructions/backlog.md
  - AGENTS.md
  - docs/product-model.md
  - docs/viewers/web/index.md
  - docs/viewers/tui/index.md
  - CONTRIBUTING.md
  - groma/systems/groma-md/containers/cli/components/relationship-markdown.md
  - groma/systems/groma-md/components/source-index.md
  - groma/systems/groma-md/containers/cli/components/source-index.md
  - groma/systems/groma-md/containers/cli/components/src-architecture-model.md
ordinal: 637000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Reuse a source ownership index for each loaded architecture snapshot across current ownership queries. Match Backlog References by exact element ID or repository-relative source file, alongside actual modified files. Keep filesystem loading and refresh in the current delivery layer and simplify redundant agent tracking guidance.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Repeated queries reuse the ownership index for the same element snapshot; replacement and historical snapshots resolve their own current owners without filesystem work in the index.
- [x] #2 Current ownership queries in relationship projection and authoring, lint, CLI file inspection, and task matching use the shared index; mutable scanner reconciliation retains its own changing map.
- [x] #3 Tasks attach through modified source files and References containing exact element IDs or exact source paths. Results are unique and newest mapped modified files retain pin priority; unmatched references remain context.
- [x] #4 Web task source references navigate to the owning element, while modified-file rows retain their diff behavior.
- [x] #5 Agent guidance keeps planning References and immediate modified-file tracking, without requiring a duplicate component reference for every source change.
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
1. Describe planned source-reference work in the work-summary scenario.
2. Keep the pure source ownership index in Architecture model. Cache by loaded elements-array identity with weak retention. Derive it from existing IDs and groma.code.file; add no OKF metadata, C4 element, persistence interface, IO, or path normalization.
3. Reuse it for loaded relationship projection/storage/authoring/inference, lint, CLI file inspection, task matching and web reference navigation. Keep the mutable scanner map in reconciliation.
4. Preserve task pin order: newest mapped modified file first, then exact ID/source References, each element once. Keep source reference labels and diff behavior distinct.
5. Update agent, contributor and product guidance; combine the new source file into its existing Architecture model owner.
6. Tests: extend existing pin/group tests because planning source references were unmapped; detect missing planned links, duplicates, wrong priority and accidental URL matching. Add focused index tests to detect rebuilding, stale ownership across snapshots and loss of the documented single-owner constraint (allow several references within one owner; reject two owners). Existing relationship, lint and CLI tests verify the refactor. Browser clicks verify owner navigation versus file diffs; tui-test verifies shared map matching.
7. Run focused checks, one cold simplicity review, full repository check, implementer specification/quality reviews, and one full-context review. Finalize and commit/push only this task.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementation: one 41-line source-index module replaces independent loaded-ownership maps. File loading and watch replacement remain in existing delivery code; source index performs no IO. A new elements array receives a new index, while task-only updates reuse it. The return API and exposed file map are read-only in TypeScript.

Verification:
- Focused relationship, lint, index and task tests: 21 passed.
- Final bun run check passed: 16 Node tests; 773 Bun passed, 51 existing skips, 0 failures. Existing lint messages are in unchanged files; no new complexity warnings.
- Browser fixture: reference-only TASK-1 has a map pin; selecting src/orders.ts navigates to component=orders. In TASK-2 the same path under Modified files opens its +2 line working-tree diff. The URL remains plain context.
- tui-test fixture: reference-only TASK-1 marks the collapsed Api map and selecting the task opens the Orders component scope. Screenshot: /tmp/groma-task-553-tui.svg.
- git diff --check passed. All changed source/test files are below 500 lines. Two scans after curation created zero components.

Reviews:
- Cold simplicity review passed without changes; retained file-first relationship projection/authoring precedence.
- Implementer specification review tied AC1 to snapshot tests, AC2 to ownership consumers and integration checks, AC3 to pin/group tests and both viewers, AC4 to browser clicks, and AC5 to guidance review.
- Quality review tightened an assertion to require the exact owner and made the returned API read-only. Current loading flows replace ownership snapshots; mutable scanner reconciliation stays separate.
- Full-context complexity review passed and recommends keeping the approach. One non-blocking follow-up: an extensionless filename equal to an element ID has ambiguous relationship endpoint precedence. Storage previously depended on element order and now resolves IDs first; projection/authoring retain file-first semantics. The broader ambiguity predates this task and is outside its approved example; no new ambiguity rules or follow-up task were added.

Architecture curation: scanner-created source-index was moved under cli and combined into src-architecture-model. Only its owner document and the task-caused relationship-markdown scanner update belong to this task. Unrelated assets and TASK-532 remain untouched.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Shared one source ownership index per loaded snapshot across existing consumers. Tasks now attach through source paths in References as well as modified files and exact IDs; web references open owners and modified files still open diffs. Guidance removes duplicate component-reference work. Full checks, browser/TUI verification and both simplicity reviews passed. Filesystem delivery stays separate; no persistence abstraction added.
<!-- SECTION:FINAL_SUMMARY:END -->
