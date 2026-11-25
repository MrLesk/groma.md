---
id: TASK-644
title: List the architecture a working-tree change touched with groma view --changed
status: To Do
assignee: []
created_date: '2026-11-02T16:18:00Z'
labels: []
dependencies: []
references:
  - src-cli
  - history-revisions
  - src-core
  - src/cli.ts
  - src/history/snapshots.ts
  - src/history/comparison.ts
  - src/plain-world.ts
  - src/source-coverage.ts
  - docs/agent-instructions/inspect.md
type: feature
ordinal: 701000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
When an agent finishes a change, nothing tells it which parts of the architecture the change touched, or that a component's record may no longer describe its code. In a trial on 2026-11-02, five Claude Code agents (three Haiku 5.5, two Sonnet 5.5) worked real tasks in clones of Backlog.md and groma.md, with prompts that never named groma.md. A Haiku agent and a Sonnet agent made the same change to groma.md's storage: reads no longer take the project lock. The Haiku happened to read the Markdown storage record, saw that it still said reads take the lock, and corrected it with `groma edit`. The Sonnet updated docs/ and left the record wrong.

People ask the same question when they review an agent's work in a terminal. The browser map answers it with its revision comparison (`from=` in the web map, `readComparison` in src/history/snapshots.ts); the CLI cannot print it.

`groma view --changed [revision]` prints that comparison as plain text, from a commit (HEAD when none is given) to the working tree. Changed files are the files Git reports as different from that commit, including untracked files it does not ignore. Relationship changes stay in the browser map for now.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `groma view --changed` compares HEAD with the working tree and `groma view --changed <revision>` compares that commit with the working tree; both print plain text, run no scanner and write no file.
- [ ] #2 Each added, modified or removed component prints once with its id, title, status and description, followed by its changed files and each file's status; unchanged components are not listed.
- [ ] #3 A component whose record changed while its files did not, for example after `groma edit`, is listed as modified.
- [ ] #4 Changed files that no component owns are listed after the components, each with the reason `groma view <file>` prints for it.
- [ ] #5 With no changes the command says so and exits 0; outside a Git repository, or with a revision Git cannot resolve, it prints one reason and exits 1.
- [ ] #6 The output pages through the existing list window (src/list-window.ts) and supports `--count`.
- [ ] #7 Tests cover a modified component, a record-only change, a new file without an owner and the no-change case, and the inspect guide documents the command.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->
