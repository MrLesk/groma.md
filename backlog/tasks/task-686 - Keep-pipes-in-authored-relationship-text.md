---
id: TASK-686
title: Keep pipes in authored relationship text
status: In Progress
assignee:
  - '@draarivpatel-ui'
created_date: '2026-11-25 01:18'
updated_date: '2026-11-25 01:36'
labels: []
dependencies: []
references:
  - src/relationship-storage.ts
  - test-bun/source-relationships.test.ts
documentation:
  - docs/component-markdown.md
modified_files:
  - test-bun/source-relationships.test.ts
  - src/relationship-storage.ts
type: bug
ordinal: 721000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Adding or editing an authored relationship can split its text at a literal pipe. The Markdown reader then takes the next cell as the technology, silently losing the rest of the description and the intended technology.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 When adding an authored relationship, the annotated architecture retains its complete description and technology when they contain literal pipes.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [x] #3 Public contracts or documentation are updated when behavior changes.
- [x] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Exercise relationship creation against the checked-in edit fixture. Description and technology are nonempty text in the component Markdown contract, but existing coverage did not check that a pipe could shift the technology into the wrong cell. Compare both fields after loading the saved architecture.
2. Escape bare pipes in both text cells in the shared relationship writer without changing endpoints or how the rows are read.
3. Run the focused regression before and after the fix, then run the repository checks with one test worker.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The original code truncated the description at the first pipe and read its remaining words as the technology. The fixture-backed regression reproduced this before the fix and passed after it. The shared writer escapes bare pipes without adding a second escape to existing Markdown. Biome lint, scrollbar lint, type checking, and all 28 Node tests passed. The single-worker Bun suite reported 952 passing, 67 skipped, and seven failures: six Java tests used JDK 21 and one Kotlin scanner test timed out. All eight Java scanner tests passed with JDK 27, including the six that first failed. The Kotlin timeout remains unresolved. Code Hygiene flagged no changed lines. The documented relationship contract and live architecture files are unchanged.
<!-- SECTION:NOTES:END -->
