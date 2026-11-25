---
id: TASK-645
title: Say none recorded for missing relationships in plain views
status: To Do
assignee: []
created_date: '2026-11-02T16:18:00Z'
labels: []
dependencies: []
references:
  - src-core
  - src/plain-world.ts
  - docs/agent-instructions/inspect.md
type: enhancement
ordinal: 702000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plain views print `none` under a relationship heading when the map stores no relationship there (`plainBlock` in src/plain-world.ts). groma.md stores only authored rows, named callbacks and HTTP calls with a certain endpoint match, not every call, so `none` states something the map cannot know. In a trial on 2026-11-02, five Claude Code agents (three Haiku 5.5, two Sonnet 5.5) worked real tasks in clones of Backlog.md and groma.md, with prompts that never named groma.md. On Backlog.md, `groma view src/board.ts` printed `none` for incoming relationships, although src/ui/board.ts, src/ui/unified-view.ts and src/readme.ts import that file. In an earlier review on 2026-10-08, coding agents said they read `none` as "nothing depends on this", and that one wrong `none` costs the map their trust for the rest of the session.

This task changes only that wording. The other gaps in TASK-573 (undescribed elements, derived rows, coverage and the first-scan note in `groma view`) stay there.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every plain view prints `none recorded` where it printed `none` under a relationship heading: Relationships, Incoming relationships and Outgoing relationships.
- [ ] #2 Other empty sections, such as Children, Flows and Items, keep printing `none`.
- [ ] #3 Paging is unchanged: an empty relationship section still prints on the page that holds the item after it.
- [ ] #4 Tests that expected `none` under a relationship heading expect `none recorded`, and a test covers a source file with no recorded relationships.
- [ ] #5 The inspect guide says that `none recorded` means the map stores no such relationship, not that the code has none.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->
