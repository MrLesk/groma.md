---
id: TASK-567
title: Let groma view work when the repository is read-only
status: Done
assignee:
  - '@codex'
created_date: 2026-10-08 15:13
updated_date: '2026-11-25T18:39:00Z'
labels: []
dependencies: []
references:
  - src/groma-filesystem.ts
  - src/architecture-reader.ts
  - src/plain-world.ts
  - src/config.ts
  - src/group-upgrade.ts
  - src/group.ts
  - src/types.ts
  - docs/component-markdown.md
  - docs/config.md
  - test-bun/filesystem-access.test.ts
  - test-bun/group-records.test.ts
  - test-bun/work-source-selection.test.ts
  - src/viewers/web/export.ts
  - src/plugins/cli.ts
  - src/lint-command.ts
modified_files:
  - test-bun/filesystem-access.test.ts
  - src/groma-filesystem.ts
  - src/types.ts
  - src/group.ts
  - src/group-upgrade.ts
  - src/architecture-reader.ts
  - src/config.ts
  - src/plain-world.ts
  - test-bun/group-records.test.ts
  - test-bun/work-source-selection.test.ts
  - docs/component-markdown.md
  - docs/config.md
  - src/viewers/web/export.ts
  - src/plugins/cli.ts
  - src/lint-command.ts
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
- [x] #1 With identical inputs, groma view --plain, groma view <id>, groma view <id> --plain, groma view <file>, groma plugin list, groma lint, groma agent-instructions and groma export <dir> into a writable directory print the same content and exit with the same status whether or not the architecture folder is writable.
- [x] #2 Commands that only read create, change and delete no file under the architecture folder, in a read-only checkout and in a writable one.
- [x] #3 Reads stay consistent across cooperating local groma.md writes: a reader never loads half of a multi-file write, including a write that starts and finishes while the read is in progress.
- [x] #4 Commands that write keep the lock, the five-second wait and atomic replacement, and the existing tests for concurrent writes, the timeout and consistent structural reads in test-bun/filesystem-access.test.ts pass.
- [x] #5 A regression test runs a read command against a fixture whose architecture folder is not writable; it fails before the fix and passes after it.
- [x] #6 The Local updates section of docs/component-markdown.md describes how readers stay consistent without the lock.
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
1. Keep the existing exclusive project lock for writers. Under that lock, atomically advance a local write revision before the operation can change any records. Readers check the revision and lock before and after reading and retry an overlapping read, including when a writer finished before the second check. A revision counter avoids relying on filesystem timestamps. Keep the counter in a self-ignored local directory so it stays out of the bundle index, Git changes and map watch events.
2. Make architecture, project and configuration reads share one read scope. Plain view builds its complete answer in that scope, including its Markdown target or empty project profile. Reuse the write scope for nested reads. The filesystem boundary owns this coordination across languages. The OKF Markdown, links and C4 elements keep their existing meaning.
3. Read existing 0.7 groups and scanners.json into the current model without saving. Save the group conversion on the next architecture write that loads it, and save configuration conversion on a settings write. The current scanner listing command is groma plugin list, which took over from groma scanner list in TASK-568.
4. Regression coverage for TASK-567. Run the real CLI in a read-only POSIX fixture. The current tests cover writers and readers that start during an already active edit, so add a disk-backed read that pauses after the first document, then resumes after a complete two-document write. Detect stale mixed results even when the lock has already gone. Extend the existing group and configuration upgrade tests to verify that a read leaves the files intact and a scoped write persists the conversion. Check the other listed commands with the same inputs and a writable external export directory.
5. Update the local access and upgrade documentation, run bun run check and the readability review, and verify the final change against the supported flow.

Give each named read command one scope for the Groma files that determine its result. Export reads its filter, map and themes together. Plugin list reads its scanner, work source and theme selections together. Lint reads its architecture and scanner settings together. Print or publish only after that read succeeds. Save the completed settings change and remove the old file when a settings write converts scanners.json.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The original report predates 0.7.8. A temporary project with a read-only architecture directory also reproduced the failure on 0.7.8 and on main. The listing command named in the original acceptance criterion moved to groma plugin list in TASK-568.

The CLI regression fails on 0e03d06 with EACCES creating groma/.groma.lock and passes with read-only access. The deterministic race pauses after the first document and lets a two-document write finish. Removing the revision comparison in a disposable copy made the test return Stock together with Shipments. The fixed read returns Inventory together with Shipments.

A temporary checkout with read-only permissions on every directory and file produced identical output and exit status for all eight read commands. The same run passed with 0.7 group and scanner records, including direct group Markdown. The commands left the architecture tree, content and file modification times intact. Exporting v0.7.8 also succeeded. git check-ignore confirmed that the local write revision is ignored, and the bundle index omits its directory.

The independent simplicity review reproduced two reads that could combine different versions. A filtered export could validate the old tag and then build the new map. Plugin list could show both a removed scanner and a newly enabled theme. Export, plugin list and lint now read their Groma inputs in one scope. A real CLI run that removed the tag after validation retried, matched the stable result after the edit and wrote no site. Another CLI run that replaced a scanner with a theme during listing returned the new theme alone. A settings update now writes its final configuration once. The full writable and read-only command matrix passed again after these changes.

The final bun run check passed with Node 26.12.1 and Bun 1.4.5. It passed 28 Node and 961 Bun tests, with 67 optional cases skipped. The readability review consolidated path handling for reads and writes. The final independent review reproduced a writer completing between two filesystem reads of the real groma view --plain command, which retried and printed both updated records. The repository scan produced no architecture changes for TASK-567.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Plain view and the other listed read commands work in a read-only checkout. Readers use the local write revision to detect an overlapping Groma edit and retry the complete read. The permission regression and both cases of concurrent writing passed. Existing writer protection remains covered, and the local update contract explains the new read behavior.
<!-- SECTION:FINAL_SUMMARY:END -->
