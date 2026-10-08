---
id: TASK-566
title: 'Report boundary violations, unexplained parts and coverage holes in groma lint'
status: To Do
assignee: []
created_date: '2026-10-07 23:16'
updated_date: '2026-10-08 15:31'
labels:
  - intermediate
dependencies: []
references:
  - src-architecture-findings
  - src-lint-command
  - review-control
  - src-core
  - src-architecture-model
  - repository-listing
  - scanner-registry
  - relationship-markdown
  - src/source-coverage.ts
type: feature
ordinal: 6
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
People asked for more ways to see when an architecture is bad. Three checks that work from the Markdown alone, so they also run where no scanner is installed, such as the pull request comparison. Findings stay review questions like the duplicated-logic finding: they extend the existing finding type, they are never written to the Markdown, and they never guess from names or keywords.

A boundary violation: a relationship between components of different containers whose mechanism is an in-process call (a derived row, or an authored row whose technology names a language call), or a network mechanism between components of the same container. A container is a runtime, not a folder. An unexplained part: a component with neither description nor overview, or parked under the system while its siblings have containers. A coverage hole: repository files no scanner owns.

Build on src/architecture-findings.ts, src/lint-command.ts, the Project review panel (src/viewers/web/review/, src/viewers/web/duplicates/), src/source-coverage.ts, src/source-index.ts and src/relationship-storage.ts.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 groma lint reports a boundary violation for every relationship whose endpoints sit in different containers while its mechanism is an in-process call, and for a network mechanism between components of one container. Each finding names the two components, their containers and the mechanism.
- [ ] #2 groma lint reports an unexplained part for a component with neither description nor overview, or whose parent is a system while sibling components have containers, once at least half of the components carry a description. Below that, it prints one count of unexplained components instead of a list.
- [ ] #3 groma lint reports coverage holes: repository files no scanner owns, grouped by extension with the share of unowned files per extension, and files hidden by an exclusion pattern listed separately with the pattern that hides them.
- [ ] #4 The three kinds extend the existing finding type, show in the web map's Project review panel beside Potential duplicates, and clicking one selects the components involved on the map.
- [ ] #5 Each finding has a stable id that survives unrelated edits, and groma lint --json prints the findings as JSON. The exit code stays 1 when any finding exists, and the duplicated-logic check is unchanged.
- [ ] #6 The lint documentation and the agent guides describe the three finding kinds and what each one asks the reader to check.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->
