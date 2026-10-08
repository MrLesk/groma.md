---
id: TASK-572
title: 'View several files at once, grouped by owner'
status: To Do
assignee: []
created_date: '2026-10-08 15:14'
updated_date: '2026-10-08 15:31'
labels: []
dependencies:
  - TASK-571
references:
  - src-core
  - src-cli
  - src-architecture-model
  - src/plain-world.ts
  - src/source-coverage.ts
  - docs/agent-instructions/inspect.md
type: enhancement
ordinal: 649000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`groma view <target>` accepts exactly one target. For an exact repository-relative source file it prints the owning component (id, kind, title, parent), the relationships in and out that name that exact file, and the command for the owner's complete record (src/plain-world.ts, src/cli.ts). A repository file without an owner prints the reason from `missingOwnerReason` (src/source-coverage.ts), such as `no owner: README.md; no enabled scanner reads it`.

Three everyday jobs start from a list of files: reviewing a pull request (`git diff --name-only main...`), checking where a task's changes landed, and resuming work on a branch. In a review on 2026-10-08, five coding agents (Claude Fable 5.1, Claude Opus 5.5, GPT-6 Astra, GPT-6.1 Sol and Grok 4.7) all asked for the same thing: one call per file is too many, so they skip groma.md and grep instead. The single-file view also hides relationships that sit on the owner's other files: `src/viewers/web/server.ts` shows one row in and one row out, while its owner `web-server` has more rows on `src/viewers/web/map-session.ts`.

Add a batch form of `groma view <target...> --plain`. Every existing single-target form stays as it is. Batch mode starts with two or more targets, or with `-`, which reads targets from stdin, one per line.
- A file selects its owning component. An element id selects that element.
- Each selected element appears once: id, kind, title, parent, group and description. A component also shows which of the given files it owns and how many other files it owns.
- Then the relationships between the selected elements, then the relationships crossing the selection's boundary, incoming and outgoing. Use all files of each selected component, and lift stored endpoints to the selected elements the way the plain views lift them today.
- A repository file without an owner is listed with its existing reason.
- Every resolvable target prints. The command exits 1 when any target is neither a stored id nor a repository file.
- The output pages through the shared list window (TASK-571). After stdin input, the footer says to repeat the same input with `--skip <n>`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 groma view <target...> --plain with two or more targets, or with - reading targets from stdin one per line, prints the batch view, so git diff --name-only main... | groma view - --plain works; every single-target form is unchanged.
- [ ] #2 Each selected element appears once with id, kind, title, parent, group and description, and a component also shows which given files it owns and how many other files it owns.
- [ ] #3 The batch view lists the relationships among the selected elements, then the incoming and outgoing relationships crossing the selection's boundary, taken from all files of each selected component.
- [ ] #4 A repository file without an owner is listed with its existing reason; every resolvable target prints, and the command exits 1 when a target is neither a stored id nor a repository file.
- [ ] #5 The batch view pages through the shared list window, and after stdin input the footer says to repeat the same input with --skip.
- [ ] #6 The inspect guide documents the batch form.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->
