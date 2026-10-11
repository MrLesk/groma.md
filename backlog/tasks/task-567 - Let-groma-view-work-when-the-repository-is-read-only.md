---
id: TASK-567
title: Let groma view work when the repository is read-only
status: To Do
assignee: []
created_date: '2026-10-08 15:13'
updated_date: '2026-10-08 15:31'
labels: []
dependencies: []
references:
  - src-architecture-reader
  - src/groma-filesystem.ts
  - docs/component-markdown.md
priority: high
type: bug
ordinal: 644000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Since TASK-552 (commit 60948526, 2026-10-06), every command that reads the architecture creates the lock file `<groma-root>/.groma.lock` before reading and deletes it afterwards. Creating that file is a write. When the architecture folder cannot be written, the read fails before anything is printed:

    EACCES: permission denied, open '<repo>/groma/.groma.lock'

Reproduced on a clone of this repository after `chmod -R a-w groma`: `groma view --plain`, `groma view <file> --plain`, `groma view <id>`, `groma view <id> --plain`, `groma scanner list` and `groma lint` all exit 1 with that error. `groma agent-instructions` still works.

Coding agents often run with a read-only checkout: Codex's read-only sandbox, review and CI jobs, planning modes. In a review on 2026-10-08, GPT-6 Astra and GPT-6.1 Sol both ran in Codex's read-only sandbox and could not read the map at all. The lock is not released yet: v0.6.6 on npm predates it. Fix it before the next release.

Why the lock exists: TASK-552 found that two concurrent CLI edits to different fields of one component both succeeded and one change was lost. It added a project lock in `GromaFileSystem.withAccess` (src/groma-filesystem.ts), a five-second wait, and atomic replacement of each document through a temporary file and a rename. Its acceptance criterion #3 says readers must not observe an in-progress structural update, so readers were put inside the same lock (docs/component-markdown.md, "Local updates"). Keep that guarantee: a structural change such as a combine or a move writes several files, and a reader must not load half of it.

Writers keep the lock. Readers must not create, change or delete any file. Keep the documented scope: the guarantee covers cooperating local groma.md processes, not separate clones or direct file editors. One possible approach: readers take no lock, check that no write happened while they read, and read again when one did. Choose the approach and record why in the implementation plan.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 With identical inputs, groma view --plain, groma view <id>, groma view <id> --plain, groma view <file>, groma scanner list, groma lint, groma agent-instructions and groma export <dir> into a writable directory print the same content and exit with the same status whether or not the architecture folder is writable.
- [ ] #2 Commands that only read create, change and delete no file under the architecture folder, in a read-only checkout and in a writable one.
- [ ] #3 Reads stay consistent across cooperating local groma.md writes: a reader never loads half of a multi-file write, including a write that starts and finishes while the read is in progress.
- [ ] #4 Commands that write keep the lock, the five-second wait and atomic replacement, and the existing tests for concurrent writes, the timeout and consistent structural reads in test-bun/filesystem-access.test.ts pass.
- [ ] #5 A regression test runs a read command against a fixture whose architecture folder is not writable; it fails before the fix and passes after it.
- [ ] #6 The Local updates section of docs/component-markdown.md describes how readers stay consistent without the lock.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->
