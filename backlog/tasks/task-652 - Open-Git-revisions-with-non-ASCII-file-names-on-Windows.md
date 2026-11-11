---
id: TASK-652
title: Open Git revisions with non-ASCII file names on Windows
status: To Do
assignee: []
created_date: '2026-11-11T22:55:00Z'
labels: []
dependencies: []
references:
  - 'https://github.com/MrLesk/groma.md/issues/208'
  - src/history/revisions.ts
type: bug
ordinal: 706000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
GitHub issue 208: on Windows, comparing two revisions fails with `groma/actors/s├ñkerhetsoperat├Âr.md: endpoint "groma/actors/säkerhetsoperatör.md" names no architecture concept` for an actor named Säkerhetsoperatör. The first name in that message is the UTF-8 file name read as code page 850, so the snapshot holds the document under a different name than the relationship link that points to it. Every feature that opens a revision is affected (comparison, time machine, `groma export --revision` and `--from`), for any architecture document whose name has a non-ASCII character. Unicode IDs are supported since TASK-631, so such names are ordinary.

A revision snapshot is written by `git archive` and unpacked by the `tar` found on PATH (`withGitTree` in `src/history/revisions.ts`). The evidence points at that step: the working tree, which Groma reads directly, loads fine for the reporter, and the tar bundled with Windows decodes archive member names with the console code page. This was not run on Windows yet. On macOS the same scenario works: an actor named Säkerhetsoperatör with a relationship, two commits, `groma export <dir> --from <first> --revision <second>` succeeds.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 On Windows, a revision whose architecture has a document with non-ASCII characters in its file name and a relationship to or from it opens and compares without error
- [ ] #2 On Windows, macOS and Linux a revision snapshot holds every file under the exact name Git records for it
- [ ] #3 Snapshot file contents are still the committed bytes, with no line-ending conversion
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->
