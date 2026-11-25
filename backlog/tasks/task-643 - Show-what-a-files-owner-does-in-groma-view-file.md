---
id: TASK-643
title: Show what a file's owner does in groma view <file>
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
ordinal: 700000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`groma view <file>` answers which component owns a repository file: it prints the owner's id, kind, title and parent, the relationships that name that exact file, and the command for the owner's complete record (`fileAnswer` in src/plain-world.ts). It leaves out what the owner does. An agent that reaches a file through grep and asks the map about it learns a name, and needs a second command before it knows what the code is for, so it reads the source instead.

In a trial on 2026-11-02, five Claude Code agents (three Haiku 5.5, two Sonnet 5.5) worked real tasks in clones of Backlog.md and groma.md without being told about groma.md. None used a groma.md read command to understand the code; all of them searched with grep. On Backlog.md, `groma view src/board.ts` names `terminal-board  component  Terminal board` and its parent, but not the description the map already holds for it.

The element view (`groma view <id> --plain`) already prints `technology:` and `description:` lines. The file view should give the same facts about the owner, so one call answers both who owns a file and what that part is for.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `groma view <file>` prints the owner's description and technology when they are set, in the same form the element view uses (`description: ...` and `technology: ...`).
- [ ] #2 An owner without a description or technology prints no empty line or placeholder for it.
- [ ] #3 The rest of the file view is unchanged: the owner line, its parent, the file's incoming and outgoing relationships, paging, and the closing command for the owner's complete record.
- [ ] #4 Tests cover an owner with a description and technology and an owner with neither.
- [ ] #5 The inspect guide's row for a source file target mentions the owner's description and technology.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->
