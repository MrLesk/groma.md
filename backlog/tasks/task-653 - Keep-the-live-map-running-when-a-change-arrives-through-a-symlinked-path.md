---
id: TASK-653
title: Keep the live map running when a change arrives through a symlinked path
status: To Do
assignee: []
created_date: '2026-11-11T22:55:00Z'
labels: []
dependencies: []
references:
  - 'https://github.com/MrLesk/groma.md/issues/201'
  - src/scanner/source-watch.ts
type: bug
ordinal: 706000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
GitHub issue 201: `groma web` exits with `RangeError: path should be a path.relative()d string, but got "../../../../../Projects/my-repo/CLAUDE.md"` as soon as a file is saved through a symlinked spelling of the repository path. The reporter has a root-level symlink from `/etc/synthetic.conf` (`/Projects` to `/System/Volumes/Data/Projects`) and an editor that opens the repository through `/Projects`, so the live map stops on the first save.

The watcher resolves the repository root once, then relates every event path to it (`subscribeSources` in `src/scanner/source-watch.ts`). macOS can report an event under a different spelling of the same directory, which yields a relative path that starts with `../`. The `ignore` package throws on such a path, inside the watcher callback, and the process exits. Shown on macOS with the watcher alone: subscribed on `/System/Volumes/Data/private/tmp/<repo>`, an edit is reported under `/private/tmp/<repo>` and relates to `../../…/src/core/other.ts`; `ignore().ignores("../x")` throws the same RangeError. The `synthetic.conf` setup itself was not recreated (it needs a system setting and a restart).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A change to a repository file that the watcher reports under another spelling of the repository path is scanned as that repository file, the same as a change reported under the resolved path
- [ ] #2 A change reported for a path outside the repository starts no scan and leaves the watcher and groma web running
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->
